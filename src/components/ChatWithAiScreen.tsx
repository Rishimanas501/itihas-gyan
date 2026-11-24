import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Trash2,
  Copy,
  Check,
  RotateCw,
  Square,
  Plus,
  BookOpen,
  MapPin,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  X,
  Languages,
  Maximize2,
  FileQuestion,
  GraduationCap,
  Download,
  Share2,
  Compass,
  ArrowRight,
  ArrowLeft,
  ClipboardList,
  Key,
  Edit3
} from 'lucide-react';
import { db } from '../db';
import type { 
  ChatConversation, 
  ChatMessage, 
  ChatAttachment, 
  AiModelInfo, 
  HistoryEra, 
  ExamAnswerFormat,
  Question,
  Paper,
  Chapter
} from '../types';
import { 
  AI_MODELS, 
  getModelInfo, 
  canModelHandleImages, 
  processSelectedFile, 
  extractFilesFromClipboard, 
  extractFilesFromDrop, 
  sendChatMessage 
} from '../services/chatAiService';
import { parseAndConvertPastedText } from '../services/aiGenerator';

// Formatted Message Renderer: Bold, Organized, Distinctly Coloured Headings, Options & Badges
const renderFormattedInlineText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-slate-800 font-medium">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-pink-700 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const FormattedMessageView: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 text-slate-800 text-sm leading-relaxed select-text">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // 1. Heading 3 (###) -> Bold colored title banner
        if (trimmed.startsWith('### ')) {
          return (
            <div
              key={idx}
              className="mt-3.5 mb-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border-l-4 border-blue-600 text-blue-950 font-bold text-base shadow-2xs flex items-center gap-2"
            >
              <span>{trimmed.replace(/^###\s*/, '')}</span>
            </div>
          );
        }

        // 2. Subheading 4 (####) -> Distinctive Purple accent banner
        if (trimmed.startsWith('#### ')) {
          return (
            <div
              key={idx}
              className="mt-2.5 mb-1.5 px-3 py-1.5 rounded-lg bg-purple-50/80 border-l-3 border-purple-600 text-purple-950 font-bold text-sm shadow-2xs flex items-center gap-2"
            >
              <span>{trimmed.replace(/^####\s*/, '')}</span>
            </div>
          );
        }

        // 3. Horizontal Rule (---)
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="border-t border-slate-200 my-2.5" />;
        }

        // 4. MCQ Answer line: Ans: / ଉତ୍ତର: / Answer: -> Green badge
        if (/^(?:Ans(?:wer)?|ଉତ୍ତର|ସଠିକ୍\s*ଉତ୍ତର|Correct\s*Answer)[\:\-\=]/i.test(trimmed)) {
          return (
            <div
              key={idx}
              className="my-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs"
            >
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">✓</span>
              <span>{renderFormattedInlineText(trimmed)}</span>
            </div>
          );
        }

        // 5. MCQ Explanation line: Exp: / ବ୍ୟାଖ୍ୟା: / Explanation: -> Amber info card
        if (/^(?:Exp(?:lanation)?|ବ୍ୟାଖ୍ୟା|Reason|ତଥ୍ୟ)[\:\-\=]/i.test(trimmed)) {
          return (
            <div
              key={idx}
              className="my-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950 text-xs sm:text-sm leading-normal flex items-start gap-2 shadow-2xs"
            >
              <span className="text-amber-600 font-bold shrink-0 mt-0.5">💡</span>
              <span className="flex-1">{renderFormattedInlineText(trimmed)}</span>
            </div>
          );
        }

        // 6. MCQ Options: (A), (B), (C), (D) or (କ), (ଖ), (ଗ), (ଘ)
        if (/^\((?:[A-D]|[a-d]|[କ-ଘ]|[1-4])\)/.test(trimmed) || /^[A-D]\.\s+/.test(trimmed)) {
          return (
            <div
              key={idx}
              className="my-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 text-slate-800 text-xs sm:text-sm font-medium transition-all shadow-2xs"
            >
              {renderFormattedInlineText(trimmed)}
            </div>
          );
        }

        // 7. Question number: "1. ...", "୧. ...", "Q1:" -> Bold question
        if (/^(?:(?:\d+|[୧-୯]+)[\.\)]|(?:Q(?:uestion)?\s*[\d୧-୯]+[\:\.]))\s+/.test(trimmed)) {
          return (
            <div
              key={idx}
              className="mt-3 mb-1.5 font-bold text-slate-900 text-sm sm:text-[15px] flex items-start gap-2"
            >
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold shrink-0 mt-0.5">
                {trimmed.match(/^(?:(?:\d+|[୧-୯]+)[\.\)]|(?:Q(?:uestion)?\s*[\d୧-୯]+[\:\.]))/)?.[0] || '•'}
              </span>
              <span className="flex-1">
                {renderFormattedInlineText(trimmed.replace(/^(?:(?:\d+|[୧-୯]+)[\.\)]|(?:Q(?:uestion)?\s*[\d୧-୯]+[\:\.]))\s*/, ''))}
              </span>
            </div>
          );
        }

        // 8. Bullet points (* or -)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 my-1 pl-1 text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
              <span className="flex-1">{renderFormattedInlineText(trimmed.slice(2))}</span>
            </div>
          );
        }

        // 9. Standard paragraphs
        return (
          <p key={idx} className="text-slate-800 text-sm leading-relaxed my-0.5">
            {renderFormattedInlineText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

interface ChatWithAiScreenProps {
  onBack: () => void;
  geminiApiKey?: string;
  openaiApiKey?: string;
  defaultLanguage?: 'odia' | 'english' | 'bilingual';
  onNavigateToBank?: () => void;
  onNavigateToMaps?: () => void;
  onNavigateToSettings?: () => void;
  onStartQuizWithQuestions?: (questions: Question[]) => void;
  chapterContext?: {
    paperId?: string;
    chapterId?: string;
    paperName?: string;
    chapterName?: string;
  } | null;
  onReturnToChapter?: (pastedText?: string) => void;
}

export const ChatWithAiScreen: React.FC<ChatWithAiScreenProps> = ({
  onBack,
  geminiApiKey,
  openaiApiKey,
  defaultLanguage = 'bilingual',
  onNavigateToBank,
  onNavigateToMaps,
  onNavigateToSettings,
  onStartQuizWithQuestions,
  chapterContext,
  onReturnToChapter
}) => {
  // Active conversation state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  
  // Model & History Mode configurations
  const [selectedModel, setSelectedModel] = useState<string>('existing-history-nlp');
  const [selectedEra, setSelectedEra] = useState<HistoryEra>('all');
  const [selectedFormat, setSelectedFormat] = useState<ExamAnswerFormat | undefined>(undefined);
  const [targetLang, setTargetLang] = useState<'odia' | 'english' | 'hindi' | 'bilingual'>(
    defaultLanguage === 'odia' ? 'odia' : defaultLanguage === 'english' ? 'english' : 'bilingual'
  );

  // UI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Message Editing State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Integration Modal
  const [availablePapers, setAvailablePapers] = useState<Paper[]>([]);
  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([]);
  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    type: 'question_bank' | 'notes';
    content: string;
    parsedQuestions?: Question[];
    targetPaperId?: string;
    targetChapterId?: string;
  } | null>(null);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Initialize Conversations from Dexie DB
  useEffect(() => {
    loadSavedConversations();
  }, []);

  const loadSavedConversations = async () => {
    try {
      const convList = await db.conversations.orderBy('updatedAt').reverse().toArray();
      setConversations(convList);

      if (convList.length > 0) {
        // Load the most recent conversation
        loadConversation(convList[0].id);
      } else {
        // Create initial default conversation
        startNewConversation();
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      startNewConversation();
    }
  };

  const loadConversation = async (convId: string) => {
    try {
      setActiveConversationId(convId);
      const msgs = await db.chatMessages.where('conversationId').equals(convId).sortBy('timestamp');
      
      // Load attachments for each message
      const loadedMessages: ChatMessage[] = await Promise.all(
        msgs.map(async (msg) => {
          const atts = await db.chatAttachments.where('messageId').equals(msg.id).toArray();
          return { ...msg, attachments: atts };
        })
      );

      setMessages(loadedMessages);
      const conv = await db.conversations.get(convId);
      if (conv) {
        setSelectedModel(conv.model || 'existing-history-nlp');
      }
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  };

  const startNewConversation = async () => {
    const newId = 'conv_' + Date.now();
    const now = new Date().toISOString();
    const newConv: ChatConversation = {
      id: newId,
      title: 'ନୂତନ ଆଲୋଚନା (New Chat)',
      provider: getModelInfo(selectedModel).provider,
      model: selectedModel,
      historyMode: selectedEra,
      createdAt: now,
      updatedAt: now
    };

    await db.conversations.put(newConv);
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    setMessages([]);
    setPendingAttachments([]);
    setInputText('');
    setIsHistoryDrawerOpen(false);

    // Initial greeting message
    const welcomeMsg: ChatMessage = {
      id: 'msg_welcome_' + Date.now(),
      conversationId: newId,
      role: 'assistant',
      content: `ନମସ୍କାର! ମୁଁ **ଇତିହାସ ଜ୍ଞାନ (ITIHASH GYAN) AI ସହାୟକ**।

ମୁଁ ଆପଣଙ୍କୁ ଓଡ଼ିଶା ଇତିହାସ, ଭାରତ ଇତିହାସ ଏବଂ ବିଶ୍ୱ ସଭ୍ୟତା ସମ୍ପର୍କରେ ଶିକ୍ଷାଦାନ, ଗବେଷଣା ଏବଂ ପରୀକ୍ଷା ପ୍ରସ୍ତୁତିରେ ସାହାଯ୍ୟ କରିପାରିବି:

- 📷 **ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ:** ଯେକୌଣସି ଐତିହାସିକ ଚିତ୍ର, ମାନଚିତ୍ର କିମ୍ବା ମନ୍ଦିର ଭାସ୍କର୍ଯ୍ୟ ବିଶ୍ଳେଷଣ କରନ୍ତୁ।
- 📋 **Ctrl + V ଦ୍ୱାରା Paste:** କମ୍ପ୍ୟୁଟରରୁ ସିଧାସଳଖ ଫଟୋ କପି କରି ଏଠାରେ Paste କରନ୍ତୁ।
- 📝 **ପ୍ରଶ୍ନପତ୍ର ସମାଧାନ:** ପ୍ରଶ୍ନପତ୍ରର ଫଟୋ ଅପଲୋଡ୍ କରି ସଠିକ୍ ଉତ୍ତର ଓ ମଡେଲ୍ ଆନସର୍ ପାଆନ୍ତୁ।
- 🎯 **୧, ୨, ୫ ଓ ୮ ମାର୍କ ନୋଟ୍ସ:** ପରୀକ୍ଷା ଫର୍ମାଟ୍ ଅନୁଯାୟୀ ଓଡ଼ିଆ କିମ୍ବା English ରେ ଉତ୍ତର ପ୍ରସ୍ତୁତ କରନ୍ତୁ।

କୌଣସି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ କିମ୍ବା ତଳେ ଥିବା ବଟନ୍ ଦ୍ୱାରା ଏକ ଫଟୋ ସଂଲଗ୍ନ କରନ୍ତୁ!`,
      timestamp: now,
      provider: 'existing',
      model: selectedModel
    };

    await db.chatMessages.put(welcomeMsg);
    setMessages([welcomeMsg]);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('ଆପଣ ଏହି ଆଲୋଚନାକୁ ଡିଲିଟ୍ କରିବାକୁ ନିଶ୍ଚିତ କି? (Delete this chat?)')) return;

    try {
      await db.conversations.delete(convId);
      await db.chatMessages.where('conversationId').equals(convId).delete();
      await db.chatAttachments.where('conversationId').equals(convId).delete();

      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);

      if (activeConversationId === convId) {
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          startNewConversation();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 2. Clipboard Paste Handler (Ctrl + V)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = extractFilesFromClipboard(e);
    if (files.length > 0) {
      e.preventDefault();
      for (const file of files) {
        await handleAttachFile(file);
      }
      showStatus('success', 'ଚିତ୍ରଟି ସଫଳତାର ସହ କ୍ଲିପବୋର୍ଡରୁ ଯୋଡ଼ାଗଲା (Image attached from clipboard)!');
    }
  };

  // 3. Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = extractFilesFromDrop(e);
    if (files.length > 0) {
      for (const file of files) {
        await handleAttachFile(file);
      }
      showStatus('success', `${files.length} ଟି ଫାଇଲ୍ ସଂଲଗ୍ନ ହେଲା (Files attached)!`);
    }
  };

  // File Attach Handler
  const handleAttachFile = async (file: File) => {
    try {
      const result = await processSelectedFile(file, activeConversationId, 'pending');
      setPendingAttachments((prev) => [...prev, result.attachment]);
      if (result.warning) {
        showStatus('info', result.warning);
      }
    } catch (err: any) {
      showStatus('error', err.message || 'ଫାଇଲ୍ ସଂଲଗ୍ନ ହୋଇପାରିଲା ନାହିଁ।');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await handleAttachFile(files[i]);
      }
      e.target.value = '';
    }
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const showStatus = (type: 'info' | 'error' | 'success', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 4. Send Message Execution
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!content && pendingAttachments.length === 0) return;
    if (isGenerating) return;

    // Vision model compatibility check
    const modelInfo = getModelInfo(selectedModel);
    const hasImages = pendingAttachments.some((a) => a.type === 'image');
    if (hasImages && !canModelHandleImages(selectedModel)) {
      showStatus(
        'error',
        `ନିର୍ବାଚିତ ମଡେଲ୍ (${selectedModel}) ଚିତ୍ର ବିଶ୍ଳେଷଣ ସମର୍ଥନ କରେ ନାହିଁ। ଦୟାକରି Gemini କିମ୍ବା GPT-4o ବ୍ୟବହାର କରନ୍ତୁ।`
      );
      return;
    }

    // Check API Key availability for external providers
    if (modelInfo.provider === 'gemini' && (!geminiApiKey || geminiApiKey.trim().length < 8)) {
      showStatus(
        'error',
        'Google Gemini API Key ଅନୁପଲବ୍ଧ। ଦୟାକରି Settings ରେ Gemini API Key ସେଭ୍ କରନ୍ତୁ, କିମ୍ବା "Existing AI" ଚୟନ କରନ୍ତୁ।'
      );
      return;
    }
    if (modelInfo.provider === 'openai' && (!openaiApiKey || openaiApiKey.trim().length < 8)) {
      showStatus(
        'error',
        'OpenAI ChatGPT API Key ଅନୁପଲବ୍ଧ। ଦୟାକରି Settings ରେ OpenAI API Key ସେଭ୍ କରନ୍ତୁ, କିମ୍ବା "Existing AI" ଚୟନ କରନ୍ତୁ।'
      );
      return;
    }

    const now = new Date().toISOString();
    const userMsgId = 'msg_u_' + Date.now();
    const currentAttachments = [...pendingAttachments];

    // Create user message
    const userMsg: ChatMessage = {
      id: userMsgId,
      conversationId: activeConversationId,
      role: 'user',
      content: content || (hasImages ? 'ଦୟାକରି ଏହି ଚିତ୍ରଟିକୁ ବିଶ୍ଳେଷଣ କରି ବୁଝାନ୍ତୁ (Please analyze this attached image).' : 'ଦୟାକରି ସଂଲଗ୍ନ ଫାଇଲ୍ ବିଶ୍ଳେଷଣ କରନ୍ତୁ।'),
      timestamp: now,
      attachments: currentAttachments
    };

    // Save user message and its attachments to Dexie
    await db.chatMessages.put(userMsg);
    for (const att of currentAttachments) {
      await db.chatAttachments.put({
        ...att,
        conversationId: activeConversationId,
        messageId: userMsgId
      });
    }

    // Auto-update conversation title if it's the first user message
    const isFirstUserMsg = messages.filter((m) => m.role === 'user').length === 0;
    if (isFirstUserMsg) {
      const titleCandidate = content.slice(0, 35) || (hasImages ? 'ଚିତ୍ର ବିଶ୍ଳେଷଣ (Image Analysis)' : 'ଐତିହାସିକ ଆଲୋଚନା');
      await db.conversations.update(activeConversationId, {
        title: titleCandidate,
        updatedAt: now,
        model: selectedModel,
        provider: modelInfo.provider
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversationId ? { ...c, title: titleCandidate, updatedAt: now } : c))
      );
    } else {
      await db.conversations.update(activeConversationId, { updatedAt: now });
    }

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setPendingAttachments([]);
    setIsGenerating(true);
    scrollToBottom();

    // Prepare assistant placeholder
    const assistantMsgId = 'msg_a_' + Date.now();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const responseText = await sendChatMessage({
        conversationId: activeConversationId,
        messages: [...messages, userMsg],
        currentInput: userMsg.content,
        attachments: currentAttachments,
        provider: modelInfo.provider,
        model: selectedModel,
        geminiApiKey,
        openaiApiKey,
        historyEra: selectedEra,
        examFormat: selectedFormat,
        targetLanguage: targetLang,
        signal: abortController.signal
      });

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        conversationId: activeConversationId,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        provider: modelInfo.provider,
        model: selectedModel,
        historyTeacherTopic: selectedEra
      };

      await db.chatMessages.put(assistantMsg);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showStatus('info', 'ଉତ୍ତର ପ୍ରସ୍ତୁତି ବନ୍ଦ କରାଗଲା (Generation stopped).');
      } else {
        console.error('Chat error:', err);
        const errorMsg: ChatMessage = {
          id: assistantMsgId,
          conversationId: activeConversationId,
          role: 'assistant',
          content: `⚠️ **ତ୍ରୁଟି ଘଟିଲା (Error encountered):**\n\n${err.message || 'AI ସହ ସଂଯୋଗ ହୋଇପାରିଲା ନାହିଁ।'}\n\n*ପରାମର୍ଶ:* ଆପଣ Settings ରେ ଯାଇ Gemini/OpenAI API Key ଯାଞ୍ଚ କରିପାରିବେ କିମ୍ବା "Existing AI (Offline)" ଚୟନ କରିପାରିବେ।`,
          timestamp: new Date().toISOString(),
          isError: true,
          provider: modelInfo.provider,
          model: selectedModel
        };
        await db.chatMessages.put(errorMsg);
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      scrollToBottom();
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Edit Message Handlers
  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveAndResubmit = async (messageId: string, newContent: string) => {
    const trimmed = newContent.trim();
    if (!trimmed || isGenerating) return;

    setEditingMessageId(null);

    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const originalMsg = messages[msgIndex];
    const updatedUserMsg: ChatMessage = {
      ...originalMsg,
      content: trimmed,
      timestamp: new Date().toISOString()
    };

    // 1. Update in database
    await db.chatMessages.put(updatedUserMsg);

    // 2. Delete all subsequent assistant / user messages after this message from DB
    const subsequentMessages = messages.slice(msgIndex + 1);
    for (const sub of subsequentMessages) {
      await db.chatMessages.delete(sub.id);
    }

    const previousHistory = messages.slice(0, msgIndex);
    const updatedHistory = [...previousHistory, updatedUserMsg];
    setMessages(updatedHistory);
    setIsGenerating(true);
    scrollToBottom();

    // 3. Re-generate AI response with the updated query
    const modelInfo = getModelInfo(selectedModel);
    const assistantMsgId = 'msg_a_' + Date.now();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const responseText = await sendChatMessage({
        conversationId: activeConversationId,
        messages: updatedHistory,
        currentInput: trimmed,
        attachments: updatedUserMsg.attachments || [],
        provider: modelInfo.provider,
        model: selectedModel,
        geminiApiKey,
        openaiApiKey,
        historyEra: selectedEra,
        examFormat: selectedFormat,
        targetLanguage: targetLang,
        signal: abortController.signal
      });

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        conversationId: activeConversationId,
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        provider: modelInfo.provider,
        model: selectedModel,
        historyTeacherTopic: selectedEra
      };

      await db.chatMessages.put(assistantMsg);
      setMessages([...updatedHistory, assistantMsg]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showStatus('info', 'ଉତ୍ତର ପ୍ରସ୍ତୁତି ବନ୍ଦ କରାଗଲା।');
      } else {
        const errorMsg: ChatMessage = {
          id: assistantMsgId,
          conversationId: activeConversationId,
          role: 'assistant',
          content: `⚠️ **ତ୍ରୁଟି ଘଟିଲା (Error encountered):**\n\n${err.message || 'AI ସହ ସଂଯୋଗ ହୋଇପାରିଲା ନାହିଁ।'}`,
          timestamp: new Date().toISOString(),
          isError: true
        };
        await db.chatMessages.put(errorMsg);
        setMessages([...updatedHistory, errorMsg]);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      scrollToBottom();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('ଏହି ମେସେଜ୍‌ଟିକୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହାନ୍ତି କି? (Delete this message?)')) return;
    try {
      await db.chatMessages.delete(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      showStatus('info', 'ମେସେଜ୍ ଡିଲିଟ୍ ହେଲା (Message deleted).');
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Response Transform Action
  const handleTransformAction = (actionPrompt: string) => {
    handleSendMessage(actionPrompt);
  };

  // Send content to Question Bank
  const handleOpenTransferToQuestionBank = async (content: string) => {
    try {
      const papers = await db.papers.toArray();
      const chapters = await db.chapters.toArray();
      setAvailablePapers(papers);
      setAvailableChapters(chapters);

      // Pre-select the chapter if user navigated from Question Bank
      const defaultPaper = (chapterContext?.paperId && papers.some(p => p.id === chapterContext.paperId))
        ? chapterContext.paperId
        : papers[0]?.id || '';
      const matchingChaps = chapters.filter((c) => c.paperId === defaultPaper);
      const defaultChap = (chapterContext?.chapterId && chapters.some(c => c.id === chapterContext.chapterId))
        ? chapterContext.chapterId
        : matchingChaps[0]?.id || chapters[0]?.id || '';

      const chosenPaper = papers.find((p) => p.id === defaultPaper);
      const chosenChap = chapters.find((c) => c.id === defaultChap);

      const parsed = parseAndConvertPastedText(content, {
        paperId: defaultPaper,
        chapterId: defaultChap,
        subject: chosenPaper?.subject || chosenPaper?.name || 'History of India',
        paper: chosenPaper?.name || 'History of India',
        topic: chosenChap?.name || 'Sources of History',
        language: 'bilingual'
      });

      setTransferModal({
        isOpen: true,
        type: 'question_bank',
        content,
        parsedQuestions: parsed,
        targetPaperId: defaultPaper,
        targetChapterId: defaultChap
      });
    } catch (err) {
      console.error('Error opening transfer modal:', err);
    }
  };

  const handleConfirmSaveToQuestionBank = async () => {
    if (!transferModal?.parsedQuestions || transferModal.parsedQuestions.length === 0) {
      showStatus('error', 'ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କରେ ସେଭ୍ କରିବା ପାଇଁ କୌଣସି ପ୍ରଶ୍ନ ଚିହ୍ନଟ ହୋଇପାରିଲା ନାହିଁ।');
      return;
    }

    const chosenPaper = availablePapers.find((p) => p.id === transferModal.targetPaperId);
    const chosenChap = availableChapters.find((c) => c.id === transferModal.targetChapterId);
    const now = new Date().toISOString();

    try {
      for (const q of transferModal.parsedQuestions) {
        await db.questions.add({
          ...q,
          paperId: transferModal.targetPaperId || chosenPaper?.id || '',
          chapterId: transferModal.targetChapterId || chosenChap?.id || '',
          paper: chosenPaper?.name || q.paper || 'History',
          subject: chosenPaper?.subject || chosenPaper?.name || q.subject || 'History',
          topic: chosenChap?.name || q.topic || 'General',
          department: chosenPaper?.department || 'History',
          semester: chosenPaper?.semester || '1st Semester',
          approved: true,
          createdAt: now,
          updatedAt: now
        } as any);
      }
      showStatus('success', `${transferModal.parsedQuestions.length} ଟି ପ୍ରଶ୍ନ ସଫଳତାର ସହ "${chosenChap?.nameOdia || chosenChap?.name || 'Question Bank'}" ରେ ସଂରକ୍ଷିତ ହେଲା!`);
      setTransferModal(null);

      // If arrived from a chapter, auto return after a brief toast
      if (chapterContext && onReturnToChapter) {
        setTimeout(() => {
          onReturnToChapter();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to add to question bank:', err);
      showStatus('error', 'ପ୍ରଶ୍ନ ସେଭ୍ କରିବାରେ ତ୍ରୁଟି ଘଟିଲା।');
    }
  };

  return (
    <div 
      className="flex h-[calc(100vh-65px)] w-full bg-[#f4f7fb] overflow-hidden select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-600/20 backdrop-blur-xs border-4 border-dashed border-blue-500 flex flex-col items-center justify-center pointer-events-none">
          <div className="p-6 rounded-3xl bg-white shadow-2xl flex flex-col items-center gap-3">
            <ImageIcon className="w-12 h-12 text-blue-600 animate-bounce" />
            <h3 className="font-odia font-bold text-lg text-slate-900">
              ଫଟୋ କିମ୍ବା ଡକ୍ୟୁମେଣ୍ଟ ଏଠାରେ ଛାଡ଼ନ୍ତୁ (Drop Files Here)
            </h3>
            <p className="text-xs text-slate-500">
              JPG, PNG, WEBP, PDF, କିମ୍ବା TXT ଫାଇଲ୍ ସମର୍ଥିତ
            </p>
          </div>
        </div>
      )}

      {/* 1. LEFT SIDEBAR: CONVERSATION HISTORY DRAWER */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-80 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 md:relative md:translate-x-0 ${
          isHistoryDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={startNewConversation}
            className="flex-1 mr-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ନୂତନ ଚାଟ୍ (New Chat)</span>
          </button>

          <button
            onClick={() => setIsHistoryDrawerOpen(false)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            ପୂର୍ବ ଆଲୋଚନା (Chat History)
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              କୌଣସି ପୂର୍ବ ଆଲୋଚନା ନାହିଁ
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    loadConversation(conv.id);
                    setIsHistoryDrawerOpen(false);
                  }}
                  className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="truncate">{conv.title}</span>
                  </div>

                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 transition-all ml-1 shrink-0"
                    title="ଡିଲିଟ୍ କରନ୍ତୁ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Model Badge Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="truncate font-semibold text-slate-300">
              {getModelInfo(selectedModel).name.split('(')[0]}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
            {getModelInfo(selectedModel).provider}
          </span>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {isHistoryDrawerOpen && (
        <div
          onClick={() => setIsHistoryDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* 2. MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Control Bar: Model, History Era, Exam Format, Language & Mobile History Trigger */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200/90 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile History Toggle */}
            <button
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              title="Chat History"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* AI Model Selector */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  const info = getModelInfo(e.target.value);
                  if (activeConversationId) {
                    db.conversations.update(activeConversationId, {
                      model: e.target.value,
                      provider: info.provider
                    });
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px] sm:max-w-[280px] truncate"
              >
                <optgroup label="1. Existing AI (Offline & Built-in - No Key Needed)">
                  {AI_MODELS.filter(m => m.provider === 'existing').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} 📷
                    </option>
                  ))}
                </optgroup>
                <optgroup label="2. Google Gemini (Official Multimodal API)">
                  {AI_MODELS.filter(m => m.provider === 'gemini').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} 📷
                    </option>
                  ))}
                </optgroup>
                <optgroup label="3. OpenAI ChatGPT (Official Multimodal API)">
                  {AI_MODELS.filter(m => m.provider === 'openai').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.supportsVision ? '📷' : '📝'}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Provider Key Status Pill & Direct Settings Shortcut */}
            {getModelInfo(selectedModel).provider === 'existing' ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Existing AI (Offline Active)</span>
              </span>
            ) : getModelInfo(selectedModel).provider === 'gemini' ? (
              geminiApiKey && geminiApiKey.trim().length >= 8 ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Gemini Key Active ⚡</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                  title="Google Gemini Key missing. Click to open Settings and configure."
                >
                  <Key className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Gemini Key Missing (Settings ⚙️)</span>
                </button>
              )
            ) : (
              openaiApiKey && openaiApiKey.trim().length >= 8 ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>ChatGPT Key Active ⚡</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
                  title="OpenAI ChatGPT Key missing. Click to open Settings and configure."
                >
                  <Key className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>OpenAI Key Missing (Settings ⚙️)</span>
                </button>
              )
            )}

            {/* History Era Selector */}
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value as HistoryEra)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer focus:outline-none hidden sm:block"
            >
              <option value="all">ସମସ୍ତ ଇତିହାସ (All Eras)</option>
              <option value="odisha_history">ଓଡ଼ିଶା ଇତିହାସ (Odisha History)</option>
              <option value="ancient_india">ପ୍ରାଚୀନ ଭାରତ (Ancient India)</option>
              <option value="medieval_india">ମଧ୍ୟଯୁଗୀୟ ଭାରତ (Medieval India)</option>
              <option value="modern_india">ଆଧୁନିକ ଭାରତ (Modern India)</option>
              <option value="world_history">ବିଶ୍ୱ ଇତିହାସ (World History)</option>
            </select>

            {/* Exam Format Selector */}
            <select
              value={selectedFormat || ''}
              onChange={(e) => setSelectedFormat((e.target.value as ExamAnswerFormat) || undefined)}
              className="px-2.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700 hover:bg-purple-100 cursor-pointer focus:outline-none hidden lg:block"
            >
              <option value="">ପରୀକ୍ଷା ଫର୍ମାଟ୍ (Normal Chat)</option>
              <option value="1-mark">୧-ମାର୍କ (Very Short)</option>
              <option value="2-mark">୨-ମାର୍କ (50-75 Words)</option>
              <option value="5-mark">୫-ମାର୍କ (200-250 Words)</option>
              <option value="8-mark">୮-ମାର୍କ (700-800 Words)</option>
              <option value="notes">ନୋଟ୍ସ (Study Notes)</option>
              <option value="mcqs">MCQ ପ୍ରଶ୍ନୋତ୍ତର (5 MCQs)</option>
              <option value="mindmap">ମାଇଣ୍ଡ-ମ୍ୟାପ୍ (Mind Map)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setTargetLang('odia')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  targetLang === 'odia' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ଓଡ଼ିଆ
              </button>
              <button
                onClick={() => setTargetLang('english')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  targetLang === 'english' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setTargetLang('bilingual')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  targetLang === 'bilingual' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ଦ୍ୱିଭାଷୀ
              </button>
            </div>

            {/* Clear Chat Button */}
            <button
              onClick={() => {
                if (confirm('ଏହି ଆଲୋଚନାର ସମସ୍ତ ମେସେଜ୍ ସଫା କରିବାକୁ ଚାହାନ୍ତି କି? (Clear messages?)')) {
                  db.chatMessages.where('conversationId').equals(activeConversationId).delete();
                  setMessages([]);
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              title="Clear Messages"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linked Chapter Return Banner (if arrived from Question Bank Chapter) */}
        {chapterContext && (
          <div className="bg-gradient-to-r from-purple-100/90 via-indigo-50 to-amber-50/70 border-b border-purple-200/90 px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs z-10 shrink-0 animate-in slide-in-from-top-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                🏛️
              </span>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-purple-700 font-bold flex items-center gap-1.5">
                  <span>ଅଧ୍ୟାୟରୁ ସଂଯୋଜିତ (Active Chapter Link)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="font-odia font-bold text-xs text-slate-900 truncate">
                  {chapterContext.chapterName} • <span className="text-slate-600 font-normal">{chapterContext.paperName}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onReturnToChapter?.()}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer shrink-0 active:scale-95"
              title="Return directly to this chapter in Question Bank"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>⬅️ ଅଧ୍ୟାୟକୁ ଫେରନ୍ତୁ (Back to Chapter)</span>
            </button>
          </div>
        )}

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`absolute top-14 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl text-xs font-bold shadow-lg animate-in fade-in flex items-center gap-2 ${
              statusMessage.type === 'error'
                ? 'bg-rose-600 text-white'
                : statusMessage.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-white'
            }`}
          >
            {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Conversation Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-2 max-w-[88%] sm:max-w-[80%] ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Attached Images / Documents rendered above/inside bubble */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs"
                        >
                          {att.type === 'image' ? (
                            <img
                              src={att.dataUrl}
                              alt={att.name}
                              onClick={() => setFullscreenImage(att.dataUrl)}
                              className="h-32 sm:h-44 w-auto object-cover rounded-2xl cursor-pointer hover:scale-102 transition-transform"
                            />
                          ) : (
                            <div className="p-3 flex items-center gap-2 bg-slate-50 text-slate-700 text-xs font-semibold">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="max-w-[150px] truncate">{att.name}</span>
                              <span className="text-[10px] text-slate-400">({Math.round(att.size / 1024)} KB)</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Bubble or Inline Editor */}
                  {isUser && editingMessageId === msg.id ? (
                    <div className="w-full min-w-[280px] sm:min-w-[420px] max-w-2xl bg-white p-3.5 rounded-2xl border-2 border-blue-500 shadow-lg">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[85px] leading-relaxed"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2 mt-2.5">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          ବାତିଲ୍ (Cancel)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveAndResubmit(msg.id, editingText)}
                          disabled={!editingText.trim() || isGenerating}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>ସେଭ୍ ଓ ପଚାରନ୍ତୁ (Save & Submit)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`p-4 sm:p-5 rounded-3xl text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs whitespace-pre-wrap'
                          : msg.isError
                          ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-xs whitespace-pre-wrap'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                      }`}
                    >
                      {isUser || msg.isError ? (
                        msg.content
                      ) : (
                        <FormattedMessageView content={msg.content} />
                      )}
                    </div>
                  )}

                  {/* User Message Action Bar (Edit, Copy, Delete) */}
                  {isUser && editingMessageId !== msg.id && (
                    <div className="flex items-center gap-1.5 pt-0.5 text-slate-400 opacity-90 hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(msg)}
                        className="px-2 py-0.5 rounded-lg hover:bg-slate-200/70 border border-transparent hover:border-slate-300 text-[11px] font-semibold text-slate-600 flex items-center gap-1 cursor-pointer transition-all"
                        title="Edit this question and resubmit"
                      >
                        <Edit3 className="w-3 h-3 text-blue-600" />
                        <span>ସମ୍ପାଦନ (Edit)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="px-2 py-0.5 rounded-lg hover:bg-slate-200/70 border border-transparent hover:border-slate-300 text-[11px] font-semibold text-slate-600 flex items-center gap-1 cursor-pointer transition-all"
                        title="Copy text"
                      >
                        {copiedMessageId === msg.id ? (
                          <span className="text-emerald-600 font-bold">Copied</span>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer transition-all"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Assistant Actions Bar */}
                  {!isUser && !msg.isError && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-slate-500">
                      {/* Copy */}
                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                        title="Copy to clipboard"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Send to Question Bank */}
                      <button
                        onClick={() => handleOpenTransferToQuestionBank(msg.content)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                        title="Extract & Save questions to Question Bank"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Send to Question Bank</span>
                      </button>

                      {/* Direct Paste & Return to Chapter */}
                      {chapterContext && onReturnToChapter && (
                        <button
                          type="button"
                          onClick={() => onReturnToChapter(msg.content)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
                          title={`Directly paste to ${chapterContext.chapterName} and return`}
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>📥 ଅଧ୍ୟାୟରେ ପେଷ୍ଟ୍ କରନ୍ତୁ & ଫେରନ୍ତୁ (Paste & Return)</span>
                        </button>
                      )}

                      {/* Odia Translation */}
                      <button
                        onClick={() => handleTransformAction('ଏହି ଉତ୍ତରକୁ ସମ୍ପୂର୍ଣ୍ଣ ଓଡ଼ିଆ ଭାଷାରେ ବୁଝାନ୍ତୁ (Explain in pure Odia).')}
                        className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
                      >
                        ଓଡ଼ିଆରେ ବ୍ୟାଖ୍ୟା
                      </button>

                      {/* Simplify */}
                      <button
                        onClick={() => handleTransformAction('ଏହି ଉତ୍ତରକୁ ଆହୁରି ସରଳ ଭାଷାରେ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ ବୁଝାନ୍ତୁ (Simplify this explanation for students).')}
                        className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
                      >
                        ସରଳ କରନ୍ତୁ
                      </button>

                      {/* Generate MCQs */}
                      <button
                        onClick={() => handleTransformAction('ଏହି ପ୍ରସଙ୍ଗରୁ ୫ଟି ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ MCQ ପ୍ରଶ୍ନ ଓ ଉତ୍ତର ପ୍ରସ୍ତୁତ କରନ୍ତୁ (Generate 5 MCQs with options and answers).')}
                        className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[11px] font-bold text-purple-700 cursor-pointer"
                      >
                        MCQ ପ୍ରସ୍ତୁତି
                      </button>

                      {/* Convert to Mind Map */}
                      <button
                        onClick={() => handleTransformAction('ଏହି ବିଷୟବସ୍ତୁକୁ ଏକ ସ୍ପଷ୍ଟ Mind Map ଫର୍ମାଟ୍ ରେ ସଜାନ୍ତୁ (Convert into Mind Map format).')}
                        className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-bold text-amber-800 cursor-pointer"
                      >
                        Mind Map
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    User
                  </div>
                )}
              </div>
            );
          })}

          {/* Live Generating Animation */}
          {isGenerating && (
            <div className="flex gap-3 max-w-4xl mx-auto items-start">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-3xl bg-white border border-slate-200 text-slate-500 text-xs flex items-center gap-3 shadow-xs">
                <div className="flex space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span>ଐତିହାସିକ ତଥ୍ୟ ବିଶ୍ଳେଷଣ ଚାଲିଛି (Analyzing history & visual sources)...</span>
                <button
                  onClick={handleStopGenerating}
                  className="ml-2 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer border border-rose-200"
                >
                  <Square className="w-3 h-3 fill-rose-700" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. INPUT AREA & CONTROLS */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shadow-lg shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Pending Attachments Preview (Shows thumbnail, remove button, filename) */}
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase px-1">
                  ସଂଲଗ୍ନ ଚିତ୍ର / ଫାଇଲ୍:
                </span>
                {pendingAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs group"
                  >
                    {att.type === 'image' ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-600" />
                    )}
                    <span className="text-xs font-semibold text-slate-700 max-w-[130px] truncate">
                      {att.name}
                    </span>
                    <button
                      onClick={() => removePendingAttachment(att.id)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Box Shell */}
            <div className="flex items-end gap-2 bg-slate-50 rounded-2xl border-2 border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition-all p-2 shadow-2xs">
              {/* Attachment Triggers */}
              <div className="flex items-center gap-1 pb-1">
                {/* Image Upload Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Upload Image (JPG, PNG, WEBP)"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {/* Document Upload Trigger */}
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Attach Document (PDF, TXT, DOCX)"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx,.doc,.csv"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Textarea Input (Auto-resizes & handles paste directly) */}
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder="ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ, କିମ୍ବା Ctrl + V ଦ୍ୱାରା ଫଟୋ paste କରନ୍ତୁ (Ask or Paste Image)..."
                className="flex-1 bg-transparent border-0 focus:outline-none text-sm text-slate-900 resize-none py-2 px-1 max-h-36 placeholder:text-slate-400 font-sans leading-relaxed"
              />

              {/* Send or Stop Button */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGenerating}
                  className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                  title="Stop Generating"
                >
                  <Square className="w-4 h-4 fill-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() && pendingAttachments.length === 0}
                  className={`p-2.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer ${
                    inputText.trim() || pendingAttachments.length > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Send Message (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Hint footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>
                💡 <strong>ଟିପ୍ପଣୀ:</strong> କମ୍ପ୍ୟୁଟରରୁ ଯେକୌଣସି ଫଟୋ କପି କରି ଏଠାରେ ସିଧାସଳଖ <strong>Ctrl + V</strong> ଦବାନ୍ତୁ।
              </span>
              <span className="hidden sm:inline font-mono text-[10px]">
                Shift + Enter for new line • Enter to send
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FULLSCREEN IMAGE MODAL */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={fullscreenImage}
              alt="Historical Visual Fullscreen"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-slate-900 shadow-xl hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. TRANSFER TO QUESTION BANK MODAL */}
      {transferModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-odia font-bold text-lg text-slate-900">
                  Question Bank ରେ ପ୍ରଶ୍ନ ଯୋଡ଼ନ୍ତୁ (Save to Question Bank)
                </h3>
              </div>
              <button
                onClick={() => setTransferModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Target Paper & Chapter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ପେପର୍ ଚୟନ କରନ୍ତୁ (Select Paper):</label>
                <select
                  value={transferModal.targetPaperId || ''}
                  onChange={(e) => {
                    const newPaperId = e.target.value;
                    const matching = availableChapters.filter((c) => c.paperId === newPaperId);
                    setTransferModal({
                      ...transferModal,
                      targetPaperId: newPaperId,
                      targetChapterId: matching[0]?.id || ''
                    });
                  }}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {availablePapers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameOdia || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ଅଧ୍ୟାୟ ଚୟନ କରନ୍ତୁ (Select Chapter):</label>
                <select
                  value={transferModal.targetChapterId || ''}
                  onChange={(e) => {
                    setTransferModal({
                      ...transferModal,
                      targetChapterId: e.target.value
                    });
                  }}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {availableChapters
                    .filter((c) => !transferModal.targetPaperId || c.paperId === transferModal.targetPaperId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameOdia || c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <p className="text-slate-600 font-semibold">
                ଚିହ୍ନଟ ହୋଇଥିବା ପ୍ରଶ୍ନ ସଂଖ୍ୟା: <strong>{transferModal.parsedQuestions?.length || 0}</strong>
              </p>

              {transferModal.parsedQuestions?.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{q.question}</span>
                  </div>
                  {q.options && (
                    <div className="grid grid-cols-2 gap-1 pl-6 text-slate-600">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="truncate">• {opt}</div>
                      ))}
                    </div>
                  )}
                  <div className="pl-6 text-emerald-700 font-semibold">
                    ସଠିକ୍ ଉତ୍ତର: {q.correctAnswer}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferModal(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                ବାତିଲ୍ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveToQuestionBank}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ନିଶ୍ଚିତ କରନ୍ତୁ ଓ ସେଭ୍ କରନ୍ତୁ (Confirm & Save)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
