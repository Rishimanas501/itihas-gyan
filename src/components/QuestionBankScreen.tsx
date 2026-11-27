import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  Plus,
  ArrowLeft,
  MoreVertical,
  Edit3,
  Trash2,
  Play,
  Eye,
  Copy,
  FileText,
  Check,
  CheckSquare,
  Square,
  Download,
  Clock,
  Award,
  BookOpen,
  ChevronRight,
  X,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Wand2,
  RefreshCw,
  Sliders,
  Layers,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Paperclip,
  Send,
  Image as ImageIcon,
  Maximize2,
  Minus
} from 'lucide-react';
import { db, initDatabaseDefaults } from '../db';
import type { 
  Paper, 
  Chapter, 
  Question, 
  SavedTest, 
  QuestionLanguage,
  QuestionPattern,
  AppSettings,
  ExamAnswerFormat,
  ChatAttachment
} from '../types';
import { 
  parseAndConvertPastedText,
  checkQuestionDuplicate,
  normalizeQuestionForComparison,
  scanDuplicatesInQuestions,
  autoSolveAndCompleteHistoryQuestions,
  type DuplicateScanResult
} from '../services/aiGenerator';
import { 
  sendChatMessage,
  processSelectedFile,
  extractFilesFromClipboard
} from '../services/chatAiService';
import { apiUrl } from '../services/serverConfig';

export interface ParsedQuestionItem extends Question {
  isDuplicate?: boolean;
  skipThis?: boolean;
  matchedQuestion?: string;
}

export interface ChapterChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  parsedQuestions?: ParsedQuestionItem[];
}
import {
  getPapersWithStats,
  getChaptersWithStats,
  savePaper,
  deletePaperSafe,
  saveChapter,
  deleteChapterSafe,
  getChapterQuestions,
  getSavedTests,
  saveTestToLibrary,
  duplicateSavedTest,
  deleteSavedTest,
  exportTestPaperPDF,
  type PaperWithStats,
  type ChapterWithStats
} from '../services/questionBankService';

interface QuestionBankScreenProps {
  onBack: () => void;
  onStartQuizWithQuestions: (questions: Question[]) => void;
  onNavigateToAi: () => void;
  onNavigateToChat?: (context?: { paperId?: string; chapterId?: string; paperName?: string; chapterName?: string }) => void;
  initialContext?: {
    paperId?: string;
    chapterId?: string;
    paperName?: string;
    chapterName?: string;
    initialPastedText?: string;
  } | null;
}

const SAMPLE_PASTE_TEXT = `1. ପ୍ରାଚୀନ ଭାରତୀୟ ଇତିହାସର ସର୍ବପ୍ରାଚୀନ ଧାର୍ମିକ ସାହିତ୍ୟ କେଉଁଟି?
(A) ଋଗ୍‌ବେଦ
(B) ସାମବେଦ
(C) ଯଜୁର୍ବେଦ
(D) ଅଥର୍ବବେଦ
ଉତ୍ତର: A
ବ୍ୟାଖ୍ୟା: ଋଗ୍‌ବେଦ ହେଉଛି ଭାରତର ସର୍ବପୁରାତନ ବୈଦିକ ଗ୍ରନ୍ଥ, ଯାହା ପ୍ରାଚୀନ ଆର୍ଯ୍ୟ ସଭ୍ୟତାର ପ୍ରାମାଣିକ ବିବରଣୀ ପ୍ରଦାନ କରେ।

2. କଳିଙ୍ଗ ରାଜା ଖାରବେଳଙ୍କ କୀର୍ତ୍ତି କେଉଁ ଶିଳାଲେଖରେ ବର୍ଣ୍ଣିତ?
(A) ଏଲାହାବାଦ ପ୍ରଶସ୍ତି
(B) ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ
(C) ଆଇହୋଲ ଅଭିଲେଖ
(D) ଜୁନାଗଡ଼ ଶିଳାଲେଖ
ଉତ୍ତର: B
ବ୍ୟାଖ୍ୟା: ଉଦୟଗିରିସ୍ଥିତ ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖରୁ ମହାମେଘବାହନ ଖାରବେଳଙ୍କ ୧୩ ବର୍ଷର ଶାସନ ଓ ବିଜୟ ବାର୍ତ୍ତା ଜଣାପଡ଼େ।

3. 'ଇଣ୍ଡିକା' (Indika) ପୁସ୍ତକର ରଚୟିତା କିଏ ଥିଲେ?
(A) ମେଗାସ୍ଥିନିସ୍
(B) ଫା-ହିୟାନ୍
(C) ହୁଏନସାଂ
(D) ଟଲେମି
ଉତ୍ତର: A
ବ୍ୟାଖ୍ୟା: ଗ୍ରୀକ୍ ରାଷ୍ଟ୍ରଦୂତ ମେଗାସ୍ଥିନିସ୍ ଚନ୍ଦ୍ରଗୁପ୍ତ ମୌର୍ଯ୍ୟଙ୍କ ରାଜସଭାକୁ ଆସି 'ଇଣ୍ଡିକା' ଗ୍ରନ୍ଥ ରଚନା କରିଥିଲେ।`;

// Navigation Levels
type ViewLevel = 'papers' | 'chapters' | 'chapter_detail' | 'create_test';

