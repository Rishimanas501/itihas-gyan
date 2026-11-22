import React, { useState, useEffect } from 'react';
import { db, initDatabaseDefaults } from './db';
import type { Question, QuizSession, AppSettings } from './types';
import { downloadStudentImportTemplate } from './services/excelService';

// Import All Screen Components
import { HomeScreen } from './components/HomeScreen';
import { Navigation } from './components/Navigation';
import { BrandHeader } from './components/BrandHeader';
import { StudentDatabaseScreen } from './components/StudentDatabaseScreen';
import { AiGeneratorScreen } from './components/AiGeneratorScreen';
import { QuestionBankScreen } from './components/QuestionBankScreen';
import { TeacherControlScreen } from './components/TeacherControlScreen';
import { PresentationScreen } from './components/PresentationScreen';
import { StudentParticipationScreen } from './components/StudentParticipationScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { BackupRestoreScreen } from './components/BackupRestoreScreen';
import { SettingsScreen } from './components/SettingsScreen';

export function App() {
  // Navigation stack
  const [navHistory, setNavHistory] = useState<string[]>(['home']);
  const currentView = navHistory[navHistory.length - 1] || 'home';

  // Real-time & database state
  const [studentCount, setStudentCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [localIp, setLocalIp] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Active Quiz Session state
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [studentJoinPin, setStudentJoinPin] = useState('');

  // Initialize DB and URL parameters on load
  useEffect(() => {
    initDatabaseDefaults().then(() => {
      refreshCounts();
    });

    // Check query params for direct links: ?view=student&pin=1234 or ?view=presentation
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const pinParam = params.get('pin');

    if (viewParam === 'student') {
      if (pinParam) setStudentJoinPin(pinParam);
      setNavHistory(['student']);
    } else if (viewParam === 'presentation') {
      setNavHistory(['presentation']);
    }

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fetch local network IP from server if available
    fetch('/api/info')
      .then(res => res.json())
      .then(data => {
        if (data && data.localIp) setLocalIp(data.localIp);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshCounts = async () => {
    const sCount = await db.students.count();
    const qCount = await db.questions.count();
    const sesCount = await db.sessions.count();
    const appSettings = await db.settings.get('app_settings');

    setStudentCount(sCount);
    setQuestionCount(qCount);
    setSessionCount(sesCount);
    if (appSettings) setSettings(appSettings);
  };

  const navigateTo = (view: string) => {
    setNavHistory(prev => [...prev, view]);
    refreshCounts();
  };

  const handleBack = () => {
    if (navHistory.length > 1) {
      setNavHistory(prev => prev.slice(0, prev.length - 1));
      refreshCounts();
    }
  };

  // Launch a new live quiz session
  const startLiveQuiz = async (selectedQuestions?: Question[]) => {
    let questionsToUse = selectedQuestions;

    if (!questionsToUse || questionsToUse.length === 0) {
      const allApproved = await db.questions.where('approved').equals(1).toArray();
      questionsToUse = allApproved.length > 0 ? allApproved : await db.questions.toArray();
    }

    if (questionsToUse.length === 0) {
      alert('Question Bank is empty! Please create questions with AI or add questions first.');
      navigateTo('ai_generator');
      return;
    }

    // Generate random 4-digit PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date().toISOString();

    const newSession: QuizSession = {
      id: 'session_' + Date.now(),
      pin,
      title: 'ଇତିହାସ କୁଇଜ୍ ପରୀକ୍ଷା (History Classroom Quiz)',
      subject: questionsToUse[0]?.subject || 'History of Odisha',
      topic: questionsToUse[0]?.topic || 'Classroom Evaluation',
      questionIds: questionsToUse.map(q => q.id!).filter(Boolean),
      currentQuestionIndex: 0,
      status: 'active',
      revealAnswer: false,
      showDescription: false,
      timerDuration: settings?.defaultTimer || 30,
      createdAt: now
    };

    await db.sessions.put(newSession);
    setActiveSession(newSession);
    setSessionQuestions(questionsToUse);
    setStudentJoinPin(pin);
    navigateTo('live_quiz');
  };

  // Presentation Mode shortcut
  const openPresentation = () => {
    if (!activeSession) {
      // Create quick demo session if none active
      db.questions.toArray().then(qs => {
        if (qs.length > 0) {
          startLiveQuiz(qs).then(() => {
            navigateTo('presentation');
          });
        } else {
          alert('No questions in bank. Please add questions first.');
        }
      });
    } else {
      navigateTo('presentation');
    }
  };

  // Student Mode shortcut
  const openStudentView = () => {
    navigateTo('student');
  };

  // If currently in Presentation Screen (Full screen mode for Digital Flat Panels)
  if (currentView === 'presentation' && activeSession) {
    return (
      <PresentationScreen
        session={activeSession}
        questions={sessionQuestions}
        onExit={handleBack}
      />
    );
  }

  // If currently in Student Participation Screen
  if (currentView === 'student') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
        <StudentParticipationScreen
          initialPin={studentJoinPin}
          onExit={() => setNavHistory(['home'])}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => setNavHistory(['home'])}
            className="text-left focus:outline-none cursor-pointer"
          >
            <BrandHeader size="sm" showSubtitle={false} />
          </button>

          <Navigation
            currentView={currentView}
            onNavigate={navigateTo}
            onBack={handleBack}
            canGoBack={navHistory.length > 1}
            onOpenPresentation={activeSession ? openPresentation : undefined}
            onOpenStudentView={openStudentView}
          />
        </div>
      </header>

      {/* Main View Router */}
      <main className="flex-1 pb-12">
        {currentView === 'home' && (
          <HomeScreen
            onNavigate={(view) => {
              if (view === 'live_quiz') {
                startLiveQuiz();
              } else {
                navigateTo(view);
              }
            }}
            studentCount={studentCount}
            questionCount={questionCount}
            sessionCount={sessionCount}
            isOnline={isOnline}
            localIp={localIp}
            onDownloadTemplate={downloadStudentImportTemplate}
          />
        )}

        {currentView === 'live_quiz' && activeSession && (
          <TeacherControlScreen
            session={activeSession}
            questions={sessionQuestions}
            onBack={handleBack}
            onOpenPresentation={openPresentation}
            onOpenStudentView={openStudentView}
          />
        )}

        {currentView === 'student_database' && (
          <StudentDatabaseScreen onBack={handleBack} />
        )}

        {currentView === 'ai_generator' && (
          <AiGeneratorScreen
            onBack={handleBack}
            geminiApiKey={settings?.geminiApiKey}
            onNavigateToBank={() => navigateTo('question_bank')}
            onStartLiveQuizWithQuestions={(qs) => startLiveQuiz(qs)}
          />
        )}

        {currentView === 'question_bank' && (
          <QuestionBankScreen
            onBack={handleBack}
            onStartQuizWithQuestions={(selected) => startLiveQuiz(selected)}
            onNavigateToAi={() => navigateTo('ai_generator')}
          />
        )}

        {currentView === 'reports' && (
          <ReportsScreen onBack={handleBack} />
        )}

        {currentView === 'backup_restore' && (
          <BackupRestoreScreen onBack={handleBack} />
        )}

        {currentView === 'settings' && (
          <SettingsScreen
            onBack={handleBack}
            onSettingsUpdated={(newSettings) => setSettings(newSettings)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-odia font-bold text-slate-800 text-sm">
              ଇତିହାସ ଜ୍ଞାନ
            </span>
            <span className="font-heading font-semibold text-emerald-800 uppercase text-[10px] tracking-widest">
              ITIHASH GYAN
            </span>
            <span>• v1.0.0 (Production Release)</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Smart Interactive Classroom Quiz & Examination Platform for College Teachers and Students
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
