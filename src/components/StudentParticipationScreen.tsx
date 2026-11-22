import React, { useState, useEffect } from 'react';
import { 
  Hand, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Sparkles, 
  Trophy, 
  ArrowRight,
  LogOut,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BrandHeader } from './BrandHeader';
import { realtimeService } from '../services/socketService';
import { db } from '../db';
import type { Student } from '../types';

interface StudentParticipationScreenProps {
  initialPin?: string;
  onExit: () => void;
}

export const StudentParticipationScreen: React.FC<StudentParticipationScreenProps> = ({
  initialPin = '',
  onExit
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
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [assignedRank, setAssignedRank] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [revealAnswer, setRevealAnswer] = useState(false);

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

  // Realtime subscriptions once joined
  useEffect(() => {
    if (!isJoined) return;

    const unsubQ = realtimeService.on('question_changed', (data: any) => {
      if (data) {
        setQuestionIndex(data.currentQuestionIndex);
        setHasRaisedHand(false);
        setAssignedRank(null);
        setRevealAnswer(false);
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
        setAssignedRank(rank);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } else if (status === 'already_raised') {
        setHasRaisedHand(true);
      }
    };
    window.addEventListener('raise_hand_ack', unsubAck);

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
      window.removeEventListener('raise_hand_ack', unsubAck);
      unsubScore();
    };
  }, [isJoined, rollNo]);

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
  };

  // View 1: Student Join Screen
  if (!isJoined) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
          <div className="text-center space-y-2">
            <BrandHeader size="md" align="center" />
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
                  placeholder="ରୋଲ୍ ନମ୍ବର ଦେଲେ ସ୍ୱୟଂଚାଳିତ ଭାବେ ଆସିବ..."
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

          <div className="pt-2 text-center">
            <button
              onClick={onExit}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              ← ମୁଖ୍ୟ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ (Back to Home)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View 2: Active Student Live Participation Arena
  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Top Student Header */}
      <div className="bg-emerald-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-800 flex items-center justify-between">
        <div className="space-y-0.5">
          <BrandHeader size="sm" lightText={true} showSubtitle={false} />
          <div className="text-xs text-emerald-200 font-medium">
            {studentName} <span className="font-mono opacity-80">({rollNo})</span>
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

      {/* Main Participation Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase">
          <span>ପ୍ରଶ୍ନ ନଂ {questionIndex + 1}</span>
        </div>

        {/* Status Prompt */}
        <div className="space-y-2">
          <h3 className="font-odia font-bold text-xl text-slate-900 leading-snug">
            {hasRaisedHand 
              ? 'ଆପଣଙ୍କ ହାତ ଟେକା ଗ୍ରହଣ କରାଯାଇଛି!' 
              : 'ଉତ୍ତର ଜଣାଥିଲେ ଶୀଘ୍ର ହାତ ଟେକନ୍ତୁ (Raise Hand)'}
          </h3>
          <p className="text-xs text-slate-500">
            {hasRaisedHand 
              ? 'ଅଧ୍ୟାପକ ଆପଣଙ୍କୁ ଚୟନ କରିବା ପର୍ଯ୍ୟନ୍ତ ଅପେକ୍ଷା କରନ୍ତୁ।' 
              : 'ପ୍ରଥମେ ହାତ ଟେକିଲେ ଆପଣଙ୍କ ରାଙ୍କ ସର୍ବୋଚ୍ଚ ରହିବ।'}
          </p>
        </div>

        {/* BIG RAISE HAND BUTTON (PART 10) */}
        <div className="py-4">
          <button
            onClick={handleRaiseHand}
            disabled={hasRaisedHand}
            className={`w-44 h-44 rounded-full mx-auto flex flex-col items-center justify-center transition-all duration-300 select-none ${
              hasRaisedHand
                ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-xl ring-8 ring-amber-400/30 scale-105'
                : 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-2xl hover:scale-105 active:scale-95 ring-8 ring-emerald-500/20'
            }`}
          >
            <Hand className={`w-16 h-16 ${hasRaisedHand ? 'animate-bounce' : 'animate-pulse'}`} />
            <span className="font-odia font-black text-lg mt-2">
              {hasRaisedHand ? 'ହାତ ଟେକା ହେଲା' : 'ହାତ ଟେକନ୍ତୁ'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              {hasRaisedHand ? 'HAND RAISED' : 'RAISE HAND'}
            </span>
          </button>
        </div>

        {/* Confirmation & Rank Badge */}
        {hasRaisedHand && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 animate-in fade-in-50 space-y-1">
            <div className="flex items-center justify-center gap-2 font-bold text-sm text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ସଫଳତାର ସହ ପଞ୍ଜୀକୃତ ହେଲା!</span>
            </div>
            {assignedRank && (
              <div className="font-mono text-lg font-black text-amber-800">
                ଆପଣଙ୍କ ରାଙ୍କ: #{assignedRank}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exit Button */}
      <div className="text-center pt-2">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ପ୍ରସ୍ଥାନ କରନ୍ତୁ (Leave Session)</span>
        </button>
      </div>
    </div>
  );
};
