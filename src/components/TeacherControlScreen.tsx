import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  Check, 
  X, 
  Award, 
  Clock, 
  RotateCcw, 
  QrCode, 
  Copy, 
  Users, 
  Hand, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Trophy,
  ExternalLink,
  Info,
  Share2,
  Globe
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Question, QuizSession, HandRaiseRecord, QuestionScoreRecord } from '../types';
import { realtimeService } from '../services/socketService';
import { db } from '../db';

interface TeacherControlScreenProps {
  session: QuizSession;
  questions: Question[];
  onBack: () => void;
  onOpenPresentation: () => void;
  onOpenStudentView: () => void;
}

export const TeacherControlScreen: React.FC<TeacherControlScreenProps> = ({
  session: initialSession,
  questions,
  onBack,
  onOpenPresentation,
  onOpenStudentView
}) => {
  const [session, setSession] = useState<QuizSession>(initialSession);
  const [currentQIndex, setCurrentQIndex] = useState(initialSession.currentQuestionIndex || 0);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  
  // Timer state
  const [timerDuration, setTimerDuration] = useState(session.timerDuration || 30);
  const [timerRemaining, setTimerRemaining] = useState(session.timerDuration || 30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Real-time student & hand-raise state
  const [handRaises, setHandRaises] = useState<HandRaiseRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<HandRaiseRecord | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);

  // Interactive Option Click Feedback state
  const [clickedOptions, setClickedOptions] = useState<{ [index: number]: 'correct' | 'wrong' }>({});
  const [lastFeedback, setLastFeedback] = useState<{
    isCorrect: boolean;
    text: string;
    explanation: string;
    optIndex: number;
  } | null>(null);

  // Question currently displayed
  const currentQuestion: Question | undefined = questions[currentQIndex];

  // Join link for students (auto-detect LAN IP from server so phone QR scan doesn't open 'localhost')
  const [networkIp, setNetworkIp] = useState<string>('');
  const [manualIp, setManualIp] = useState<string>('');
  const [customOnlineUrl, setCustomOnlineUrl] = useState<string>(() => {
    return localStorage.getItem('itihas_custom_online_url') || '';
  });

  useEffect(() => {
    fetch('/api/info')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.cloudflareUrl) {
            setCustomOnlineUrl(data.cloudflareUrl);
          }
          if (data.localIp && data.localIp !== 'localhost' && data.localIp !== '127.0.0.1') {
            setNetworkIp(data.localIp);
            setManualIp(data.localIp);
          }
        }
      })
      .catch(() => {});
  }, []);

  const activeHostIp = manualIp || networkIp;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const effectiveHost = (isLocalhost && activeHostIp)
    ? `${activeHostIp}:${window.location.port || '3000'}`
    : window.location.host;

  const joinUrl = !isLocalhost
    ? `${window.location.origin}/?view=student&pin=${session.pin}`
    : (customOnlineUrl.trim()
        ? `${customOnlineUrl.trim().replace(/\/$/, '')}/?view=student&pin=${session.pin}`
        : `${window.location.protocol}//${effectiveHost}/?view=student&pin=${session.pin}`);

  const shareOnWhatsApp = () => {
    const text = `🏛️ *ଇତିହାସ ଜ୍ଞାନ (ITIHAS GYAN) - ଲାଇଭ୍ କ୍ଲାସ କୁଇଜ୍*\n\nସମସ୍ତ ଛାତ୍ରଛାତ୍ରୀ ଏହି ଲିଙ୍କ୍ ଉପରେ କ୍ଲିକ୍ କରି କୁଇଜ୍‌ରେ ଯୋଗ ଦିଅନ୍ତୁ (Google Meet ପରି):\n🔗 ${joinUrl}\n\n🔑 *Session PIN:* ${session.pin}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Initialize teacher session on mount
  useEffect(() => {
    realtimeService.initTeacherSession(session, questions);

    // Subscribe to student hand raises
    const unsubHandRaises = realtimeService.on('hand_raises_updated', (data: any) => {
      if (data && data.handRaises) {
        setHandRaises(data.handRaises);
      }
    });

    const unsubStudents = realtimeService.on('student_list_updated', (data: any) => {
      if (data && data.studentCount !== undefined) {
        setStudentCount(data.studentCount);
      }
    });

    const unsubState = realtimeService.on('session_state_updated', (data: any) => {
      if (data && data.handRaises) {
        setHandRaises(data.handRaises);
      }
      if (data && data.studentCount !== undefined) {
        setStudentCount(data.studentCount);
      }
    });

    const unsubOptionClicked = realtimeService.on('option_clicked', (data: any) => {
      if (data && data.optIndex !== undefined) {
        setClickedOptions({
          [data.optIndex]: data.isCorrect ? 'correct' : 'wrong'
        });
        setLastFeedback({
          isCorrect: data.isCorrect,
          text: data.optionText,
          explanation: data.explanation,
          optIndex: data.optIndex
        });
        if (data.isCorrect) {
          setRevealAnswer(true);
        }
      }
    });

    // Dual-redundancy polling check every 2.5s to ensure 100% sync
    const pollInterval = setInterval(() => {
      if (!session.pin) return;
      fetch(`/api/session/${session.pin}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.found) {
            if (data.handRaises && Array.isArray(data.handRaises)) {
              setHandRaises(data.handRaises);
            }
            if (data.studentCount !== undefined) {
              setStudentCount(data.studentCount);
            }
          }
        })
        .catch(() => {});
    }, 2500);

    return () => {
      unsubHandRaises();
      unsubStudents();
      unsubState();
      unsubOptionClicked();
      clearInterval(pollInterval);
    };
  }, [session.pin]);

  // Countdown Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerRemaining]);

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      const nextIndex = currentQIndex + 1;
      setCurrentQIndex(nextIndex);
      setRevealAnswer(false);
      setShowDescription(false);
      setHandRaises([]);
      setSelectedStudent(null);
      setTimerRemaining(timerDuration);
      setIsTimerRunning(false);
      setClickedOptions({});
      setLastFeedback(null);

      realtimeService.changeQuestion(session.pin, nextIndex);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      const prevIndex = currentQIndex - 1;
      setCurrentQIndex(prevIndex);
      setRevealAnswer(false);
      setShowDescription(false);
      setHandRaises([]);
      setSelectedStudent(null);
      setTimerRemaining(timerDuration);
      setIsTimerRunning(false);
      setClickedOptions({});
      setLastFeedback(null);

      realtimeService.changeQuestion(session.pin, prevIndex);
    }
  };

  const handleToggleReveal = () => {
    const nextVal = !revealAnswer;
    setRevealAnswer(nextVal);
    realtimeService.revealAnswer(session.pin, nextVal);
  };

  const handleToggleDescription = () => {
    const nextVal = !showDescription;
    setShowDescription(nextVal);
    realtimeService.toggleDescription(session.pin, nextVal);
  };

  const handleResetQuestion = () => {
    setRevealAnswer(false);
    setShowDescription(false);
    setHandRaises([]);
    setSelectedStudent(null);
    setTimerRemaining(timerDuration);
    setIsTimerRunning(false);
    setClickedOptions({});
    setLastFeedback(null);
    realtimeService.changeQuestion(session.pin, currentQIndex);
  };

  const handleOptionClick = (opt: string, optIdx: number) => {
    if (!currentQuestion) return;

    const normalizedOpt = opt.trim().toLowerCase();
    const normalizedCorrect = (currentQuestion.correctAnswer || '').trim().toLowerCase();
    const optLetter = String.fromCharCode(65 + optIdx).toLowerCase();

    const isCorrect = (
      normalizedOpt === normalizedCorrect ||
      normalizedCorrect === optLetter ||
      normalizedCorrect.startsWith(optLetter + '.') ||
      normalizedCorrect.startsWith(optLetter + ')') ||
      normalizedCorrect.startsWith(`(${optLetter})`) ||
      normalizedOpt.includes(normalizedCorrect) ||
      normalizedCorrect.includes(normalizedOpt)
    );

    let explanation = '';
    if (isCorrect) {
      explanation = currentQuestion.explanationCorrect || 
        `ଏହା ସମ୍ପୂର୍ଣ୍ଣ ସଠିକ୍ ଉତ୍ତର ଅଟେ। ପ୍ରଦତ୍ତ ଐତିହାସିକ ତଥ୍ୟ ଅନୁସାରେ "${opt}" ସଠିକ୍ ଅଟେ। (Correct! This matches verified historical records.)`;
    } else {
      if (currentQuestion.explanationIncorrect && currentQuestion.explanationIncorrect[optIdx]) {
        explanation = currentQuestion.explanationIncorrect[optIdx];
      } else {
        explanation = `"${opt}" ଏହି ପ୍ରଶ୍ନ ପାଇଁ ଭୁଲ୍ ବିକଳ୍ପ ଅଟେ। ଦୟାକରି ଅନ୍ୟ ବିକଳ୍ପ ଚେଷ୍ଟା କରନ୍ତୁ! (Incorrect option. Please check the other choices and try again!)`;
      }
    }

    setClickedOptions({
      [optIdx]: isCorrect ? 'correct' : 'wrong'
    });

    setLastFeedback({
      isCorrect,
      text: opt,
      explanation,
      optIndex: optIdx
    });

    if (isCorrect) {
      setRevealAnswer(true);
    }

    realtimeService.clickOption(session.pin, optIdx, opt, isCorrect, explanation);
  };

  const handleAwardMarks = async (
    status: 'correct' | 'incorrect' | 'partial' | 'bonus' | 'no_marks'
  ) => {
    if (!selectedStudent || !currentQuestion) {
      alert('Please select a student from the Hand Raise list first.');
      return;
    }

    let marks = 0;
    if (status === 'correct') marks = currentQuestion.marks;
    if (status === 'partial') marks = Math.max(0.5, currentQuestion.marks / 2);
    if (status === 'bonus') marks = 1;
    if (status === 'incorrect' || status === 'no_marks') marks = 0;

    // Record in local database
    await db.scores.add({
      rollNo: selectedStudent.rollNo,
      name: selectedStudent.name,
      questionIndex: currentQIndex,
      marks,
      markingStatus: status,
      handRaisedRank: selectedStudent.rank
    });

    // Broadcast in real-time
    realtimeService.awardMarks(
      session.pin,
      selectedStudent.rollNo,
      selectedStudent.name,
      currentQIndex,
      marks,
      status
    );

    alert(`Marks recorded for ${selectedStudent.name}: ${marks} Mark(s) [${status.toUpperCase()}]`);

    // If incorrect, prompt teacher to invite next student
    if (status === 'incorrect') {
      const nextStudent = handRaises.find(h => h.rank === (selectedStudent.rank + 1));
      if (nextStudent) {
        setSelectedStudent(nextStudent);
      }
    }
  };

  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEndQuiz = async () => {
    if (confirm('Are you sure you want to conclude this live quiz session?')) {
      realtimeService.endSession(session.pin);
      await db.sessions.update(session.id, {
        status: 'ended',
        endedAt: new Date().toISOString()
      });
      onBack();
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      realtimeService.initTeacherSession(session, questions);
      if (session.pin) {
        const res = await fetch(`/api/session/${session.pin}`);
        const data = await res.json();
        if (data && data.found) {
          if (data.handRaises && Array.isArray(data.handRaises)) {
            setHandRaises(data.handRaises);
          }
          if (data.studentCount !== undefined) {
            setStudentCount(data.studentCount);
          }
          if (data.currentQuestionIndex !== undefined) {
            setCurrentQIndex(data.currentQuestionIndex);
          }
        }
      }
      setRefreshToast(true);
      setTimeout(() => setRefreshToast(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Session Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
              ଲାଇଭ୍ କୁଇଜ୍ ନିୟନ୍ତ୍ରଣ (TEACHER CONTROL PANEL)
            </span>
          </div>
          <h2 className="font-odia font-bold text-xl sm:text-2xl text-amber-300">
            {session.title}
          </h2>
          <p className="text-xs text-slate-400">
            {session.subject} • {session.topic}
          </p>
        </div>

        {/* PIN & QR Shortcuts & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            title="ସେସନ୍ ଏବଂ ହାତ ଟେକିବା ଲିଷ୍ଟ୍ ରିଫ୍ରେଶ୍ କରନ୍ତୁ"
          >
            <RotateCcw className={`w-4 h-4 text-slate-950 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'ରିଫ୍ରେଶ୍...' : '🔄 ରିଫ୍ରେଶ୍ (Refresh)'}</span>
          </button>

          <div className="px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">SESSION PIN</div>
              <div className="font-mono text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
                {session.pin}
              </div>
            </div>
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              title="Show QR Code"
            >
              <QrCode className="w-5 h-5 text-amber-300" />
            </button>
          </div>

          <button
            onClick={copyJoinLink}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-4 h-4 text-emerald-400" />
            <span>{copiedLink ? 'ଲିଙ୍କ୍ କପି ହେଲା!' : 'Join Link'}</span>
          </button>

          <button
            onClick={shareOnWhatsApp}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Share direct join link to WhatsApp group"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp ରେ ପଠାନ୍ତୁ</span>
          </button>

          <button
            onClick={onOpenPresentation}
            className="px-3.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            title="Open Presentation Screen for Projector / Flat Panel"
          >
            <ExternalLink className="w-4 h-4" />
            <span>ପ୍ରୋଜେକ୍ଟର ସ୍କ୍ରିନ୍</span>
          </button>

          <button
            onClick={handleEndQuiz}
            className="px-3.5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>କୁଇଜ୍ ସମାପ୍ତ</span>
          </button>
        </div>
      </div>

      {/* Refresh Feedback Alert */}
      {refreshToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>ସେସନ୍ ତଥା ହାତ ଟେକିଥିବା ଛାତ୍ର ଲିଷ୍ଟ୍ ସଫଳତାର ସହ ରିଫ୍ରେଶ୍ ହେଲା! (Refreshed Successfully)</span>
        </div>
      )}

      {/* Main Grid: Left = Active Question & Controls, Right = Hand Raise Queue & Marking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Question Card & Reveal Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Question Display Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-xs uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                ପ୍ରଶ୍ନ {currentQIndex + 1} / {questions.length} ({currentQuestion?.pattern.toUpperCase()} • {currentQuestion?.marks} Mark{currentQuestion && currentQuestion.marks > 1 ? 's' : ''})
              </span>

              {/* Timer Bar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
                    isTimerRunning 
                      ? 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse' 
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{timerRemaining}s</span>
                  {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                </button>

                <select
                  value={timerDuration}
                  onChange={(e) => {
                    const dur = Number(e.target.value);
                    setTimerDuration(dur);
                    setTimerRemaining(dur);
                    setIsTimerRunning(false);
                  }}
                  className="text-xs p-1.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                  <option value={45}>45s</option>
                  <option value={60}>60s</option>
                  <option value={0}>Timer Off</option>
                </select>
              </div>
            </div>

            {/* Question Text in Large Font */}
            <h3 className="font-odia font-black text-xl sm:text-2xl text-slate-900 leading-snug">
              {currentQuestion?.question}
            </h3>

            {/* Interactive Options (Clickable with immediate Right/Wrong Evaluation & Description) */}
            {currentQuestion?.options && currentQuestion.options.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <span>ବିକଳ୍ପ ଚୟନ କରନ୍ତୁ (Click an option to evaluate):</span>
                  <span>{Object.keys(clickedOptions).length > 0 ? `${Object.keys(clickedOptions).length} Option(s) tested` : 'Interactive Mode Active'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const normalizedOpt = opt.trim().toLowerCase();
                    const normalizedCorrect = (currentQuestion.correctAnswer || '').trim().toLowerCase();
                    const optLetter = String.fromCharCode(65 + optIdx).toLowerCase();
                    const isCorrect = (
                      normalizedOpt === normalizedCorrect ||
                      normalizedCorrect === optLetter ||
                      normalizedCorrect.startsWith(optLetter + '.') ||
                      normalizedCorrect.startsWith(optLetter + ')') ||
                      normalizedCorrect.startsWith(`(${optLetter})`) ||
                      normalizedOpt.includes(normalizedCorrect) ||
                      normalizedCorrect.includes(normalizedOpt)
                    );
                    const clickedStatus = clickedOptions[optIdx];

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleOptionClick(opt, optIdx)}
                        className={`p-3.5 rounded-2xl border-2 text-left font-medium transition-all flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.98] ${
                          clickedStatus === 'correct'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg ring-4 ring-emerald-300/60 scale-[1.01]'
                            : clickedStatus === 'wrong'
                            ? 'bg-rose-50 text-rose-950 border-rose-500 ring-2 ring-rose-300 shadow-xs animate-shake'
                            : 'bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            clickedStatus === 'correct'
                              ? 'bg-white text-emerald-900 shadow-xs'
                              : clickedStatus === 'wrong'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-sm font-semibold">{opt}</span>
                        </div>

                        <div className="shrink-0">
                          {clickedStatus === 'correct' && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                              <span>ସଠିକ୍</span>
                            </span>
                          )}
                          {clickedStatus === 'wrong' && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-black flex items-center gap-1 shadow-xs">
                              <XCircle className="w-3.5 h-3.5 text-rose-200" />
                              <span>ଭୁଲ୍</span>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prominent Live Feedback Banner (Shown when any option is clicked) */}
            {lastFeedback && (
              <div
                className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                  lastFeedback.isCorrect
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200'
                    : 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {lastFeedback.isCorrect ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-black text-sm uppercase tracking-wide ${
                        lastFeedback.isCorrect ? 'text-emerald-900' : 'text-rose-900'
                      }`}>
                        {lastFeedback.isCorrect
                          ? '🎉 ସଠିକ୍ ଉତ୍ତର! (CORRECT ANSWER)'
                          : '❌ ଭୁଲ୍ ଉତ୍ତର! (INCORRECT ANSWER - PLEASE TRY AGAIN)'}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        lastFeedback.isCorrect ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                      }`}>
                        Option {String.fromCharCode(65 + lastFeedback.optIndex)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold">
                      ବାଛିଥିବା ବିକଳ୍ପ: <span className="underline">{lastFeedback.text}</span>
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 text-xs sm:text-sm space-y-1">
                      <span className="font-bold block text-slate-800">
                        {lastFeedback.isCorrect
                          ? 'ଏହି ଉତ୍ତର କାହିଁକି ସଠିକ୍ (Detailed Explanation):'
                          : 'ଏହି ବିକଳ୍ପ କାହିଁକି ଭୁଲ୍ (Why this option is incorrect):'}
                      </span>
                      <p className="leading-relaxed text-slate-700">
                        {lastFeedback.explanation}
                      </p>
                    </div>

                    {!lastFeedback.isCorrect && (
                      <div className="mt-2 bg-rose-100/90 text-rose-900 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-rose-700" />
                        <span>ସଠିକ୍ ଉତ୍ତର ନମିଳିବା ପର୍ଯ୍ୟନ୍ତ ଅନ୍ୟ ବିକଳ୍ପଗୁଡ଼ିକ ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ! (Keep trying until you find the right one!)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Model Answer preview if revealed */}
            {revealAnswer && currentQuestion?.modelAnswer && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs sm:text-sm space-y-1">
                <span className="font-bold text-emerald-900 block">ମଡେଲ ଉତ୍ତର (Model Answer):</span>
                <p className="leading-relaxed">{currentQuestion.modelAnswer}</p>
              </div>
            )}

            {/* In-Depth Description Panel (Expanded when Show Description is clicked) */}
            {showDescription && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 text-amber-950 text-xs sm:text-sm space-y-2 animate-in fade-in-50">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-sm">
                  <Info className="w-4 h-4" />
                  <span>ବିସ୍ତୃତ ଐତିହାସିକ ବ୍ୟାଖ୍ୟା (In-Depth Explanation & Fact Check):</span>
                </div>
                <p className="leading-relaxed font-normal">
                  {currentQuestion?.explanationCorrect}
                </p>

                {currentQuestion?.explanationIncorrect && currentQuestion.explanationIncorrect.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-amber-200/80 space-y-1">
                    <span className="font-bold text-xs text-amber-900 block">ଭୁଲ୍ ବିକଳ୍ପଗୁଡ଼ିକ କାହିଁକି ଅଯଥାର୍ଥ:</span>
                    {currentQuestion.explanationIncorrect.map((exp, eIdx) => (
                      <p key={eIdx} className="text-xs text-amber-900/90 leading-normal">
                        • {exp}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Teacher Control Action Buttons (PART 12 & 13) */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Reveal Answer Button */}
                <button
                  onClick={handleToggleReveal}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all flex items-center gap-2 ${
                    revealAnswer
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {revealAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{revealAnswer ? 'ଉତ୍ତର ଲୁଚାନ୍ତୁ' : 'Reveal Answer (ଉତ୍ତର ଦେଖାନ୍ତୁ)'}</span>
                </button>

                {/* Show Description Button */}
                <button
                  onClick={handleToggleDescription}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all flex items-center gap-2 ${
                    showDescription
                      ? 'bg-amber-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  <span>{showDescription ? 'ବ୍ୟାଖ୍ୟା ଲୁଚାନ୍ତୁ' : 'Show Description (ବ୍ୟାଖ୍ୟା)'}</span>
                </button>

                <button
                  onClick={handleResetQuestion}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
                  title="Reset Question & Clear Hands"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Prev / Next Question Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevQuestion}
                  disabled={currentQIndex === 0}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ପୂର୍ବ (Prev)</span>
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQIndex === questions.length - 1}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                >
                  <span>ପରବର୍ତ୍ତୀ (Next)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Digital Hand Raising Queue & Scoring */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Hand className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-odia font-bold text-base text-slate-900">
                    ହାତ ଟେକିବା ତାଲିକା (Hand Raises)
                  </h4>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">
                    Server Timestamp Ranked Queue
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {handRaises.length} Raised
              </span>
            </div>

            {/* Hand Raised List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {handRaises.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  କୌଣସି ଛାତ୍ର ଏପର୍ଯ୍ୟନ୍ତ ହାତ ଟେକି ନାହାନ୍ତି। ମୋବାଇଲରୁ "Raise Hand" ଚିପିବାକୁ କୁହନ୍ତୁ।
                </div>
              ) : (
                handRaises.map((hr) => {
                  const isSelected = selectedStudent?.rollNo === hr.rollNo;
                  return (
                    <div
                      key={hr.rollNo}
                      onClick={() => setSelectedStudent(hr)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-400'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                          hr.rank === 1 ? 'bg-amber-400 text-slate-950 font-black' :
                          hr.rank === 2 ? 'bg-slate-300 text-slate-800' :
                          hr.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          #{hr.rank}
                        </span>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 leading-tight">
                            {hr.name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {hr.rollNo}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[10px] font-bold text-amber-800 uppercase bg-amber-200/60 px-2 py-0.5 rounded-full">
                          ଚୟନିତ
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Scoring & Marks Section (PART 11) */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  ମାର୍କ ପ୍ରଦାନ (Award Marks)
                </span>
                {selectedStudent ? (
                  <span className="text-xs font-bold text-blue-700">
                    {selectedStudent.name}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    ଛାତ୍ର ଚୟନ କରନ୍ତୁ
                  </span>
                )}
              </div>

              {/* Action Buttons: Correct, Incorrect, Partial, Bonus */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAwardMarks('correct')}
                  disabled={!selectedStudent}
                  className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ସଠିକ୍ (+{currentQuestion?.marks || 1})</span>
                </button>

                <button
                  onClick={() => handleAwardMarks('incorrect')}
                  disabled={!selectedStudent}
                  className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  <span>ଭୁଲ୍ (0 Mark)</span>
                </button>

                <button
                  onClick={() => handleAwardMarks('partial')}
                  disabled={!selectedStudent}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>ଆଂଶିକ (Partial)</span>
                </button>

                <button
                  onClick={() => handleAwardMarks('bonus')}
                  disabled={!selectedStudent}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ବୋନସ୍ (+1)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal for Classroom Display */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <h3 className="font-odia font-bold text-xl text-slate-900">
              କୁଇଜ୍ ଯୋଗଦାନ QR କୋଡ୍ (Student Join)
            </h3>
            <p className="text-xs text-slate-500">
              ମୋବାଇଲ୍ କ୍ୟାମେରା ବା Google Lens ଦ୍ୱାରା ସ୍କାନ୍ କରି ସିଧାସଳଖ ଯୋଗ ଦିଅନ୍ତୁ:
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <QRCodeSVG value={joinUrl} size={220} level="M" />
            </div>

            {/* Direct Join Link & Copy */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Google Meet ପରି Student Join Link:</span>
              </div>
              <div className="font-mono text-xs text-slate-800 break-all bg-white p-2.5 rounded-xl border border-slate-200 select-all font-semibold">
                {joinUrl}
              </div>

              {/* Action Buttons: WhatsApp Share & Copy */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={shareOnWhatsApp}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp ରେ ପଠାନ୍ତୁ</span>
                </button>
                <button
                  onClick={copyJoinLink}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-300"
                >
                  <Copy className="w-4 h-4 text-emerald-600" />
                  <span>{copiedLink ? 'କପି ହେଲା!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Optional Online Public Link input */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Custom Online Link (ଯଦି Tunnel ବା Cloud Link ଅଛି):</span>
              </div>
              <input
                type="text"
                placeholder="ଯଥା: https://xxxx.loca.lt କିମ୍ବା render ଲିଙ୍କ୍"
                value={customOnlineUrl}
                onChange={(e) => {
                  setCustomOnlineUrl(e.target.value);
                  localStorage.setItem('itihas_custom_online_url', e.target.value);
                }}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-400 font-bold uppercase">SESSION PIN</div>
              <div className="font-mono text-3xl font-black text-emerald-800 tracking-widest">
                {session.pin}
              </div>
            </div>

            {/* Wi-Fi Alert / Help info */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ସୂଚନା (Wi-Fi Requirement):</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                ଶିକ୍ଷକଙ୍କ କମ୍ପ୍ୟୁଟର ଏବଂ ଛାତ୍ରଙ୍କ ମୋବାଇଲ୍ <strong>ଗୋଟିଏ Wi-Fi କିମ୍ବା ମୋବାଇଲ୍ ହଟସ୍ପଟ୍</strong> ସହ କନେକ୍ଟ ଥିବା ଦରକାର।
              </p>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              ବନ୍ଦ କରନ୍ତୁ (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
