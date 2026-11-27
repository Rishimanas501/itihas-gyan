import React, { useState, useEffect } from 'react';
import { db, initDatabaseDefaults } from './db';
import type { Question, QuizSession, AppSettings } from './types';
import { downloadStudentImportTemplate } from './services/excelService';
import { apiUrl, setConfiguredServerUrl } from './services/serverConfig';

// Layout & Navigation Components
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';

// All Application Screens
import { HomeScreen } from './components/HomeScreen';
import { StudentDatabaseScreen } from './components/StudentDatabaseScreen';
import { AiGeneratorScreen } from './components/AiGeneratorScreen';
import { ChatWithAiScreen } from './components/ChatWithAiScreen';
import { QuestionBankScreen } from './components/QuestionBankScreen';
import { TeacherControlScreen } from './components/TeacherControlScreen';
import { PresentationScreen } from './components/PresentationScreen';
import { StudentParticipationScreen } from './components/StudentParticipationScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { BackupRestoreScreen } from './components/BackupRestoreScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AboutDownloadsScreen } from './components/AboutDownloadsScreen';
import { HistoricalMapScreen } from './components/HistoricalMapScreen';

export function App() {
  const initialParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialViewParam = initialParams?.get('view');
  const initialPinParam = initialParams?.get('pin') || '';

  // Navigation stack
  const [navHistory, setNavHistory] = useState<string[]>(() => {
    if (initialViewParam === 'student') return ['student'];
    if (initialViewParam === 'presentation') return ['presentation'];
    return ['home'];
  });
  const currentView = navHistory[navHistory.length - 1] || 'home';

  // Responsive Sidebar State (Closed by default on desktop & mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Language state (Odia / English / Bilingual)
  const [currentLanguage, setCurrentLanguage] = useState<'odia' | 'english' | 'bilingual'>('bilingual');

  // Real-time database counts
  const [studentCount, setStudentCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);

  // Network & system state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [localIp, setLocalIp] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Active Quiz Session state
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [studentJoinPin, setStudentJoinPin] = useState(() => (initialViewParam === 'student' ? initialPinParam : ''));
  const [presentationPin, setPresentationPin] = useState(() => (initialViewParam === 'presentation' ? initialPinParam : ''));

  // Active Question Bank Chapter context (for return navigation from AI Chat)
  const [qbChapterContext, setQbChapterContext] = useState<{
    paperId?: string;
    chapterId?: string;
    paperName?: string;
    chapterName?: string;
    initialPastedText?: string;
  } | null>(null);

  // Initialize DB and URL parameters on load
  useEffect(() => {
    initDatabaseDefaults().then(() => {
      refreshCounts();
    });

    // Check query params for direct links: ?view=student&pin=1234 or ?view=presentation&pin=1234
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const pinParam = params.get('pin');
    const serverParam = params.get('server');

    if (serverParam) {
      setConfiguredServerUrl(serverParam);
    }

    if (viewParam === 'student') {
      if (pinParam) setStudentJoinPin(pinParam);
      setNavHistory(['student']);
    } else if (viewParam === 'presentation') {
      if (pinParam) setPresentationPin(pinParam);
      setNavHistory(['presentation']);
    }

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fetch local network IP from server if available
    fetch(apiUrl('/api/info'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.localIp) setLocalIp(data.localIp);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshCounts = async () => {
    try {
      const sCount = await db.students.count();
      const qCount = await db.questions.count();
      const sesCount = await db.sessions.count();
      const allScores = await db.scores.toArray();
      const endedSessions = await db.sessions.where('status').equals('ended').count();
      const studentsWithScores = new Set(allScores.map((s) => s.rollNo)).size;
      const resCount = Math.max(studentsWithScores, endedSessions, allScores.length > 0 ? 1 : 0);

      const appSettings = await db.settings.get('app_settings');

      setStudentCount(sCount);
      setQuestionCount(qCount);
      setSessionCount(sesCount);
      setResultsCount(resCount);
      if (appSettings) {
        setSettings(appSettings);
        if (appSettings.serverUrl) {
          setConfiguredServerUrl(appSettings.serverUrl);
        }
        if (appSettings.defaultLanguage) {
          setCurrentLanguage(appSettings.defaultLanguage);
        }
      }
    } catch (err) {
      console.error('Failed to refresh counts:', err);
    }
  };

  const navigateTo = (view: string) => {
    setNavHistory((prev) => [...prev, view]);
    refreshCounts();
  };

  const handleBack = () => {
    if (navHistory.length > 1) {
      setNavHistory((prev) => prev.slice(0, prev.length - 1));
      refreshCounts();
    }
  };

  const handleNavigateToChatFromChapter = (ctx?: {
    paperId?: string;
    chapterId?: string;
    paperName?: string;
    chapterName?: string;
  }) => {
    if (ctx) {
      setQbChapterContext({ ...ctx });
    }
    navigateTo('ai_chat');
  };

  const handleReturnToChapterFromChat = (pastedText?: string) => {
    if (qbChapterContext) {
      setQbChapterContext((prev) => prev ? { ...prev, initialPastedText: pastedText } : null);
    }
    navigateTo('question_bank');
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
      questionIds: questionsToUse.map((q) => q.id!).filter(Boolean),
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

  // Presentation Mode shortcut (Distraction-free Full Screen Mode)
  const openPresentation = () => {
    if (!activeSession) {
      db.questions.toArray().then((qs) => {
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

  const handleMenuNavigation = (viewId: string) => {
    setIsSidebarOpen(false);
    if (viewId === 'live_quiz') {
      if (!activeSession) {
        startLiveQuiz();
      } else {
        navigateTo('live_quiz');
      }
    } else {
      navigateTo(viewId);
    }
  };

  // 1. PRESENTATION SCREEN (Distraction-free full-screen for LG Digital Flat Panels / Projectors)
  // Supports both local activeSession AND remote Smart Panel linking via ?view=presentation&pin=XXXX
  if (currentView === 'presentation') {
    const isDirectPresentationLink = new URLSearchParams(window.location.search).get('view') === 'presentation';
    return (
      <PresentationScreen
        session={activeSession || undefined}
        questions={sessionQuestions}
        initialPin={presentationPin || activeSession?.pin || ''}
        isStandalone={isDirectPresentationLink}
        onExit={() => {
          if (isDirectPresentationLink) {
            setNavHistory(['home']);
          } else {
            handleBack();
          }
        }}
      />
    );
  }

  // 2. STUDENT PARTICIPATION SCREEN (Distraction-free mobile interface for students)
  if (currentView === 'student') {
    const isDirectStudentLink = new URLSearchParams(window.location.search).get('view') === 'student';
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
        <StudentParticipationScreen
          initialPin={studentJoinPin}
          onExit={() => setNavHistory(['home'])}
          isStandalone={isDirectStudentLink}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb] text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white w-full">
      {/* 2. LEFT SIDEBAR: OVERLAY DRAWER (CLOSED BY DEFAULT ON DESKTOP & MOBILE) */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleMenuNavigation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isOnline={isOnline}
        appVersion="v1.0.0 (Production)"
      />

      {/* 3. TOP HEADER (100% full screen width, contains Three-Dot Menu Button at extreme left) */}
      <TopHeader
        currentView={currentView}
        onNavigate={handleMenuNavigation}
        onBack={handleBack}
        canGoBack={navHistory.length > 1}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        teacherName={settings?.teacherName || 'ଅଧ୍ୟାପକ (History Teacher)'}
        collegeName={settings?.collegeName || 'ଇତିହାସ ବିଭାଗ, ସ୍ୱୟଂଶାସିତ ମହାବିଦ୍ୟାଳୟ'}
        onOpenPresentation={activeSession ? openPresentation : undefined}
        onOpenStudentView={openStudentView}
        currentLanguage={currentLanguage}
        onChangeLanguage={(lang) => {
          setCurrentLanguage(lang);
          if (settings) {
            const updated = { ...settings, defaultLanguage: lang };
            db.settings.put(updated);
            setSettings(updated);
          }
        }}
      />

      {/* MAIN CONTENT AREA — 100% Full Available Width, NO permanent left margin */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <main className="flex-1 w-full">
          {/* 1. Home Dashboard */}
          {currentView === 'home' && (
            <HomeScreen
              onNavigate={handleMenuNavigation}
              studentCount={studentCount}
              questionCount={questionCount}
              sessionCount={sessionCount}
              resultsCount={resultsCount}
              isOnline={isOnline}
              localIp={localIp}
              onDownloadTemplate={downloadStudentImportTemplate}
            />
          )}

          {/* Historical Maps & Flipbook Animation */}
          {currentView === 'historical_maps' && (
            <HistoricalMapScreen
              geminiApiKey={settings?.geminiApiKey}
              isOdia={currentLanguage === 'odia' || currentLanguage === 'bilingual'}
            />
          )}

          {/* AI Chat & Vision Multimodal Assistant */}
          {currentView === 'ai_chat' && (
            <ChatWithAiScreen
              onBack={() => {
                if (qbChapterContext) {
                  handleReturnToChapterFromChat();
                } else {
                  handleBack();
                }
              }}
              geminiApiKey={settings?.geminiApiKey}
              openaiApiKey={settings?.openaiApiKey}
              defaultLanguage={currentLanguage}
              onNavigateToBank={() => navigateTo('question_bank')}
              onNavigateToMaps={() => navigateTo('historical_maps')}
              onNavigateToSettings={() => navigateTo('settings')}
              onStartQuizWithQuestions={(qs) => startLiveQuiz(qs)}
              chapterContext={qbChapterContext}
              onReturnToChapter={handleReturnToChapterFromChat}
            />
          )}

          {/* 2. Live Quiz (Teacher Control) */}
          {currentView === 'live_quiz' && activeSession && (
            <TeacherControlScreen
              session={activeSession}
              questions={sessionQuestions}
              onBack={handleBack}
              onSessionEnded={() => {
                setActiveSession(null);
                setSessionQuestions([]);
                setNavHistory(['home']);
                refreshCounts();
              }}
              onOpenPresentation={openPresentation}
              onOpenStudentView={openStudentView}
            />
          )}

          {/* 3. AI Question Generator */}
          {currentView === 'ai_generator' && (
            <AiGeneratorScreen
              onBack={handleBack}
              geminiApiKey={settings?.geminiApiKey}
              onNavigateToBank={() => navigateTo('question_bank')}
              onNavigateToChat={() => navigateTo('ai_chat')}
              onStartLiveQuizWithQuestions={(qs) => startLiveQuiz(qs)}
            />
          )}

          {/* 4. Question Bank */}
          {currentView === 'question_bank' && (
            <QuestionBankScreen
              onBack={handleBack}
              onStartQuizWithQuestions={(selected) => startLiveQuiz(selected)}
              onNavigateToAi={() => navigateTo('ai_generator')}
              onNavigateToChat={handleNavigateToChatFromChapter}
              initialContext={qbChapterContext}
            />
          )}

          {/* 5. Student Database */}
          {currentView === 'student_database' && (
            <StudentDatabaseScreen onBack={handleBack} />
          )}

          {/* 6. Reports & Results */}
          {currentView === 'reports' && (
            <ReportsScreen onBack={handleBack} />
          )}

          {/* 7. Backup & Restore */}
          {currentView === 'backup_restore' && (
            <BackupRestoreScreen onBack={handleBack} />
          )}

          {/* 8. Settings */}
          {currentView === 'settings' && (
            <SettingsScreen
              onBack={handleBack}
              onSettingsUpdated={(newSettings) => setSettings(newSettings)}
            />
          )}

          {/* 9. About / Downloads */}
          {currentView === 'about_downloads' && (
            <AboutDownloadsScreen
              onBack={handleBack}
              isOnline={isOnline}
              localIp={localIp}
              studentCount={studentCount}
              questionCount={questionCount}
              sessionCount={sessionCount}
            />
          )}
        </main>

        {/* Global Slim Footer Bar (Hidden in single-viewport Historical Maps workspace) */}
        {currentView !== 'historical_maps' && (
          <footer className="border-t border-slate-200/80 bg-white/80 py-3.5 px-6 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-odia font-black text-slate-900 text-sm">
                  ଇତିହାସ ଜ୍ଞାନ
                </span>
                <span className="font-heading font-extrabold text-blue-600 uppercase text-[10px] tracking-widest">
                  ITIHASH GYAN
                </span>
                <span className="text-slate-400">• v1.0.0 (Production Release)</span>
              </div>
              <div className="text-slate-400 text-[11px] text-center sm:text-right">
                Digital Flat Panel & Classroom Quiz System for College Teachers & Students
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
