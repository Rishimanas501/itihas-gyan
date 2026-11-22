import React, { useState, useEffect, useRef } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Users, 
  Hand, 
  Trophy, 
  Info, 
  Medal, 
  Flame, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { BrandHeader } from './BrandHeader';
import type { Question, QuizSession, HandRaiseRecord } from '../types';
import { realtimeService } from '../services/socketService';

interface PresentationScreenProps {
  session: QuizSession;
  questions: Question[];
  onExit: () => void;
}

export const PresentationScreen: React.FC<PresentationScreenProps> = ({
  session: initialSession,
  questions,
  onExit
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(initialSession.currentQuestionIndex || 0);
  const [revealAnswer, setRevealAnswer] = useState(initialSession.revealAnswer || false);
  const [showDescription, setShowDescription] = useState(initialSession.showDescription || false);
  const [handRaises, setHandRaises] = useState<HandRaiseRecord[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Interactive option click state: ONLY 1 option is highlighted at a time
  const [clickedOptions, setClickedOptions] = useState<{ [index: number]: 'correct' | 'wrong' }>({});
  const [lastFeedback, setLastFeedback] = useState<{
    isCorrect: boolean;
    text: string;
    explanation: string;
    optIndex: number;
  } | null>(null);

  const feedbackRef = useRef<HTMLDivElement>(null);
  const currentQuestion: Question | undefined = questions[currentQIndex];

  // Auto-scroll to feedback description when an option is clicked or description is shown
  useEffect(() => {
    if (lastFeedback || showDescription) {
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [lastFeedback, showDescription]);

  // Listen to realtime updates from teacher controls
  useEffect(() => {
    const unsubQ = realtimeService.on('question_changed', (data: any) => {
      if (data) {
        if (data.currentQuestionIndex !== undefined) setCurrentQIndex(data.currentQuestionIndex);
        if (data.revealAnswer !== undefined) setRevealAnswer(data.revealAnswer);
        if (data.showDescription !== undefined) setShowDescription(data.showDescription);
        setHandRaises([]);
        setClickedOptions({});
        setLastFeedback(null);
      }
    });

    const unsubReveal = realtimeService.on('answer_revealed', (data: any) => {
      if (data && data.revealAnswer !== undefined) {
        setRevealAnswer(data.revealAnswer);
      }
    });

    const unsubOption = realtimeService.on('option_clicked', (data: any) => {
      if (data && data.optIndex !== undefined) {
        // ONLY highlight the newly clicked option
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

    const unsubDesc = realtimeService.on('description_toggled', (data: any) => {
      if (data && data.showDescription !== undefined) {
        setShowDescription(data.showDescription);
      }
    });

    const unsubHands = realtimeService.on('hand_raises_updated', (data: any) => {
      if (data && data.handRaises) {
        setHandRaises(data.handRaises);
      }
    });

    const unsubStudents = realtimeService.on('student_list_updated', (data: any) => {
      if (data && data.studentCount !== undefined) {
        setStudentCount(data.studentCount);
      }
    });

    const unsubLeaderboard = realtimeService.on('leaderboard_updated', (data: any) => {
      if (data && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    });

    return () => {
      unsubQ();
      unsubReveal();
      unsubOption();
      unsubDesc();
      unsubHands();
      unsubStudents();
      unsubLeaderboard();
    };
  }, []);

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
        `ଏହା ସମ୍ପୂର୍ଣ୍ଣ ସଠିକ୍ ଉତ୍ତର ଅଟେ। ପ୍ରଦତ୍ତ ଐତିହାସିକ ତଥ୍ୟ ଅନୁସାରେ "${opt}" ସଠିକ୍। (Correct answer based on verified historical facts.)`;
    } else {
      if (currentQuestion.explanationIncorrect && currentQuestion.explanationIncorrect[optIdx]) {
        explanation = currentQuestion.explanationIncorrect[optIdx];
      } else {
        explanation = `"${opt}" ଏହି ପ୍ରଶ୍ନ ପାଇଁ ଭୁଲ୍ ବିକଳ୍ପ ଅଟେ। ଦୟାକରି ଅନ୍ୟ ବିକଳ୍ପ ଚେଷ୍ଟା କରନ୍ତୁ! (Incorrect option. Please check the other choices and try again!)`;
      }
    }

    // ONLY highlight the newly clicked option, resetting previous ones
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

    realtimeService.clickOption(initialSession.pin, optIdx, opt, isCorrect, explanation);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto select-none">
      {/* Top Bar for Digital Flat Panel */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-lg">
        <BrandHeader size="sm" lightText={true} />

        <div className="flex items-center gap-3">
          {/* Joined Students Counter */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 sm:px-4 py-1.5 rounded-2xl border border-slate-700">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-sm sm:text-base font-bold text-emerald-300">
              {studentCount} Joined
            </span>
          </div>

          {/* Hand Raise Counter */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 sm:px-4 py-1.5 rounded-2xl border border-slate-700">
            <Hand className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-mono text-sm sm:text-base font-bold text-amber-300">
              {handRaises.length} Raised
            </span>
          </div>

          {/* Session PIN */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3.5 py-1.5 rounded-2xl border border-slate-700 font-mono">
            <span className="text-xs text-slate-400 font-bold">PIN:</span>
            <span className="text-base sm:text-lg font-black text-amber-400 tracking-widest">{initialSession.pin}</span>
          </div>

          {/* Leaderboard Toggle */}
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="p-2 sm:p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
            title="Toggle Leaderboard"
          >
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Exit Button */}
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-2xl bg-rose-900/70 hover:bg-rose-800 text-rose-200 border border-rose-700 text-xs font-bold transition-colors"
          >
            ପ୍ରସ୍ଥାନ (Exit)
          </button>
        </div>
      </div>

      {/* Main Classroom Presentation Arena */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-start max-w-6xl mx-auto w-full space-y-4">
        {showLeaderboard ? (
          /* LEADERBOARD VIEW */
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-400" />
                <div>
                  <h3 className="font-odia font-black text-2xl text-amber-300">
                    ଲାଇଭ୍ ଲିଡରବୋର୍ଡ୍ (Live Classroom Leaderboard)
                  </h3>
                  <p className="text-xs text-slate-400">କ୍ଲାସର ସର୍ବୋଚ୍ଚ ସ୍କୋର ଓ ପ୍ରଦର୍ଶନ</p>
                </div>
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                ପ୍ରଶ୍ନ ଦେଖନ୍ତୁ (Back to Question)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leaderboard.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400">
                  କୌଣସି ମାର୍କ ରେକର୍ଡ ଏପର୍ଯ୍ୟନ୍ତ ନାହିଁ।
                </div>
              ) : (
                leaderboard.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                      idx === 0 ? 'bg-amber-500/10 border-amber-400/60 ring-1 ring-amber-400' :
                      idx === 1 ? 'bg-slate-400/10 border-slate-400/50' :
                      idx === 2 ? 'bg-amber-800/10 border-amber-700/50' :
                      'bg-slate-800/40 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base ${
                        idx === 0 ? 'bg-amber-400 text-slate-950 shadow-md' :
                        idx === 1 ? 'bg-slate-300 text-slate-900' :
                        idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-base text-white">{item.name}</div>
                        <div className="font-mono text-xs text-slate-400">{item.rollNo}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-2xl font-black text-amber-300">
                        {item.totalMarks} <span className="text-xs font-normal text-slate-400">pts</span>
                      </div>
                      <div className="text-[11px] text-emerald-400">
                        {item.correctCount} Correct • {item.handRaiseCount} Raises
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* QUESTION VIEW ON DIGITAL FLAT PANEL */
          <div className="space-y-4">
            {/* Question Meta Badge */}
            <div className="flex items-center justify-between">
              <span className="font-heading font-black text-xs sm:text-sm uppercase tracking-widest px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                QUESTION {currentQIndex + 1} OF {questions.length} • {currentQuestion?.marks} MARK{currentQuestion && currentQuestion.marks > 1 ? 'S' : ''}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-400">
                {initialSession.subject}
              </span>
            </div>

            {/* Question Text */}
            <h2 className="font-odia font-black text-xl sm:text-2xl lg:text-3xl text-white leading-snug drop-shadow-md notranslate" translate="no">
              {currentQuestion?.question}
            </h2>

            {/* Answer Options Grid (Touch-Friendly Buttons for Flat Panels & Screens) */}
            {currentQuestion?.options && currentQuestion.options.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
                {currentQuestion.options.map((opt, optIdx) => {
                  const clickedStatus = clickedOptions[optIdx];

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleOptionClick(opt, optIdx)}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer text-left active:scale-[0.99] select-none ${
                        clickedStatus === 'correct'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-xl ring-4 ring-emerald-400/50 scale-[1.01]'
                          : clickedStatus === 'wrong'
                          ? 'bg-rose-950/90 border-rose-500 text-white ring-4 ring-rose-500/40 shadow-xl scale-[1.01]'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition-colors ${
                          clickedStatus === 'correct'
                            ? 'bg-white text-emerald-950 shadow-md'
                            : clickedStatus === 'wrong'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="text-base sm:text-lg font-bold font-odia leading-snug notranslate" translate="no">
                          {opt}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {clickedStatus === 'correct' && (
                          <div className="px-3 py-1 rounded-xl bg-emerald-800 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                            <span>ସଠିକ୍ ଉତ୍ତର</span>
                          </div>
                        )}
                        {clickedStatus === 'wrong' && (
                          <div className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm">
                            <XCircle className="w-4 h-4 text-rose-200" />
                            <span>ଭୁଲ୍ ଉତ୍ତର</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Flat Panel Feedback & In-Depth Description Banner (Prominently Visible) */}
            {lastFeedback ? (
              <div
                ref={feedbackRef}
                className={`mt-2 p-5 rounded-3xl border-2 transition-all duration-300 shadow-2xl animate-in fade-in-50 ${
                  lastFeedback.isCorrect
                    ? 'bg-emerald-950/95 border-emerald-500 text-white ring-4 ring-emerald-500/30'
                    : 'bg-rose-950/95 border-rose-500 text-white ring-4 ring-rose-500/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  {lastFeedback.isCorrect ? (
                    <CheckCircle2 className="w-9 h-9 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-9 h-9 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className={`text-xl sm:text-2xl font-black font-odia uppercase tracking-wide ${
                        lastFeedback.isCorrect ? 'text-emerald-300' : 'text-rose-300'
                      }`}>
                        {lastFeedback.isCorrect
                          ? '🎉 ସଠିକ୍ ଉତ୍ତର! (CORRECT ANSWER)'
                          : '❌ ଭୁଲ୍ ଉତ୍ତର! (INCORRECT ANSWER - PLEASE TRY AGAIN)'}
                      </h4>
                      <span className="text-xs sm:text-sm font-mono px-3 py-1 rounded-xl bg-white/10 font-bold">
                        OPTION {String.fromCharCode(65 + lastFeedback.optIndex)}
                      </span>
                    </div>

                    <p className="text-base sm:text-lg font-bold text-slate-200">
                      ବାଛିଥିବା ବିକଳ୍ପ: <span className="text-amber-300 font-extrabold underline">{lastFeedback.text}</span>
                    </p>

                    <div className="pt-2 border-t border-white/15 text-sm sm:text-base space-y-1">
                      <span className="font-bold block text-slate-300">
                        {lastFeedback.isCorrect ? 'ଐତିହାସିକ ବ୍ୟାଖ୍ୟା (In-Depth Explanation):' : 'କାହିଁକି ଏହି ବିକଳ୍ପ ଭୁଲ୍ (Why this is incorrect):'}
                      </span>
                      <p className="leading-relaxed text-slate-100 font-odia font-normal">
                        {lastFeedback.explanation}
                      </p>
                    </div>

                    {!lastFeedback.isCorrect && (
                      <div className="pt-1">
                        <span className="text-xs sm:text-sm font-semibold text-rose-200 bg-rose-900/70 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 border border-rose-700/60">
                          💡 ଦୟାକରି ସଠିକ୍ ଉତ୍ତର ନମିଳିବା ପର୍ଯ୍ୟନ୍ତ ଅନ୍ୟ ବିକଳ୍ପ ଚୟନ କରନ୍ତୁ! (Please try other options until you find the right one!)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : showDescription && currentQuestion?.explanationCorrect ? (
              <div
                ref={feedbackRef}
                className="mt-2 p-5 rounded-3xl bg-amber-950/90 border-2 border-amber-500/70 text-amber-50 space-y-2 shadow-2xl animate-in fade-in-50"
              >
                <div className="flex items-center gap-2 font-bold text-amber-300 text-lg sm:text-xl">
                  <Info className="w-6 h-6 text-amber-400" />
                  <span>ବିସ୍ତୃତ ଐତିହାସିକ ବ୍ୟାଖ୍ୟା (In-Depth Explanation):</span>
                </div>
                <p className="leading-relaxed font-odia text-base sm:text-lg text-slate-100">
                  {currentQuestion.explanationCorrect}
                </p>
              </div>
            ) : null}

            {/* Model Answer if revealed for Short/Long */}
            {revealAnswer && currentQuestion?.modelAnswer && (
              <div className="p-5 rounded-3xl bg-emerald-950/70 border-2 border-emerald-500/60 text-emerald-100 text-base sm:text-lg space-y-2">
                <span className="font-bold text-amber-300 block text-sm uppercase">ମଡେଲ ଉତ୍ତର (Model Answer):</span>
                <p className="leading-relaxed font-odia">{currentQuestion.modelAnswer}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Podium: Top 3 Hand Raises displayed prominently for classroom */}
      <div className="bg-slate-900/90 backdrop-blur-md px-6 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs uppercase text-slate-400">
            ପ୍ରଥମ ୩ ପ୍ରତିଯୋଗୀ (Top 3 Raised Hands):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {handRaises.slice(0, 3).map((hr) => (
            <div
              key={hr.rollNo}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border text-xs ${
                hr.rank === 1 ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md' :
                hr.rank === 2 ? 'bg-slate-300 text-slate-900 font-bold border-slate-200' :
                'bg-amber-700 text-white font-bold border-amber-600'
              }`}
            >
              <Medal className="w-3.5 h-3.5" />
              <span>Rank #{hr.rank}</span>
              <span className="font-bold">{hr.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({hr.rollNo})</span>
            </div>
          ))}

          {handRaises.length === 0 && (
            <span className="text-xs text-slate-500 italic">
              ପ୍ରଶ୍ନର ଉତ୍ତର ପାଇଁ ମୋବାଇଲରୁ ହାତ ଟେକନ୍ତୁ (Raise Hand)...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
