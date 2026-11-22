import React, { useState, useEffect } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Clock, 
  Users, 
  Hand, 
  Check, 
  X, 
  Trophy, 
  Sparkles, 
  HelpCircle,
  Info,
  Medal,
  Flame
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

  const currentQuestion: Question | undefined = questions[currentQIndex];

  // Listen to realtime updates from teacher controls
  useEffect(() => {
    const unsubQ = realtimeService.on('question_changed', (data: any) => {
      if (data) {
        if (data.currentQuestionIndex !== undefined) setCurrentQIndex(data.currentQuestionIndex);
        if (data.revealAnswer !== undefined) setRevealAnswer(data.revealAnswer);
        if (data.showDescription !== undefined) setShowDescription(data.showDescription);
        setHandRaises([]);
      }
    });

    const unsubReveal = realtimeService.on('answer_revealed', (data: any) => {
      if (data && data.revealAnswer !== undefined) {
        setRevealAnswer(data.revealAnswer);
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
      unsubDesc();
      unsubHands();
      unsubStudents();
      unsubLeaderboard();
    };
  }, []);

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
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Top Bar for Digital Flat Panel */}
      <div className="bg-slate-900/90 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
        <BrandHeader size="sm" lightText={true} />

        <div className="flex items-center gap-4">
          {/* Joined Students Counter */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-base font-bold text-emerald-300">
              {studentCount} Joined
            </span>
          </div>

          {/* Hand Raise Counter */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700">
            <Hand className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-mono text-base font-bold text-amber-300">
              {handRaises.length} Raised
            </span>
          </div>

          {/* Session PIN */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 font-mono">
            <span className="text-xs text-slate-400 font-bold">PIN:</span>
            <span className="text-lg font-black text-amber-400 tracking-widest">{initialSession.pin}</span>
          </div>

          {/* Leaderboard Toggle */}
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
            title="Toggle Leaderboard"
          >
            <Trophy className="w-5 h-5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Exit Button */}
          <button
            onClick={onExit}
            className="px-3.5 py-2 rounded-2xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 text-xs font-bold transition-colors"
          >
            ପ୍ରସ୍ଥାନ (Exit)
          </button>
        </div>
      </div>

      {/* Main Classroom Presentation Arena */}
      <div className="flex-1 p-6 lg:p-12 flex flex-col justify-center max-w-7xl mx-auto w-full">
        {showLeaderboard ? (
          /* LEADERBOARD VIEW */
          <div className="bg-slate-900/90 rounded-3xl p-8 border border-slate-800 space-y-6 max-h-[75vh] overflow-y-auto">
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
          <div className="space-y-8">
            {/* Question Meta Badge */}
            <div className="flex items-center justify-between">
              <span className="font-heading font-black text-sm lg:text-base uppercase tracking-widest px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                QUESTION {currentQIndex + 1} OF {questions.length} • {currentQuestion?.marks} MARK{currentQuestion && currentQuestion.marks > 1 ? 'S' : ''}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                {initialSession.subject}
              </span>
            </div>

            {/* Huge Question Text */}
            <h2 className="font-odia font-black text-2xl sm:text-4xl lg:text-5xl text-white leading-tight drop-shadow-md">
              {currentQuestion?.question}
            </h2>

            {/* Answer Options Grid (Very Large Buttons for Touch Panels) */}
            {currentQuestion?.options && currentQuestion.options.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 pt-4">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isCorrect = opt === currentQuestion.correctAnswer;
                  return (
                    <div
                      key={optIdx}
                      className={`p-6 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4 ${
                        revealAnswer && isCorrect
                          ? 'bg-emerald-600/95 text-white border-emerald-400 shadow-2xl scale-[1.02] ring-4 ring-emerald-400/50'
                          : revealAnswer && !isCorrect
                          ? 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${
                        revealAnswer && isCorrect ? 'bg-white text-emerald-900 shadow-md' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-xl sm:text-2xl font-bold font-odia leading-snug">
                        {opt}
                      </span>
                      {revealAnswer && isCorrect && (
                        <Check className="w-8 h-8 ml-auto text-white stroke-[3.5]" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Model Answer if revealed for Short/Long */}
            {revealAnswer && currentQuestion?.modelAnswer && (
              <div className="p-6 rounded-3xl bg-emerald-950/70 border-2 border-emerald-500/60 text-emerald-100 text-lg space-y-2">
                <span className="font-bold text-amber-300 block text-base uppercase">ମଡେଲ ଉତ୍ତର (Model Answer):</span>
                <p className="leading-relaxed font-odia">{currentQuestion.modelAnswer}</p>
              </div>
            )}

            {/* In-depth Explanation Banner if triggered */}
            {showDescription && (
              <div className="p-6 rounded-3xl bg-amber-950/60 border-2 border-amber-500/60 text-amber-100 text-base sm:text-lg space-y-2 animate-in fade-in-50">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Info className="w-5 h-5" />
                  <span>ବିସ୍ତୃତ ଐତିହାସିକ ବ୍ୟାଖ୍ୟା (In-Depth Explanation):</span>
                </div>
                <p className="leading-relaxed font-odia">{currentQuestion?.explanationCorrect}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Podium: Top 3 Hand Raises displayed prominently for classroom */}
      <div className="bg-slate-900/90 backdrop-blur-md px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-xs uppercase text-slate-400">
            ପ୍ରଥମ ୩ ପ୍ରତିଯୋଗୀ (Top 3 Raised Hands):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {handRaises.slice(0, 3).map((hr) => (
            <div
              key={hr.rollNo}
              className={`px-4 py-2 rounded-2xl flex items-center gap-2.5 border ${
                hr.rank === 1 ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md' :
                hr.rank === 2 ? 'bg-slate-300 text-slate-900 font-bold border-slate-200' :
                'bg-amber-700 text-white font-bold border-amber-600'
              }`}
            >
              <Medal className="w-4 h-4" />
              <span className="text-xs">Rank #{hr.rank}</span>
              <span className="text-xs font-bold">{hr.name}</span>
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
