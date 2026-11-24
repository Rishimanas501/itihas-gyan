import React, { useState, useEffect } from 'react';
import { 
  Hand, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Lock,
  Unlock,
  Sparkles, 
  Trophy, 
  ArrowRight,
  LogOut,
  HelpCircle,
  Clock,
  WifiOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BrandHeader } from './BrandHeader';
import { realtimeService } from '../services/socketService';
import { db } from '../db';
import type { Question } from '../types';

interface StudentParticipationScreenProps {
  initialPin?: string;
  onExit: () => void;
  isStandalone?: boolean;
}

export const StudentParticipationScreen: React.FC<StudentParticipationScreenProps> = ({
  initialPin = '',
  onExit,
  isStandalone = false
}) => {
  // Join step state
  const [pin, setPin] = useState(initialPin);
  const [rollNo, setRollNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Live session state for student
  const [sessionTitle, setSessionTitle] = useState('ଇତିହାସ ଜ୍ଞାନ ଲାଇଭ୍ କୁଇଜ୍');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [assignedRank, setAssignedRank] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(realtimeService.isSocketConnected());

  // Teacher connection tracking: if teacher closes app, pause & wait
  const [isTeacherOnline, setIsTeacherOnline] = useState(true);

  // Single option selection per question: student cannot re-click or change answer
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [optionFeedback, setOptionFeedback] = useState<{ isCorrect: boolean; text: string; explanation: string } | null>(null);
  const [showRaiseAlert, setShowRaiseAlert] = useState(false);

  // Track realtime socket connection state
  useEffect(() => {
    const unsubConn = realtimeService.on('connection_status', (data: any) => {
      setIsServerConnected(!!data?.connected);
    });
    return () => unsubConn();
  }, []);

  // Auto lookup student name when roll number is entered (Part 5 requirement)
  useEffect(() => {
    const clean = rollNo.trim();
    if (clean.length >= 3) {
      setIsLookingUp(true);
      db.students.where('rollNo').equalsIgnoreCase(clean).first()
        .then((found) => {
          if (found) {
            setStudentName(found.name);
          }
        })
        .finally(() => setIsLookingUp(false));
    }
  }, [rollNo]);

  // Direct fetch session details upon joining or pin change
  useEffect(() => {
    if (!isJoined || !pin.trim()) return;

    const fetchSession = () => {
      fetch(`/api/session/${pin.trim()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.found) {
            if (data.currentQuestionIndex !== undefined) {
              setQuestionIndex(data.currentQuestionIndex);
            }
            if (data.title) {
              setSessionTitle(data.title);
            }
            if (data.isTeacherOnline !== undefined) {
              setIsTeacherOnline(data.isTeacherOnline);
            }
            if (data.questions && Array.isArray(data.questions)) {
              setAllQuestions(data.questions);
              const q = data.currentQuestion || data.questions[data.currentQuestionIndex || 0];
              if (q) setCurrentQuestion(q);
            } else if (data.currentQuestion) {
              setCurrentQuestion(data.currentQuestion);
            }
            if (data.handRaises && Array.isArray(data.handRaises)) {
              const found = data.handRaises.find((h: any) => h.rollNo === rollNo.trim());
              if (found) {
                setHasRaisedHand(true);
                setAssignedRank(found.rank);
              }
            }
          }
        })
        .catch(() => {});
    };

    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [isJoined, pin, rollNo]);

  // Realtime subscriptions once joined
  useEffect(() => {
    if (!isJoined) return;

    const unsubQ = realtimeService.on('question_changed', (data: any) => {
      if (data) {
        const newIndex = data.currentQuestionIndex ?? 0;
        setQuestionIndex(newIndex);
        setHasRaisedHand(false);
        setAssignedRank(null);
        setRevealAnswer(false);
        setSelectedOption(null);
        setHasAnswered(false);
        setOptionFeedback(null);
        setShowRaiseAlert(false);

        if (data.currentQuestion) {
          setCurrentQuestion(data.currentQuestion);
        } else if (data.questions && data.questions[newIndex]) {
          setCurrentQuestion(data.questions[newIndex]);
        } else if (allQuestions[newIndex]) {
          setCurrentQuestion(allQuestions[newIndex]);
        }

        if (data.questions && Array.isArray(data.questions)) {
          setAllQuestions(data.questions);
        }
      }
    });

    const unsubReveal = realtimeService.on('answer_revealed', (data: any) => {
      if (data && data.revealAnswer !== undefined) {
        setRevealAnswer(data.revealAnswer);
      }
    });

    const unsubAck = (e: any) => {
      const { status, rank } = e.detail || {};
      if (status === 'success' || rank) {
        setHasRaisedHand(true);
        if (rank) setAssignedRank(rank);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } else if (status === 'already_raised') {
        setHasRaisedHand(true);
      }
    };
    window.addEventListener('raise_hand_ack', unsubAck);

    const unsubHands = realtimeService.on('hand_raises_updated', (data: any) => {
      if (data && data.handRaises && Array.isArray(data.handRaises)) {
        const found = data.handRaises.find((h: any) => h.rollNo === rollNo.trim());
        if (found) {
          setHasRaisedHand(true);
          setAssignedRank(found.rank);
        }
      }
    });

    const unsubTeacherStatus = realtimeService.on('teacher_status_changed', (data: any) => {
      if (data && data.isTeacherOnline !== undefined) {
        setIsTeacherOnline(data.isTeacherOnline);
      }
    });

    const unsubJoinSuccess = realtimeService.on('join_success', (data: any) => {
      if (data && data.session) {
        const s = data.session;
        if (s.currentQuestionIndex !== undefined) {
          setQuestionIndex(s.currentQuestionIndex);
        }
        if (s.title) {
          setSessionTitle(s.title);
        }
        if (s.isTeacherOnline !== undefined) {
          setIsTeacherOnline(s.isTeacherOnline);
        }
        if (s.questions && Array.isArray(s.questions)) {
          setAllQuestions(s.questions);
          const q = s.questions[s.currentQuestionIndex || 0];
          if (q) setCurrentQuestion(q);
        }
        if (s.handRaises && Array.isArray(s.handRaises)) {
          const found = s.handRaises.find((h: any) => h.rollNo === rollNo.trim());
          if (found) {
            setHasRaisedHand(true);
            setAssignedRank(found.rank);
          }
        }
      }
    });

    const unsubScore = realtimeService.on('marks_awarded', (data: any) => {
      if (data && data.rollNo === rollNo) {
        setMyScore((prev) => prev + (data.marks || 0));
        if (data.markingStatus === 'correct' || data.markingStatus === 'bonus') {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
      }
    });

    return () => {
      unsubQ();
      unsubReveal();
      unsubHands();
      unsubTeacherStatus();
      unsubJoinSuccess();
      window.removeEventListener('raise_hand_ack', unsubAck);
      unsubScore();
    };
  }, [isJoined, rollNo, allQuestions]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || !rollNo.trim()) {
      setJoinError('Please enter both Session PIN and your College Roll Number.');
      return;
    }

    const finalName = studentName.trim() || `Student (${rollNo.trim()})`;
    realtimeService.joinAsStudent(pin.trim(), rollNo.trim(), finalName);
    setIsJoined(true);
    setJoinError('');
  };

  const handleRaiseHand = () => {
    if (hasRaisedHand) return; // prevent spam
    realtimeService.raiseHand(pin.trim(), rollNo.trim(), studentName || rollNo.trim());
    setHasRaisedHand(true);
    setShowRaiseAlert(false);
  };

  // Student Option Click evaluation (Single choice per question strictly enforced)
  const handleOptionClick = (opt: string, optIdx: number) => {
    // 1. Must raise hand first
    if (!hasRaisedHand) {
      setShowRaiseAlert(true);
      setTimeout(() => setShowRaiseAlert(false), 3000);
      return;
    }

    // 2. REQUIREMENT: "ek student sirf ek baar hi apna option choose kar sakega dobara nahin"
    if (hasAnswered || selectedOption !== null) {
      return;
    }

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
      explanation = currentQuestion.explanationCorrect || 'ସଠିକ୍ ଉତ୍ତର (Correct Answer)';
    } else {
      if (currentQuestion.explanationIncorrect && currentQuestion.explanationIncorrect[optIdx]) {
        explanation = currentQuestion.explanationIncorrect[optIdx];
      } else {
        explanation = currentQuestion.correctAnswer 
          ? `ଭୁଲ୍ ବିକଳ୍ପ। ସଠିକ୍ ଉତ୍ତର: ${currentQuestion.correctAnswer}` 
          : 'ଭୁଲ୍ ବିକଳ୍ପ (Incorrect Answer)';
      }
    }

    setSelectedOption(optIdx);
    setHasAnswered(true);
    setOptionFeedback({
      isCorrect,
      text: opt,
      explanation
    });

    if (isCorrect) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    }

    // Broadcast option click to teacher screen & presentation panel
    realtimeService.clickOption(pin.trim(), optIdx, opt, isCorrect, explanation);
  };

  // View 1: Student Join Screen
  if (!isJoined) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
          <div className="text-center space-y-2">
            <BrandHeader size="md" align="center" />
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${isServerConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="text-[11px] font-semibold text-slate-600">
                {isServerConnected ? 'ଲାଇଭ୍ ସଂଯୁକ୍ତ (Server Online)' : 'ସର୍ଭର ସଂଯୋଗ ଚାଲିଛି...'}
              </span>
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase mt-2">
              ଛାତ୍ର ଯୋଗଦାନ (Student Join)
            </div>
          </div>

          {joinError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{joinError}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ସେସନ୍ ପିନ୍ (Session PIN)*
              </label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="e.g. 5821"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-center font-mono text-2xl font-black tracking-widest text-emerald-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                କଲେଜ ରୋଲ୍ ନମ୍ବର (College Roll Number)*
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BA24-001"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-center font-mono text-lg font-bold text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ଛାତ୍ରଙ୍କ ନାମ (Student Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ରୋଲ୍ ନମ୍ବର ଦେଲେ ଆପେ ଆସିବ କିମ୍ବା ନିଜେ ଲେଖନ୍ତୁ..."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
                {studentName && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-emerald-700/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>କୁଇଜ୍‌ରେ ଯୋଗ ଦିଅନ୍ତୁ (Join Quiz)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {!isStandalone && (
            <div className="pt-2 text-center">
              <button
                onClick={onExit}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                ← ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Home)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View 2: Active Student Live Participation Arena
  return (
    <div className="max-w-md mx-auto px-4 py-5 space-y-4">
      {/* Top Student Header */}
      <div className="bg-emerald-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-emerald-800 flex items-center justify-between">
        <div className="space-y-0.5">
          <BrandHeader size="sm" lightText={true} showSubtitle={false} />
          <div className="text-xs text-emerald-200 font-medium">
            {studentName} <span className="font-mono opacity-80">({rollNo})</span>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className={`w-2 h-2 rounded-full ${isServerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-[10px] text-emerald-200">
              {isServerConnected ? 'ଲାଇଭ୍ ସଂଯୁକ୍ତ (Connected)' : 'ସର୍ଭର ସଂଯୋଗ ଚାଲିଛି...'}
            </span>
          </div>
        </div>

        {/* Score pill */}
        <div className="text-right">
          <div className="text-[10px] text-emerald-300 uppercase font-bold">ମୋଟ ମାର୍କ</div>
          <div className="font-mono text-2xl font-black text-amber-300">
            {myScore} <span className="text-xs font-normal text-emerald-200">pts</span>
          </div>
        </div>
      </div>

      {/* REQUIREMENT 1: TEACHER OFFLINE PAUSE STATE */}
      {!isTeacherOnline && (
        <div className="p-5 rounded-3xl bg-amber-50 border-2 border-amber-400 text-center space-y-2.5 shadow-sm animate-pulse">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 animate-spin" />
          </div>
          <h4 className="font-odia font-bold text-base text-amber-950">
            ଅଧ୍ୟାପକ ସାମୟିକ ଭାବେ ଅଫଲାଇନ୍ ଅଛନ୍ତି...
          </h4>
          <p className="text-xs text-amber-800 font-medium leading-relaxed">
            ଦୟାକରି କିଛି ସମୟ ଅପେକ୍ଷା କରନ୍ତୁ। ଅଧ୍ୟାପକ ଆପ୍ ପୁଣି ଖୋଲିବା ମାତ୍ରେ କୁଇଜ୍ ଏହି ପୃଷ୍ଠାରେ ଆପେ ଆପେ ଆରମ୍ଭ ହୋଇଯିବ।
          </p>
          <div className="inline-block px-3.5 py-1 rounded-full bg-amber-200/80 text-amber-900 text-xs font-bold">
            ⏸️ କୁଇଜ୍ ସ୍ଥଗିତ ଅଛି (Session Paused)
          </div>
        </div>
      )}

      {/* Main Question & Participation Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        {/* Question Counter Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase border border-emerald-200">
            <span>ପ୍ରଶ୍ନ {questionIndex + 1}</span>
            {allQuestions.length > 0 && <span>/ {allQuestions.length}</span>}
          </div>

          <div className="text-xs font-bold text-slate-500">
            {currentQuestion?.pattern ? currentQuestion.pattern.toUpperCase() : 'MCQ'} • {currentQuestion?.marks || 1} Mark
          </div>
        </div>

        {/* Question Display on Mobile Screen */}
        <div className="space-y-2">
          {currentQuestion ? (
            <h3 className="font-odia font-black text-lg sm:text-xl text-slate-900 leading-snug">
              {currentQuestion.question}
            </h3>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <HelpCircle className="w-8 h-8 text-emerald-600 mx-auto animate-pulse" />
              <p className="font-odia font-bold text-slate-700 text-sm">
                ଅଧ୍ୟାପକ ପ୍ରଶ୍ନ ଆରମ୍ଭ କରିବା ପର୍ଯ୍ୟନ୍ତ ଅପେକ୍ଷା କରନ୍ତୁ...
              </p>
              <p className="text-xs text-slate-400">
                (Waiting for teacher to start or change question)
              </p>
            </div>
          )}
        </div>

        {/* RAISE HAND BUTTON SECTION (Positioned right below the question) */}
        <div className="pt-1">
          {!hasRaisedHand ? (
            <button
              onClick={handleRaiseHand}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold shadow-lg shadow-emerald-700/25 active:scale-98 transition-all flex items-center justify-between gap-3 ring-4 ring-emerald-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Hand className="w-6 h-6 animate-bounce" />
                </div>
                <div className="text-left">
                  <div className="font-odia font-black text-base tracking-wide">
                    ହାତ ଟେକନ୍ତୁ (RAISE HAND)
                  </div>
                  <div className="text-[11px] text-emerald-100 font-normal">
                    ଉତ୍ତର ଦେବା ପାଇଁ ଏଠାରେ ଚିପନ୍ତୁ (Tap to unlock options)
                  </div>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-black uppercase">
                Tap
              </div>
            </button>
          ) : (
            <div className="w-full p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex items-center justify-between shadow-xs animate-in fade-in-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-odia font-bold text-sm text-amber-900 leading-tight">
                    ହାତ ଟେକା ହେଲା (Hand Raised!)
                  </div>
                  <div className="text-[11px] text-amber-700">
                    ଏବେ ତଳ ବିକଳ୍ପରୁ ସଠିକ୍ ଉତ୍ତର ବାଛନ୍ତୁ (Select your option below)
                  </div>
                </div>
              </div>
              {assignedRank && (
                <div className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-mono text-xs font-black shadow-xs">
                  Rank #{assignedRank}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Alert prompt if user taps an option before raising hand */}
        {showRaiseAlert && (
          <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-900 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              ପ୍ରଥମେ ଉପରୋକ୍ତ "Raise Hand" ବଟନ୍ ଦବାନ୍ତୁ, ତା'ପରେ ହିଁ ବିକଳ୍ପ କ୍ଲିକ୍ ହେବ!
            </span>
          </div>
        )}

        {/* REQUIREMENT 2: LOCKED NOTICE AFTER SINGLE ANSWER CHOSEN */}
        {hasAnswered && (
          <div className="p-3 rounded-2xl bg-slate-100 border border-slate-300 text-center flex items-center justify-center gap-2 text-xs font-bold text-slate-700 animate-in fade-in-50">
            <Lock className="w-4 h-4 text-slate-600" />
            <span>ଆପଣଙ୍କ ଉତ୍ତର ଦାଖଲ ହୋଇଛି • ଗୋଟିଏ ପ୍ରଶ୍ନ ପାଇଁ ଥରେ ମାତ୍ର ବିକଳ୍ପ ବାଛିପାରିବେ</span>
          </div>
        )}

        {/* Options Section (Locked until Raise Hand is clicked, and locked after 1 selection) */}
        {currentQuestion?.options && currentQuestion.options.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
              <span>ବିକଳ୍ପ ଚୟନ (Options):</span>
              <span className={`flex items-center gap-1 ${hasRaisedHand && !hasAnswered ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                {hasAnswered ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>ଉତ୍ତର ଦାଖଲ ହେଲା (Locked)</span>
                  </>
                ) : hasRaisedHand ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>ଅନ୍‌ଲକ୍ ହେଲା (Clickable)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>ହାତ ଟେକିଲେ ଖୋଲିବ (Locked)</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const isCorrectFeedback = optionFeedback && isSelected && optionFeedback.isCorrect;
                const isWrongFeedback = optionFeedback && isSelected && !optionFeedback.isCorrect;

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={!hasRaisedHand || hasAnswered}
                    onClick={() => handleOptionClick(opt, optIdx)}
                    className={`p-3.5 rounded-2xl border-2 text-left font-medium transition-all flex items-center justify-between gap-3 select-none ${
                      !hasRaisedHand
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-75 border-dashed'
                        : isCorrectFeedback
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-4 ring-emerald-300/60 scale-[1.01]'
                        : isWrongFeedback
                        ? 'bg-rose-50 text-rose-950 border-rose-500 ring-2 ring-rose-300'
                        : hasAnswered
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-40'
                        : 'bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 border-slate-200 text-slate-800 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        !hasRaisedHand || (hasAnswered && !isSelected)
                          ? 'bg-slate-200 text-slate-400'
                          : isCorrectFeedback
                          ? 'bg-white text-emerald-900 shadow-xs'
                          : isWrongFeedback
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className={`text-sm font-semibold ${!hasRaisedHand || (hasAnswered && !isSelected) ? 'text-slate-500' : ''}`}>
                        {opt}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {isCorrectFeedback && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                          <span>ସଠିକ୍</span>
                        </span>
                      )}
                      {isWrongFeedback && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-black flex items-center gap-1 shadow-xs">
                          <XCircle className="w-3.5 h-3.5 text-rose-200" />
                          <span>ଭୁଲ୍</span>
                        </span>
                      )}
                      {(!hasRaisedHand || (hasAnswered && !isSelected)) && (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Feedback & Explanation Box */}
        {optionFeedback && (
          <div className={`p-4 rounded-2xl border-2 text-left space-y-1.5 animate-in fade-in-50 ${
            optionFeedback.isCorrect
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200'
              : 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-200'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm">
              {optionFeedback.isCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>ସଠିକ୍ ଉତ୍ତର! (Correct Answer)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>ଭୁଲ୍ ଉତ୍ତର (Incorrect Option Selected)</span>
                </>
              )}
            </div>
            {optionFeedback.explanation && (
              <p className="text-xs text-slate-700 leading-relaxed font-medium pt-1 border-t border-black/10">
                {optionFeedback.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Exit Button */}
      <div className="text-center pt-1">
        <button
          onClick={() => {
            if (isStandalone) {
              setIsJoined(false);
            } else {
              onExit();
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ସେସନ୍ ବାହାରକୁ ଯାଆନ୍ତୁ (Leave Session)</span>
        </button>
      </div>
    </div>
  );
};