export const QuestionBankScreen: React.FC<QuestionBankScreenProps> = ({
  onBack,
  onStartQuizWithQuestions,
  onNavigateToAi,
  onNavigateToChat,
  initialContext
}) => {
  // Navigation State
  const [viewLevel, setViewLevel] = useState<ViewLevel>('papers');
  const [selectedPaper, setSelectedPaper] = useState<PaperWithStats | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterWithStats | null>(null);

  // Settings for AI calls
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Success Toast state
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Smart Paste Modal States
  const [isSmartPasteModalOpen, setIsSmartPasteModalOpen] = useState(false);
  const [smartPasteStep, setSmartPasteStep] = useState<'paste' | 'preview'>('paste');
  const [smartPasteRawText, setSmartPasteRawText] = useState('');
  const [parsedPastedQuestions, setParsedPastedQuestions] = useState<ParsedQuestionItem[]>([]);
  const [smartPasteSkipDuplicates, setSmartPasteSkipDuplicates] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [isConvertingWithAi, setIsConvertingWithAi] = useState(false);

  // Smart Paste Requirements
  const [smartPasteTargetPattern, setSmartPasteTargetPattern] = useState<'auto' | 'mcq' | 'blanks' | 'true_false' | 'short' | 'long'>('auto');
  const [smartPasteTargetLanguage, setSmartPasteTargetLanguage] = useState<'bilingual' | 'odia' | 'english'>('bilingual');

  // Chapter AI Generator Modal States
  const [isChapterAiModalOpen, setIsChapterAiModalOpen] = useState(false);
  const [chapterModalTab, setChapterModalTab] = useState<'generator' | 'chat'>('generator');
  const [chapterAiCount, setChapterAiCount] = useState<number>(10);
  const [chapterAiPattern, setChapterAiPattern] = useState<'mcq' | 'blanks' | 'true_false' | 'short' | 'long'>('mcq');
  const [chapterAiAvoidDuplicates, setChapterAiAvoidDuplicates] = useState(true);
  const [chapterAiSkipDuplicates, setChapterAiSkipDuplicates] = useState(true);
  const [chapterAiLanguage, setChapterAiLanguage] = useState<'odia' | 'english' | 'bilingual'>('bilingual');
  const [chapterAiCustomPrompt, setChapterAiCustomPrompt] = useState('');
  const [chapterAiResponse, setChapterAiResponse] = useState('');
  const [chapterAiParsedQuestions, setChapterAiParsedQuestions] = useState<ParsedQuestionItem[]>([]);
  const [isGeneratingChapterAi, setIsGeneratingChapterAi] = useState(false);
  const [chapterAiError, setChapterAiError] = useState<string | null>(null);

  // In-Modal Live Chat Feed for this Chapter
  const [chapterChatMessages, setChapterChatMessages] = useState<ChapterChatMessage[]>([]);
  const [chapterChatInput, setChapterChatInput] = useState('');
  const [chapterChatAttachments, setChapterChatAttachments] = useState<ChatAttachment[]>([]);
  const chapterChatBottomRef = useRef<HTMLDivElement>(null);
  const chapterFileInputRef = useRef<HTMLInputElement>(null);

  // Data States
  const [papers, setPapers] = useState<PaperWithStats[]>([]);
  const [chapters, setChapters] = useState<ChapterWithStats[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allSavedTests, setAllSavedTests] = useState<SavedTest[]>([]);

  // Three-dot Action Menu Popover (open for specific paper/chapter ID)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modals for CRUD
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Partial<Paper> | null>(null);

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Partial<Chapter> | null>(null);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

  const [deleteConfirmPaper, setDeleteConfirmPaper] = useState<PaperWithStats | null>(null);
  const [deleteConfirmChapter, setDeleteConfirmChapter] = useState<ChapterWithStats | null>(null);

  // Duplicate Scanner Modal States
  const [isDuplicateScannerOpen, setIsDuplicateScannerOpen] = useState(false);
  const [duplicateScanResults, setDuplicateScanResults] = useState<DuplicateScanResult<Question>[]>([]);
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);

  // Preview Modals
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState<number | null>(null);
  const [testToPreview, setTestToPreview] = useState<{ test: SavedTest; questions: Question[] } | null>(null);

  // Create Test Form States (Level 4)
  const [testTitle, setTestTitle] = useState('');
  const [testDuration, setTestDuration] = useState(30);
  const [testLanguage, setTestLanguage] = useState<QuestionLanguage>('bilingual');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

  // Paper Filters
  const [paperCourseFilter, setPaperCourseFilter] = useState<string>('all');

  // 1. Initial Load & Refresh
  useEffect(() => {
    const initData = async () => {
      await loadAllPapers();
      await loadAllSavedTests();
      db.settings.get('app_settings').then((s) => setAppSettings(s || null)).catch(console.error);

      // If initialContext was passed (e.g. returning from AI Chat), directly open the chapter!
      if (initialContext?.paperId && initialContext?.chapterId) {
        const paperList = await getPapersWithStats();
        const foundPaper = paperList.find((p) => p.id === initialContext.paperId);
        if (foundPaper) {
          setSelectedPaper(foundPaper);
          const chapList = await getChaptersWithStats(foundPaper.id);
          setChapters(chapList);
          const foundChap = chapList.find((c) => c.id === initialContext.chapterId);
          if (foundChap) {
            setSelectedChapter(foundChap);
            const qList = await getChapterQuestions(foundChap.id);
            setQuestions(qList);
            setTestTitle(`${foundChap.nameOdia || foundChap.name} Unit Test`);
            setViewLevel('chapter_detail');

            // If initialPastedText was provided, open Smart Paste Modal with it!
            if (initialContext.initialPastedText) {
              setSmartPasteRawText(initialContext.initialPastedText);
              setPasteError(null);
              setIsSmartPasteModalOpen(true);
              const parsed = parseAndConvertPastedText(initialContext.initialPastedText, {
                paperId: foundPaper.id,
                chapterId: foundChap.id,
                subject: foundPaper.subject || foundPaper.name,
                paper: foundPaper.name,
                topic: foundChap.name,
                language: 'bilingual'
              });
              if (parsed.length > 0) {
                const itemsWithDupCheck: ParsedQuestionItem[] = parsed.map((item) => {
                  const dup = checkQuestionDuplicate(item.question, qList);
                  return {
                    ...item,
                    isDuplicate: dup.isDuplicate,
                    skipThis: dup.isDuplicate,
                    matchedQuestion: dup.matchedQuestion
                  };
                });
                setParsedPastedQuestions(itemsWithDupCheck);
                setSmartPasteStep('preview');
              } else {
                setSmartPasteStep('paste');
              }
            }
          }
        }
      }
    };

    initData();
  }, [initialContext]);

  // Close three-dot menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const loadAllPapers = async () => {
    try {
      await initDatabaseDefaults();
    } catch (e) {
      console.warn('initDatabaseDefaults:', e);
    }
    const paperList = await getPapersWithStats();
    setPapers(paperList);
  };

  const loadChaptersForPaper = async (paperId: string) => {
    const chapList = await getChaptersWithStats(paperId);
    setChapters(chapList);
  };

  const loadQuestionsAndTestsForChapter = async (chapId: string) => {
    const qList = await getChapterQuestions(chapId);
    setQuestions(qList);
    loadAllSavedTests();
  };

  const loadAllSavedTests = async () => {
    const tests = await getSavedTests();
    setAllSavedTests(tests);
  };

  // 2. Navigation Handlers
  const handleOpenPaper = async (paper: PaperWithStats) => {
    setSelectedPaper(paper);
    await loadChaptersForPaper(paper.id);
    setViewLevel('chapters');
  };

  const handleOpenChapter = async (chap: ChapterWithStats) => {
    setSelectedChapter(chap);
    await loadQuestionsAndTestsForChapter(chap.id);
    // Initialize default test title
    setTestTitle(`${chap.nameOdia || chap.name} Unit Test`);
    setSelectedQuestionIds([]);
    setViewLevel('chapter_detail');
  };

  const handleOpenCreateTest = () => {
    if (!selectedChapter) return;
    setTestTitle(`${selectedChapter.nameOdia || selectedChapter.name} Unit Test`);
    // Pre-select all questions by default for quick test setup
    setSelectedQuestionIds(questions.map((q) => q.id!).filter(Boolean));
    setViewLevel('create_test');
  };

  const handleBackToPapers = () => {
    setSelectedPaper(null);
    setSelectedChapter(null);
    loadAllPapers();
    setViewLevel('papers');
  };

  const handleBackToChapters = () => {
    if (selectedPaper) {
      loadChaptersForPaper(selectedPaper.id);
    }
    setSelectedChapter(null);
    setViewLevel('chapters');
  };

  const handleBackToChapterDetail = () => {
    if (selectedChapter) {
      loadQuestionsAndTestsForChapter(selectedChapter.id);
    }
    setViewLevel('chapter_detail');
  };

  // 3. Filtered Saved Tests for Selected Chapter
  const chapterSavedTests = selectedChapter
    ? allSavedTests.filter(
        (t) =>
          (t.chapterIds && t.chapterIds.includes(selectedChapter.id)) ||
          (t.paperId === selectedChapter.paperId &&
            t.title.toLowerCase().includes((selectedChapter.name || '').toLowerCase()))
      )
    : [];

  // 4. Create / Edit Paper Handlers
  const handleSavePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaper?.name?.trim()) {
      alert('Please enter a paper name.');
      return;
    }
    await savePaper(editingPaper);
    setIsPaperModalOpen(false);
    setEditingPaper(null);
    await loadAllPapers();
  };

  const handleExecuteDeletePaper = async () => {
    if (!deleteConfirmPaper) return;
    await deletePaperSafe(deleteConfirmPaper.id);
    setDeleteConfirmPaper(null);
    await loadAllPapers();
  };

  // 5. Create / Edit Chapter Handlers
  const handleSaveChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter?.name?.trim() || !editingChapter.paperId) {
      alert('Please enter chapter name.');
      return;
    }
    await saveChapter(editingChapter);
    setIsChapterModalOpen(false);
    setEditingChapter(null);
    if (selectedPaper) {
      await loadChaptersForPaper(selectedPaper.id);
    }
  };

  const handleExecuteDeleteChapter = async () => {
    if (!deleteConfirmChapter) return;
    await deleteChapterSafe(deleteConfirmChapter.id);
    setDeleteConfirmChapter(null);
    if (selectedPaper) {
      await loadChaptersForPaper(selectedPaper.id);
    }
  };

  // 6. Create / Edit Question Handlers
  const handleSaveQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion?.question?.trim()) {
      alert('Please enter question text.');
      return;
    }
    if (!editingQuestion.correctAnswer?.trim()) {
      alert('Please enter correct answer.');
      return;
    }

    const now = new Date().toISOString();
    const qData: Partial<Question> = {
      ...editingQuestion,
      paperId: selectedPaper?.id || '',
      chapterId: selectedChapter?.id || '',
      paper: selectedPaper?.name || 'History',
      chapter: selectedChapter?.name || 'Chapter',
      subject: selectedPaper?.subject || 'History',
      department: selectedPaper?.department || 'History',
      semester: selectedPaper?.semester || '1st Semester',
      topic: selectedChapter?.name || 'General',
      language: editingQuestion.language || 'bilingual',
      approved: true,
      updatedAt: now
    };

    if (editingQuestion.id) {
      await db.questions.update(editingQuestion.id, qData);
    } else {
      await db.questions.add({
        ...qData,
        createdAt: now
      } as any);
    }

    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
    if (selectedChapter) {
      await loadQuestionsAndTestsForChapter(selectedChapter.id);
    }
  };

  const handleDeleteQuestion = async (id?: number) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this question?')) {
      await db.questions.delete(id);
      if (selectedChapter) {
        await loadQuestionsAndTestsForChapter(selectedChapter.id);
      }
    }
  };

  // Duplicate Scanner Handlers
  const handleOpenDuplicateScanner = () => {
    setIsScanningDuplicates(true);
    const results = scanDuplicatesInQuestions(questions);
    setDuplicateScanResults(results);
    setIsScanningDuplicates(false);
    setIsDuplicateScannerOpen(true);
  };

  const handleDeleteDuplicateFromScan = async (id?: number) => {
    if (!id) return;
    if (confirm('ଏହି ଡୁପ୍ଲିକେଟ୍ ପ୍ରଶ୍ନଟିକୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି କି? (Are you sure you want to delete this duplicate question?)')) {
      await db.questions.delete(id);
      if (selectedChapter) {
        const updated = await getChapterQuestions(selectedChapter.id);
        setQuestions(updated);
        const newResults = scanDuplicatesInQuestions(updated);
        setDuplicateScanResults(newResults);
        showToast('✅ ଡୁପ୍ଲିକେଟ୍ ପ୍ରଶ୍ନ ସଫଳତାର ସହ ହଟାଗଲା।');
      }
    }
  };

  // Smart Paste Handlers
  const handleOpenSmartPaste = () => {
    setSmartPasteStep('paste');
    setPasteError(null);
    setIsSmartPasteModalOpen(true);
  };

  const applyParsedQuestions = (parsedList: Question[]) => {
    const itemsWithDupCheck: ParsedQuestionItem[] = parsedList.map((q) => {
      const dup = checkQuestionDuplicate(q.question, questions);
      return {
        ...q,
        isDuplicate: dup.isDuplicate,
        skipThis: dup.isDuplicate, // initially mark duplicate as skipped, teacher can click to keep!
        matchedQuestion: dup.matchedQuestion
      };
    });

    setParsedPastedQuestions(itemsWithDupCheck);
    setSmartPasteStep('preview');
  };

  const handleToggleSkipAllDuplicates = (skip: boolean) => {
    setSmartPasteSkipDuplicates(skip);
    setParsedPastedQuestions((prev) =>
      prev.map((q) => (q.isDuplicate ? { ...q, skipThis: skip } : q))
    );
  };

  const handleConvertPastedText = () => {
    if (!smartPasteRawText.trim()) {
      setPasteError('ଦୟାକରି ପ୍ରଶ୍ନ ପାଠ୍ୟ (Question text) ପେଷ୍ଟ୍ କରନ୍ତୁ।');
      return;
    }
    setPasteError(null);
    const parsed = parseAndConvertPastedText(smartPasteRawText, {
      paperId: selectedPaper?.id,
      chapterId: selectedChapter?.id,
      subject: selectedPaper?.subject || selectedPaper?.name,
      paper: selectedPaper?.name,
      topic: selectedChapter?.name,
      language: smartPasteTargetLanguage === 'odia' ? 'odia' : smartPasteTargetLanguage === 'english' ? 'english' : 'bilingual'
    });

    if (parsed.length === 0) {
      setPasteError('ସିଧାସଳଖ ପାଠ୍ୟରେ ସଠିକ୍ ପ୍ରଶ୍ନ ଫର୍ମାଟ୍ ମିଳିଲା ନାହିଁ। ଦୟାକରି ତଳେ ଥିବା "✨ AI ବିଶ୍ଳେଷଣ ଓ ରୂପାନ୍ତରଣ (AI Smart Convert)" ବଟନ୍ ଦବାନ୍ତୁ, AI ନିଜେ ଏହାକୁ ପ୍ରଶ୍ନରେ ରୂପାନ୍ତରିତ କରିବ।');
      return;
    }

    applyParsedQuestions(parsed);
  };

  const handleConvertPastedTextWithAi = async () => {
    if (!smartPasteRawText.trim()) {
      setPasteError('ଦୟାକରି କିଛି ପ୍ରଶ୍ନ, ଉତ୍ତର କିମ୍ବା ତଥ୍ୟ ପେଷ୍ଟ୍ କରନ୍ତୁ।');
      return;
    }
    if (!selectedChapter || !selectedPaper) return;

    setIsConvertingWithAi(true);
    setPasteError(null);

    // 1. Always parse user's input directly first (supports all 20+ Odia/English numbers, bottom Answer Keys, inline answers)
    const directQuestions = parseAndConvertPastedText(smartPasteRawText, {
      paperId: selectedPaper.id,
      chapterId: selectedChapter.id,
      subject: selectedPaper.subject || selectedPaper.name,
      paper: selectedPaper.name,
      topic: selectedChapter.name,
      language: smartPasteTargetLanguage === 'odia' ? 'odia' : smartPasteTargetLanguage === 'english' ? 'english' : 'bilingual'
    });

    // Check if an online AI provider (user key or server env key) is available
    let activeProvider = (appSettings?.defaultAiProvider as any) || 'existing';
    let activeModel = (appSettings?.defaultAiModel as any) || 'existing-history-nlp';
    const hasGeminiKey = Boolean(appSettings?.geminiApiKey && appSettings.geminiApiKey.trim().length > 8);
    const hasOpenAiKey = Boolean(appSettings?.openaiApiKey && appSettings.openaiApiKey.trim().length > 8);

    let serverKeys = { hasServerGeminiKey: false, hasServerOpenAiKey: false };
    try {
      const mRes = await fetch(apiUrl('/api/ai/models'));
      if (mRes.ok) {
        serverKeys = await mRes.json();
      }
    } catch {
      // Offline / no server AI check
    }

    if (activeProvider === 'existing') {
      if (hasGeminiKey || serverKeys.hasServerGeminiKey) {
        activeProvider = 'gemini';
        activeModel = 'gemini-1.5-flash';
      } else if (hasOpenAiKey || serverKeys.hasServerOpenAiKey) {
        activeProvider = 'openai';
        activeModel = 'gpt-4o-mini';
      }
    }

    const canUseCloudAi =
      (activeProvider === 'gemini' && (hasGeminiKey || serverKeys.hasServerGeminiKey)) ||
      (activeProvider === 'openai' && (hasOpenAiKey || serverKeys.hasServerOpenAiKey));

    // Check if every parsed question already has a real answer AND doesn't need cloud AI synthesis
    const allHaveAnswers =
      directQuestions.length > 0 &&
      directQuestions.every((q) => Boolean(q.correctAnswer && q.correctAnswer.trim().length > 0)) &&
      directQuestions.every((q) => q.question.includes('?') || /_{2,}|\.{3,}/.test(q.question) || (q.options && q.options.length >= 2));

    // If cloud AI is NOT configured (offline mode), OR all questions already have full answers & only need local format conversion:
    if (!canUseCloudAi || (allHaveAnswers && smartPasteTargetPattern === 'auto')) {
      if (directQuestions.length > 0) {
        const solved = autoSolveAndCompleteHistoryQuestions(
          directQuestions,
          smartPasteTargetPattern,
          smartPasteTargetLanguage
        );
        applyParsedQuestions(solved);
        setIsConvertingWithAi(false);
        return;
      }
    }

    // 2. Call Online AI (or intelligent fallback) to analyze any format (questions, only answers, blanks, notes) and convert to target format
    const chapName = selectedChapter.nameOdia || selectedChapter.name;
    const paperName = selectedPaper.nameOdia || selectedPaper.name;

    let patternInstruction = '';
    if (smartPasteTargetPattern === 'mcq') {
      patternInstruction = 'Convert EVERY item into Multiple Choice Questions (MCQs). Every question MUST have 4 distinct options labelled (A), (B), (C), (D), with Ans: and Exp:. Preserve any answers already provided by the teacher.';
    } else if (smartPasteTargetPattern === 'blanks') {
      patternInstruction = 'Convert EVERY item into Fill-in-the-Blanks questions with ________ blank, followed by Ans: (the exact word/phrase that fills the blank) and Exp:.';
    } else if (smartPasteTargetPattern === 'true_false') {
      patternInstruction = 'Convert EVERY item into True or False statements, followed by Ans: True or False and Exp:.';
    } else if (smartPasteTargetPattern === 'short') {
      patternInstruction = 'Convert EVERY item into 2-mark short questions with concise accurate Ans: and Exp:.';
    } else if (smartPasteTargetPattern === 'long') {
      patternInstruction = 'Convert EVERY item into 5-mark comprehensive questions with detailed Ans: and Exp:.';
    } else {
      patternInstruction = 'Analyze the input text carefully. Keep all questions and answers provided by the teacher intact (do NOT drop any numbered question). If answers are missing, solve them accurately. If only answers or keywords are given, generate complete questions for each one.';
    }

    const langInstruction = smartPasteTargetLanguage === 'odia'
      ? 'Generate output strictly in Odia language.'
      : smartPasteTargetLanguage === 'english'
      ? 'Generate output in English language.'
      : 'Generate output in Bilingual format (Odia question followed by English translation, keeping teacher input language clear).';

    const aiPrompt = `You are an expert History Professor for College Examination in Odisha.
Subject/Paper: "${paperName}"
Chapter: "${chapName}"

TEACHER INPUT (May contain numbered questions 1..N, fill-in-the-blanks with or without answers, bottom answer keys, MCQs, only answers, key terms, or study notes):
"""
${smartPasteRawText.trim()}
"""

INSTRUCTIONS:
1. Process ALL items in the teacher input without skipping any question (preserve exact count).
2. ${patternInstruction}
3. ${langInstruction}
4. Format EVERY question strictly using standard numbering (1., 2., 3., ...) like:
1. [Question Text]
(A) [Option A] (only if MCQ)
(B) [Option B] (only if MCQ)
(C) [Option C] (only if MCQ)
(D) [Option D] (only if MCQ)
Ans: [Exact Correct Answer]
Exp: [Brief historical explanation]

Return only the formatted questions.`;

    try {
      const res = await sendChatMessage({
        conversationId: 'smart_ai_paste_' + selectedChapter.id + '_' + Date.now(),
        messages: [],
        currentInput: aiPrompt,
        provider: activeProvider,
        model: activeModel,
        geminiApiKey: appSettings?.geminiApiKey,
        openaiApiKey: appSettings?.openaiApiKey,
        historyEra: 'all',
        examFormat: smartPasteTargetPattern === 'mcq' ? 'mcqs' : smartPasteTargetPattern === 'short' ? '2-mark' : '1-mark',
        targetLanguage: smartPasteTargetLanguage === 'odia' ? 'odia' : smartPasteTargetLanguage === 'english' ? 'english' : 'bilingual',
        existingQuestionsToAvoid: []
      });

      const parsed = parseAndConvertPastedText(res, {
        paperId: selectedPaper.id,
        chapterId: selectedChapter.id,
        subject: selectedPaper.subject || selectedPaper.name,
        paper: selectedPaper.name,
        topic: selectedChapter.name,
        language: smartPasteTargetLanguage === 'odia' ? 'odia' : smartPasteTargetLanguage === 'english' ? 'english' : 'bilingual'
      });

      if (parsed.length > 0) {
        const finalized = autoSolveAndCompleteHistoryQuestions(
          parsed,
          smartPasteTargetPattern,
          smartPasteTargetLanguage
        );
        applyParsedQuestions(finalized);
      } else if (directQuestions.length > 0) {
        const solved = autoSolveAndCompleteHistoryQuestions(
          directQuestions,
          smartPasteTargetPattern,
          smartPasteTargetLanguage
        );
        applyParsedQuestions(solved);
      } else {
        setPasteError('AI ପ୍ରଶ୍ନ ଚିହ୍ନଟ କରିପାରିଲା ନାହିଁ। ଦୟାକରି ପାଠ୍ୟ ଯାଞ୍ଚ କରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।');
      }
    } catch (e: any) {
      console.error('Error in AI paste conversion:', e);
      if (directQuestions.length > 0) {
        const solved = autoSolveAndCompleteHistoryQuestions(
          directQuestions,
          smartPasteTargetPattern,
          smartPasteTargetLanguage
        );
        applyParsedQuestions(solved);
      } else {
        setPasteError('AI ରୂପାନ୍ତରଣରେ ତ୍ରୁଟି: ' + (e.message || 'ଦୟାକରି ଇଣ୍ଟରନେଟ୍ ବା AI ସେଟିଙ୍ଗ୍ ଯାଞ୍ଚ କରନ୍ତୁ।'));
      }
    } finally {
      setIsConvertingWithAi(false);
    }
  };

  const handleSaveParsedQuestionsToChapter = async () => {
    if (!selectedPaper || !selectedChapter || parsedPastedQuestions.length === 0) return;
    
    // Save only questions that are not skipped by the teacher
    const questionsToSave = parsedPastedQuestions.filter((q) => !q.skipThis);

    if (questionsToSave.length === 0) {
      alert('ସଂରକ୍ଷଣ କରିବା ପାଇଁ ଅତି କମରେ ଗୋଟିଏ ପ୍ରଶ୍ନ "ସଂରକ୍ଷଣ ହେବ (Keep)" ଭାବେ ଚୟନ କରନ୍ତୁ।');
      return;
    }

    const skippedCount = parsedPastedQuestions.length - questionsToSave.length;
    const now = new Date().toISOString();
    try {
      for (const q of questionsToSave) {
        await db.questions.add({
          ...q,
          paperId: selectedPaper.id,
          chapterId: selectedChapter.id,
          subject: selectedPaper.subject || selectedPaper.name,
          paper: selectedPaper.name,
          topic: selectedChapter.name,
          department: selectedPaper.department || 'History',
          semester: selectedPaper.semester || '1st Semester',
          approved: true,
          createdAt: now,
          updatedAt: now
        } as any);
      }
      await loadQuestionsAndTestsForChapter(selectedChapter.id);
      setIsSmartPasteModalOpen(false);
      setSmartPasteRawText('');
      setParsedPastedQuestions([]);
      showToast(`✅ ସଫଳତାର ସହ ${questionsToSave.length} ଟି ପ୍ରଶ୍ନ "${selectedChapter.nameOdia || selectedChapter.name}" ରେ ସଂରକ୍ଷିତ ହେଲା!${skippedCount > 0 ? ` (${skippedCount} ଟି ବାଦ୍ ଦିଆଗଲା)` : ''}`);
    } catch (e) {
      console.error('Error saving parsed questions:', e);
      alert('ପ୍ରଶ୍ନ ସଂରକ୍ଷଣ କରିବାରେ ତ୍ରୁଟି ଘଟିଲା।');
    }
  };

  const handleUpdateParsedQuestion = (index: number, updated: ParsedQuestionItem) => {
    setParsedPastedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const handleRemoveParsedQuestion = (index: number) => {
    setParsedPastedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddBlankQuestionToParsed = () => {
    const now = new Date().toISOString();
    const newQ: ParsedQuestionItem = {
      paperId: selectedPaper?.id || '',
      chapterId: selectedChapter?.id || '',
      subject: selectedPaper?.subject || selectedPaper?.name || 'History',
      paper: selectedPaper?.name || 'History',
      topic: selectedChapter?.name || 'General',
      department: selectedPaper?.department || 'History',
      semester: selectedPaper?.semester || '1st Semester',
      language: 'bilingual',
      createdAt: now,
      updatedAt: now,
      question: '',
      pattern: 'mcq',
      marks: 1,
      options: ['', '', '', ''],
      correctAnswer: '',
      explanationCorrect: '',
      approved: true,
      isDuplicate: false,
      skipThis: false
    };
    setParsedPastedQuestions((prev) => [...prev, newQ]);
  };

  // Chapter AI Generator / In-Modal Chat Handlers
  const handleOpenChapterAi = (defaultTab: 'generator' | 'chat' = 'generator') => {
    setIsChapterAiModalOpen(true);
    setChapterModalTab(defaultTab);
    setChapterAiResponse('');
    setChapterAiParsedQuestions([]);
    setChapterAiError(null);

    // Initial greeting if no messages yet
    if (selectedChapter && chapterChatMessages.length === 0) {
      const chapName = selectedChapter.nameOdia || selectedChapter.name;
      setChapterChatMessages([
        {
          id: 'welcome_' + Date.now(),
          role: 'assistant',
          content: `### 💬 ଇତିହାସ ଜ୍ଞାନ AI Chat (Vision & Docs)\n\nନମସ୍କାର ଶିକ୍ଷକ ମହୋଦୟ! ମୁଁ **"${chapName}"** ଅଧ୍ୟାୟ ପାଇଁ ଆପଣଙ୍କ AI ସହାୟକ।\n\n- ଆପଣ ଏହି ଅଧ୍ୟାୟର ଯେକୌଣସି ପ୍ରଶ୍ନ ପଚାରିପାରିବେ, ପୁସ୍ତକ/ନୋଟ୍ସର ଫଟୋ (Ctrl + V କିମ୍ବା 📎 ଦ୍ୱାରା) ଯୋଡ଼ିପାରିବେ।\n- ଉପରେ ଥିବା କୁଇକ୍ ଚିପ୍ସ (ଯଥା: **⚡ 10 MCQs**, **⚡ 5 Short**) ଦବାଇ ତୁରନ୍ତ ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ କରିପାରିବେ।\n- ପ୍ରସ୍ତୁତ ପ୍ରଶ୍ନ ତଳେ ଥିବା **"📥 ଏହି ଅଧ୍ୟାୟରେ ସଂରକ୍ଷଣ କରନ୍ତୁ"** ବଟନ୍ ଦବାଇ ସିଧାସଳଖ ଏହି ଅଧ୍ୟାୟରେ ସେଭ୍ କରିପାରିବେ।`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleGenerateChapterQuestions = async () => {
    if (!selectedPaper || !selectedChapter || isGeneratingChapterAi) return;

    const chapName = selectedChapter.nameOdia || selectedChapter.name;
    const paperName = selectedPaper.nameOdia || selectedPaper.name;
    const count = Math.max(1, Math.min(50, Number(chapterAiCount) || 10));

    let patternLabel = 'MCQs (1 mark each)';
    if (chapterAiPattern === 'short') patternLabel = 'short-answer questions (2 marks each)';
    else if (chapterAiPattern === 'long') patternLabel = 'comprehensive long questions (5 marks each)';
    else if (chapterAiPattern === 'blanks') patternLabel = 'fill-in-the-blanks questions (1 mark each)';
    else if (chapterAiPattern === 'true_false') patternLabel = 'true or false questions';

    let promptText = `Generate exactly ${count} ${patternLabel} on "${chapName}" (${paperName}).`;
    if (chapterAiCustomPrompt.trim()) {
      promptText += ` Special focus topic: ${chapterAiCustomPrompt.trim()}.`;
    }

    if (chapterAiLanguage === 'odia') {
      promptText += ' in pure Odia language.';
    } else if (chapterAiLanguage === 'english') {
      promptText += ' in English.';
    } else {
      promptText += ' in bilingual format (Odia and English).';
    }

    const existingToAvoid = chapterAiAvoidDuplicates 
      ? questions.map((q) => q.question).filter(Boolean)
      : [];

    setIsGeneratingChapterAi(true);
    setChapterAiError(null);

    try {
      const res = await sendChatMessage({
        conversationId: 'chap_gen_' + selectedChapter.id,
        messages: [],
        currentInput: promptText,
        attachments: [...chapterChatAttachments],
        provider: (appSettings?.defaultAiProvider as any) || 'existing',
        model: (appSettings?.defaultAiModel as any) || 'existing-history-nlp',
        geminiApiKey: appSettings?.geminiApiKey,
        openaiApiKey: appSettings?.openaiApiKey,
        historyEra: 'all',
        examFormat: chapterAiPattern === 'mcq' ? 'mcqs' : chapterAiPattern === 'short' ? '2-mark' : chapterAiPattern === 'long' ? '5-mark' : '1-mark',
        targetLanguage: chapterAiLanguage,
        existingQuestionsToAvoid: existingToAvoid,
        questionCount: count
      });

      // Parse questions from response
      const parsed = parseAndConvertPastedText(res, {
        paperId: selectedPaper.id,
        chapterId: selectedChapter.id,
        subject: selectedPaper.subject || selectedPaper.name,
        paper: selectedPaper.name,
        topic: selectedChapter.name,
        language: chapterAiLanguage === 'odia' ? 'odia' : chapterAiLanguage === 'english' ? 'english' : 'bilingual'
      });

      const parsedWithDups: ParsedQuestionItem[] = parsed.map((q) => {
        const dup = checkQuestionDuplicate(q.question, questions);
        return {
          ...q,
          isDuplicate: dup.isDuplicate,
          skipThis: dup.isDuplicate,
          matchedQuestion: dup.matchedQuestion
        };
      });

      setChapterAiResponse(res);
      setChapterAiParsedQuestions(parsedWithDups);

      // Append to live chat messages too
      const genMsg: ChapterChatMessage = {
        id: 'gen_' + Date.now(),
        role: 'assistant',
        content: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        parsedQuestions: parsedWithDups
      };
      setChapterChatMessages((prev) => [...prev, genMsg]);
    } catch (e: any) {
      console.error('Error generating chapter questions:', e);
      setChapterAiError(e.message || 'AI ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ କରିବାରେ ତ୍ରୁଟି ଘଟିଲା।');
    } finally {
      setIsGeneratingChapterAi(false);
    }
  };

  const handleSaveAllGeneratedQuestions = async () => {
    if (!selectedPaper || !selectedChapter || chapterAiParsedQuestions.length === 0) return;

    const toSave = chapterAiParsedQuestions.filter((q) => {
      if (chapterAiAvoidDuplicates && q.isDuplicate) return false;
      if (q.skipThis) return false;
      return true;
    });

    if (toSave.length === 0) {
      alert('ସଂରକ୍ଷଣ କରିବା ପାଇଁ କୌଣସି ନୂଆ ପ୍ରଶ୍ନ ନାହିଁ (ସମସ୍ତ ପ୍ରଶ୍ନ ପୂର୍ବରୁ ଉପଲବ୍ଧ ଅଛି କିମ୍ବା ବାଦ୍ ଦିଆଯାଇଛି)।');
      return;
    }

    const skippedCount = chapterAiParsedQuestions.length - toSave.length;
    const now = new Date().toISOString();
    try {
      for (const q of toSave) {
        await db.questions.add({
          ...q,
          paperId: selectedPaper.id,
          chapterId: selectedChapter.id,
          subject: selectedPaper.subject || selectedPaper.name,
          paper: selectedPaper.name,
          topic: selectedChapter.name,
          department: selectedPaper.department || 'History',
          semester: selectedPaper.semester || '1st Semester',
          approved: true,
          createdAt: now,
          updatedAt: now
        } as any);
      }
      await loadQuestionsAndTestsForChapter(selectedChapter.id);
      setIsChapterAiModalOpen(false);
      setChapterAiParsedQuestions([]);
      setChapterAiResponse('');
      showToast(`✅ ସଫଳତାର ସହ ${toSave.length} ଟି ନୂଆ ପ୍ରଶ୍ନ "${selectedChapter.nameOdia || selectedChapter.name}" ରେ ସଂରକ୍ଷିତ ହେଲା!${skippedCount > 0 ? ` (${skippedCount} ଟି Duplicate ବାଦ୍ ଦିଆଗଲା)` : ''}`);
    } catch (e) {
      console.error('Error saving generated questions:', e);
      alert('ପ୍ରଶ୍ନ ସେଭ୍ କରିବାରେ ତ୍ରୁଟି ଘଟିଲା।');
    }
  };

  const handleToggleSkipChapterAiQuestion = (index: number) => {
    setChapterAiParsedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], skipThis: !copy[index].skipThis };
      return copy;
    });
  };

  const handleSendChapterChatMessage = async (presetPrompt?: string) => {
    const rawText = (presetPrompt || chapterChatInput).trim();
    if (!rawText && chapterChatAttachments.length === 0) return;
    if (!selectedPaper || !selectedChapter || isGeneratingChapterAi) return;

    const chapName = selectedChapter.nameOdia || selectedChapter.name;
    const paperName = selectedPaper.nameOdia || selectedPaper.name;

    const userMsg: ChapterChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: rawText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: [...chapterChatAttachments]
    };

    setChapterChatMessages((prev) => [...prev, userMsg]);
    setChapterChatInput('');
    const currentAtts = [...chapterChatAttachments];
    setChapterChatAttachments([]);
    setIsGeneratingChapterAi(true);
    setChapterAiError(null);

    try {
      let promptText = rawText;
      if (!promptText.toLowerCase().includes(chapName.toLowerCase())) {
        promptText = `${rawText} (Topic: ${chapName}, Subject: ${paperName})`;
      }

      if (chapterAiLanguage === 'odia') {
        promptText += ' in pure Odia language.';
      } else if (chapterAiLanguage === 'english') {
        promptText += ' in English.';
      } else {
        promptText += ' in bilingual format (Odia and English).';
      }

      const existingToAvoid = chapterAiAvoidDuplicates 
        ? questions.map((q) => q.question).filter(Boolean)
        : [];

      const count = Math.max(1, Math.min(50, Number(chapterAiCount) || 10));

      const res = await sendChatMessage({
        conversationId: 'chap_chat_' + selectedChapter.id,
        messages: chapterChatMessages.map((m) => ({
          id: m.id,
          conversationId: 'chap_chat_' + selectedChapter.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          attachments: m.attachments
        })),
        currentInput: promptText,
        attachments: currentAtts,
        provider: (appSettings?.defaultAiProvider as any) || 'existing',
        model: (appSettings?.defaultAiModel as any) || 'existing-history-nlp',
        geminiApiKey: appSettings?.geminiApiKey,
        openaiApiKey: appSettings?.openaiApiKey,
        historyEra: 'all',
        examFormat: chapterAiPattern === 'mcq' ? 'mcqs' : chapterAiPattern === 'short' ? '2-mark' : chapterAiPattern === 'long' ? '5-mark' : '1-mark',
        targetLanguage: chapterAiLanguage,
        existingQuestionsToAvoid: existingToAvoid,
        questionCount: count
      });

      // Parse questions from response
      const parsed = parseAndConvertPastedText(res, {
        paperId: selectedPaper.id,
        chapterId: selectedChapter.id,
        subject: selectedPaper.subject || selectedPaper.name,
        paper: selectedPaper.name,
        topic: selectedChapter.name,
        language: chapterAiLanguage === 'odia' ? 'odia' : chapterAiLanguage === 'english' ? 'english' : 'bilingual'
      });

      const parsedWithDups: ParsedQuestionItem[] = parsed.map((q) => {
        const dup = checkQuestionDuplicate(q.question, questions);
        return {
          ...q,
          isDuplicate: dup.isDuplicate,
          skipThis: dup.isDuplicate,
          matchedQuestion: dup.matchedQuestion
        };
      });

      const assistantMsg: ChapterChatMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        parsedQuestions: parsedWithDups
      };

      setChapterChatMessages((prev) => [...prev, assistantMsg]);
      setChapterAiResponse(res);
      setChapterAiParsedQuestions(parsedWithDups);
    } catch (e: any) {
      console.error('Error generating chapter questions:', e);
      setChapterAiError(e.message || 'AI ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ କରିବାରେ ତ୍ରୁଟି ଘଟିଲା।');
    } finally {
      setIsGeneratingChapterAi(false);
    }
  };

  const handleSaveQuestionsFromMessage = async (msg: ChapterChatMessage) => {
    if (!selectedPaper || !selectedChapter) return;
    let toSave = msg.parsedQuestions;
    if (!toSave || toSave.length === 0) {
      const rawParsed = parseAndConvertPastedText(msg.content, {
        paperId: selectedPaper.id,
        chapterId: selectedChapter.id,
        subject: selectedPaper.subject || selectedPaper.name,
        paper: selectedPaper.name,
        topic: selectedChapter.name
      });
      toSave = rawParsed.map((q) => {
        const dup = checkQuestionDuplicate(q.question, questions);
        return {
          ...q,
          isDuplicate: dup.isDuplicate,
          skipThis: dup.isDuplicate,
          matchedQuestion: dup.matchedQuestion
        };
      });
    }

    if (!toSave || toSave.length === 0) {
      alert('ଏହି ମେସେଜ୍‌ରେ କୌଣସି ପ୍ରଶ୍ନ ଚିହ୍ନଟ ହୋଇପାରିଲା ନାହିଁ।');
      return;
    }

    const questionsToSave = toSave.filter((q) => {
      if (chapterAiSkipDuplicates && q.isDuplicate) return false;
      if (q.skipThis) return false;
      return true;
    });

    if (questionsToSave.length === 0) {
      alert('ସଂରକ୍ଷଣ କରିବା ପାଇଁ କୌଣସି ନୂଆ ପ୍ରଶ୍ନ ନାହିଁ (ସମସ୍ତ ପ୍ରଶ୍ନ ପୂର୍ବରୁ Question Bank ରେ ଉପଲବ୍ଧ ଅଛି କିମ୍ବା ବାଦ୍ ଦିଆଯାଇଛି)।');
      return;
    }

    const skippedCount = toSave.length - questionsToSave.length;
    const now = new Date().toISOString();
    try {
      for (const q of questionsToSave) {
        await db.questions.add({
          ...q,
          paperId: selectedPaper.id,
          chapterId: selectedChapter.id,
          subject: selectedPaper.subject || selectedPaper.name,
          paper: selectedPaper.name,
          topic: selectedChapter.name,
          department: selectedPaper.department || 'History',
          semester: selectedPaper.semester || '1st Semester',
          approved: true,
          createdAt: now,
          updatedAt: now
        } as any);
      }
      await loadQuestionsAndTestsForChapter(selectedChapter.id);
      showToast(`✅ ସଫଳତାର ସହ ${questionsToSave.length} ଟି ନୂଆ AI ପ୍ରଶ୍ନ "${selectedChapter.nameOdia || selectedChapter.name}" ରେ ସଂରକ୍ଷିତ ହେଲା!${skippedCount > 0 ? ` (${skippedCount} ଟି Duplicate ବାଦ୍ ଦିଆଗଲା)` : ''}`);
    } catch (e) {
      console.error('Error saving AI questions:', e);
      alert('ପ୍ରଶ୍ନ ସେଭ୍ କରିବାରେ ତ୍ରୁଟି ଘଟିଲା।');
    }
  };

  const handleTransferMessageToSmartPaste = (msg: ChapterChatMessage) => {
    setIsChapterAiModalOpen(false);
    setSmartPasteRawText(msg.content);
    if (msg.parsedQuestions && msg.parsedQuestions.length > 0) {
      setParsedPastedQuestions(msg.parsedQuestions);
      setSmartPasteStep('preview');
    } else {
      setSmartPasteStep('paste');
    }
    setIsSmartPasteModalOpen(true);
  };

  const handleChapterChatAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await processSelectedFile(file, 'chap_chat_' + selectedChapter?.id, 'msg_' + Date.now());
      setChapterChatAttachments((prev) => [...prev, res.attachment]);
    } catch (err: any) {
      alert(err.message || 'ଫାଇଲ୍ ଯୋଡ଼ିବାରେ ତ୍ରୁଟି ଘଟିଲା।');
    }
  };

  const handleChapterChatPaste = async (e: React.ClipboardEvent) => {
    const files = extractFilesFromClipboard(e);
    if (files.length > 0) {
      e.preventDefault();
      try {
        for (const file of files) {
          const res = await processSelectedFile(file, 'chap_chat_' + selectedChapter?.id, 'msg_' + Date.now());
          setChapterChatAttachments((prev) => [...prev, res.attachment]);
        }
      } catch (err: any) {
        console.error('Paste file error:', err);
      }
    }
  };

  const handleSaveChapterAiQuestionsDirectly = async () => {
    if (chapterChatMessages.length === 0) return;
    const lastAssistantMsg = [...chapterChatMessages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistantMsg) {
      await handleSaveQuestionsFromMessage(lastAssistantMsg);
    }
  };

  const handleTransferChapterAiToSmartPaste = () => {
    if (chapterChatMessages.length === 0) return;
    const lastAssistantMsg = [...chapterChatMessages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistantMsg) {
      handleTransferMessageToSmartPaste(lastAssistantMsg);
    }
  };

  // 7. Create Test Form Handlers (Level 4)
  const selectedQuestionsList = questions.filter((q) => selectedQuestionIds.includes(q.id!));
  const totalSelectedMarks = selectedQuestionsList.reduce((sum, q) => sum + (q.marks || 1), 0);

  const toggleQuestionSelection = (id: number) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((qId) => qId !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const handleSelectAllQuestions = () => {
    setSelectedQuestionIds(questions.map((q) => q.id!).filter(Boolean));
  };

  const handleClearSelection = () => {
    setSelectedQuestionIds([]);
  };

  const handleSaveTestToLibrary = async () => {
    if (!selectedPaper || !selectedChapter) return;
    if (selectedQuestionIds.length === 0) {
      alert('Please select at least 1 question for the test.');
      return;
    }

    const newTest: Omit<SavedTest, 'id' | 'createdAt' | 'updatedAt'> = {
      title: testTitle.trim() || `${selectedChapter.name} Test`,
      paperId: selectedPaper.id,
      paperName: selectedPaper.name,
      chapterIds: [selectedChapter.id],
      chapterNames: [selectedChapter.name],
      questionIds: selectedQuestionIds,
      totalQuestions: selectedQuestionsList.length,
      totalMarks: totalSelectedMarks,
      durationMinutes: testDuration,
      language: testLanguage
    };

    await saveTestToLibrary(newTest);
    alert('ପରୀକ୍ଷା ସଫଳତାର ସହିତ ସଂରକ୍ଷିତ ହେଲା! (Test Saved Successfully!)');
    await loadAllSavedTests();
    handleBackToChapterDetail();
  };

  const handleStartLiveTestNow = () => {
    if (selectedQuestionsList.length === 0) {
      alert('Please select at least 1 question to start.');
      return;
    }
    onStartQuizWithQuestions(selectedQuestionsList);
  };

  const handlePreviewTestPaper = () => {
    if (selectedQuestionsList.length === 0) {
      alert('Please select at least 1 question to preview.');
      return;
    }
    const tempTest: SavedTest = {
      id: 'preview_temp',
      title: testTitle.trim() || `${selectedChapter?.name} Test`,
      paperId: selectedPaper?.id || '',
      paperName: selectedPaper?.name || 'History',
      chapterIds: selectedChapter ? [selectedChapter.id] : [],
      chapterNames: selectedChapter ? [selectedChapter.name] : [],
      questionIds: selectedQuestionIds,
      totalQuestions: selectedQuestionsList.length,
      totalMarks: totalSelectedMarks,
      durationMinutes: testDuration,
      language: testLanguage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTestToPreview({ test: tempTest, questions: selectedQuestionsList });
  };

  // 8. Saved Tests Actions Inside Chapter View
  const handleStartSavedTest = async (test: SavedTest) => {
    const qs = await db.questions.bulkGet(test.questionIds);
    const valid = qs.filter(Boolean) as Question[];
    if (valid.length === 0) {
      alert('No questions found in this saved test.');
      return;
    }
    onStartQuizWithQuestions(valid);
  };

  const handlePreviewSavedTest = async (test: SavedTest) => {
    const qs = await db.questions.bulkGet(test.questionIds);
    const valid = qs.filter(Boolean) as Question[];
    setTestToPreview({ test, questions: valid });
  };

  const handleDuplicateSavedTest = async (test: SavedTest) => {
    await duplicateSavedTest(test.id);
    await loadAllSavedTests();
  };

  const handleDeleteSavedTest = async (testId: string) => {
    if (confirm('Are you sure you want to delete this saved test?')) {
      await deleteSavedTest(testId);
      await loadAllSavedTests();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">
      {/* ========================================================================= */}
      {/* TOP HEADER: Simple & Clean Header with Breadcrumbs */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          {/* Left: Back button & Breadcrumb Title */}
          <div className="flex items-center gap-3 min-w-0">
            {viewLevel !== 'papers' ? (
              <button
                onClick={() => {
                  if (viewLevel === 'create_test') handleBackToChapterDetail();
                  else if (viewLevel === 'chapter_detail') handleBackToChapters();
                  else if (viewLevel === 'chapters') handleBackToPapers();
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">ପଛକୁ (Back)</span>
              </button>
            ) : (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">ମୁଖ୍ୟ ପୃଷ୍ଠା (Home)</span>
              </button>
            )}

            {/* Breadcrumb Hierarchy Display */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
              <span
                onClick={handleBackToPapers}
                className={`font-odia font-bold truncate cursor-pointer hover:text-blue-600 ${
                  viewLevel === 'papers' ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କ (Question Bank)
              </span>

              {selectedPaper && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span
                    onClick={handleBackToChapters}
                    className={`font-odia font-bold truncate cursor-pointer hover:text-blue-600 ${
                      viewLevel === 'chapters' ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {selectedPaper.nameOdia || selectedPaper.name}
                  </span>
                </>
              )}

              {selectedChapter && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span
                    onClick={handleBackToChapterDetail}
                    className={`font-odia font-bold truncate cursor-pointer hover:text-blue-600 ${
                      viewLevel === 'chapter_detail' ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {selectedChapter.nameOdia || selectedChapter.name}
                  </span>
                </>
              )}

              {viewLevel === 'create_test' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="font-odia font-bold text-emerald-600 truncate">
                    ପରୀକ୍ଷା ସୃଷ୍ଟି (Create Test)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: AI Quick Link */}
          <button
            onClick={onNavigateToAi}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">AI ପ୍ରଶ୍ନ ସୃଷ୍ଟି</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT CONTAINER */}
      {/* ========================================================================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* ===================================================================== */}
        {/* LEVEL 1: MAIN QUESTION BANK SCREEN — ONLY PAPER FOLDERS */}
        {/* ===================================================================== */}
        {viewLevel === 'papers' && (
          <div className="space-y-6">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h1 className="font-odia font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  ପେପର୍ ଫୋଲ୍ଡରଗୁଡ଼ିକ (Paper Folders)
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  ଆପଣଙ୍କର ଯେକୌଣସି ପେପର୍ ଖୋଲି ତାହାର ଅଧ୍ୟାୟ ଓ ପ୍ରଶ୍ନ ଦେଖନ୍ତୁ।
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingPaper({
                    name: '',
                    nameOdia: '',
                    code: '',
                    subject: 'History',
                    department: 'History',
                    courseType: 'Major',
                    academicSession: '2024-27',
                    semester: '1st Semester'
                  });
                  setIsPaperModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ ନୂଆ ପେପର (Add Paper)</span>
              </button>
            </div>

            {/* Course Type Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl w-fit">
              <button
                onClick={() => setPaperCourseFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperCourseFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ସମସ୍ତ ପେପର୍ ({papers.length})
              </button>
              <button
                onClick={() => setPaperCourseFilter('Major')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperCourseFilter === 'Major'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                Major (Honours)
              </button>
              <button
                onClick={() => setPaperCourseFilter('Minor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperCourseFilter === 'Minor'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-700'
                }`}
              >
                Minor (Elective)
              </button>
              <button
                onClick={() => setPaperCourseFilter('AEC')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperCourseFilter === 'AEC'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                AEC
              </button>
              <button
                onClick={() => setPaperCourseFilter('SEC')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperCourseFilter === 'SEC'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                SEC
              </button>
              <button
                onClick={() => setPaperCourseFilter('VAC')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperCourseFilter === 'VAC'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-purple-700'
                }`}
              >
                VAC
              </button>
              <button
                onClick={() => setPaperCourseFilter('Multidisciplinary')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paperCourseFilter === 'Multidisciplinary'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Multidisciplinary
              </button>
            </div>

            {/* Paper Folders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {papers
                .filter((p) => {
                  if (paperCourseFilter === 'all') return true;
                  return (p.courseType || 'Major').toLowerCase() === paperCourseFilter.toLowerCase();
                })
                .map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => handleOpenPaper(paper)}
                  className="group relative bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 group-hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors shadow-xs">
                        <Folder className="w-6 h-6 fill-amber-400 text-amber-500" />
                      </div>

                      {/* Three-dot menu button */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === paper.id ? null : paper.id)
                          }
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Three-dot Menu Popover */}
                        {activeMenuId === paper.id && (
                          <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-20 animate-in fade-in zoom-in-95 text-xs">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setEditingPaper(paper);
                                setIsPaperModalOpen(true);
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                              <span>ନାମ ବଦଳାନ୍ତୁ (Rename)</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setDeleteConfirmPaper(paper);
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ଡିଲିଟ୍ କରନ୍ତୁ (Delete)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          (paper.courseType || 'Major') === 'Major'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            : (paper.courseType || 'Major') === 'Minor'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                            : (paper.courseType || 'Major') === 'AEC'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : (paper.courseType || 'Major') === 'SEC'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : (paper.courseType || 'Major') === 'VAC'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          {paper.courseType || 'Major'}
                        </span>
                        {paper.academicSession && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {paper.academicSession}
                          </span>
                        )}
                      </div>

                      <h3 className="font-odia font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {paper.nameOdia || paper.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {paper.code ? `${paper.code} • ` : ''}
                        {paper.name}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-slate-700">
                      {paper.chapterCount || 0} ଅଧ୍ୟାୟ (Chapters)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-[11px] text-slate-600">
                      {paper.questionCount || 0} Qs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* LEVEL 2: CHAPTERS INSIDE SELECTED PAPER */}
        {/* ===================================================================== */}
        {viewLevel === 'chapters' && selectedPaper && (
          <div className="space-y-6">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {selectedPaper.code ? `${selectedPaper.code} • ` : ''}
                  {selectedPaper.subject}
                </span>
                <h1 className="font-odia font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  {selectedPaper.nameOdia || selectedPaper.name}
                </h1>
                <p className="text-xs text-slate-500">
                  କୌଣସି ଅଧ୍ୟାୟ ଖୋଲି ତାହାର ପ୍ରଶ୍ନ ଦେଖନ୍ତୁ କିମ୍ବା ପରୀକ୍ଷା ସୃଷ୍ଟି କରନ୍ତୁ।
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingChapter({
                      paperId: selectedPaper.id,
                      name: '',
                      nameOdia: '',
                      description: ''
                    });
                    setIsChapterModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ନୂଆ ଅଧ୍ୟାୟ (Add Chapter)</span>
                </button>
              </div>
            </div>

            {/* Chapters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {chapters.length > 0 ? (
                chapters.map((chap) => (
                  <div
                    key={chap.id}
                    onClick={() => handleOpenChapter(chap)}
                    className="group relative bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors shadow-xs">
                          <FolderOpen className="w-6 h-6 text-blue-500" />
                        </div>

                        {/* Three-dot menu */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              setActiveMenuId(activeMenuId === chap.id ? null : chap.id)
                            }
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Popover */}
                          {activeMenuId === chap.id && (
                            <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-20 animate-in fade-in zoom-in-95 text-xs">
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setEditingChapter(chap);
                                  setIsChapterModalOpen(true);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                <span>ନାମ ବଦଳାନ୍ତୁ (Rename)</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeleteConfirmChapter(chap);
                                }}
                                className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-semibold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ଡିଲିଟ୍ କରନ୍ତୁ (Delete)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          {chap.chapterNumber ? `Chapter ${chap.chapterNumber}` : 'Chapter'}
                        </div>
                        <h3 className="font-odia font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                          {chap.nameOdia || chap.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {chap.name}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {chap.questionCount || 0} ପ୍ରଶ୍ନ (Questions)
                      </span>
                      <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        ଖୋଲନ୍ତୁ &rarr;
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                  <Folder className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-odia font-bold text-base text-slate-800">
                    ଏହି ପେପରରେ କୌଣସି ଅଧ୍ୟାୟ ନାହିଁ
                  </h4>
                  <p className="text-xs text-slate-500">
                    ଦୟାକରି + ନୂଆ ଅଧ୍ୟାୟ ବଟନ୍ ଦବାଇ ଏକ ଅଧ୍ୟାୟ ଯୋଡ଼ନ୍ତୁ।
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* LEVEL 3: CHAPTER VIEW — QUESTIONS & SAVED TESTS ONLY */}
        {/* ===================================================================== */}
        {viewLevel === 'chapter_detail' && selectedChapter && selectedPaper && (
          <div className="space-y-8">
            {/* Chapter Header Strip with Prominent CREATE TEST Button */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {selectedPaper.nameOdia || selectedPaper.name}
                </span>
                <h1 className="font-odia font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  {selectedChapter.nameOdia || selectedChapter.name}
                </h1>
                <p className="text-xs text-slate-500">
                  ଉପଲବ୍ଧ ପ୍ରଶ୍ନ ସଂଖ୍ୟା: <span className="font-bold text-slate-800">{questions.length} Questions</span>
                </p>
              </div>

              {/* Action Buttons: Smart Paste, Chapter AI, + Add Question, and + CREATE TEST */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={handleOpenSmartPaste}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  title="Paste questions from any source and auto-convert"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>📋 Smart Paste (ପେଷ୍ଟ୍ କନଭର୍ଟର)</span>
                </button>

                <button
                  onClick={() => handleOpenChapterAi('generator')}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  title="AI ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି ଓ Chat (Vision & Docs)"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>✨ AI ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି & Chat (Vision & Docs)</span>
                </button>

                <button
                  onClick={handleOpenDuplicateScanner}
                  className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                  title="ଏହି ଅଧ୍ୟାୟର ସମସ୍ତ ପ୍ରଶ୍ନ ମଧ୍ୟରେ ଡୁପ୍ଲିକେଟ୍ ଯାଞ୍ଚ କରନ୍ତୁ"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>🔍 ଡୁପ୍ଲିକେଟ୍ ଯାଞ୍ଚ ({questions.length})</span>
                </button>

                <button
                  onClick={() => {
                    setEditingQuestion({
                      paperId: selectedPaper.id,
                      chapterId: selectedChapter.id,
                      pattern: 'mcq',
                      marks: 1,
                      options: ['', '', '', ''],
                      correctAnswer: '',
                      explanationCorrect: ''
                    });
                    setIsQuestionModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ହାତରେ ଯୋଡ଼ନ୍ତୁ</span>
                </button>

                <button
                  onClick={handleOpenCreateTest}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer scale-100 hover:scale-[1.02]"
                >
                  <Award className="w-4 h-4" />
                  <span>+ CREATE TEST (ପରୀକ୍ଷା ସୃଷ୍ଟି)</span>
                </button>
              </div>
            </div>

            {/* ================================================================= */}
            {/* SAVED TESTS FOR THIS CHAPTER (Requirement 5) */}
            {/* ================================================================= */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-odia font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <span>ଏହି ଅଧ୍ୟାୟର ସଂରକ୍ଷିତ ପରୀକ୍ଷା (Saved Tests)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    {chapterSavedTests.length}
                  </span>
                </h2>
              </div>

              {chapterSavedTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chapterSavedTests.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                          <span>{t.durationMinutes} Mins</span>
                          <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-odia font-bold text-base text-slate-900 leading-snug">
                          {t.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                            {t.totalQuestions} Qs
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                            {t.totalMarks} Marks
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        <button
                          onClick={() => handleStartSavedTest(t)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Start Quiz Now"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start</span>
                        </button>

                        <button
                          onClick={() => handlePreviewSavedTest(t)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          title="Preview Printable Test Paper"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                        </button>

                        <button
                          onClick={() => handleDuplicateSavedTest(t)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          title="Duplicate Test"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteSavedTest(t.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                          title="Delete Test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  ଏପର୍ଯ୍ୟନ୍ତ ଏହି ଅଧ୍ୟାୟରୁ କୌଣସି ପରୀକ୍ଷା ସଂରକ୍ଷିତ ହୋଇନାହିଁ। ପରୀକ୍ଷା ପ୍ରସ୍ତୁତ କରିବା ପାଇଁ ଉପରେ ଥିବା <b>+ CREATE TEST</b> ବଟନ୍ ଦବାନ୍ତୁ।
                </div>
              )}
            </div>

            {/* ================================================================= */}
            {/* QUESTIONS LIST BELONGING TO THIS CHAPTER */}
            {/* ================================================================= */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-odia font-bold text-lg text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>ଅଧ୍ୟାୟ ପ୍ରଶ୍ନଗୁଡ଼ିକ (Questions in this Chapter)</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                    {questions.length}
                  </span>
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenDuplicateScanner}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    title="ଡୁପ୍ଲିକେଟ୍ ଯାଞ୍ଚ କରନ୍ତୁ"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ଡୁପ୍ଲିକେଟ୍ ଯାଞ୍ଚ</span>
                  </button>
                  <button
                    onClick={handleOpenSmartPaste}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Paste raw text and auto-convert"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                    <span>Smart Paste</span>
                  </button>
                  <button
                    onClick={() => handleOpenChapterAi('generator')}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="AI ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି & Chat"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>✨ AI ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି & Chat</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {questions.length > 0 ? (
                  questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                            {q.pattern}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            {q.marks} Mark{q.marks > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Card actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewQuestionIndex(idx)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="Preview Question"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingQuestion(q);
                              setIsQuestionModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="Edit Question"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question text */}
                      <p className="font-odia font-bold text-sm sm:text-base text-slate-900 leading-relaxed">
                        {q.question}
                      </p>

                      {/* MCQ Options */}
                      {q.pattern === 'mcq' && q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = opt.trim() === (q.correctAnswer || '').trim();
                            return (
                              <div
                                key={oIdx}
                                className={`px-3 py-2 rounded-xl border flex items-center justify-between ${
                                  isCorrect
                                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span>
                                  {String.fromCharCode(65 + oIdx)}. {opt}
                                </span>
                                {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Correct Answer Strip */}
                      <div className="pt-2 border-t border-slate-100 text-xs flex items-start gap-1.5 text-slate-600">
                        <span className="font-bold text-emerald-700 shrink-0">ସଠିକ୍ ଉତ୍ତର:</span>
                        <span className="font-odia font-medium text-slate-800">{q.correctAnswer}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h3 className="font-odia font-bold text-lg text-slate-900">
                        ଏହି ଅଧ୍ୟାୟରେ ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ପ୍ରଶ୍ନ ସଂରକ୍ଷିତ ହୋଇନାହିଁ
                      </h3>
                      <p className="text-xs text-slate-500">
                        ଆପଣ Smart Paste ଦ୍ୱାରା ଯେକୌଣସି ପ୍ରଶ୍ନ ପେଷ୍ଟ୍ କରିପାରିବେ କିମ୍ବା AI ସାହାଯ୍ୟରେ 1-କ୍ଲିକ୍ ରେ ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ କରି ଏଠାରେ ସ୍ଥାୟୀ ଭାବେ ସେଭ୍ କରିପାରିବେ।
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleOpenSmartPaste}
                        className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                      >
                        <ClipboardList className="w-4 h-4" />
                        <span>📋 Smart Paste (ପେଷ୍ଟ୍ କରି ପ୍ରଶ୍ନ ଯୋଡ଼ନ୍ତୁ)</span>
                      </button>

                      <button
                        onClick={() => handleOpenChapterAi('generator')}
                        className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>✨ AI ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି & Chat (Vision & Docs)</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingQuestion({
                            paperId: selectedPaper.id,
                            chapterId: selectedChapter.id,
                            pattern: 'mcq',
                            marks: 1,
                            options: ['', '', '', ''],
                            correctAnswer: '',
                            explanationCorrect: ''
                          });
                          setIsQuestionModalOpen(true);
                        }}
                        className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        + ହାତରେ ଲେଖି ଯୋଡ଼ନ୍ତୁ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* LEVEL 4: CREATE TEST SCREEN (Simple & Clear Test Creation) */}
        {/* ===================================================================== */}
        {viewLevel === 'create_test' && selectedChapter && selectedPaper && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {selectedPaper.nameOdia || selectedPaper.name} • {selectedChapter.nameOdia || selectedChapter.name}
              </div>
              <h1 className="font-odia font-black text-2xl sm:text-3xl text-slate-900">
                ପରୀକ୍ଷା ସୃଷ୍ଟି କରନ୍ତୁ (CREATE TEST)
              </h1>
              <p className="text-xs text-slate-500">
                ଏହି ଅଧ୍ୟାୟରୁ ପ୍ରଶ୍ନ ଚୟନ କରନ୍ତୁ ଏବଂ ପରୀକ୍ଷା ସଂରକ୍ଷଣ କରନ୍ତୁ କିମ୍ବା ସିଧାସଳଖ ଲାଇଭ୍ କୁଇଜ୍ ଆରମ୍ଭ କରନ୍ତୁ।
              </p>
            </div>

            {/* Test Configuration Controls */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ପରୀକ୍ଷାର ନାମ (Test Title)
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Indus Valley Unit Test"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ସମୟ ଅବଧି (Duration)
                  </label>
                  <select
                    value={testDuration}
                    onChange={(e) => setTestDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold"
                  >
                    <option value={15}>15 ମିନିଟ୍ (15 Mins)</option>
                    <option value={20}>20 ମିନିଟ୍ (20 Mins)</option>
                    <option value={30}>30 ମିନିଟ୍ (30 Mins)</option>
                    <option value={45}>45 ମିନିଟ୍ (45 Mins)</option>
                    <option value={60}>60 ମିନିଟ୍ (60 Mins)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ଭାଷା (Language)
                  </label>
                  <select
                    value={testLanguage}
                    onChange={(e) => setTestLanguage(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold"
                  >
                    <option value="bilingual">ଉଭୟ ଭାଷା (Bilingual)</option>
                    <option value="odia">କେବଳ ଓଡ଼ିଆ (Odia Only)</option>
                    <option value="english">କେବଳ ଇଂରାଜୀ (English Only)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Questions Selection Strip */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-odia font-bold text-base text-slate-900">
                    ପ୍ରଶ୍ନ ଚୟନ କରନ୍ତୁ (Select Questions)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ଚୟନ ହୋଇଛି: <span className="font-bold text-blue-600">{selectedQuestionIds.length}</span> / {questions.length} Qs • ମୋଟ ମାର୍କ୍ସ: <span className="font-bold text-emerald-600">{totalSelectedMarks}</span> Marks
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllQuestions}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ସମସ୍ତ ଚୟନ (Select All)
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ଅଣଚୟନ (Clear)
                  </button>
                </div>
              </div>

              {/* Questions Checklist */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isChecked = selectedQuestionIds.includes(q.id!);
                  return (
                    <div
                      key={q.id || idx}
                      onClick={() => toggleQuestionSelection(q.id!)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-300 text-blue-950 font-semibold'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <button className="mt-0.5 text-blue-600 shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 fill-blue-600 text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-mono text-slate-400">Q{idx + 1}</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-white border border-slate-200 uppercase font-bold text-slate-600">
                            {q.pattern}
                          </span>
                          <span className="font-bold text-emerald-700">
                            {q.marks} Mark{q.marks > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="font-odia text-xs leading-snug line-clamp-2">
                          {q.question}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test Action Bar: Preview, Save, Start Test */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20">
              <div className="text-xs text-slate-600 text-center sm:text-left">
                ମୋଟ: <span className="font-bold text-slate-900">{selectedQuestionIds.length} Qs</span> ({totalSelectedMarks} Marks)
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handlePreviewTestPaper}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>ପୂର୍ବାବଲୋକନ (Preview)</span>
                </button>

                <button
                  onClick={handleSaveTestToLibrary}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>ପରୀକ୍ଷା ସଂରକ୍ଷଣ (Save Test)</span>
                </button>

                <button
                  onClick={handleStartLiveTestNow}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Live Quiz</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT PAPER */}
      {/* ========================================================================= */}
      {isPaperModalOpen && editingPaper && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-odia font-bold text-lg text-slate-900">
                {editingPaper.id ? 'ପେପର୍ ସମ୍ପାଦନା (Edit Paper)' : '+ ନୂଆ ପେପର୍ (Add Paper)'}
              </h3>
              <button
                onClick={() => setIsPaperModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaperSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ଓଡ଼ିଆ ନାମ (Paper Name in Odia)
                </label>
                <input
                  type="text"
                  value={editingPaper.nameOdia || ''}
                  onChange={(e) => setEditingPaper({ ...editingPaper, nameOdia: e.target.value })}
                  placeholder="ଯଥା: ଭାରତର ପ୍ରାଚୀନ ଇତିହାସ"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none focus:border-blue-500 font-odia"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ଇଂରାଜୀ ନାମ (Paper Name in English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingPaper.name || ''}
                  onChange={(e) => setEditingPaper({ ...editingPaper, name: e.target.value })}
                  placeholder="e.g. Ancient History of India"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ପେପର୍ କୋଡ୍ (Code)</label>
                  <input
                    type="text"
                    value={editingPaper.code || ''}
                    onChange={(e) => setEditingPaper({ ...editingPaper, code: e.target.value })}
                    placeholder="HIST-C1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">କୋର୍ସ ପ୍ରକାର (Course Type)</label>
                  <select
                    value={editingPaper.courseType || 'Major'}
                    onChange={(e) => setEditingPaper({ ...editingPaper, courseType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-blue-900"
                  >
                    <option value="Major">Major (ମୁଖ୍ୟ ବିଷୟ / Honours)</option>
                    <option value="Minor">Minor (ସହାୟକ ବିଷୟ / Elective)</option>
                    <option value="AEC">AEC (Ability Enhancement)</option>
                    <option value="SEC">SEC (Skill Enhancement)</option>
                    <option value="VAC">VAC (Value Added Course)</option>
                    <option value="Multidisciplinary">Multidisciplinary (MDC)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ସେମିଷ୍ଟାର୍ (Semester)</label>
                  <input
                    type="text"
                    value={editingPaper.semester || ''}
                    onChange={(e) => setEditingPaper({ ...editingPaper, semester: e.target.value })}
                    placeholder="1st Semester"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ବ୍ୟାଚ୍ (Batch / Session)</label>
                  <select
                    value={editingPaper.academicSession || '2024-27'}
                    onChange={(e) => setEditingPaper({ ...editingPaper, academicSession: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  >
                    <option value="2024-27">2024-27 (3rd Year)</option>
                    <option value="2025-28">2025-28 (2nd Year)</option>
                    <option value="2026-29">2026-29 (1st Year)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaperModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  ବାତିଲ୍ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  ସଂରକ୍ଷଣ କରନ୍ତୁ (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT CHAPTER */}
      {/* ========================================================================= */}
      {isChapterModalOpen && editingChapter && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-odia font-bold text-lg text-slate-900">
                {editingChapter.id ? 'ଅଧ୍ୟାୟ ସମ୍ପାଦନା (Edit Chapter)' : '+ ନୂଆ ଅଧ୍ୟାୟ (Add Chapter)'}
              </h3>
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChapterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ଓଡ଼ିଆ ନାମ (Chapter Name in Odia)
                </label>
                <input
                  type="text"
                  value={editingChapter.nameOdia || ''}
                  onChange={(e) => setEditingChapter({ ...editingChapter, nameOdia: e.target.value })}
                  placeholder="ଯଥା: ସିନ୍ଧୁ ସଭ୍ୟତା"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none focus:border-blue-500 font-odia"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ଇଂରାଜୀ ନାମ (Chapter Name in English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingChapter.name || ''}
                  onChange={(e) => setEditingChapter({ ...editingChapter, name: e.target.value })}
                  placeholder="e.g. Indus Valley Civilization"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  ବାତିଲ୍ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  ସଂରକ୍ଷଣ କରନ୍ତୁ (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT QUESTION */}
      {/* ========================================================================= */}
      {isQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-odia font-bold text-lg text-slate-900">
                {editingQuestion.id ? 'ପ୍ରଶ୍ନ ସମ୍ପାଦନା (Edit Question)' : '+ ନୂଆ ପ୍ରଶ୍ନ (Add Question)'}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ପ୍ରଶ୍ନ (Question Text) *</label>
                <textarea
                  required
                  rows={3}
                  value={editingQuestion.question || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  placeholder="ପ୍ରଶ୍ନ ଏଠାରେ ଲେଖନ୍ତୁ..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none focus:border-blue-500 font-odia"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ପ୍ରଶ୍ନ ପ୍ରକାର (Pattern)</label>
                  <select
                    value={editingQuestion.pattern || 'mcq'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, pattern: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  >
                    <option value="mcq">MCQ</option>
                    <option value="blanks">Fill in Blanks</option>
                    <option value="true_false">True / False</option>
                    <option value="one_word">One Word</option>
                    <option value="short">Short Answer (2M)</option>
                    <option value="long">Long Answer (5M+)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ମାର୍କ୍ସ (Marks)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editingQuestion.marks || 1}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              {/* Options for MCQ */}
              {editingQuestion.pattern === 'mcq' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block font-bold text-slate-700">ବିକଳ୍ପଗୁଡ଼ିକ (Options)</label>
                  {(editingQuestion.options || ['', '', '', '']).map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="w-5 text-center font-bold text-slate-400">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const opts = [...(editingQuestion.options || ['', '', '', ''])];
                          opts[oIdx] = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: opts });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ସଠିକ୍ ଉତ୍ତର (Correct Answer) *
                </label>
                <input
                  type="text"
                  required
                  value={editingQuestion.correctAnswer || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                  placeholder="ସଠିକ୍ ଉତ୍ତର ଏଠାରେ ଲେଖନ୍ତୁ..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none focus:border-blue-500 font-odia"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ବ୍ୟାଖ୍ୟା (Explanation)
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanationCorrect || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanationCorrect: e.target.value })}
                  placeholder="ଉତ୍ତରର ସଂକ୍ଷିପ୍ତ ବ୍ୟାଖ୍ୟା..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium font-odia"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  ବାତିଲ୍ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  ସଂରକ୍ଷଣ କରନ୍ତୁ (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SINGLE QUESTION PREVIEW */}
      {/* ========================================================================= */}
      {previewQuestionIndex !== null && questions[previewQuestionIndex] && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase">
                {questions[previewQuestionIndex].pattern} • {questions[previewQuestionIndex].marks} Marks
              </span>
              <button
                onClick={() => setPreviewQuestionIndex(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-odia font-bold text-base sm:text-lg text-slate-900 leading-snug">
                {questions[previewQuestionIndex].question}
              </h3>

              {questions[previewQuestionIndex].pattern === 'mcq' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {questions[previewQuestionIndex].options?.map((opt, idx) => {
                    const isCorrect = opt.trim() === questions[previewQuestionIndex].correctAnswer.trim();
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{String.fromCharCode(65 + idx)}. {opt}</span>
                        {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                <span className="font-bold text-emerald-800 uppercase text-[10px]">ସଠିକ୍ ଉତ୍ତର:</span>
                <p className="font-odia font-bold text-emerald-950">{questions[previewQuestionIndex].correctAnswer}</p>
              </div>

              {questions[previewQuestionIndex].explanationCorrect && (
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                  <span className="font-bold text-blue-800 uppercase text-[10px]">ବ୍ୟାଖ୍ୟା:</span>
                  <p className="font-odia text-blue-950 leading-relaxed">{questions[previewQuestionIndex].explanationCorrect}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <button
                disabled={previewQuestionIndex <= 0}
                onClick={() => setPreviewQuestionIndex((prev) => (prev !== null ? prev - 1 : 0))}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-40 cursor-pointer"
              >
                &larr; ପୂର୍ବ (Prev)
              </button>
              <button
                disabled={previewQuestionIndex >= questions.length - 1}
                onClick={() => setPreviewQuestionIndex((prev) => (prev !== null ? prev + 1 : 0))}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-40 cursor-pointer"
              >
                ପରବର୍ତ୍ତୀ (Next) &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE TEST PAPER PREVIEW */}
      {/* ========================================================================= */}
      {testToPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-odia font-bold text-lg text-slate-900">
                  ପରୀକ୍ଷା ପତ୍ର ପୂର୍ବାବଲୋକନ (Test Paper Preview)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportTestPaperPDF(testToPreview.test, testToPreview.questions)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF ଡାଉନଲୋଡ୍</span>
                </button>
                <button
                  onClick={() => setTestToPreview(null)}
                  className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Exam Paper Layout */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 rounded-2xl border border-slate-200/80 space-y-6 font-serif text-slate-900">
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-800">
                <h2 className="text-xl font-bold tracking-wider uppercase">
                  ଇତିହାସ ବିଭାଗ (DEPARTMENT OF HISTORY)
                </h2>
                <h3 className="text-base font-bold font-odia text-slate-800">
                  {testToPreview.test.title}
                </h3>
                <div className="flex items-center justify-between text-xs pt-2 font-mono">
                  <span>Paper: {testToPreview.test.paperName}</span>
                  <span>Time: {testToPreview.test.durationMinutes} Minutes</span>
                  <span>Full Marks: {testToPreview.test.totalMarks}</span>
                </div>
              </div>

              <div className="space-y-5 text-sm">
                {testToPreview.questions.map((q, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-start justify-between gap-3 font-medium">
                      <div className="flex items-start gap-2">
                        <span className="font-bold">{idx + 1}.</span>
                        <span className="font-odia leading-relaxed">{q.question}</span>
                      </div>
                      <span className="font-bold shrink-0">[{q.marks}]</span>
                    </div>

                    {q.pattern === 'mcq' && q.options && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 pl-6 text-xs text-slate-800">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx}>
                            ({String.fromCharCode(65 + oIdx)}) {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SAFE DELETE PAPER */}
      {/* ========================================================================= */}
      {deleteConfirmPaper && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="font-odia font-bold text-lg text-rose-600">
              ପେପର୍ ଡିଲିଟ୍ ସତର୍କତା (Delete Paper)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ଆପଣ ପ୍ରକୃତରେ <b>{deleteConfirmPaper.nameOdia || deleteConfirmPaper.name}</b> କୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହାଁନ୍ତି କି?
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => setDeleteConfirmPaper(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                ବାତିଲ୍ (Cancel)
              </button>
              <button
                onClick={handleExecuteDeletePaper}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
              >
                ଡିଲିଟ୍ କରନ୍ତୁ (Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SAFE DELETE CHAPTER */}
      {/* ========================================================================= */}
      {deleteConfirmChapter && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <h3 className="font-odia font-bold text-lg text-rose-600">
              ଅଧ୍ୟାୟ ଡିଲିଟ୍ ସତର୍କତା (Delete Chapter)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ଆପଣ ପ୍ରକୃତରେ <b>{deleteConfirmChapter.nameOdia || deleteConfirmChapter.name}</b> କୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହାଁନ୍ତି କି?
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                onClick={() => setDeleteConfirmChapter(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                ବାତିଲ୍ (Cancel)
              </button>
              <button
                onClick={handleExecuteDeleteChapter}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
              >
                ଡିଲିଟ୍ କରନ୍ତୁ (Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUCCESS TOAST NOTIFICATION */}
      {/* ========================================================================= */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SMART PASTE & AUTO-CONVERTER (Paste & Convert to Chapter Questions) */}
      {/* ========================================================================= */}
      {isSmartPasteModalOpen && selectedChapter && selectedPaper && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-amber-50/60 to-white">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                  <span>Smart Paste & Auto-Converter (ପ୍ରଶ୍ନ ପେଷ୍ଟ୍ କନଭର୍ଟର)</span>
                </div>
                <h3 className="font-odia font-bold text-lg sm:text-xl text-slate-900 mt-0.5">
                  {smartPasteStep === 'paste'
                    ? 'ଅଧ୍ୟାୟ ପାଇଁ ପ୍ରଶ୍ନ ପାଠ୍ୟ ପେଷ୍ଟ୍ କରନ୍ତୁ'
                    : `ଚିହ୍ନଟ ହୋଇଥିବା ପ୍ରଶ୍ନ ଯାଞ୍ଚ ଓ ସମ୍ପାଦନା (${parsedPastedQuestions.length} Questions)`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ଅଧ୍ୟାୟ: <strong className="text-slate-800">{selectedChapter.nameOdia || selectedChapter.name}</strong> • ପେପର୍: {selectedPaper.nameOdia || selectedPaper.name}
                </p>
              </div>

              <button
                onClick={() => setIsSmartPasteModalOpen(false)}
                className="p-2 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {smartPasteStep === 'paste' ? (
                /* STEP 1: PASTE TEXTAREA */
                <div className="space-y-4">
                  {/* Guidance Box */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-1.5 leading-relaxed">
                    <div className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                      <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>କିପରି ବ୍ୟବହାର କରିବେ (How to Use):</span>
                    </div>
                    <p className="text-[11px]">
                      Word, PDF, WhatsApp, Web, ChatGPT କିମ୍ବା Gemini ରୁ କପି କରିଥିବା ପ୍ରଶ୍ନଗୁଡ଼ିକୁ ତଳ ବକ୍ସରେ ପେଷ୍ଟ୍ (Ctrl + V) କରନ୍ତୁ। ଏହା ସ୍ୱୟଂକ୍ରିୟ ଭାବେ ପ୍ରଶ୍ନ, ୪ଟି ବିକଳ୍ପ (A/B/C/D), ସଠିକ୍ ଉତ୍ତର ଓ ବ୍ୟାଖ୍ୟା ଚିହ୍ନଟ କରି ଅଧ୍ୟାୟରେ ସଂରକ୍ଷଣ କରିବ।
                    </p>
                  </div>

                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-700">ପ୍ରଶ୍ନ ପାଠ୍ୟ (Raw Question Content) *</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) setSmartPasteRawText(text);
                          } catch {
                            alert('କ୍ଲିପବୋର୍ଡ ପଢ଼ିବା ଅନୁମତି ମିଳିଲା ନାହିଁ। ଦୟାକରି Ctrl + V ଦବାଇ ପେଷ୍ଟ୍ କରନ୍ତୁ।');
                          }
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
                        <span>କ୍ଲିପବୋର୍ଡରୁ ଆଣନ୍ତୁ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSmartPasteRawText(SAMPLE_PASTE_TEXT)}
                        className="px-2.5 py-1 rounded-xl bg-amber-100/80 hover:bg-amber-200 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-700" />
                        <span>ନମୁନା ଟେମ୍ପଲେଟ୍ ଭରନ୍ତୁ</span>
                      </button>

                      {smartPasteRawText && (
                        <button
                          type="button"
                          onClick={() => setSmartPasteRawText('')}
                          className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ଖାଲି କରନ୍ତୁ</span>
                        </button>
                      )}
                    </div>
                  </div>

                    {/* Textarea */}
                    <textarea
                      rows={10}
                      value={smartPasteRawText}
                      onChange={(e) => setSmartPasteRawText(e.target.value)}
                      placeholder={`ଏଠାରେ ଆପଣ ଯେକୌଣସି ପାଠ୍ୟ ପେଷ୍ଟ କରନ୍ତୁ — ପ୍ରଶ୍ନ, କେବଳ ଉତ୍ତର, କିମ୍ବା ପଢ଼ା ତଥ୍ୟ...

ଉଦାହରଣ ୧ (କେବଳ ଉତ୍ତର ବା ତଥ୍ୟ):
- ମାଦଳା ପାଞ୍ଜି (ଓଡ଼ିଶାର ଶ୍ରୀଜଗନ୍ନାଥ ମନ୍ଦିର ଓ ରାଜବଂଶ ଇତିହାସ)
- ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ (ଖାରବେଳଙ୍କ ୧୩ ବର୍ଷର କାର୍ଯ୍ୟାବଳୀ)

ଉଦାହରଣ ୨ (ପୂର୍ଣ୍ଣ ପ୍ରଶ୍ନ):
1. ପ୍ରାଚୀନ ଭାରତୀୟ ଇତିହାସର ସର୍ବପ୍ରାଚୀନ ଧାର୍ମିକ ସାହିତ୍ୟ କେଉଁଟି?
(A) ଋଗ୍‌ବେଦ (B) ସାମବେଦ (C) ଯଜୁର୍ବେଦ (D) ଅଥର୍ବବେଦ
Ans: A
Exp: ଋଗ୍‌ବେଦ ହେଉଛି ଭାରତର ସର୍ବପୁରାତନ ବୈଦିକ ଗ୍ରନ୍ଥ...`}
                      className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                    />

                    {/* Requirements Card: Format & Language */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-slate-50 border border-purple-100 space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-purple-950">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>ଆପଣଙ୍କ ଆବଶ୍ୟକତା (Select Your Requirements):</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Target Question Pattern */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            ପ୍ରଶ୍ନ ଫର୍ମାଟ୍ (Target Question Pattern):
                          </label>
                          <select
                            value={smartPasteTargetPattern}
                            onChange={(e) => setSmartPasteTargetPattern(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 font-bold text-xs text-purple-950 focus:outline-none focus:border-purple-400"
                          >
                            <option value="auto">ସ୍ୱୟଂକ୍ରିୟ ଚିହ୍ନଟ (Auto Detect from Text)</option>
                            <option value="mcq">ବହୁବିକଳ୍ପ (MCQ - 4 Options with Ans & Exp)</option>
                            <option value="blanks">ଶୂନ୍ୟସ୍ଥାନ ପୂରଣ (Fill in the Blanks)</option>
                            <option value="true_false">ସତ୍ୟ କିମ୍ବା ମିଥ୍ୟା (True / False)</option>
                            <option value="short">ସଂକ୍ଷିପ୍ତ ଉତ୍ତର (Short Answer - 2 Marks)</option>
                            <option value="long">ଦୀର୍ଘ ଉତ୍ତର (Long Answer - 5 Marks)</option>
                          </select>
                        </div>

                        {/* Target Language */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            ଭାଷା (Language):
                          </label>
                          <select
                            value={smartPasteTargetLanguage}
                            onChange={(e) => setSmartPasteTargetLanguage(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 font-bold text-xs text-purple-950 focus:outline-none focus:border-purple-400"
                          >
                            <option value="bilingual">ଓଡ଼ିଆ + English (Bilingual)</option>
                            <option value="odia">କେବଳ ଓଡ଼ିଆ (Odia Only)</option>
                            <option value="english">English Only</option>
                          </select>
                        </div>
                      </div>
                    </div>

                  {/* Error Notification */}
                  {pasteError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{pasteError}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* STEP 2: PREVIEW & CUSTOMIZE DETECTED QUESTIONS */
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                        {parsedPastedQuestions.length} ଟି ପ୍ରଶ୍ନ ଚିହ୍ନଟ ହୋଇଛି
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        ସଂରକ୍ଷଣ କରିବା ପୂର୍ବରୁ ଆପଣ ଯେକୌଣସି ବିକଳ୍ପ ବା ଉତ୍ତର ସମ୍ପାଦନା କରିପାରିବେ
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSmartPasteStep('paste')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>⬅️ ପାଠ୍ୟ ପରିବର୍ତ୍ତନ</span>
                    </button>
                  </div>

                  {/* Duplicate Alert Banner */}
                  {parsedPastedQuestions.some((q) => q.isDuplicate) && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-amber-900">
                            ⚠️ {parsedPastedQuestions.filter((q) => q.isDuplicate).length} ଟି ପ୍ରଶ୍ନ ପୂର୍ବରୁ Question Bank ରେ ଉପଲବ୍ଧ ଅଛି (Duplicates Found)
                          </div>
                          <div className="text-[11px] text-amber-800 mt-0.5">
                            ଆପଣ ଏଗୁଡ଼ିକୁ ରଖିବାକୁ ଚାହାଁନ୍ତି କି ବାଦ୍ ଦେବାକୁ ଚାହାଁନ୍ତି, ତଳୁ ଚୟନ କରନ୍ତୁ:
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSkipAllDuplicates(false)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs cursor-pointer transition-colors"
                          title="ସମସ୍ତ ପ୍ରଶ୍ନ ରଖନ୍ତୁ"
                        >
                          ✅ ସବୁ ରଖନ୍ତୁ (Keep All)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSkipAllDuplicates(true)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px] shadow-xs cursor-pointer transition-colors"
                          title="ଡୁପ୍ଲିକେଟ୍ ପ୍ରଶ୍ନଗୁଡ଼ିକୁ ବାଦ୍ ଦିଅନ୍ତୁ"
                        >
                          🚫 ସବୁ ବାଦ୍ ଦିଅନ୍ତୁ (Skip All)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Questions List */}
                  <div className="space-y-4">
                    {parsedPastedQuestions.map((q, idx) => {
                      const isSkipped = !!q.skipThis;
                      return (
                        <div
                          key={idx}
                          className={`p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3 transition-all ${
                            q.isDuplicate
                              ? isSkipped
                                ? 'bg-amber-50/30 border border-amber-200 opacity-60'
                                : 'bg-amber-50/70 border-2 border-amber-400 ring-2 ring-amber-200'
                              : isSkipped
                              ? 'bg-slate-50 border border-slate-200 opacity-60'
                              : 'bg-white border border-slate-200/90'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>

                              {/* Pattern Selector */}
                              <select
                                value={q.pattern}
                                onChange={(e) => {
                                  const newPat = e.target.value as QuestionPattern;
                                  handleUpdateParsedQuestion(idx, {
                                    ...q,
                                    pattern: newPat,
                                    options: newPat === 'mcq' ? (q.options?.length ? q.options : ['', '', '', '']) : undefined
                                  });
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-[11px] text-slate-700"
                              >
                                <option value="mcq">MCQ (4 Options)</option>
                                <option value="true_false">True / False</option>
                                <option value="blanks">Fill in the Blanks</option>
                                <option value="short">Short Q&A</option>
                                <option value="one_word">One Word</option>
                              </select>

                              {/* Marks Selector */}
                              <select
                                value={q.marks}
                                onChange={(e) => handleUpdateParsedQuestion(idx, { ...q, marks: Number(e.target.value) })}
                                className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-[11px] text-slate-700"
                              >
                                <option value={1}>1 Mark</option>
                                <option value={2}>2 Marks</option>
                                <option value={5}>5 Marks</option>
                                <option value={8}>8 Marks</option>
                              </select>

                              {/* Duplicate Badge */}
                              {q.isDuplicate && (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] flex items-center gap-1 shadow-2xs">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>ପୂର୍ବରୁ ଉପଲବ୍ଧ (Duplicate)</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Keep / Skip Toggle Button */}
                              {isSkipped ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateParsedQuestion(idx, { ...q, skipThis: false })}
                                  className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                  title="ଏହି ପ୍ରଶ୍ନଟି ବାଦ୍ ଦିଆଯାଇଛି। ସଂରକ୍ଷଣ କରିବାକୁ ଏଠାରେ କ୍ଲିକ୍ କରନ୍ତୁ"
                                >
                                  <Square className="w-3.5 h-3.5 text-amber-700" />
                                  <span>ବାଦ୍ (କ୍ଲିକ୍ କରି ରଖନ୍ତୁ)</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateParsedQuestion(idx, { ...q, skipThis: true })}
                                  className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                  title="ଏହି ପ୍ରଶ୍ନ ସଂରକ୍ଷଣ ହେବ। ବାଦ୍ ଦେବାକୁ ଏଠାରେ କ୍ଲିକ୍ କରନ୍ତୁ"
                                >
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>ରଖନ୍ତୁ (Will Save)</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveParsedQuestion(idx)}
                                className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove Question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Matched Question Note if Duplicate */}
                          {q.isDuplicate && q.matchedQuestion && (
                            <div className="text-[11px] text-amber-900 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200 font-odia leading-relaxed">
                              <strong>ପୂର୍ବରୁ ଥିବା ପ୍ରଶ୍ନ ସହ ସାମଞ୍ଜସ୍ୟ:</strong> "{q.matchedQuestion}"
                            </div>
                          )}

                          {/* Question Text */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                              ପ୍ରଶ୍ନ (Question Text):
                            </label>
                            <textarea
                              rows={2}
                              value={q.question}
                              onChange={(e) => handleUpdateParsedQuestion(idx, { ...q, question: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-odia font-medium text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Options if MCQ */}
                          {q.pattern === 'mcq' && (
                            <div className="space-y-2">
                              <label className="block font-bold text-slate-700 text-[11px]">
                                ବିକଳ୍ପଗୁଡ଼ିକ (ସଠିକ୍ ଉତ୍ତର ପାଇଁ ବାମ ପଟ ଚେକ୍ ବଟନ୍ କ୍ଲିକ୍ କରନ୍ତୁ):
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(q.options || ['', '', '', '']).map((opt, oIdx) => {
                                  const isCorrect = opt.trim() && opt.trim() === (q.correctAnswer || '').trim();
                                  return (
                                    <div
                                      key={oIdx}
                                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                        isCorrect
                                          ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
                                          : 'bg-white border-slate-200'
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateParsedQuestion(idx, { ...q, correctAnswer: opt })}
                                        className={`w-6 h-6 rounded-lg font-bold text-[10px] flex items-center justify-center shrink-0 transition-colors ${
                                          isCorrect
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                                        }`}
                                        title="Mark as correct answer"
                                      >
                                        {String.fromCharCode(65 + oIdx)}
                                      </button>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const newOpts = [...(q.options || ['', '', '', ''])];
                                          const oldVal = newOpts[oIdx];
                                          newOpts[oIdx] = e.target.value;
                                          handleUpdateParsedQuestion(idx, {
                                            ...q,
                                            options: newOpts,
                                            correctAnswer: q.correctAnswer === oldVal ? e.target.value : q.correctAnswer
                                          });
                                        }}
                                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                        className="flex-1 bg-transparent font-odia text-xs focus:outline-none"
                                      />
                                      {isCorrect && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Non-MCQ Correct Answer */}
                          {q.pattern !== 'mcq' && (
                            <div>
                              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                                ସଠିକ୍ ଉତ୍ତର (Correct Answer):
                              </label>
                              <input
                                type="text"
                                value={q.correctAnswer}
                                onChange={(e) => handleUpdateParsedQuestion(idx, { ...q, correctAnswer: e.target.value })}
                                placeholder="ସଠିକ୍ ଉତ୍ତର ଲେଖନ୍ତୁ..."
                                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-odia text-xs focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          )}

                          {/* Explanation */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                              ପ୍ରାମାଣିକ ବ୍ୟାଖ୍ୟା (Explanation):
                            </label>
                            <textarea
                              rows={2}
                              value={q.explanationCorrect || ''}
                              onChange={(e) => handleUpdateParsedQuestion(idx, { ...q, explanationCorrect: e.target.value })}
                              placeholder="ଉତ୍ତରର ଐତିହାସିକ ପ୍ରମାଣ ବା ବ୍ୟାଖ୍ୟା..."
                              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-odia text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Add More Question Card */}
                    <button
                      type="button"
                      onClick={handleAddBlankQuestionToParsed}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-400 text-slate-500 hover:text-amber-700 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer bg-white"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ ଆଉ ଏକ ପ୍ରଶ୍ନ ଯୋଡ଼ନ୍ତୁ (Add Another Question)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsSmartPasteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                ବାତିଲ୍ (Cancel)
              </button>

              {smartPasteStep === 'paste' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConvertPastedText}
                    disabled={isConvertingWithAi || !smartPasteRawText.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Pre-formatted questions (1. Q, A, B, C, D) ଥିଲେ ସିଧାସଳଖ ପଢ଼ନ୍ତୁ"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>⚡ ସିଧାସଳଖ ପଢ଼ନ୍ତୁ (Direct Fast)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConvertPastedTextWithAi}
                    disabled={isConvertingWithAi || !smartPasteRawText.trim()}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isConvertingWithAi ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                        <span>AI ବିଶ୍ଳେଷଣ ଚାଲିଛି...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>✨ AI ବିଶ୍ଳେଷଣ ଓ ରୂପାନ୍ତରଣ &rarr;</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                (() => {
                  const activeCount = parsedPastedQuestions.filter((q) => !q.skipThis).length;
                  return (
                    <button
                      type="button"
                      disabled={activeCount === 0}
                      onClick={handleSaveParsedQuestionsToChapter}
                      className={`px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 ${
                        activeCount > 0
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95 shadow-emerald-600/20'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {activeCount > 0
                          ? `ଏହି ଅଧ୍ୟାୟରେ ସଂରକ୍ଷଣ କରନ୍ତୁ (${activeCount} Questions)`
                          : 'ସଂରକ୍ଷଣ ପାଇଁ ପ୍ରଶ୍ନ ଚୟନ କରନ୍ତୁ (0 Selected)'}
                      </span>
                    </button>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IN-PAGE CHAPTER AI CHAT & VISION ASSISTANT (No need to leave page) */}
      {/* ========================================================================= */}
      {isChapterAiModalOpen && selectedChapter && selectedPaper && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[92vh] max-h-[900px] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                  {chapterModalTab === 'generator' ? '⚡' : '💬'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-odia font-bold text-base sm:text-lg text-slate-900 truncate">
                      {chapterModalTab === 'generator' ? 'AI ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି (Question Generator)' : 'AI Chat (Vision & Docs)'}
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      100% Offline / Online Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    ଅଧ୍ୟାୟ: <strong className="text-purple-900">{selectedChapter.nameOdia || selectedChapter.name}</strong> • {selectedPaper.nameOdia || selectedPaper.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onNavigateToChat && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChapterAiModalOpen(false);
                      onNavigateToChat({
                        paperId: selectedPaper.id,
                        chapterId: selectedChapter.id,
                        paperName: selectedPaper.nameOdia || selectedPaper.name,
                        chapterName: selectedChapter.nameOdia || selectedChapter.name
                      });
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                    title="Open in Dedicated Full-Screen AI Chat Page"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsChapterAiModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs & Deduplication Shield */}
            <div className="px-5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl shadow-xs border border-slate-200">
                <button
                  type="button"
                  onClick={() => setChapterModalTab('generator')}
                  className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    chapterModalTab === 'generator'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ AI ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତି (Generator)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChapterModalTab('chat')}
                  className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    chapterModalTab === 'chat'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>💬 AI Chat (Vision & Docs)</span>
                </button>
              </div>

              {/* Deduplication Shield Toggle */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer select-none shrink-0 hover:bg-slate-50 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <input
                  type="checkbox"
                  checked={chapterAiAvoidDuplicates}
                  onChange={(e) => setChapterAiAvoidDuplicates(e.target.checked)}
                  className="rounded text-purple-600 cursor-pointer"
                />
                <span>ଡୁପ୍ଲିକେଟ୍ ରୋକନ୍ତୁ (No Repeat)</span>
              </label>
            </div>

            {/* TAB 1: STRUCTURED QUESTION GENERATOR */}
            {chapterModalTab === 'generator' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar bg-white">
                {/* 1. Question Count Section (Fixed by Teacher) */}
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        🔢
                      </span>
                      <label className="font-odia font-bold text-sm text-purple-950">
                        ପ୍ରଶ୍ନ ସଂଖ୍ୟା ସ୍ଥିର କରନ୍ତୁ (Fix Number of Questions):
                      </label>
                    </div>
                    <p className="text-[11px] text-purple-700 mt-1">
                      ଆପଣ ଯେତିକି ସଂଖ୍ୟା ଫିକ୍ସ କରିବେ, AI ଠିକ୍ ସେତିକି ନୂଆ ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ କରିବ (୧ ରୁ ୫୦ ପର୍ଯ୍ୟନ୍ତ)।
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* Number Stepper */}
                    <div className="flex items-center bg-white border border-purple-200 rounded-xl shadow-xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setChapterAiCount(Math.max(1, chapterAiCount - 1))}
                        disabled={chapterAiCount <= 1}
                        className="p-2 hover:bg-purple-100 text-purple-900 disabled:opacity-30 cursor-pointer transition-colors"
                        title="Decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={chapterAiCount}
                        onChange={(e) => setChapterAiCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                        className="w-14 text-center font-bold text-sm text-purple-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setChapterAiCount(Math.min(50, chapterAiCount + 1))}
                        disabled={chapterAiCount >= 50}
                        className="p-2 hover:bg-purple-100 text-purple-900 disabled:opacity-30 cursor-pointer transition-colors"
                        title="Increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Chips */}
                    <div className="flex items-center gap-1">
                      {[5, 10, 15, 20, 25, 30].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setChapterAiCount(cnt)}
                          className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            chapterAiCount === cnt
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-100'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Question Format / Pattern Grid */}
                <div>
                  <label className="block font-odia font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                    ପ୍ରଶ୍ନ ପ୍ରକାର ଚୟନ କରନ୍ତୁ (Select Question Format):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { key: 'mcq', title: '1-Mark MCQs', desc: 'ବହୁବିକଳ୍ପୀ ପ୍ରଶ୍ନ (୪ଟି ଅପ୍ସନ୍)' },
                      { key: 'short', title: '2-Marks Short', desc: 'ସଂକ୍ଷିପ୍ତ ଉତ୍ତରମୂଳକ' },
                      { key: 'long', title: '5-Marks Long', desc: 'ଦୀର୍ଘ ବିସ୍ତୃତ ଉତ୍ତର' },
                      { key: 'blanks', title: '1-Mark Blanks', desc: 'ଶୂନ୍ୟସ୍ଥାନ ପୂରଣ' },
                      { key: 'true_false', title: 'True / False', desc: 'ସତ୍ୟ କିମ୍ବା ମିଥ୍ୟା' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setChapterAiPattern(item.key as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          chapterAiPattern === item.key
                            ? 'bg-purple-50 border-purple-500 shadow-xs ring-2 ring-purple-400/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${chapterAiPattern === item.key ? 'text-purple-900' : 'text-slate-800'}`}>
                              {item.title}
                            </span>
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              chapterAiPattern === item.key ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                            }`}>
                              {chapterAiPattern === item.key && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Language & Custom Topic / Focus */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Language */}
                  <div>
                    <label className="block font-odia font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                      ପ୍ରଶ୍ନର ଭାଷା (Language):
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { key: 'odia', label: 'ଓଡ଼ିଆ' },
                        { key: 'english', label: 'English' },
                        { key: 'bilingual', label: 'Bilingual' },
                      ].map((l) => (
                        <button
                          key={l.key}
                          type="button"
                          onClick={() => setChapterAiLanguage(l.key as any)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            chapterAiLanguage === l.key
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Topic / Prompt */}
                  <div className="sm:col-span-2">
                    <label className="block font-odia font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                      ବିଶେଷ ପ୍ରଶ୍ନ ବା ନିର୍ଦ୍ଦେଶ (Custom Focus - ଇଚ୍ଛାଧୀନ):
                    </label>
                    <input
                      type="text"
                      value={chapterAiCustomPrompt}
                      onChange={(e) => setChapterAiCustomPrompt(e.target.value)}
                      placeholder="e.g. ଶିଳାଲେଖ ଓ ମୁଦ୍ରା ଉପରେ ବିଶେଷ ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ କରନ୍ତୁ..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-odia text-xs focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* 4. Vision & Document Upload / Paste Area */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                      📎
                    </div>
                    <div>
                      <span className="font-odia font-bold text-xs text-slate-800">
                        ପୁସ୍ତକ / ନୋଟ୍ସ ଫଟୋ ବା ଦସ୍ତାବିଜ୍ ଯୋଡ଼ନ୍ତୁ (Vision & Docs)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        ପୁସ୍ତକ ପେଜ୍ ଅପଲୋଡ୍ କରନ୍ତୁ କିମ୍ବା ସିଧାସଳଖ ଏଠାରେ Ctrl + V ଦ୍ୱାରା Paste କରନ୍ତୁ।
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="file"
                      ref={chapterFileInputRef}
                      onChange={handleChapterChatAttachFile}
                      accept="image/*,.pdf,.txt"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => chapterFileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                      <span>ଫାଇଲ୍ ଯୋଡ଼ନ୍ତୁ</span>
                    </button>
                  </div>
                </div>

                {/* Attached Files List */}
                {chapterChatAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {chapterChatAttachments.map((att) => (
                      <div key={att.id} className="relative group rounded-xl overflow-hidden border border-purple-200 bg-white p-1 flex items-center gap-2 shadow-xs">
                        {att.type === 'image' && att.dataUrl ? (
                          <img src={att.dataUrl} alt={att.name} className="w-10 h-10 object-cover rounded-lg" />
                        ) : (
                          <FileText className="w-6 h-6 text-purple-600 ml-1" />
                        )}
                        <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setChapterChatAttachments(prev => prev.filter(a => a.id !== att.id))}
                          className="p-1 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Big Purple Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isGeneratingChapterAi}
                    onClick={handleGenerateChapterQuestions}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isGeneratingChapterAi ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>AI ଦ୍ୱାରା {chapterAiCount} ଟି ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ ଚାଲିଛି...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                        <span>
                          ✨ ଏହି ଅଧ୍ୟାୟ ପାଇଁ {chapterAiCount} ଟି {chapterAiPattern.toUpperCase()} ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ କରନ୍ତୁ (GENERATE {chapterAiCount} QUESTIONS)
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Box */}
                {chapterAiError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-medium text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{chapterAiError}</span>
                  </div>
                )}

                {/* 6. Generated Questions Preview & Direct Save */}
                {chapterAiParsedQuestions.length > 0 && (
                  <div className="mt-6 border border-slate-200 rounded-3xl p-4 sm:p-5 bg-white shadow-sm space-y-4 animate-in fade-in-50">
                    {/* Result Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <h4 className="font-odia font-bold text-sm text-slate-900">
                            ପ୍ରଶ୍ନ ସଫଳତାର ସହ ପ୍ରସ୍ତୁତ ହୋଇଛି ({chapterAiParsedQuestions.length} Qs Generated)
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ନିମ୍ନରେ ପ୍ରଶ୍ନଗୁଡ଼ିକ ଯାଞ୍ଚ କରନ୍ତୁ ଏବଂ ସିଧାସଳଖ ଅଧ୍ୟାୟରେ ସଂରକ୍ଷଣ କରନ୍ତୁ।
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleSaveAllGeneratedQuestions}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          <span>📥 ଏହି ସମସ୍ତ ପ୍ରଶ୍ନ ଅଧ୍ୟାୟରେ ସେଭ୍ କରନ୍ତୁ</span>
                        </button>
                      </div>
                    </div>

                    {/* Questions Cards List */}
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                      {chapterAiParsedQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border transition-all ${
                            q.skipThis
                              ? 'bg-slate-50/70 border-slate-200 opacity-60'
                              : q.isDuplicate
                              ? 'bg-amber-50/40 border-amber-200'
                              : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-odia font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                                  {q.question}
                                </p>

                                {/* Options if MCQ */}
                                {q.options && q.options.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2.5">
                                    {q.options.map((opt, oIdx) => {
                                      const isCorrect = opt.trim() === q.correctAnswer?.trim();
                                      return (
                                        <div
                                          key={oIdx}
                                          className={`px-2.5 py-1.5 rounded-lg text-xs font-odia flex items-center gap-2 ${
                                            isCorrect
                                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold'
                                              : 'bg-slate-50 border border-slate-100 text-slate-700'
                                          }`}
                                        >
                                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                            {String.fromCharCode(65 + oIdx)}
                                          </span>
                                          <span className="truncate">{opt}</span>
                                          {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Explanation */}
                                {q.explanationCorrect && (
                                  <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <strong className="text-purple-900">Exp:</strong> {q.explanationCorrect}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Badges & Toggle */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              {q.isDuplicate ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  ⚠️ ଡୁପ୍ଲିକେଟ୍
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  ✓ ନୂତନ ପ୍ରଶ୍ନ
                                </span>
                              )}

                              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!q.skipThis}
                                  onChange={() => handleToggleSkipChapterAiQuestion(idx)}
                                  className="rounded text-purple-600"
                                />
                                <span>{q.skipThis ? 'ବାଦ୍ ଦିଆଯାଇଛି' : 'ସଂରକ୍ଷଣ କରନ୍ତୁ'}</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const text = chapterAiParsedQuestions.map((q, i) => `${i + 1}. ${q.question}\nAns: ${q.correctAnswer}\nExp: ${q.explanationCorrect || ''}`).join('\n\n');
                            navigator.clipboard.writeText(text);
                            showToast('📋 ସମସ୍ତ ପ୍ରଶ୍ନ କପି ହୋଇଗଲା!');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy All</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsChapterAiModalOpen(false);
                            setSmartPasteRawText(chapterAiResponse);
                            setIsSmartPasteModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 font-bold text-xs hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-amber-700" />
                          <span>Smart Paste ରେ ଖୋଲନ୍ତୁ</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveAllGeneratedQuestions}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>📥 ଏହି ସମସ୍ତ ପ୍ରଶ୍ନ ଅଧ୍ୟାୟରେ ସେଭ୍ କରନ୍ତୁ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: IN-PAGE CHAT & VISION CONVERSATION */}
            {chapterModalTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                {/* Quick Preset Action Chips Bar */}
                <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0 custom-scrollbar">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>ତୁରନ୍ତ ପ୍ରସ୍ତୁତି:</span>
                  </span>

                  <button
                    type="button"
                    disabled={isGeneratingChapterAi}
                    onClick={() => {
                      setChapterAiPattern('mcq');
                      handleSendChapterChatMessage(`Generate ${chapterAiCount} multiple choice questions (MCQs, 1 mark each) with 4 options, verified correct answer, and detailed historical explanation on "${selectedChapter.nameOdia || selectedChapter.name}"`);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-purple-100/80 hover:bg-purple-200 text-purple-900 font-bold text-[11px] shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ⚡ {chapterAiCount} MCQs
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingChapterAi}
                    onClick={() => {
                      setChapterAiPattern('short');
                      handleSendChapterChatMessage(`Generate 5 short-answer questions (2 marks each) with clear verified answers on "${selectedChapter.nameOdia || selectedChapter.name}"`);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-indigo-100/80 hover:bg-indigo-200 text-indigo-900 font-bold text-[11px] shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ⚡ 5 Short Q&A
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingChapterAi}
                    onClick={() => {
                      setChapterAiPattern('long');
                      handleSendChapterChatMessage(`Generate 5 comprehensive long questions (5 marks each) with detailed historical notes on "${selectedChapter.nameOdia || selectedChapter.name}"`);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-blue-100/80 hover:bg-blue-200 text-blue-900 font-bold text-[11px] shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ⚡ 5 Long Q&A
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingChapterAi}
                    onClick={() => {
                      setChapterAiPattern('blanks');
                      handleSendChapterChatMessage(`Generate 5 fill-in-the-blanks questions (1 mark each) with answers on "${selectedChapter.nameOdia || selectedChapter.name}"`);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-100/80 hover:bg-amber-200 text-amber-900 font-bold text-[11px] shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ⚡ 5 Blanks
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingChapterAi}
                    onClick={() => {
                      setChapterAiPattern('true_false');
                      handleSendChapterChatMessage(`Generate 5 true or false questions with answers and explanations on "${selectedChapter.nameOdia || selectedChapter.name}"`);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ⚡ 5 True/False
                  </button>
                </div>

                {/* Conversation Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
                  {chapterChatMessages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {isUser ? 'ଆପଣ (Teacher)' : 'AI ସହାୟକ (Assistant)'}
                          </span>
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        </div>

                        <div
                          className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[90%] sm:max-w-[85%] break-words shadow-2xs ${
                            isUser
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs space-y-3'
                          }`}
                        >
                          {/* Attached images if user message */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {msg.attachments.map((att, aIdx) => (
                                <img
                                  key={aIdx}
                                  src={att.dataUrl}
                                  alt={att.name}
                                  className="w-24 h-24 object-cover rounded-xl border border-white/30 shadow-xs"
                                />
                              ))}
                            </div>
                          )}

                          {/* Content */}
                          <div className="whitespace-pre-wrap font-sans">
                            {msg.content}
                          </div>

                          {/* Actions Toolbar for Assistant Message */}
                          {!isUser && msg.id !== 'welcome_' + msg.timestamp && (
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-2">
                              <div className="flex items-center gap-1.5">
                                {msg.parsedQuestions && msg.parsedQuestions.length > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
                                    {msg.parsedQuestions.length} ଟି ପ୍ରଶ୍ନ ଚିହ୍ନଟ
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.content);
                                    showToast('📋 ଉତ୍ତର କପି ହେଲା!');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Copy"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleTransferMessageToSmartPaste(msg)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Smart Paste ରେ କଷ୍ଟମାଇଜ୍ କରନ୍ତୁ"
                                >
                                  <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Smart Paste</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSaveQuestionsFromMessage(msg)}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                                  title="Save directly into this chapter in Question Bank"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>📥 ଏହି ଅଧ୍ୟାୟରେ ସଂରକ୍ଷଣ କରନ୍ତୁ</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Generating spinner */}
                  {isGeneratingChapterAi && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-purple-200 shadow-2xs max-w-sm">
                      <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                      <span className="text-xs font-bold text-purple-900">
                        AI ଉତ୍ତର ଓ ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ କରୁଛି...
                      </span>
                    </div>
                  )}

                  {/* Error box */}
                  {chapterAiError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-medium text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{chapterAiError}</span>
                    </div>
                  )}

                  <div ref={chapterChatBottomRef} />
                </div>

                {/* Bottom Chat Input Bar */}
                <div className="p-3.5 border-t border-slate-200 bg-white space-y-2.5 shrink-0">
                  {/* Attachment Preview thumbnail */}
                  {chapterChatAttachments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {chapterChatAttachments.map((att, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-300 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setChapterChatAttachments((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-xs hover:bg-rose-700 cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {/* File attachment hidden input */}
                    <input
                      ref={chapterFileInputRef}
                      type="file"
                      accept="image/*,.pdf,.txt"
                      onChange={handleChapterChatAttachFile}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => chapterFileInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
                      title="Attach Photo or Document"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Question Count indicator chip in chat */}
                    <button
                      type="button"
                      onClick={() => setChapterModalTab('generator')}
                      className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
                      title="Click to fix question count"
                    >
                      <span>🔢 Count:</span>
                      <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px]">
                        {chapterAiCount}
                      </span>
                    </button>

                    {/* Text input */}
                    <input
                      type="text"
                      value={chapterChatInput}
                      onChange={(e) => setChapterChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChapterChatMessage();
                        }
                      }}
                      onPaste={handleChapterChatPaste}
                      placeholder="ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ, କିମ୍ବା Ctrl + V ଦ୍ୱାରା ଫଟୋ paste କରନ୍ତୁ (Ask or Paste Image)..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-odia text-xs focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    />

                    {/* Language Select */}
                    <select
                      value={chapterAiLanguage}
                      onChange={(e) => setChapterAiLanguage(e.target.value as any)}
                      className="hidden sm:block px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-[11px] text-slate-700 cursor-pointer"
                    >
                      <option value="bilingual">Bilingual</option>
                      <option value="odia">ଓଡ଼ିଆ (Odia)</option>
                      <option value="english">English</option>
                    </select>

                    {/* Send Button */}
                    <button
                      type="button"
                      onClick={() => handleSendChapterChatMessage()}
                      disabled={isGeneratingChapterAi || (!chapterChatInput.trim() && chapterChatAttachments.length === 0)}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>ପଠାନ୍ତୁ</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DUPLICATE QUESTIONS SCANNER & AUDIT */}
      {/* ========================================================================= */}
      {isDuplicateScannerOpen && selectedChapter && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-odia font-bold text-base text-slate-900 leading-tight">
                    🔍 ପ୍ରଶ୍ନ ଡୁପ୍ଲିକେଟ୍ ଯାଞ୍ଚ (Duplicate Scanner)
                  </h3>
                  <p className="font-odia text-xs text-slate-500 mt-0.5">
                    {selectedChapter.nameOdia || selectedChapter.name} • ସମୁଦାୟ {questions.length} ଟି ପ୍ରଶ୍ନ ସ୍କାନ୍ ହୋଇଛି
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDuplicateScannerOpen(false)}
                className="p-2 rounded-2xl hover:bg-white text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {duplicateScanResults.length === 0 ? (
                <div className="text-center py-8 px-4 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h4 className="font-odia font-bold text-lg text-emerald-900">
                    🎉 କୌଣସି ଡୁପ୍ଲିକେଟ୍ ମିଳିଲା ନାହିଁ! (100% Unique)
                  </h4>
                  <p className="font-odia text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    ଏହି ଅଧ୍ୟାୟରେ ଥିବା ସମସ୍ତ <b>{questions.length} ଟି ପ୍ରଶ୍ନ</b> ପରସ୍ପର ଠାରୁ ସମ୍ପୂର୍ଣ୍ଣ ଅନନ୍ୟ ଏବଂ ଭିନ୍ନ ଅଟନ୍ତି। କୌଣସି ପ୍ରଶ୍ନ ରିପିଟ୍ ହୋଇନାହିଁ।
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      ସମସ୍ତ {questions.length} ଟି ପ୍ରଶ୍ନ ଯାଞ୍ଚିତ ଓ ସୁରକ୍ଷିତ
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">
                        ⚠️ ଏହି ଅଧ୍ୟାୟରେ {duplicateScanResults.length} ଯୋଡ଼ା ସମ୍ଭାବ୍ୟ ଡୁପ୍ଲିକେଟ୍ ପ୍ରଶ୍ନ ମିଳିଛି!
                      </p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        ଦୟାକରି ତଳେ ତୁଳନା କରନ୍ତୁ ଏବଂ ଅନାବଶ୍ୟକ ଥିବା ଦ୍ୱିତୀୟ ପ୍ରଶ୍ନକୁ ଡିଲିଟ୍ କରିପାରିବେ:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {duplicateScanResults.map((dup, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-amber-200/90 bg-amber-50/20 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                            ଡୁପ୍ଲିକେଟ୍ ଯୋଡ଼ି #{idx + 1} ({dup.matchType === 'exact' ? 'ହୁବହୁ ସମାନ (Exact)' : 'ସାମଞ୍ଜସ୍ୟ (Partial)'})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteDuplicateFromScan(dup.itemB.id)}
                            className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="ଦ୍ୱିତୀୟ ପ୍ରଶ୍ନଟିକୁ ହଟାନ୍ତୁ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ପ୍ରଶ୍ନ #{dup.indexB} ହଟାନ୍ତୁ</span>
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          {/* Item A */}
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              ପ୍ରଥମ ପ୍ରଶ୍ନ (Original - #{dup.indexA})
                            </span>
                            <p className="font-odia font-semibold text-slate-800">
                              {dup.itemA.question}
                            </p>
                          </div>

                          {/* Item B */}
                          <div className="p-2.5 rounded-xl bg-white border border-amber-300 space-y-1">
                            <span className="text-[10px] font-bold text-amber-700 uppercase">
                              ରିପିଟ୍ ହୋଇଥିବା ପ୍ରଶ୍ନ (Duplicate - #{dup.indexB})
                            </span>
                            <p className="font-odia font-semibold text-slate-800">
                              {dup.itemB.question}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
              <button
                type="button"
                onClick={handleOpenDuplicateScanner}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>ପୁନର୍ବାର ଯାଞ୍ଚ (Re-Scan)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDuplicateScannerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                ବନ୍ଦ କରନ୍ତୁ (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
