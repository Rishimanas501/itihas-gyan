import { io, Socket } from 'socket.io-client';
import type { HandRaiseRecord, StudentSessionSummary } from '../types';

class ClassroomRealtimeService {
  private socket: Socket | null = null;
  private channel: BroadcastChannel | null = null;
  private isConnected = false;
  private isTeacher = false;
  private currentPin: string = '';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('itihas_gyan_classroom_bus');
      this.channel.onmessage = (event) => {
        this.handleLocalBroadcast(event.data);
      };
    }
  }

  // Connect to the Socket.IO server
  public connect(serverUrl?: string): void {
    if (this.socket) return;

    const url = serverUrl || (window.location.port === '5173' ? 'http://localhost:3000' : window.location.origin);
    
    try {
      this.socket = io(url, {
        reconnectionAttempts: 5,
        timeout: 4000,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('[Realtime] Connected to live classroom server');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('[Realtime] Disconnected from live server');
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Realtime] Server connection error (falling back to local bus):', err.message);
      });
    } catch (e) {
      console.warn('[Realtime] Could not initialize socket.io:', e);
    }
  }

  public initTeacherSession(session: any, questions: any[]): void {
    this.isTeacher = true;
    this.currentPin = session.pin;
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
    this.connect();

    if (this.socket && this.socket.connected) {
      this.socket.emit('student_join', { pin, rollNo, name });
    }

    this.broadcastLocal('student_join', { pin, rollNo, name });
  }

  public raiseHand(pin: string, rollNo: string, name: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('student_raise_hand', { pin, rollNo, name });
    } else {
      // Local fallback mode: synthesize server timestamp and ranking
      const timestamp = Date.now();
      const storedRaisesStr = localStorage.getItem(`hand_raises_${pin}`) || '[]';
      const storedRaises: HandRaiseRecord[] = JSON.parse(storedRaisesStr);
      
      if (!storedRaises.some(h => h.rollNo === rollNo)) {
        const record: HandRaiseRecord = {
          rollNo,
          name,
          timestamp,
          sequence: storedRaises.length + 1,
          rank: storedRaises.length + 1
        };
        storedRaises.push(record);
        localStorage.setItem(`hand_raises_${pin}`, JSON.stringify(storedRaises));
        
        this.broadcastLocal('hand_raises_updated', {
          pin,
          handRaises: storedRaises,
          latest: record
        });

        // Trigger local callback for student self-ack
        window.dispatchEvent(new CustomEvent('raise_hand_ack', { detail: { status: 'success', rank: record.rank } }));
      } else {
        window.dispatchEvent(new CustomEvent('raise_hand_ack', { detail: { status: 'already_raised' } }));
      }
    }
  }

  public changeQuestion(pin: string, questionIndex: number): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_change_question', { pin, questionIndex });
    }
    // Clear local hand raises for new question
    localStorage.removeItem(`hand_raises_${pin}`);
    this.broadcastLocal('question_changed', { pin, questionIndex, handRaises: [] });
  }

  public revealAnswer(pin: string, reveal: boolean): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_reveal_answer', { pin, reveal });
    }
    this.broadcastLocal('answer_revealed', { pin, revealAnswer: reveal });
  }

  public toggleDescription(pin: string, show: boolean): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_show_description', { pin, show });
    }
    this.broadcastLocal('description_toggled', { pin, showDescription: show });
  }

  public clickOption(pin: string, optIndex: number, optionText: string, isCorrect: boolean, explanation: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('client_click_option', { pin, optIndex, optionText, isCorrect, explanation });
    }
    this.broadcastLocal('option_clicked', { pin, optIndex, optionText, isCorrect, explanation });
  }

  public awardMarks(pin: string, rollNo: string, name: string, questionIndex: number, marks: number, markingStatus: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_award_marks', { pin, rollNo, name, questionIndex, marks, markingStatus });
    }
    this.broadcastLocal('marks_awarded', { pin, rollNo, name, questionIndex, marks, markingStatus });
  }

  public endSession(pin: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('teacher_end_session', { pin });
    }
    this.broadcastLocal('session_ended', { pin });
  }

  // Event Listeners registration
  public on(event: string, callback: (...args: any[]) => void): () => void {
    const handleCustom = (e: any) => callback(e.detail);
    window.addEventListener(`rt_${event}`, handleCustom);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => {
      window.removeEventListener(`rt_${event}`, handleCustom);
      if (this.socket) {
        this.socket.off(event, callback);
      }
    };
  }

  private broadcastLocal(type: string, data: any): void {
    if (this.channel) {
      this.channel.postMessage({ type, data });
    }
    window.dispatchEvent(new CustomEvent(`rt_${type}`, { detail: data }));
  }

  private handleLocalBroadcast(msg: { type: string; data: any }): void {
    if (!msg || !msg.type) return;
    window.dispatchEvent(new CustomEvent(`rt_${msg.type}`, { detail: msg.data }));
  }
}

export const realtimeService = new ClassroomRealtimeService();
