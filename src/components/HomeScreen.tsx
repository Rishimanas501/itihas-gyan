import React, { useState, useEffect } from 'react';
import {
  Play,
  Sparkles,
  MessageSquareText,
  BookOpen,
  Users,
  BarChart3,
  Database,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Award,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  Trophy,
  Activity,
  History,
  Info,
  Compass,
  Map as MapIcon,
  GraduationCap,
  Monitor
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { db } from '../db';

interface HomeScreenProps {
  onNavigate: (view: string) => void;
  studentCount: number;
  questionCount: number;
  sessionCount: number;
  resultsCount: number;
  isOnline: boolean;
  localIp?: string;
  onDownloadTemplate: () => void;
}

interface ActivityItem {
  id: string;
  type: 'quiz' | 'student' | 'question' | 'backup' | 'score';
  titleOdia: string;
  titleEng: string;
  subtitle: string;
  dateStr: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  studentCount,
  questionCount,
  sessionCount,
  resultsCount,
  isOnline,
  localIp,
  onDownloadTemplate
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Fetch actual recent activities from existing database
  useEffect(() => {
    const loadRealActivities = async () => {
      try {
        const items: ActivityItem[] = [];

        // 1. Check latest live quiz sessions
        const recentSessions = await db.sessions.toArray();
        if (recentSessions.length > 0) {
          // Sort descending by createdAt
          const sorted = [...recentSessions].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const latest = sorted[0];
          items.push({
            id: `session_${latest.id}`,
            type: 'quiz',
            titleOdia: latest.status === 'ended' ? 'କୁଇଜ୍ ସମ୍ପନ୍ନ ହୋଇଛି' : 'ଲାଇଭ୍ କୁଇଜ୍ ସେସନ୍',
            titleEng: `Session PIN: ${latest.pin}`,
            subtitle: `${latest.subject || 'ଇତିହାସ'} • ${latest.questionIds?.length || 0} ପ୍ରଶ୍ନ`,
            dateStr: formatActivityDate(latest.createdAt),
            icon: Play,
            colorClass: 'text-blue-600',
            bgClass: 'bg-blue-50'
          });
        }

        // 2. Check latest questions created
        const recentQuestions = await db.questions.toArray();
        if (recentQuestions.length > 0) {
          const sortedQ = [...recentQuestions].sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          const latestQ = sortedQ[0];
          items.push({
            id: `q_${latestQ.id}`,
            type: 'question',
            titleOdia: 'ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କରେ ନୂଆ ପ୍ରଶ୍ନ ଯୋଡ଼ାଗଲା',
            titleEng: 'New Question Added',
            subtitle: `${latestQ.topic || latestQ.subject || 'ଇତିହାସ'} (${latestQ.pattern?.toUpperCase()})`,
            dateStr: formatActivityDate(latestQ.createdAt),
            icon: BookOpen,
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50'
          });
        }

        // 3. Check latest students
        const recentStudents = await db.students.toArray();
        if (recentStudents.length > 0) {
          const sortedS = [...recentStudents].sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          const latestS = sortedS[0];
          items.push({
            id: `student_${latestS.id || latestS.rollNo}`,
            type: 'student',
            titleOdia: 'ଛାତ୍ରଛାତ୍ରୀ ଡାଟା ଯୋଡ଼ାଗଲା',
            titleEng: 'Student Enrolled',
            subtitle: `${latestS.name} (${latestS.rollNo})`,
            dateStr: formatActivityDate(latestS.createdAt),
            icon: Users,
            colorClass: 'text-cyan-600',
            bgClass: 'bg-cyan-50'
          });
        }

        // 4. Check latest backup
        const settings = await db.settings.get('app_settings');
        if (settings && (settings as any).lastBackupDate) {
          items.push({
            id: 'backup_last',
            type: 'backup',
            titleOdia: 'ଡାଟାବେସ୍ ବ୍ୟାକ୍ଅପ୍ ସଫଳ',
            titleEng: 'System Backup Created',
            subtitle: 'ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ ବ୍ୟାକ୍ଅପ୍ ଫାଇଲ୍ ଡାଉନଲୋଡ୍ ହୋଇଛି',
            dateStr: formatActivityDate((settings as any).lastBackupDate),
            icon: Database,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50'
          });
        }

        // 5. Check scores/results
        const allScores = await db.scores.toArray();
        if (allScores.length > 0) {
          items.push({
            id: 'score_latest',
            type: 'score',
            titleOdia: 'ପରୀକ୍ଷା ମୂଲ୍ୟାୟନ ରେକର୍ଡ ହୋଇଛି',
            titleEng: 'Scores Recorded',
            subtitle: `${allScores.length} ଟି ପ୍ରଶ୍ନୋତ୍ତର ମୂଲ୍ୟାଙ୍କନ ଉପଲବ୍ଧ`,
            dateStr: 'ସଦ୍ୟତମ ଫଳାଫଳ',
            icon: Trophy,
            colorClass: 'text-purple-600',
            bgClass: 'bg-purple-50'
          });
        }

        setActivities(items);
      } catch (err) {
        console.error('Failed to load recent activities:', err);
      } finally {
        setLoadingActivity(false);
      }
    };

    loadRealActivities();
  }, [studentCount, questionCount, sessionCount, resultsCount]);

  function formatActivityDate(dateString?: string): string {
    if (!dateString) return 'ନିକଟ ଅତୀତରେ';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'ନିକଟ ଅତୀତରେ';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 5) return 'ଏହି ମାତ୍ର (Just now)';
      if (diffMins < 60) return `${diffMins} ମିନିଟ୍ ପୂର୍ବେ`;
      if (diffHours < 24) return `${diffHours} ଘଣ୍ଟା ପୂର୍ବେ`;
      if (diffDays === 1) return 'ଗତକାଲି (Yesterday)';
      if (diffDays < 7) return `${diffDays} ଦିନ ପୂର୍ବେ`;

      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return 'ନିକଟ ଅତୀତରେ';
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 4. HOME DASHBOARD WELCOME BANNER WITH BEAUTIFULLY ARRANGED KONARK & PURI JAGANNATH TEMPLES */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#070e24] via-[#0d1d42] to-[#142e6a] text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-blue-900/60">
        
        {/* 🌟 PROMINENT & MAJESTIC BACKGROUND: PURI JAGANNATH SHREEMANDIRA & KONARK SUN TEMPLE CHARIOT WHEEL */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-end justify-end">
          {/* Ambient Golden & Divine Blue Halos */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

          {/* Authentic Architectural SVG: Jagannath Temple Spire + Nilachakra + Patitapabana Flag & Konark Sun Temple Wheel */}
          <svg
            viewBox="0 0 760 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[520px] sm:w-[650px] lg:w-[740px] h-auto max-h-[92%] opacity-30 sm:opacity-35 text-amber-300 transition-opacity translate-x-6 sm:translate-x-0"
          >
            {/* Sunrise Rays radiating from behind the monuments */}
            <g opacity="0.4" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6">
              <line x1="390" y1="280" x2="160" y2="40" />
              <line x1="390" y1="280" x2="250" y2="20" />
              <line x1="390" y1="280" x2="350" y2="10" />
              <line x1="390" y1="280" x2="450" y2="15" />
              <line x1="390" y1="280" x2="550" y2="30" />
              <line x1="390" y1="280" x2="650" y2="60" />
            </g>

            {/* Base Plinth / Temple Platform */}
            <path
              d="M 20 285 L 740 285 L 740 295 L 20 295 Z"
              fill="currentColor"
              opacity="0.3"
            />
            <line x1="20" y1="285" x2="740" y2="285" stroke="currentColor" strokeWidth="2" opacity="0.6" />

            {/* ============================================================ */}
            {/* 1. PURI SRI JAGANNATH SHREEMANDIRA (Left-Center Architecture)  */}
            {/* ============================================================ */}
            {/* Jagamohana (Pyramidal Front Hall) */}
            <path
              d="M 120 285 L 145 230 L 195 230 L 220 285 Z"
              fill="currentColor"
              opacity="0.25"
            />
            <path
              d="M 135 230 L 150 185 L 190 185 L 205 230 Z"
              fill="currentColor"
              opacity="0.3"
            />
            <path
              d="M 148 185 L 160 150 L 180 150 L 192 185 Z"
              fill="currentColor"
              opacity="0.35"
            />
            {/* Jagamohana Kalasa & Mastaka */}
            <ellipse cx="170" cy="146" rx="9" ry="4" fill="currentColor" opacity="0.7" />
            <path d="M 170 142 L 170 132" stroke="currentColor" strokeWidth="2.5" />

            {/* Main Vimana / Bada Deula (Towering Rekha Shikhara of Jagannath Temple) */}
            <path
              d="M 195 285 L 210 200 Q 220 120 240 65 L 260 65 Q 280 120 290 200 L 305 285 Z"
              fill="currentColor"
              opacity="0.32"
            />
            {/* Stepped horizontal ribs (Pagas & Bhumis) of Rekha Deula */}
            {[260, 240, 220, 200, 180, 160, 140, 120, 100, 80].map((y, i) => (
              <line
                key={i}
                x1={205 + (285 - y) * 0.12}
                y1={y}
                x2={295 - (285 - y) * 0.12}
                y2={y}
                stroke="currentColor"
                strokeWidth="1.2"
                opacity="0.5"
              />
            ))}
            {/* Beki & Amalaka (ଅଁଳା ବେକୀ) */}
            <rect x="238" y="58" width="24" height="7" rx="2" fill="currentColor" opacity="0.6" />
            <ellipse cx="250" cy="52" rx="18" ry="6" fill="currentColor" opacity="0.8" />
            {/* Kalasa (ପୂର୍ଣ୍ଣ କଳସ) */}
            <ellipse cx="250" cy="43" rx="8" ry="4" fill="currentColor" opacity="0.85" />
            
            {/* ☸️ THE SACRED NILACHAKRA (ନୀଳଚକ୍ର) */}
            <circle cx="250" cy="30" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.95" />
            <circle cx="250" cy="30" r="3" fill="currentColor" opacity="0.95" />
            {[0, 45, 90, 135].map((deg, i) => (
              <line
                key={i}
                x1={250 + 9 * Math.cos((deg * Math.PI) / 180)}
                y1={30 + 9 * Math.sin((deg * Math.PI) / 180)}
                x2={250 - 9 * Math.cos((deg * Math.PI) / 180)}
                y2={30 - 9 * Math.sin((deg * Math.PI) / 180)}
                stroke="currentColor"
                strokeWidth="1.8"
                opacity="0.95"
              />
            ))}

            {/* 🚩 PATITAPABANA BANA (Holy Fluttering Flag of Jagannath Temple) */}
            <path
              d="M 252 22 Q 275 14 295 24 Q 282 28 298 34 L 252 28 Z"
              fill="currentColor"
              opacity="0.9"
            />
            <line x1="250" y1="30" x2="252" y2="18" stroke="currentColor" strokeWidth="2.5" />

            {/* ============================================================ */}
            {/* 2. KONARK SUN TEMPLE (କୋଣାର୍କ ସୂର୍ଯ୍ୟ ମନ୍ଦିର - Right Architecture) */}
            {/* ============================================================ */}
            {/* Konark Jagamohana Structure */}
            <path
              d="M 330 285 L 350 240 L 410 240 L 430 285 Z"
              fill="currentColor"
              opacity="0.25"
            />
            <path
              d="M 345 240 L 360 200 L 400 200 L 415 240 Z"
              fill="currentColor"
              opacity="0.3"
            />
            <path
              d="M 358 200 L 370 165 L 390 165 L 402 200 Z"
              fill="currentColor"
              opacity="0.35"
            />
            <ellipse cx="380" cy="160" rx="12" ry="5" fill="currentColor" opacity="0.75" />
            <path d="M 380 156 L 380 144" stroke="currentColor" strokeWidth="2.5" />

            {/* ☀️ THE COLOSSAL 24-SPOKED KONARK CHARIOT WHEEL (କୋଣାର୍କ ଚକ୍ର) */}
            <g transform="translate(580, 175)">
              {/* Outer Carved Rim with Studs */}
              <circle cx="0" cy="0" r="102" stroke="currentColor" strokeWidth="5" fill="none" opacity="0.8" />
              <circle cx="0" cy="0" r="94" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" fill="none" opacity="0.5" />
              <circle cx="0" cy="0" r="86" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.85" />

              {/* Decorative Medallions on Outer Rim */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
                <circle
                  key={i}
                  cx={94 * Math.cos((deg * Math.PI) / 180)}
                  cy={94 * Math.sin((deg * Math.PI) / 180)}
                  r="3.5"
                  fill="currentColor"
                  opacity="0.8"
                />
              ))}

              {/* Central Axle & Hub */}
              <circle cx="0" cy="0" r="32" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.2" opacity="0.9" />
              <circle cx="0" cy="0" r="16" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.4" opacity="0.9" />
              <circle cx="0" cy="0" r="6" fill="currentColor" opacity="0.95" />

              {/* 16 Major & Minor Carved Spokes of Konark */}
              {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((deg, i) => {
                const isMajor = i % 2 === 0;
                return (
                  <g key={i}>
                    <line
                      x1={32 * Math.cos((deg * Math.PI) / 180)}
                      y1={32 * Math.sin((deg * Math.PI) / 180)}
                      x2={86 * Math.cos((deg * Math.PI) / 180)}
                      y2={86 * Math.sin((deg * Math.PI) / 180)}
                      stroke="currentColor"
                      strokeWidth={isMajor ? 3.5 : 2}
                      opacity={isMajor ? 0.9 : 0.65}
                    />
                    {isMajor && (
                      <circle
                        cx={60 * Math.cos((deg * Math.PI) / 180)}
                        cy={60 * Math.sin((deg * Math.PI) / 180)}
                        r="4"
                        fill="currentColor"
                        opacity="0.85"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>ସ୍ମାର୍ଟ ଡିଜିଟାଲ୍ କ୍ଲାସରୁମ୍ ଏବଂ ପରୀକ୍ଷା ପରିଚାଳନା</span>
            </div>

            {/* Strict Application Branding */}
            <div>
              <h1 className="font-odia font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight drop-shadow-md">
                ଇତିହାସ ଜ୍ଞାନ
              </h1>
              <h2 className="font-heading font-black text-sm sm:text-base lg:text-lg text-blue-300 tracking-[0.25em] uppercase pt-0.5">
                ITIHASH GYAN
              </h2>
            </div>

            {/* Subtitle */}
            <p className="text-slate-200 text-xs sm:text-sm font-normal leading-relaxed pt-1 drop-shadow-xs max-w-xl">
              Smart Interactive Classroom Quiz & Examination System. ଉଚ୍ଚ ମାଧ୍ୟମିକ ଓ ମହାବିଦ୍ୟାଳୟ ସ୍ତରର ଇତିହାସ ଶିକ୍ଷାଦାନ, ଡିଜିଟାଲ୍ ଫ୍ଲାଟ୍ ପ୍ୟାନେଲ୍ ଏବଂ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ସ୍ମାର୍ଟଫୋନ୍ ମାଧ୍ୟମରେ ତତ୍କ୍ଷଣାତ୍ ମୂଲ୍ୟାୟନ।
            </p>

            {/* Heritage Badge */}
            <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-amber-300/90">
              <span>🏛️ ଐତିହ୍ୟ ପୃଷ୍ଠଭୂମି: ଶ୍ରୀମନ୍ଦିର ପୁରୀ ଓ କୋଣାର୍କ ସୂର୍ଯ୍ୟ ମନ୍ଦିର</span>
            </div>
          </div>

          {/* Quick Status / Hotspot Indicator */}
          <div className="shrink-0 flex flex-col gap-2.5 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/70 shadow-lg">
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-semibold text-slate-200">
                {isOnline ? 'ଅନଲାଇନ୍ ସଂଯୋଜିତ (Gemini AI ସକ୍ରିୟ)' : 'ଲୋକାଲ୍ ମୋଡ୍ (Offline NLP Ready)'}
              </span>
            </div>

            {localIp ? (
              <div className="text-[11px] text-blue-300 font-mono bg-blue-950/70 px-2.5 py-1 rounded-lg border border-blue-800/50">
                Wi-Fi IP: {localIp}:3000
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">
                Local Wi-Fi Server Ready
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-1">
              <button
                onClick={() => onNavigate('student')}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                title="ଛାତ୍ର ଯୋଗଦାନ (Join Quiz)"
              >
                <GraduationCap className="w-4 h-4" />
                <span>ଛାତ୍ର ଯୋଗଦାନ</span>
              </button>
              <button
                onClick={() => onNavigate('presentation')}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                title="LG Smart Panel / Projector Display Mode"
              >
                <Monitor className="w-4 h-4" />
                <span>Smart Panel</span>
              </button>
              <button
                onClick={() => onNavigate('live_quiz')}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>କୁଇଜ୍ ଆରମ୍ଭ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FOUR COLOURFUL STATISTICS CARDS (FETCHED FROM REAL DATABASE & CLICKABLE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Students (Blue Theme) -> Navigates to Student Database */}
        <div
          onClick={() => onNavigate('student_database')}
          className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-blue-400 hover:ring-4 hover:ring-blue-500/10 active:scale-[0.98] transition-all duration-200 cursor-pointer group"
          title="କ୍ଲିକ୍ କରି ଛାତ୍ର ତାଲିକା ଦେଖନ୍ତୁ (Click to view Student Database)"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
              ଛାତ୍ରଛାତ୍ରୀ
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-blue-600 font-heading">
              {studentCount}
            </div>
            <div className="text-xs text-slate-600 font-medium font-odia mt-0.5 group-hover:text-blue-700 transition-colors">
              ମୋଟ ପଞ୍ଜୀକୃତ ଛାତ୍ର
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-slate-400 font-heading uppercase tracking-wide">
                Total Students
              </span>
              <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                ଦେଖନ୍ତୁ &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* 2. Questions in Bank (Green Theme) -> Navigates to Question Bank */}
        <div
          onClick={() => onNavigate('question_bank')}
          className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-400 hover:ring-4 hover:ring-emerald-500/10 active:scale-[0.98] transition-all duration-200 cursor-pointer group"
          title="କ୍ଲିକ୍ କରି ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ୍ ଦେଖନ୍ତୁ (Click to view Question Bank)"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
              ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ୍
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 font-heading">
              {questionCount}
            </div>
            <div className="text-xs text-slate-600 font-medium font-odia mt-0.5 group-hover:text-emerald-700 transition-colors">
              ପ୍ରଶ୍ନ ସଂରକ୍ଷିତ
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-slate-400 font-heading uppercase tracking-wide">
                Questions in Bank
              </span>
              <span className="text-[10px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                ଦେଖନ୍ତୁ &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* 3. Live Quiz Sessions (Orange/Amber Theme) -> Navigates to Live Quiz */}
        <div
          onClick={() => onNavigate('live_quiz')}
          className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-amber-400 hover:ring-4 hover:ring-amber-500/10 active:scale-[0.98] transition-all duration-200 cursor-pointer group"
          title="କ୍ଲିକ୍ କରି ଲାଇଭ୍ କୁଇଜ୍ ଦେଖନ୍ତୁ (Click to view Live Quiz)"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-amber-600 transition-colors">
              କୁଇଜ୍ ସେସନ୍
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white group-hover:scale-110 transition-all shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-amber-600 font-heading">
              {sessionCount}
            </div>
            <div className="text-xs text-slate-600 font-medium font-odia mt-0.5 group-hover:text-amber-700 transition-colors">
              କୁଇଜ୍ ପରିଚାଳିତ
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-slate-400 font-heading uppercase tracking-wide">
                Live Quiz Sessions
              </span>
              <span className="text-[10px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                ଦେଖନ୍ତୁ &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* 4. Results Available (Purple Theme) -> Navigates to Reports */}
        <div
          onClick={() => onNavigate('reports')}
          className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-purple-400 hover:ring-4 hover:ring-purple-500/10 active:scale-[0.98] transition-all duration-200 cursor-pointer group"
          title="କ୍ଲିକ୍ କରି ଫଳାଫଳ ଓ ରିପୋର୍ଟ ଦେଖନ୍ତୁ (Click to view Results)"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
              ଫଳାଫଳ
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white group-hover:scale-110 transition-all shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-purple-600 font-heading">
              {resultsCount}
            </div>
            <div className="text-xs text-slate-600 font-medium font-odia mt-0.5 group-hover:text-purple-700 transition-colors">
              ଫଳାଫଳ ଉପଲବ୍ଧ
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-slate-400 font-heading uppercase tracking-wide">
                Results Available
              </span>
              <span className="text-[10px] text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                ଦେଖନ୍ତୁ &rarr;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. REAL RECENT ACTIVITY & SYSTEM DASHBOARD (CLEAN EXECUTIVE LAYOUT - NO REDUNDANT SIDEBAR DUPLICATES) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Real Recent Activities Timeline (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>ସାମ୍ପ୍ରତିକ କାର୍ଯ୍ୟକଳାପ (RECENT ACTIVITY)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              ଲାଇଭ୍ ଡାଟାବେସ୍ କାର୍ଯ୍ୟକଳାପ
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            {loadingActivity ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                କାର୍ଯ୍ୟକଳାପ ଯାଞ୍ଚ ହେଉଛି...
              </div>
            ) : activities.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {activities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/70 rounded-2xl px-2 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-2xl ${act.bgClass} ${act.colorClass} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-odia font-bold text-sm text-slate-900 truncate">
                            {act.titleOdia}
                          </span>
                          <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 font-medium">
                            {act.dateStr}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate mt-0.5">
                          {act.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Activity className="w-7 h-7" />
                </div>
                <div className="font-odia font-bold text-base text-slate-700">
                  କୌଣସି ସାମ୍ପ୍ରତିକ କାର୍ଯ୍ୟକଳାପ ନାହିଁ
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  କୁଇଜ୍ ଆରମ୍ଭ କଲେ ବା ଛାତ୍ର ଯୋଡ଼ିଲେ ସମସ୍ତ କାର୍ଯ୍ୟକଳାପ ଏଠାରେ ସ୍ୱୟଂଚାଳିତ ଭାବେ ପ୍ରଦର୍ଶିତ ହେବ।
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-xs">ସମସ୍ତ ଡାଟା ଲୋକାଲ୍ ଡାଟାବେସ୍‌ରେ ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ</span>
              <button
                onClick={() => onNavigate('reports')}
                className="text-blue-600 font-bold hover:underline cursor-pointer text-xs flex items-center gap-1"
              >
                <span>ପୂର୍ଣ୍ଣ ରିପୋର୍ଟ ଓ ଫଳାଫଳ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Utilities & Template Download (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>ଶିକ୍ଷାଦାନ ସହାୟତା (TEACHER UTILITY)</span>
            </h3>
          </div>

          {/* Excel Template Download Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-odia font-bold text-sm text-slate-900">
                ଛାତ୍ର ନାମଲେଖା Excel ଟେମ୍ପଲେଟ୍
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                ଏହି ଟେମ୍ପଲେଟ୍ ଡାଉନଲୋଡ୍ କରି ସିଧାସଳଖ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ନାମ ଓ ରୋଲ୍ ନମ୍ବର ଭରି ଏକସଙ୍ଗେ ଆମଦାନୀ (Bulk Import) କରନ୍ତୁ।
              </p>
            </div>
            <button
              onClick={onDownloadTemplate}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel ଟେମ୍ପଲେଟ୍ ଡାଉନଲୋଡ୍</span>
            </button>
          </div>

          {/* Quick System Status Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 font-odia">ସିଷ୍ଟମ୍ ସ୍ଥିତି (System Status)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>କଲେଜ ଡାଟାବେସ୍:</span>
                <span className="font-bold text-emerald-600">ସୁରକ୍ଷିତ (Dexie v5)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ଚାଟ୍ AI ମୋଡ୍:</span>
                <span className="font-bold text-blue-600">Offline NLP + Vision</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ନେଭିଗେସନ୍:</span>
                <span className="text-slate-500 font-medium">ବାମ ପାର୍ଶ୍ୱ ସାଇଡବାର୍ (Sidebar Menu)</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 8. BOTTOM INFORMATION STRIP */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-6 py-4 border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {/* Subtle decorative temple silhouette background */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-heading font-bold text-xs sm:text-sm text-amber-300 uppercase tracking-wider">
              "Knowledge is Power — Let's Explore the History Together!"
            </p>
            <p className="font-odia text-xs text-slate-300">
              ଜ୍ଞାନ ହିଁ ଶକ୍ତି — ଆସନ୍ତୁ ଏକାଠି ଇତିହାସର ରୋମାଞ୍ଚକର ଯାତ୍ରା ଆରମ୍ଭ କରିବା!
            </p>
          </div>
        </div>

        <div className="shrink-0 text-[11px] text-slate-400 font-medium">
          🏛️ ଉଚ୍ଚ ମାଧ୍ୟମିକ ଓ ମହାବିଦ୍ୟାଳୟ ଇତିହାସ ଶିକ୍ଷାଦାନ ପାଇଁ ଉଦ୍ଦିଷ୍ଟ
        </div>
      </div>
    </div>
  );
};
