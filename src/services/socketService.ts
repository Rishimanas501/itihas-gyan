import { io, Socket } from 'socket.io-client';
import type { HandRaiseRecord } from '../types';

class ClassroomRealtimeService {
  private socket: Socket | null = null;
  private channel: BroadcastChannel | null = null;
  private isTeacher = false;
  private currentPin: string = '';
  private teacherSessionData: { session: any; questions: any[] } | null = null;
  private studentJoinData: { pin: string; rollNo: string; name: string } | null = null;
  private pendingRaiseHand: { pin: string; rollNo: string; name: string } | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private connectedStatus: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('itihas_gyan_classroom_bus');
      this.channel.onmessage = (event) => {
        this.handleLocalBroadcast(event.data);
      };
    }
  }

  public isSocketConnected(): boolean {
    return this.connectedStatus && (this.socket?.connected ?? false);
  }

  // Connect to the Socket.IO server
  public connect(serverUrl?: string): void {
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return;
    }

    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const defaultUrl = window.location.port === '5173'
      ? `${protocol}//${host}:3000`
      : window.location.origin;

    const url = serverUrl || defaultUrl;

    try {
      this.socket = io(url, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 4000,
        timeout: 10000,
        transports: ['polling', 'websocket']
      });

      this.socket.on('connect', () => {
        this.connectedStatus = true;
        console.log('[Realtime] Connected to live classroom server at', url);

        // Auto-sync teacher session upon connect or reconnect
        if (this.isTeacher && this.teacherSessionData) {
          console.log('[Realtime] Emitting teacher_init_session for PIN', this.teacherSessionData.session?.pin);
          this.socket?.emit('teacher_init_session', this.teacherSessionData);
        }

        // Auto-sync student join upon connect or reconnect
        if (!this.isTeacher && this.studentJoinData) {
          console.log('[Realtime] Emitting student_join for rollNo', this.studentJoinData.rollNo);
          this.socket?.emit('student_join', this.studentJoinData);
        }

        // Deliver any pending raise hand
        if (this.pendingRaiseHand) {
          console.log('[Realtime] Emitting pending raise hand for rollNo', this.pendingRaiseHand.rollNo);
          this.socket?.emit('student_raise_hand', this.pendingRaiseHand);
          this.pendingRaiseHand = null;
        }

        this.notifyListeners('connection_status', { connected: true });
        window.dispatchEvent(new CustomEvent('rt_connection_status', { detail: { connected: true } }));
      });

      this.socket.on('disconnect', (reason) => {
        this.connectedStatus = false;
        console.log('[Realtime] Disconnected from live server:', reason);
        this.notifyListeners('connection_status', { connected: false });
        window.dispatchEvent(new CustomEvent('rt_connection_status', { detail: { connected: false } }));
      });

      this.socket.on('connect_error', (err) => {
        this.connectedStatus = false;
        console.warn('[Realtime] Server connection error (falling back to local bus):', err.message);
        this.notifyListeners('connection_status', { connected: false, error: err.message });
      });

      // Bind all server events
      const serverEvents = [
        'session_state_updated',
        'hand_raises_updated',
        'student_list_updated',
        'question_changed',
        'answer_revealed',
        'option_clicked',
        'description_toggled',
        'marks_awarded',
        'session_ended',
        'teacher_status_changed',
        'raise_hand_ack',
        'join_success',
        'join_error'
      ];

      for (const ev of serverEvents) {
        this.socket.on(ev, (data: any) => {
          this.notifyListeners(ev, data);
          this.broadcastLocal(ev, data);

          if (ev === 'raise_hand_ack') {
            window.dispatchEvent(new CustomEvent('raise_hand_ack', { detail: data }));
          }
        });
      }

    } catch (e) {
      console.warn('[Realtime] Could not initialize socket.io:', e);
    }
  }

  public initTeacherSession(session: any, questions: any[]): void {
    this.isTeacher = true;
    this.currentPin = session.pin;
    this.teacherSessionData = { session, questions };
    this.connect();

    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_init_session', { session, questions });
    }

    // Always broadcast locally for multi-tab / flat-panel presentation screen
    this.broadcastLocal('session_init', { session, questions });
  }

  public joinAsStudent(pin: string, rollNo: string, name: string): void {
    this.isTeacher = false;
    this.currentPin = pin;
    this.studentJoinData = { pin, rollNo, name };
    this.connect();

    if (this.socket && this.socket.connected) {
      this.socket.emit('student_join', { pin, rollNo, name });
    }

    this.broadcastLocal('student_join', { pin, rollNo, name });
  }

  public raiseHand(pin: string, rollNo: string, name: string): void {
    const cleanPin = pin.trim();
    const cleanRoll = rollNo.trim();
    const cleanName = name.trim();

    this.pendingRaiseHand = { pin: cleanPin, rollNo: cleanRoll, name: cleanName };
    this.connect();

    if (this.socket && this.socket.connected) {
      this.socket.emit('student_raise_hand', { pin: cleanPin, rollNo: cleanRoll, name: cleanName });
      this.pendingRaiseHand = null;
    } else {
      // Local fallback mode: synthesize server timestamp and ranking for same-browser testing
      const timestamp = Date.now();
      const storedRaisesStr = localStorage.getItem(`hand_raises_${cleanPin}`) || '[]';
      const storedRaises: HandRaiseRecord[] = JSON.parse(storedRaisesStr);
      
      if (!storedRaises.some(h => h.rollNo === cleanRoll)) {
        const record: HandRaiseRecord = {
          rollNo: cleanRoll,
          name: cleanName,
          timestamp,
          sequence: storedRaises.length + 1,
          rank: storedRaises.length + 1
        };
        storedRaises.push(record);
        localStorage.setItem(`hand_raises_${cleanPin}`, JSON.stringify(storedRaises));
        
        this.broadcastLocal('hand_raises_updated', {
          pin: cleanPin,
          handRaises: storedRaises,
          latest: record
        });

        window.dispatchEvent(new CustomEvent('raise_hand_ack', { detail: { status: 'success', rank: record.rank } }));
      } else {
        window.dispatchEvent(new CustomEvent('raise_hand_ack', { detail: { status: 'already_raised' } }));
      }
    }
  }

  public changeQuestion(pin: string, questionIndex: number): void {
    const cleanPin = pin.trim();
    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_change_question', { pin: cleanPin, questionIndex });
    }
    // Clear local hand raises for new question
    localStorage.removeItem(`hand_raises_${cleanPin}`);
    const currentQ = this.teacherSessionData?.questions?.[questionIndex] || null;
    this.broadcastLocal('question_changed', {
      pin: cleanPin,
      currentQuestionIndex: questionIndex,
      currentQuestion: currentQ,
      questions: this.teacherSessionData?.questions || [],
      handRaises: []
    });
  }

  public revealAnswer(pin: string, reveal: boolean): void {
    const cleanPin = pin.trim();
    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_reveal_answer', { pin: cleanPin, reveal });
    }
    this.broadcastLocal('answer_revealed', { pin: cleanPin, revealAnswer: reveal });
  }

  public toggleDescription(pin: string, show: boolean): void {
    const cleanPin = pin.trim();
    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_show_description', { pin: cleanPin, show });
    }
    this.broadcastLocal('description_toggled', { pin: cleanPin, showDescription: show });
  }

  public clickOption(pin: string, optIndex: number, optionText: string, isCorrect: boolean, explanation: string): void {
    const cleanPin = pin.trim();
    if (this.socket && this.socket.connected) {
      this.socket.emit('client_click_option', { pin: cleanPin, optIndex, optionText, isCorrect, explanation });
    }
    this.broadcastLocal('option_clicked', { pin: cleanPin, optIndex, optionText, isCorrect, explanation });
  }

  public awardMarks(pin: string, rollNo: string, name: string, questionIndex: number, marks: number, markingStatus: any): void {
    const cleanPin = pin.trim();
    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_award_marks', { pin: cleanPin, rollNo, name, questionIndex, marks, markingStatus });
    }
    this.broadcastLocal('marks_awarded', { pin: cleanPin, rollNo, name, questionIndex, marks, markingStatus });
  }

  public endSession(pin: string): void {
    const cleanPin = pin.trim();
    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_end_session', { pin: cleanPin });
    }
    this.broadcastLocal('session_ended', { pin: cleanPin });
  }

  // Event Listeners registration
  public on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    const handleCustom = (e: any) => callback(e.detail);
    window.addEventListener(`rt_${event}`, handleCustom);

    return () => {
      this.listeners.get(event)?.delete(callback);
      window.removeEventListener(`rt_${event}`, handleCustom);
    };
  }

  private notifyListeners(event: string, data: any): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in listener for ${event}:`, err);
        }
      }
    }
  }

  private broadcastLocal(type: string, data: any): void {
    if (this.channel) {
      this.channel.postMessage({ type, data });
    }
    window.dispatchEvent(new CustomEvent(`rt_${type}`, { detail: data }));
  }

  private handleLocalBroadcast(msg: { type: string; data: any }): void {
    if (!msg || !msg.type) return;
    this.notifyListeners(msg.type, msg.data);
    window.dispatchEvent(new CustomEvent(`rt_${msg.type}`, { detail: msg.data }));
  }
}

export const realtimeService = new ClassroomRealtimeService();
