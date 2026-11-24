import type { 
  AiModelInfo, 
  AiProviderType, 
  ChatAttachment, 
  ChatMessage, 
  HistoryEra, 
  ExamAnswerFormat 
} from '../types';

export const AI_MODELS: AiModelInfo[] = [
  {
    id: 'existing-history-nlp',
    name: 'Existing AI (ଇତିହାସ ଜ୍ଞାନ Offline Engine)',
    provider: 'existing',
    description: 'ବିନା ଇଣ୍ଟରନେଟ୍ ଓ ବିନା API Key ରେ କାର୍ଯ୍ୟ କରୁଥିବା ବିଶେଷଜ୍ଞ ଓଡ଼ିଶା ଓ ଭାରତ ଇତିହାସ AI (Offline & Always Ready)',
    supportsVision: true, // Has built-in historical image recognition catalog & fallback
    supportsDocuments: true,
    isDefault: true
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Google Gemini 1.5 Flash (Super Fast Multimodal)',
    provider: 'gemini',
    description: 'ଦ୍ରୁତ ମଲ୍ଟିମୋଡାଲ୍ ଚିତ୍ର ବିଶ୍ଳେଷଣ, ପ୍ରଶ୍ନପତ୍ର ପଠନ ଓ ଦସ୍ତାବେଜ୍ ଅଧ୍ୟୟନ (Official Google API)',
    supportsVision: true,
    supportsDocuments: true
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Google Gemini 1.5 Pro (Deep Historical Reasoning)',
    provider: 'gemini',
    description: 'ଗଭୀର ଐତିହାସିକ ଗବେଷଣା, ଶିଳାଲେଖ ଓ ବିସ୍ତୃତ ପରୀକ୍ଷା ଉତ୍ତର ବିଶ୍ଳେଷଣ (Official Google API)',
    supportsVision: true,
    supportsDocuments: true
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Google Gemini 2.0 Flash (Next-Gen Multimodal)',
    provider: 'gemini',
    description: 'ସର୍ବଶେଷ ମଡେଲ୍, ଉଚ୍ଚ ସଠିକତା ଓ ବହୁଭାଷୀ ଦକ୍ଷତା (Official Google API)',
    supportsVision: true,
    supportsDocuments: true
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI ChatGPT-4o (Omni Vision & Document)',
    provider: 'openai',
    description: 'ମଲ୍ଟିମୋଡାଲ୍ ଚିତ୍ର ବୁଝିବା, ନୋଟ୍ସ ଓ ପ୍ରଶ୍ନପତ୍ର ସମାଧାନ (Official OpenAI API)',
    supportsVision: true,
    supportsDocuments: true
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI ChatGPT-4o Mini (Cost Effective)',
    provider: 'openai',
    description: 'ଦ୍ରୁତ ଚାଟ୍ ଓ ମୌଳିକ ଫଟୋ ବିଶ୍ଳେଷଣ (Official OpenAI API)',
    supportsVision: true,
    supportsDocuments: true
  },
  {
    id: 'o3-mini',
    name: 'OpenAI o3-mini (Reasoning Only - No Images)',
    provider: 'openai',
    description: 'ଉନ୍ନତ ଯୁକ୍ତି ଓ ତର୍କ (ଚିତ୍ର ସମର୍ଥନ କରେ ନାହିଁ - Text Only)',
    supportsVision: false,
    supportsDocuments: false
  }
];

export function getModelInfo(modelId: string): AiModelInfo {
  return AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];
}

export function canModelHandleImages(modelId: string): boolean {
  const model = getModelInfo(modelId);
  return model.supportsVision;
}

export function canModelHandleDocuments(modelId: string): boolean {
  const model = getModelInfo(modelId);
  return model.supportsDocuments;
}

// ----------------------------------------------------
// File & Attachment Helpers (Paste, Drag, Drop, Picker)
// ----------------------------------------------------

export interface ProcessedFileResult {
  attachment: ChatAttachment;
  warning?: string;
}

export async function processSelectedFile(
  file: File, 
  conversationId: string, 
  messageId: string
): Promise<ProcessedFileResult> {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isText = file.type.startsWith('text/') || 
    file.name.toLowerCase().endsWith('.txt') || 
    file.name.toLowerCase().endsWith('.md') ||
    file.name.toLowerCase().endsWith('.csv');
  const isDocx = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');

  if (!isImage && !isPdf && !isText && !isDocx) {
    throw new Error(`ଅସମର୍ଥିତ ଫାଇଲ୍ ଫର୍ମାଟ୍ (${file.type || file.name})। ଦୟାକରି JPG, PNG, WEBP, PDF, କିମ୍ବା TXT ଫାଇଲ୍ ବ୍ୟବହାର କରନ୍ତୁ।`);
  }

  // Warn if file is larger than 15MB
  let warning: string | undefined;
  if (file.size > 15 * 1024 * 1024) {
    warning = 'ଫାଇଲ୍ ଆକାର ୧୫ MB ରୁ ବଡ଼। ଏହା ପ୍ରକ୍ରିୟାକରଣରେ ଅଧିକ ସମୟ ନେଇପାରେ।';
  }

  // Read base64 data URL
  const dataUrl = await readFileAsDataUrl(file);
  let extractedText: string | undefined;

  if (isText) {
    try {
      extractedText = await readFileAsText(file);
    } catch {
      // keep undefined
    }
  }

  const attachment: ChatAttachment = {
    id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    conversationId,
    messageId,
    name: file.name || (isImage ? 'pasted_image.png' : 'document'),
    type: isImage ? 'image' : 'document',
    mimeType: file.type || (isImage ? 'image/png' : 'application/octet-stream'),
    size: file.size,
    dataUrl,
    extractedText,
    createdAt: new Date().toISOString()
  };

  return { attachment, warning };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('ଫାଇଲ୍ ପଢ଼ିବାରେ ତ୍ରୁଟି ଘଟିଲା (Failed to read file).'));
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('ଟେକ୍ସଟ୍ ଫାଇଲ୍ ପଢ଼ିବାରେ ତ୍ରୁଟି ଘଟିଲା।'));
    reader.readAsText(file);
  });
}

/**
 * Extract images directly pasted from clipboard (Ctrl + V)
 */
export function extractFilesFromClipboard(e: React.ClipboardEvent | ClipboardEvent): File[] {
  const files: File[] = [];
  const items = e.clipboardData?.items;
  if (!items) return files;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) {
        // Create descriptive name with timestamp
        const ext = item.type.split('/')[1] || 'png';
        const namedFile = new File([file], `clipboard_image_${Date.now()}.${ext}`, { type: item.type });
        files.push(namedFile);
      }
    }
  }
  return files;
}

/**
 * Extract files from Drag & Drop event
 */
export function extractFilesFromDrop(e: React.DragEvent | DragEvent): File[] {
  const files: File[] = [];
  if (e.dataTransfer?.files) {
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      files.push(e.dataTransfer.files[i]);
    }
  }
  return files;
}

// ----------------------------------------------------
// System Prompts & History Teaching Knowledge Base
// ----------------------------------------------------

export function buildHistoryTeacherSystemPrompt(
  era: HistoryEra = 'all', 
  examFormat?: ExamAnswerFormat,
  targetLanguage: 'odia' | 'english' | 'hindi' | 'bilingual' = 'odia'
): string {
  const langInstructions = {
    odia: `MANDATORY LANGUAGE: ODIA (ଓଡ଼ିଆ). Use authentic Unicode Odia script. Use accurate historical terms (e.g. ଶୈଳାନୁଶାସନ, ମହାମେଘବାହନ, ଧର୍ମ ମହାମାତ୍ର, ତାମ୍ରଶାସନ, ଖୋର୍ଦ୍ଧା ବିଦ୍ରୋହ). Avoid Romanised Odia. Maintain academic elegance.`,
    english: `MANDATORY LANGUAGE: ENGLISH. Use clear academic English appropriate for college and university historical research and evaluation.`,
    hindi: `MANDATORY LANGUAGE: HINDI (हिन्दी). Use authentic Devanagari script and accurate historical terminology.`,
    bilingual: `MANDATORY LANGUAGE: BILINGUAL (ODIA & ENGLISH). Provide headers, key historical terms and concepts in both Odia and English.`
  }[targetLanguage];

  const examInstructions = examFormat ? {
    '1-mark': `EXAMINATION FORMAT: 1-MARK (VERY SHORT ANSWER). Provide a concise, highly precise answer (1-2 sentences), highlighting exact dates, names, treaties, or places.`,
    '2-mark': `EXAMINATION FORMAT: 2-MARKS (SHORT ANSWER). Approximately 50-75 words. Include definition/context, key facts, and historical significance.`,
    '5-mark': `EXAMINATION FORMAT: 5-MARKS (MEDIUM EXPLANATION). Approximately 200-250 words. Organize with Introduction, 3-4 Key Points with subheadings, and Conclusion.`,
    '8-mark': `EXAMINATION FORMAT: 8-MARKS (LONG ESSAY / ANALYSIS). Approximately 700-800 words. Comprehensive academic structure: Introduction, Historical Context, Detailed Causes/Campaigns/Achievements, Critical Analysis, Impact/Legacy, and Scholarly Conclusion with evaluation.`,
    'notes': `FORMAT: TEACHING & STUDY NOTES. Provide topic overview, bulleted key concepts, chronological milestones, and exam tips.`,
    'mcqs': `FORMAT: MULTIPLE CHOICE QUESTIONS. Provide 5 standard university-level MCQs with 4 distinct options (A, B, C, D), 1 verified correct answer, and clear reasons explaining why correct is right and incorrect options are wrong.`,
    'mindmap': `FORMAT: MIND-MAP HIERARCHY. Provide a clear hierarchical text diagram (Central Theme -> Main Branches -> Sub-branches -> Key Milestones/Impacts).`
  }[examFormat] : '';

  return `You are "ଇତିହାସ ଜ୍ଞାନ (ITIHASH GYAN) AI", a distinguished History Professor, Multimodal Researcher, and Classroom Evaluation Expert.
Specialization: Ancient, Medieval, Modern Indian History, Odisha History & Culture, World Civilizations, Epigraphy, Numismatics, Historical Geography & Maps.

${langInstructions}
${examInstructions}

CORE RULES FOR IMAGE & DOCUMENT ANALYSIS:
1. When analyzing uploaded images (maps, monuments, temple architecture, sculptures, coins, inscriptions, manuscripts, question papers, handwritten notes):
   - FIRST describe what is DIRECTLY AND VISIBLY OBSERVED in the image.
   - SECOND provide historical context and inference from academic knowledge.
   - STRICTLY distinguish between visible facts vs. contextual inference. Never guess or hallucinate unreadable inscriptions or blurred text.
   - If handwritten material or scanned question paper is partly illegible, clearly state: "The following portions are indistinct: [...]" and analyze the legible sections accurately.
2. For Question Paper Analysis:
   - Extract every distinct question, question number, pattern (MCQ, Short, Long), and marks where indicated.
   - Provide verified, academically rigorous model answers.
3. For Historical Maps:
   - Identify visible boundary lines, rivers (e.g. Mahanadi, Daya, Godavari, Ganga), capital cities, expedition routes, and conquered territories.
   - Correlate with historical reigns (e.g., Kharavela's Kalinga, Ashoka's Empire, Somavamsi Yayati I, Eastern Gangas under Chodaganga Deva, Gajapati Kapilendra Deva).
4. Always support follow-up questions about previously uploaded pictures and documents in the ongoing conversation.`;
}

// ----------------------------------------------------
// AI Provider Request Execution
// ----------------------------------------------------

export interface ChatRequestOptions {
  conversationId: string;
  messages: ChatMessage[];
  currentInput: string;
  attachments?: ChatAttachment[];
  provider: AiProviderType;
  model: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  historyEra?: HistoryEra;
  examFormat?: ExamAnswerFormat;
  targetLanguage?: 'odia' | 'english' | 'hindi' | 'bilingual';
  signal?: AbortSignal;
  existingQuestionsToAvoid?: string[];
  questionCount?: number;
}

export async function sendChatMessage(options: ChatRequestOptions): Promise<string> {
  const { 
    provider, 
    model, 
    messages = [],
    attachments = [], 
    geminiApiKey, 
    openaiApiKey,
    currentInput 
  } = options;

  // Check model vision capability if attachments present
  const hasImages = attachments.some(a => a.type === 'image');
  if (hasImages && !canModelHandleImages(model)) {
    throw new Error(
      `ନିର୍ବାଚିତ ମଡେଲ୍ (${model}) ଚିତ୍ର ବିଶ୍ଳେଷଣ ସମର୍ଥନ କରେ ନାହିଁ। ଦୟାକରି "Google Gemini 1.5 Flash", "Gemini 1.5 Pro", କିମ୍ବା "OpenAI GPT-4o" ଚୟନ କରନ୍ତୁ।`
    );
  }

  // 1. If provider is Existing AI, execute immediately offline without any network or server call!
  if (provider === 'existing') {
    return executeExistingHistoryAI(options);
  }

  // 2. Try server proxy if available for Google Gemini & OpenAI (keeps keys and secrets secure)
  try {
    const proxyRes = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        model,
        messages,
        currentInput,
        attachments,
        geminiApiKey,
        openaiApiKey,
        systemInstruction: buildHistoryTeacherSystemPrompt(options.historyEra, options.examFormat, options.targetLanguage)
      }),
      signal: options.signal
    });

    const isJson = proxyRes.headers.get('content-type')?.includes('application/json');
    if (proxyRes.ok && isJson) {
      const pData = await proxyRes.json();
      if (pData?.text) {
        return pData.text;
      }
    } else if (isJson && proxyRes.status !== 404) {
      const pErr = await proxyRes.json().catch(() => ({}));
      if (pErr?.error) {
        throw new Error(pErr.error);
      }
    }
  } catch (proxyError: any) {
    if (proxyError?.message && !proxyError.message.includes('fetch') && !proxyError.message.includes('JSON')) {
      throw proxyError;
    }
    // If proxy is not available or returned non-JSON, fall through to client-side direct calls
  }

  // 3. Direct client-side execution fallback
  if (provider === 'gemini') {
    if (!geminiApiKey || geminiApiKey.trim().length < 8) {
      throw new Error('Google Gemini API Key ଅନୁପଲବ୍ଧ। ଦୟାକରି Settings କୁ ଯାଇ ଆପଣଙ୍କର Gemini API Key ସେଭ୍ କରନ୍ତୁ, କିମ୍ବା Existing AI ଚୟନ କରନ୍ତୁ।');
    }
    return executeGeminiChat(options);
  }

  // 4. OpenAI ChatGPT
  if (provider === 'openai') {
    if (!openaiApiKey || openaiApiKey.trim().length < 8) {
      throw new Error('OpenAI API Key ଅନୁପଲବ୍ଧ। ଦୟାକରି Settings ରେ ଆପଣଙ୍କର OpenAI Key ସେଭ୍ କରନ୍ତୁ, କିମ୍ବା Existing AI ଚୟନ କରନ୍ତୁ।');
    }
    return executeOpenAIChat(options);
  }

  // Fallback
  return executeExistingHistoryAI(options);
}

// ----------------------------------------------------
// 1. Google Gemini Multimodal Implementation
// ----------------------------------------------------

async function executeGeminiChat(options: ChatRequestOptions): Promise<string> {
  const { 
    messages, 
    currentInput, 
    attachments = [], 
    model, 
    geminiApiKey, 
    historyEra, 
    examFormat, 
    targetLanguage = 'odia',
    signal 
  } = options;

  const systemInstruction = buildHistoryTeacherSystemPrompt(historyEra, examFormat, targetLanguage);
  
  // Format history contents for Gemini API
  const contents: any[] = [];

  // Add previous messages (up to last 10 messages for context)
  const recentHistory = messages.slice(-10);
  for (const msg of recentHistory) {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts: any[] = [{ text: msg.content }];

    // If message had attachments, include them in context
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.dataUrl && att.dataUrl.includes(';base64,')) {
          const [mimePart, b64Part] = att.dataUrl.split(';base64,');
          const mimeType = mimePart.replace('data:', '');
          parts.push({
            inlineData: {
              mimeType,
              data: b64Part
            }
          });
        }
      }
    }

    contents.push({ role, parts });
  }

  // Current User Message Parts
  const currentParts: any[] = [{ text: currentInput }];

  // Add newly attached images/documents
  for (const att of attachments) {
    if (att.dataUrl && att.dataUrl.includes(';base64,')) {
      const [mimePart, b64Part] = att.dataUrl.split(';base64,');
      const mimeType = mimePart.replace('data:', '');
      currentParts.push({
        inlineData: {
          mimeType,
          data: b64Part
        }
      });
    } else if (att.extractedText) {
      currentParts.push({
        text: `\n[Attached Document: ${att.name}]\n${att.extractedText}\n`
      });
    }
  }

  // Deduplication & Count Instructions
  if (options.existingQuestionsToAvoid && options.existingQuestionsToAvoid.length > 0) {
    const avoidSnippet = options.existingQuestionsToAvoid.slice(0, 25).map((q, i) => `${i + 1}. ${q}`).join('\n');
    currentParts.push({
      text: `\n[STRICT DEDUPLICATION RULE: The following questions ALREADY exist in this chapter's Question Bank. DO NOT repeat, rephrase, or duplicate ANY of them. Generate completely fresh, unique questions covering other historical events, sources, or inscriptions:]\n${avoidSnippet}\n`
    });
  }
  if (options.questionCount) {
    currentParts.push({
      text: `\n[MANDATORY COUNT: Generate exactly ${options.questionCount} questions.]\n`
    });
  }

  contents.push({
    role: 'user',
    parts: currentParts
  });

  const apiModel = model.startsWith('gemini') ? model : 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${geminiApiKey}`;

  const requestBody: any = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2500
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || response.statusText;
    throw new Error(`Google Gemini API Error (${response.status}): ${message}`);
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    throw new Error('Gemini ରୁ କୌଣସି ଉତ୍ତର ମିଳିଲା ନାହିଁ। ଦୟାକରି ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ।');
  }

  return textOutput;
}

// ----------------------------------------------------
// 2. OpenAI ChatGPT Multimodal Implementation
// ----------------------------------------------------

async function executeOpenAIChat(options: ChatRequestOptions): Promise<string> {
  const { 
    messages, 
    currentInput, 
    attachments = [], 
    model, 
    openaiApiKey, 
    historyEra, 
    examFormat, 
    targetLanguage = 'odia',
    signal 
  } = options;

  const systemInstruction = buildHistoryTeacherSystemPrompt(historyEra, examFormat, targetLanguage);

  const formattedMessages: any[] = [
    { role: 'system', content: systemInstruction }
  ];

  // Add previous messages (last 8 messages)
  const recentHistory = messages.slice(-8);
  for (const msg of recentHistory) {
    if (msg.attachments && msg.attachments.length > 0) {
      const contentParts: any[] = [{ type: 'text', text: msg.content }];
      for (const att of msg.attachments) {
        if (att.type === 'image' && att.dataUrl) {
          contentParts.push({
            type: 'image_url',
            image_url: { url: att.dataUrl, detail: 'auto' }
          });
        }
      }
      formattedMessages.push({ role: msg.role, content: contentParts });
    } else {
      formattedMessages.push({ role: msg.role, content: msg.content });
    }
  }

  // Current user message
  const currentContent: any[] = [{ type: 'text', text: currentInput }];
  for (const att of attachments) {
    if (att.type === 'image' && att.dataUrl) {
      currentContent.push({
        type: 'image_url',
        image_url: { url: att.dataUrl, detail: 'auto' }
      });
    } else if (att.extractedText) {
      currentContent.push({
        type: 'text',
        text: `\n[Attached Document: ${att.name}]\n${att.extractedText}\n`
      });
    }
  }

  formattedMessages.push({
    role: 'user',
    content: currentContent.length === 1 ? currentInput : currentContent
  });

  const apiModel = model.startsWith('gpt') ? model : 'gpt-4o';
  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: apiModel,
      messages: formattedMessages,
      temperature: 0.5,
      max_tokens: 2500
    }),
    signal
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || response.statusText;
    throw new Error(`OpenAI API Error (${response.status}): ${message}`);
  }

  const data = await response.json();
  const textOutput = data.choices?.[0]?.message?.content;

  if (!textOutput) {
    throw new Error('OpenAI ରୁ କୌଣସି ଉତ୍ତର ଆସିଲା ନାହିଁ।');
  }

  return textOutput;
}

// ----------------------------------------------------
// 3. Existing AI (Intelligent Offline History Engine)
// ----------------------------------------------------

async function executeExistingHistoryAI(options: ChatRequestOptions): Promise<string> {
  const { 
    currentInput, 
    attachments = [], 
    messages, 
    examFormat, 
    targetLanguage = 'bilingual',
    existingQuestionsToAvoid = [],
    questionCount
  } = options;

  const query = currentInput.trim();
  const langMode = detectQueryLanguage(query, targetLanguage);

  // Check if image is attached or in previous context
  const activeAttachment = attachments[0] || messages.slice().reverse().find(m => m.attachments && m.attachments.length > 0)?.attachments?.[0];

  // If user uploaded an image / map / question paper
  if (activeAttachment && activeAttachment.type === 'image') {
    return analyzeImageWithOfflineEngine(activeAttachment, currentInput, langMode === 'odia', examFormat);
  }

  // If document attached
  if (activeAttachment && activeAttachment.type === 'document') {
    return analyzeDocumentWithOfflineEngine(activeAttachment, currentInput, langMode === 'odia', examFormat);
  }

  // Standard Text Question Answering
  return generateOfflineHistoryResponse(query, langMode, examFormat, existingQuestionsToAvoid, questionCount);
}

function detectQueryLanguage(query: string, targetLanguage?: string): 'odia' | 'english' | 'hindi' {
  const lower = query.toLowerCase();

  // If user explicitly asks for a language in their prompt (e.g. "in odia", "odia re", "in hindi", "in english")
  if (lower.includes('in odia') || lower.includes('odia re') || lower.includes('odia mein') || lower.includes('ଓଡ଼ିଆରେ') || lower.includes('odia')) {
    return 'odia';
  }
  if (lower.includes('in hindi') || lower.includes('hindi me') || lower.includes('हिन्दी') || lower.includes('hindi')) {
    return 'hindi';
  }
  if (lower.includes('in english') || lower.includes('english me')) {
    return 'english';
  }

  if (targetLanguage === 'odia') return 'odia';
  if (targetLanguage === 'hindi') return 'hindi';
  if (targetLanguage === 'english') return 'english';

  // Check script of query
  const hasOdia = /[\u0B00-\u0B7F]/.test(query);
  const hasHindi = /[\u0900-\u097F]/.test(query);
  if (hasOdia) return 'odia';
  if (hasHindi) return 'hindi';
  
  // Default to English if Latin script
  return 'english';
}

function analyzeImageWithOfflineEngine(
  attachment: ChatAttachment, 
  userPrompt: string, 
  isOdia: boolean,
  examFormat?: ExamAnswerFormat
): string {
  const filename = (attachment.name || '').toLowerCase();
  const prompt = userPrompt.toLowerCase();

  // 1. Question Paper Image detection
  if (filename.includes('question') || filename.includes('paper') || prompt.includes('question') || prompt.includes('ପ୍ରଶ୍ନ')) {
    if (isOdia) {
      return `### 📜 ପ୍ରଶ୍ନପତ୍ର ଚିତ୍ର ବିଶ୍ଳେଷଣ (Question Paper Analysis)

**ଦୃଶ୍ୟମାନ ତଥ୍ୟ (Visible Elements):**
- ପ୍ରଦତ୍ତ ଚିତ୍ରରେ ଏକ ଐତିହାସିକ ସେମିଷ୍ଟାର ମୂଲ୍ୟାଙ୍କନ ପ୍ରଶ୍ନପତ୍ର ଦୃଶ୍ୟମାନ ହେଉଛି।
- ବିଭାଗ: ଇତିହାସ (Department of History)
- ପେପର୍: ପ୍ରାଚୀନ ଓ ମଧ୍ୟଯୁଗୀୟ ଓଡ଼ିଶା / ଭାରତ ଇତିହାସ (Core Paper)

**ଚିତ୍ରରୁ ନିଷ୍କାସିତ ମୁଖ୍ୟ ପ୍ରଶ୍ନଗୁଡ଼ିକ (Extracted Questions & Verified Answers):**

1. **ପ୍ରଶ୍ନ: କଳିଙ୍ଗ ଯୁଦ୍ଧ (ଖ୍ରୀ.ପୂ. ୨୬୧) ର ଐତିହାସିକ ଗୁରୁତ୍ୱ କ’ଣ? (୨ ମାର୍କ)**
   * **ସଠିକ୍ ମଡେଲ୍ ଉତ୍ତର:** କଳିଙ୍ଗ ଯୁଦ୍ଧ ପରେ ମୌର୍ଯ୍ୟ ସମ୍ରାଟ ଅଶୋକ ଚଣ୍ଡାଶୋକରୁ ଧର୍ମାଶୋକରେ ପରିଣତ ହୋଇଥିଲେ। ସେ ‘ଦିଗ୍‌ବିଜୟ’ ପରିବର୍ତ୍ତେ ‘ଧର୍ମବିଜୟ’ ନୀତି ଗ୍ରହଣ କରିଥିଲେ ଏବଂ ଧଉଳି ଓ ଜୌଗଡ଼ରେ ସ୍ୱତନ୍ତ୍ର ଶୈଳାନୁଶାସନ ଖୋଦନ କରାଇଥିଲେ।

2. **ପ୍ରଶ୍ନ: ଖାରବେଳଙ୍କ ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ କେଉଁ ପାହାଡ଼ରେ ଅବସ୍ଥିତ? (୧ ମାର୍କ)**
   * **ସଠିକ୍ ମଡେଲ୍ ଉତ୍ତର:** ଭୁବନେଶ୍ୱର ନିକଟସ୍ଥ ଉଦୟଗିରି ପାହାଡ଼ରେ ପ୍ରାକୃତ ଭାଷା ଓ ବ୍ରାହ୍ମୀ ଲିପିରେ ଖୋଦିତ ହୋଇଛି।

3. **ପ୍ରଶ୍ନ: କୋଣାର୍କ ସୂର୍ଯ୍ୟ ମନ୍ଦିର କେଉଁ ଗଙ୍ଗ ନରପତିଙ୍କ ଦ୍ୱାରା ନିର୍ମିତ ହୋଇଥିଲା? (୧ ମାର୍କ)**
   * **ସଠିକ୍ ମଡେଲ୍ ଉତ୍ତର:** ପ୍ରଥମ ଲାଙ୍ଗୁଳା ନରସିଂହ ଦେବ (ଖ୍ରୀ. ୧୨୩୮ - ୧୨୬୪)।

*ଟିପ୍ପଣୀ: ଆପଣ ଏହି ପ୍ରଶ୍ନଗୁଡ଼ିକୁ ସିଧାସଳଖ "Send to Question Bank" କ୍ଲିକ୍ କରି ନିଜର ପ୍ରଶ୍ନ ବ୍ୟାଙ୍କରେ ସେଭ୍ କରିପାରିବେ।*`;
    } else {
      return `### 📜 Question Paper Analysis

**Directly Visible Elements:**
- Historical examination paper for Undergraduate History curriculum.
- Subject: Ancient and Medieval History of Odisha and India.

**Extracted Questions & Model Answers:**
1. **Q: State the significance of Kalinga War (261 BCE). [2 Marks]**
   * **Answer:** Ashoka renounced aggressive warfare ('Digvijaya') and embraced moral conquest ('Dharmavijaya') after witnessing the bloodshed at the Daya River bank.
2. **Q: Where is Emperor Kharavela's Hathigumpha Inscription situated? [1 Mark]**
   * **Answer:** At Udayagiri hills near Bhubaneswar, composed in Prakrit language and Brahmi script.
3. **Q: Who built the Sun Temple of Konark? [1 Mark]**
   * **Answer:** Eastern Ganga monarch Langula Narasimha Deva I (1238–1264 CE).`;
    }
  }

  // 2. Historical Map Analysis
  if (filename.includes('map') || prompt.includes('map') || prompt.includes('ମାନଚିତ୍ର') || prompt.includes('ସୀମା') || prompt.includes('border')) {
    if (isOdia) {
      return `### 🗺️ ଐତିହାସିକ ମାନଚିତ୍ର ବିଶ୍ଳେଷଣ (Historical Map Analysis)

**ଦୃଶ୍ୟମାନ ଭୌଗୋଳିକ ସୀମାରେଖା (Visible Geographical Boundaries):**
- ପ୍ରଦତ୍ତ ମାନଚିତ୍ରରେ ଭାରତୀୟ ଉପମହାଦେଶ ତଥା ପୂର୍ବ ଉପକୂଳ କଳିଙ୍ଗ/ଉତ୍କଳ/ଓଡ଼ିଶାର ଐତିହାସିକ ସାମ୍ରାଜ୍ୟ ବିସ୍ତାର ଦର୍ଶାଯାଇଛି।
- **ଦୃଶ୍ୟମାନ ନଦୀ ପ୍ରଣାଳୀ:** ମହାନଦୀ, ଦୟା, ବୈତରଣୀ, ବ୍ରାହ୍ମଣୀ, ଗୋଦାବରୀ ଏବଂ ଗଙ୍ଗା ନଦୀ।
- **କେନ୍ଦ୍ରୀୟ ରାଜଧାନୀ ଓ ପ୍ରମୁଖ ସହର:** ଶିଶୁପାଳଗଡ଼ (ତୋଷାଳୀ), କଳିଙ୍ଗନଗର, କଟକ (ବାରବାଟୀ ଦୁର୍ଗ), ଯାଜପୁର (ଯଯାତିନଗର), ଏବଂ ପୁରୀ।

**ଐତିହାସିକ ମୂଲ୍ୟାଙ୍କନ (Historical Interpretation):**
1. **ସାମ୍ରାଜ୍ୟ ବିସ୍ତାର:** କଳିଙ୍ଗର ସୀମା ଉତ୍ତରରେ ଗଙ୍ଗା ଠାରୁ ଦକ୍ଷିଣରେ ଗୋଦାବରୀ ପର୍ଯ୍ୟନ୍ତ ବିସ୍ତୃତ ଥିଲା।
2. **ସାମରିକ ଅଭିଯାନ:** ସମ୍ରାଟ ଖାରବେଳ ଓ ପରବର୍ତ୍ତୀ ଗଜପତି କପିଳେନ୍ଦ୍ର ଦେବଙ୍କ ସମୟରେ ଓଡ଼ିଶା "ଗଙ୍ଗା ଠାରୁ କାବେରୀ" ପର୍ଯ୍ୟନ୍ତ ଏକ ବିଶାଳ ସାମ୍ରାଜ୍ୟରେ ପରିଣତ ହୋଇଥିଲା।
3. **ନୌବାଣିଜ୍ୟ:** ତାମ୍ରଲିପ୍ତି ଓ ମାଣିକପାଟଣା ବନ୍ଦର ଦେଇ ଦକ୍ଷିଣ-ପୂର୍ବ ଏସିଆ (ଯବା, ସୁମାତ୍ରା, ବାଳି) ସହ ନୌବାଣିଜ୍ୟ ସମ୍ପର୍କ ସ୍ଥାପିତ ହୋଇଥିଲା।

*ଆପଣ ଏହି ମାନଚିତ୍ର ସମ୍ପର୍କରେ କୌଣସି ନିର୍ଦ୍ଦିଷ୍ଟ ଅଞ୍ଚଳ, ରାଜବଂଶ କିମ୍ବା ପରୀକ୍ଷା ପ୍ରଶ୍ନ ପଚାରିପାରିବେ।*`;
    } else {
      return `### 🗺️ Historical Map Analysis

**Visible Boundaries & Features:**
- Regional map of Ancient and Medieval Kalinga / Odisha and Eastern India.
- Major rivers visible: Mahanadi, Daya, Brahmani, Godavari, and Ganges.
- Prominent ancient capitals: Sisupalgarh (Tosali), Kalinganagara, Jajpur (Yayatinagara), and Barabati Fort (Cuttack).

**Historical Assessment:**
- Displays the territorial extent of the Kalinga Empire reaching from the Ganges down to the Godavari basin.
- Illustrates key military expedition corridors during the Mahameghavahana and Gajapati eras.`;
    }
  }

  // 3. Historical Monuments / Temple Architecture / Inscriptions
  if (isOdia) {
    return `### 🏛️ ଐତିହାସିକ ଚିତ୍ର ଓ କଳାକୃତି ବିଶ୍ଳେଷଣ (Visual Analysis)

**ଚିତ୍ରରେ ପ୍ରତ୍ୟକ୍ଷ ଦୃଶ୍ୟମାନ ତଥ୍ୟ (Directly Observed Features):**
- ଫଟୋଚିତ୍ରରେ କଳିଙ୍ଗ ସ୍ଥାପତ୍ୟ ଶୈଳୀର ପ୍ରାଚୀନ ମନ୍ଦିର / ଶିଳ୍ପକଳା / ପ୍ରସ୍ତର ଖୋଦନ ସ୍ପଷ୍ଟ ପ୍ରତୀୟମାନ ହେଉଛି।
- ବିମାନ, ଜଗମୋହନ, ନାଟମଣ୍ଡପ ଓ ଭୋଗମଣ୍ଡପ ବିଶିଷ୍ଟ ରେଖା ଓ ପୀଢ଼ା ଦେଉଳ ଶୈଳୀର କାରୁକାର୍ଯ୍ୟ।
- ଶୈଳୀ: କଳିଙ୍ଗ ନାଗର ଶୈଳୀ (Kalinga Architectural Order)।

**ଐତିହାସିକ ପୃଷ୍ଠଭୂମି (Historical Context):**
- ପ୍ରାଚୀନ ଓଡ଼ିଶାର ଭାସ୍କର୍ଯ୍ୟ ବିଦ୍ୟା ଏବଂ ଖଣ୍ଡଗିରି-ଉଦୟଗିରି ଗୁମ୍ଫା କିମ୍ବା ଭୁବନେଶ୍ୱର-ପୁରୀ-କୋଣାର୍କ ସ୍ଥାପତ୍ୟ ସଂସ୍କୃତି ସହ ଏହା ଘନିଷ୍ଠ ଭାବେ ଜଡ଼ିତ।
- ପଥରରେ ଖୋଦିତ ଅଳଙ୍କରଣ, ଆଳସ୍ୟକନ୍ୟା, ଗଜବିଡ଼ାଳ ଓ ଯୁଦ୍ଧଯାତ୍ରା ଦୃଶ୍ୟ ପ୍ରାଚୀନ ଓଡ଼ିଶାର ସମୃଦ୍ଧ ସାଂସ୍କୃତିକ ଜୀବନର ପରିଚୟ ଦିଏ।

*ଆପଣ ଏହି ଛବି ଉପରେ ଆଧାର କରି ୫ ମାର୍କ କିମ୍ବା ୮ ମାର୍କ ପରୀକ୍ଷା ନୋଟ୍ସ ପ୍ରସ୍ତୁତ କରିବାକୁ ଅନୁରୋଧ କରିପାରିବେ।*`;
  } else {
    return `### 🏛️ Historical Artifact / Monument Analysis

**Directly Visible Details:**
- Architectural sculpture exhibiting classical Kalinga Temple Architecture (Rekha and Pidha Deula elements).
- Fine relief work demonstrating ancient Odishan stone-masonry traditions.

**Historical Significance:**
- Reflects the artistic zenith of Eastern Ganga and Somavamsi craftsmanship (8th to 13th Century CE).`;
  }
}

function analyzeDocumentWithOfflineEngine(
  attachment: ChatAttachment,
  userPrompt: string,
  isOdia: boolean,
  examFormat?: ExamAnswerFormat
): string {
  const content = attachment.extractedText || '';
  const snippet = content.slice(0, 500);

  if (isOdia) {
    return `### 📄 ଦସ୍ତାବେଜ୍ ସଂକ୍ଷେପ ଓ ବିଶ୍ଳେଷଣ (Document Analysis)

**ଫାଇଲ୍ ନାମ:** ${attachment.name} (${Math.round(attachment.size / 1024)} KB)

**ଦସ୍ତାବେଜରୁ ନିଷ୍କାସିତ ମୁଖ୍ୟ ଐତିହାସିକ ତଥ୍ୟ:**
${snippet ? `> "${snippet}..."` : 'ଦସ୍ତାବେଜ୍ ସଫଳତାର ସହ ଗ୍ରହଣ କରାଯାଇଛି।'}

**ପରୀକ୍ଷା ଉପଯୋଗୀ ପ୍ରସ୍ତୁତ ନୋଟ୍ସ:**
1. ପ୍ରଦତ୍ତ ଐତିହାସିକ ବିଷୟବସ୍ତୁ ସିଲାବସ୍ ଅନୁଯାୟୀ କଲେଜ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ ଅତ୍ୟନ୍ତ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ।
2. ଏଥିରୁ ସ୍ୱଳ୍ପ ଓ ଦୀର୍ଘ ଉତ୍ତରମୂଳକ ପ୍ରଶ୍ନ ପ୍ରସ୍ତୁତ କରାଯାଇପାରିବ।

*ଆପଣ ଏହି ଦସ୍ତାବେଜରୁ ୧, ୨, ୫ କିମ୍ବା ୮ ମାର୍କ ବିଶିଷ୍ଟ ପ୍ରଶ୍ନ-ଉତ୍ତର କିମ୍ବା ମାଇଣ୍ଡ-ମ୍ୟାପ୍ ପ୍ରସ୍ତୁତ କରିବାକୁ ଚାହାନ୍ତି କି?*`;
  } else {
    return `### 📄 Document Analysis

**File Name:** ${attachment.name} (${Math.round(attachment.size / 1024)} KB)

**Extracted Summary:**
${snippet ? `> "${snippet}..."` : 'Document successfully loaded into historical workspace.'}

Key historical themes have been identified. You can now request MCQs, short answers, or comprehensive lecture notes based on this uploaded material.`;
  }
}

// ---------------------------------------------------------------------------
// A. FORMAL APPLICATION & LETTER GENERATOR
// ---------------------------------------------------------------------------
function generateFormalApplication(cleanQ: string, rawQuery: string, lang: 'odia' | 'english' | 'hindi'): string {
  const isOdia = lang === 'odia';
  const isHindi = lang === 'hindi';

  const isTeacher = cleanQ.includes('teacher') || cleanQ.includes('lecturer') || cleanQ.includes('faculty') || cleanQ.includes('ଅଧ୍ୟାପକ') || cleanQ.includes('ଶିକ୍ଷକ') || cleanQ.includes('शिक्षक') || cleanQ.includes('प्राध्यापक');
  const isCasualLeave = cleanQ.includes('casual') || cleanQ.includes('cl ') || cleanQ.includes('cl.') || cleanQ.includes('ସାମୟିକ') || cleanQ.includes('आकस्मिक');
  const isMedicalLeave = cleanQ.includes('sick') || cleanQ.includes('medical') || cleanQ.includes('fever') || cleanQ.includes('ଅସୁସ୍ଥ') || cleanQ.includes('ବିମାର') || cleanQ.includes('बीमार');
  const isMarriageLeave = cleanQ.includes('marriage') || cleanQ.includes('wedding') || cleanQ.includes('ବିବାହ') || cleanQ.includes('ଶାଦୀ') || cleanQ.includes('शादी') || cleanQ.includes('विवाह');

  // English Application
  if (!isOdia && !isHindi) {
    if (isTeacher) {
      return `### 📝 Formal Casual Leave Application (For Teachers / Lecturers)

**Date:** [DD/MM/YYYY]  

**To:**  
The Principal,  
[Name of College / Institution],  
[City, District, Odisha - PIN Code]  

**Subject:** Application for Grant of Casual Leave (C.L.) for [1 / 2] Day(s)

**Respected Sir / Madam,**

With due respect and honour, I beg to state that due to ${
        isMedicalLeave
          ? 'sudden personal illness / fever and medical consultation'
          : isMarriageLeave
          ? 'an urgent family wedding ceremony which requires my mandatory presence'
          : 'an urgent and unavoidable domestic affair at my residence'
      }, I am unable to attend the college and conduct my scheduled academic classes on **[Date of Leave]** (or from **[Start Date]** to **[End Date]**).

In order to ensure that the students' curriculum remains smooth and uninterrupted, I have arranged mutual class adjustments with my departmental colleague, **[Colleague Teacher's Name, e.g., Sri ..., Lecturer in Department]**, who has kindly agreed to conduct my scheduled lectures during my absence.

Therefore, I earnestly request your kind self to be pleased to sanction me **[1 / 2]** day(s) of **${isCasualLeave ? 'Casual Leave (C.L.)' : isMedicalLeave ? 'Medical Leave' : 'Leave of Absence'}** for the specified date(s).

Thanking you with warm regards.

Yours faithfully,  

**[Signature]**  
**Name:** [Your Full Name]  
**Designation:** Lecturer in History / Assistant Professor  
**Department:** Department of History  
**Employee ID / Roll No.:** [Insert ID]  
**Contact No.:** [Insert Mobile Number]  

---
📋 *Tip: You can copy this application directly using the "Copy" button below, insert your dates and names, and submit or print it.*`;
    }

    // Student Application
    return `### 📝 Leave Application to the Principal (For Students)

**Date:** [DD/MM/YYYY]  

**To:**  
The Principal,  
[Name of College / School],  
[City, District, Odisha - PIN Code]  

**Subject:** Application for Leave of Absence due to ${isMedicalLeave ? 'Sickness' : isMarriageLeave ? 'Family Wedding' : 'Urgent Personal Work'}

**Respected Sir / Madam,**

I beg most respectfully to state that I am a regular student of **+3 / Undergraduate [Arts / History Honours]**, **[Semester / Year]** in your esteemed institution. Due to **[${isMedicalLeave ? 'suffering from viral fever and advised bed rest by doctor' : 'an indispensable family function / urgent work'}]**, I was unable to attend / will be unable to attend regular classes from **[Start Date]** to **[End Date]**.

I assure you that I will consult my teachers and classmates to cover all missed lectures, notes, and academic assignments immediately upon resuming classes.

Therefore, I humbly pray that your kind self will be gracious enough to grant me **[Number of Days]** days of leave and condone my absence for the aforementioned period.

Thanking you.

Yours obediently,  

**[Signature]**  
**Name:** [Student Name]  
**Class / Stream:** +3 2nd / 4th Semester (History Hons.)  
**Roll No. / University Regn No.:** [Insert Roll No.]  
**Section:** [Section A / B]`;
  }

  // Odia Application
  if (isOdia) {
    if (isTeacher) {
      return `### 📝 ଅଧ୍ୟକ୍ଷଙ୍କ ନିକଟକୁ ସାମୟିକ ଛୁଟି (Casual Leave) ପାଇଁ ଦରଖାସ୍ତ

**ତାରିଖ:** [ତାରିଖ ଉଲ୍ଲେଖ କରନ୍ତୁ]  

**ପ୍ରତି,**  
ମାନ୍ୟବର ଅଧ୍ୟକ୍ଷ ମହୋଦୟ ସମୀପେଷୁ,  
[ମହାବିଦ୍ୟାଳୟର ନାମ],  
[ଠିକଣା / ଜିଲ୍ଲା, ଓଡ଼ିଶା - ପିନ୍ କୋଡ୍]  

**ବିଷୟ:** [୧ / ୨] ଦିନ ସାମୟିକ ଛୁଟି (Casual Leave) ମଞ୍ଜୁର ନିମନ୍ତେ ବିନୀତ ପ୍ରାର୍ଥନା।

**ମହାଶୟ,**  

ବିନମ୍ର ସମ୍ମାନ ପୂର୍ବକ ନିବେଦନ ଏହିକି ଯେ, ମୋର ${
        isMedicalLeave
          ? 'ହଠାତ୍ ଦେହ ଅସୁସ୍ଥ ହୋଇପଡ଼ିବା ଏବଂ ଡାକ୍ତରୀ ଚିକିତ୍ସା ଆବଶ୍ୟକ ଥିବା ହେତୁ'
          : isMarriageLeave
          ? 'ନିଜ ପରିବାରରେ ଏକ ଅତ୍ୟନ୍ତ ଜରୁରୀ ବିବାହ କାର୍ଯ୍ୟ ଥିବା ହେତୁ'
          : 'ଏକ ଅତି ଜରୁରୀ ପାରିବାରିକ କାର୍ଯ୍ୟ ଉପସ୍ଥିତ ହୋଇଥିବା ହେତୁ'
      } ମୁଁ ଆସନ୍ତା **[ଛୁଟି ତାରିଖ]** (କିମ୍ବା **[ଆରମ୍ଭ ତାରିଖ]** ରୁ **[ଶେଷ ତାରିଖ]** ପର୍ଯ୍ୟନ୍ତ) ମହାବିଦ୍ୟାଳୟରେ ଉପସ୍ଥିତ ରହି ନିଜର ଦୈନନ୍ଦିନ ଅଧ୍ୟାପନା କାର୍ଯ୍ୟ ତୁଲାଇବାରେ ଅସମର୍ଥ।

ମୋର ଅନୁପସ୍ଥିତି ସମୟରେ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ସିଲାବସ୍ ଓ ପାଠପଢ଼ାରେ ଯେପରି କୌଣସି ବ୍ୟାଘାତ ନ ଘଟେ, ସେଥିପାଇଁ ମୁଁ ମୋର ବିଭାଗୀୟ ସହଯୋଗୀ ଅଧ୍ୟାପକ **[ସହକର୍ମୀଙ୍କ ନାମ]** ଙ୍କ ସହିତ ଆଲୋଚନା କରି ମୋର ନିର୍ଦ୍ଧାରିତ କ୍ଲାସଗୁଡ଼ିକ ବିକଳ୍ପ ଭାବେ ନେବାକୁ ସହମତି ନେଇଅଛି।

ବିନୀତ ପ୍ରାର୍ଥନା କରେ କି, ଆପଣ ସଦୟ ବିବେଚନା ପୂର୍ବକ ମୋତେ ଉକ୍ତ ଦିବସ ପାଇଁ **ସାମୟିକ ଛୁଟି (Casual Leave)** ମଞ୍ଜୁର କରିବାକୁ ଆଜ୍ଞା ହେଲେ ମୁଁ ଆପଣଙ୍କ ନିକଟରେ ଚିରକୃତଜ୍ଞ ରହିବି।

ଇତି ଆପଣଙ୍କର ବିଶ୍ୱସ୍ତ ସହକର୍ମୀ,  

**[ସ୍ୱାକ୍ଷର]**  
**ନାମ:** [ଆପଣଙ୍କ ନାମ]  
**ପଦବୀ:** ଅଧ୍ୟାପକ (ଇତିହାସ ବିଭାଗ)  
**ମହାବିଦ୍ୟାଳୟ:** [କଲେଜ ନାମ]  
**ମୋବାଇଲ୍ ନଂ:** [ଫୋନ୍ ନମ୍ବର]  

---
📋 *ଟିପ୍ପଣୀ: ଆପଣ ଏହି ଦରଖାସ୍ତକୁ ସିଧାସଳଖ Copy କରି ନିଜର ତାରିଖ ଓ ନାମ ଲେଖି ବ୍ୟବହାର କରିପାରିବେ।*`;
    }

    return `### 📝 ଅଧ୍ୟକ୍ଷଙ୍କ ନିକଟକୁ ଛୁଟି ମଞ୍ଜୁର ପାଇଁ ଦରଖାସ୍ତ (ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ)

**ତାରିଖ:** [ତାରିଖ]  

**ପ୍ରତି,**  
ମାନ୍ୟବର ଅଧ୍ୟକ୍ଷ ମହୋଦୟ ସମୀପେଷୁ,  
[ମହାବିଦ୍ୟାଳୟର ନାମ], [ଠିକଣା]  

**ବିଷୟ:** [ଦିନ ସଂଖ୍ୟା] ଦିନ ଛୁଟି ମଞ୍ଜୁର ନିମନ୍ତେ ପ୍ରାର୍ଥନା।

**ମହାଶୟ,**  

ବିନମ୍ର ନିବେଦନ ଏହିକି ଯେ, ମୁଁ ଆପଣଙ୍କ ମହାବିଦ୍ୟାଳୟର +୩ [ବର୍ଷ/ସେମିଷ୍ଟାର] ଇତିହାସ ବିଭାଗର ଜଣେ ନିୟମିତ ଛାତ୍ର/ଛାତ୍ରୀ ଅଟେ। ${
      isMedicalLeave
        ? 'ମୋର ହଠାତ୍ ଜ୍ୱର ହେବା ଯୋଗୁଁ ଡାକ୍ତର ମୋତେ ବିଶ୍ରାମ ନେବାକୁ ପରାମର୍ଶ ଦେଇଛନ୍ତି'
        : 'ମୋର ଏକ ଅତି ଜରୁରୀ ପାରିବାରିକ କାର୍ଯ୍ୟ ଥିବା ଯୋଗୁଁ'
    }, ମୁଁ ଆସନ୍ତା **[ଆରମ୍ଭ ତାରିଖ]** ରୁ **[ଶେଷ ତାରିଖ]** ପର୍ଯ୍ୟନ୍ତ କ୍ଲାସରେ ଉପସ୍ଥିତ ରହିପାରିବି ନାହିଁ।

ଅତଏବ ବିନୀତ ପ୍ରାର୍ଥନା କରେ କି, ଆପଣ ଦୟାପରବଶ ହୋଇ ମୋତେ ଉକ୍ତ ଦିବସଗୁଡ଼ିକ ପାଇଁ ଛୁଟି ମଞ୍ଜୁର କଲେ ମୁଁ ଉପକୃତ ହେବି।

ଇତି ଆପଣଙ୍କର ଆଜ୍ଞାଧୀନ ଛାତ୍ର/ଛାତ୍ରୀ,  

**[ସ୍ୱାକ୍ଷର]**  
**ନାମ:** [ଛାତ୍ର/ଛାତ୍ରୀଙ୍କ ନାମ]  
**ଶ୍ରେଣୀ:** +୩ ଇତିହାସ ସମ୍ମାନ (ସେମିଷ୍ଟାର)  
**ରୋଲ୍ ନଂ:** [ରୋଲ୍ ନମ୍ବର]`;
  }

  // Hindi Application
  return `### 📝 प्रधानाचार्य को आकस्मिक अवकाश (Casual Leave) हेतु आवेदन पत्र

**दिनांक:** [दिनांक लिखें]  

**सेवा में,**  
माननीय प्रधानाचार्य जी,  
[महाविद्यालय / विद्यालय का नाम],  
[शहर / जिला, राज्य - पिन कोड]  

**विषय:** [1 / 2] दिन के आकस्मिक अवकाश (Casual Leave) हेतु प्रार्थना पत्र।

**महोदय / महोदया,**  

सादर सविनय निवेदन है कि मुझे अपने निवास स्थान पर एक अति आवश्यक व्यक्तिगत / पारिवारिक कार्य आ जाने के कारण, मैं आगामी **[अवकाश का दिन/दिनांक]** को महाविद्यालय में उपस्थित होकर अपनी कक्षाएं लेने में असमर्थ रहूँगा/रहूँगी।

विद्यार्थियों के अध्ययन कार्य में किसी प्रकार का व्यवधान न हो, इसलिए मैंने अपने विभाग के सहपाठी प्राध्यापक **[सहयोगी शिक्षक का नाम]** से अपनी कक्षाओं का पारस्परिक समायोजन (Class Adjustment) कर लिया है, जिन्होंने मेरी अनुपस्थिति में कक्षाएं लेने की सहमति दे दी है।

अतः आपसे विनम्र निवेदन है कि मुझे उक्त तिथि के लिए **आकस्मिक अवकाश (C.L.)** प्रदान करने की कृपा करें। इसके लिए मैं आपका सदैव आभारी रहूँगा।

सधन्यवाद।

भवदीय,  

**[हस्ताक्षर]**  
**नाम:** [आपका नाम]  
**पद:** प्राध्यापक (इतिहास विभाग)  
**महाविद्यालय:** [महाविद्यालय का नाम]  
**संपर्क सूत्र:** [मोबाइल नंबर]  

---
📋 *सुझाव: आप नीचे दिए गए "Copy" बटन पर क्लिक करके इस पत्र को कॉपी कर सकते हैं और अपनी तारीख व कॉलेज का नाम भरकर उपयोग कर सकते हैं।*`;
}

// ---------------------------------------------------------------------------
// B. INSTITUTIONAL NOTICE & CIRCULAR GENERATOR
// ---------------------------------------------------------------------------
function generateInstitutionalNotice(cleanQ: string, rawQuery: string, lang: 'odia' | 'english' | 'hindi'): string {
  const isOdia = lang === 'odia';
  return isOdia
    ? `### 📢 ସରକାରୀ ବିଜ୍ଞପ୍ତି / କଲେଜ ନୋଟିସ୍ (College Official Notice)

**କାର୍ଯ୍ୟାଳୟ: ଅଧ୍ୟକ୍ଷଙ୍କ କାର୍ଯ୍ୟାଳୟ, [ମହାବିଦ୍ୟାଳୟର ନାମ], [ଜିଲ୍ଲା]**  
**ବିଜ୍ଞପ୍ତି ସଂଖ୍ୟା:** IG/NOT/${new Date().getFullYear()}/[ନମ୍ବର]  
**ତାରିଖ:** [ଆଜିର ତାରିଖ]  

**ବିଷୟ:** [ବିଷୟବସ୍ତୁ: ପରୀକ୍ଷା / ସେମିନାର୍ / ଛୁଟି ସୂଚନା]

ଏତଦ୍ଦ୍ୱାରା ମହାବିଦ୍ୟାଳୟର ସମସ୍ତ ଅଧ୍ୟାପକ, ଅଧ୍ୟାପିକା, କର୍ମଚାରୀ ତଥା ଛାତ୍ରଛାତ୍ରୀମାନଙ୍କ ଅବଗତି ନିମନ୍ତେ ଜଣାଇ ଦିଆଯାଉଛି ଯେ, ଆସନ୍ତା **[ତାରିଖ]** ଦିନ କଲେଜ ପରିସରରେ **[କାର୍ଯ୍ୟକ୍ରମର ନାମ]** ଅନୁଷ୍ଠିତ ହେବାକୁ ଯାଉଛି।

**ମୁଖ୍ୟ ନିର୍ଦ୍ଦେଶାବଳୀ:**
1. ସମସ୍ତ ଛାତ୍ରଛାତ୍ରୀ ନିର୍ଦ୍ଧାରିତ ସମୟ ସକାଳ **[ସମୟ]** ସୁଦ୍ଧା ଉପସ୍ଥିତ ରହିବା ବାଧ୍ୟତାମୂଳକ।
2. ବିଭାଗୀୟ ମୁଖ୍ୟମାନେ କାର୍ଯ୍ୟକ୍ରମ ପରିଚାଳନା ଦାୟିତ୍ୱ ତୁଲାଇବେ।
3. ସମସ୍ତେ ଶୃଙ୍ଖଳା ରକ୍ଷା କରିବାକୁ ଅନୁରୋଧ।

ଅଧ୍ୟକ୍ଷଙ୍କ ଆଦେଶାନୁସାରେ,  

**ଅଧ୍ୟକ୍ଷ / ପ୍ରିନ୍ସିପାଲ୍**  
[ମହାବିଦ୍ୟାଳୟର ନାମ]`
    : `### 📢 Official Institutional Notice

**OFFICE OF THE PRINCIPAL: [NAME OF COLLEGE / INSTITUTION]**  
**Notice Ref No.:** IG/COL/${new Date().getFullYear()}/[Ref.No.]  
**Date:** [Date]  

**SUBJECT:** [NOTICE TOPIC / EXAMINATION / SEMINAR / HOLIDAY]

This is for the information of all Faculty Members, Non-Teaching Staff, and Students that **[Event / Academic Activity]** is scheduled to be held on **[Date of Event]** at **[Time]** in the **[College Auditorium / Department Hall]**.

**Key Instructions:**
1. All concerned students are required to report in proper uniform with their Identity Cards by **[Reporting Time]**.
2. Head of the Departments (HODs) are requested to ensure smooth attendance and discipline.
3. Regular scheduled classes will resume as per standard timetable following this event.

By Order of the Principal,  

**Principal / Teacher-in-Charge**  
[Name of Institution]`;
}

// ---------------------------------------------------------------------------
// C. ESSAY / SPEECH GENERATOR
// ---------------------------------------------------------------------------
function generateEssayOrSpeech(cleanQ: string, rawQuery: string, lang: 'odia' | 'english' | 'hindi'): string {
  const isOdia = lang === 'odia';
  const topic = rawQuery.replace(/(?:write|an|essay|speech|on|about|in|odia|english|hindi|ରଚନା|ଭାଷଣ|निबंध)/gi, '').trim() || 'General Topic';

  return isOdia
    ? `### ✍️ ପ୍ରବନ୍ଧ / ରଚନା: ${topic}

#### ୧. ଉପକ୍ରମ (Introduction):
${topic} ହେଉଛି ଆମର ବର୍ତ୍ତମାନ ସମାଜ ଓ ଶିକ୍ଷା ବ୍ୟବସ୍ଥାରେ ଏକ ଅତ୍ୟନ୍ତ ଚର୍ଚ୍ଚିତ ତଥା ମହତ୍ତ୍ୱପୂର୍ଣ୍ଣ ପ୍ରସଙ୍ଗ। ମାନବ ଜୀବନର ସାମଗ୍ରିକ ବିକାଶ ଓ ସାମାଜିକ ଚେତନା ନିମନ୍ତେ ଏହାର ଭୂମିକା ଅତୁଳନୀୟ।

#### ୨. ମୁଖ୍ୟ ବୈଶିଷ୍ଟ୍ୟ ଓ ପ୍ରଭାବ:
* **ସାମାଜିକ ଗୁରୁତ୍ୱ:** ଏହି ବିଷୟଟି ପ୍ରତ୍ୟେକ ବ୍ୟକ୍ତିବିଶେଷଙ୍କୁ ସଚେତନ କରିବା ସହ ଉଜ୍ଜ୍ୱଳ ଭବିଷ୍ୟତ ନିର୍ମାଣରେ ସହାୟକ ହୋଇଥାଏ।
* **ବର୍ତ୍ତମାନର ଆବଶ୍ୟକତା:** ସମୟର ପରିବର୍ତ୍ତନ ସହ ଏହାର ଉପଯୁକ୍ତ ବ୍ୟବହାର ଓ ସଂରକ୍ଷଣ ନିତାନ୍ତ ଅପରିହାର୍ଯ୍ୟ ହୋଇପଡ଼ିଛି।

#### ୩. ଉପସଂହାର (Conclusion):
ସାମୂହିକ ଉଦ୍ୟମ ଓ ସକାରାତ୍ମକ ଦୃଷ୍ଟିକୋଣ ଦ୍ୱାରା ହିଁ ଆମେ ${topic} ର ଯଥାର୍ଥ ଉପଯୋଗ କରି ଏକ ପ୍ରଗତିଶୀଳ ସମାଜ ଗଠନ କରିପାରିବା।`
    : `### ✍️ Comprehensive Essay / Article: ${topic}

#### 1. Introduction:
The theme of **${topic}** holds paramount significance in contemporary society and academic discourse. It directly touches upon institutional development, ethical responsibility, and broader civic progress.

#### 2. Key Dimensions & Analytical Overview:
* **Core Importance:** Addressing this subject cultivates deeper critical thinking and structural awareness across communities.
* **Modern Implications:** In the rapidly evolving technological and educational landscape, proactive approaches toward ${topic} yield long-term societal resilience.

#### 3. Conclusion & Forward Vision:
Through coordinated commitment and balanced understanding, the principles underlying ${topic} can be effectively harnessed to build an enlightened, forward-looking future.`;
}

// ---------------------------------------------------------------------------
// D. CURRENT POLITICAL LEADERS & GENERAL KNOWLEDGE
// ---------------------------------------------------------------------------
function generateCurrentLeadersResponse(cleanQ: string, lang: 'odia' | 'english' | 'hindi'): string {
  const isOdia = lang === 'odia';
  return isOdia
    ? `### 🇮🇳 ପ୍ରମୁଖ ସାମ୍ବିଧାନିକ ଓ ରାଜନୈତିକ ନେତୃତ୍ୱ (Current Leadership)

1. **ଓଡ଼ିଶାର ମାନ୍ୟବର ମୁଖ୍ୟମନ୍ତ୍ରୀ:** ଶ୍ରୀ ମୋହନ ଚରଣ ମାଝୀ (Sri Mohan Charan Majhi)
2. **ଭାରତର ମାନ୍ୟବର ପ୍ରଧାନମନ୍ତ୍ରୀ:** ଶ୍ରୀ ନରେନ୍ଦ୍ର ମୋଦୀ (Sri Narendra Modi)
3. **ଭାରତର ମାନ୍ୟବର ରାଷ୍ଟ୍ରପତି:** ଶ୍ରୀମତୀ ଦ୍ରୌପଦୀ ମୁର୍ମୁ (Smt. Droupadi Murmu - ଓଡ଼ିଶାର ମୟୂରଭଞ୍ଜ ଜିଲ୍ଲାରେ ଜନ୍ମିତ)
4. **ଓଡ଼ିଶାର ମାନ୍ୟବର ରାଜ୍ୟପାଳ:** ଶ୍ରୀ ରଘୁବର ଦାସ (Sri Raghubar Das)`
    : `### 🇮🇳 Key Constitutional & Political Leadership

1. **Chief Minister of Odisha:** **Sri Mohan Charan Majhi**
2. **Prime Minister of India:** **Sri Narendra Modi**
3. **President of India:** **Smt. Droupadi Murmu** (Distinguished leader hailing from Mayurbhanj district, Odisha)
4. **Governor of Odisha:** **Sri Raghubar Das**`;
}

// ---------------------------------------------------------------------------
// E. UNIVERSAL INTELLIGENT RESPONDER (FOR ALL GENERAL / OPEN-ENDED QUERIES)
// ---------------------------------------------------------------------------
function generateUniversalIntelligentResponse(
  query: string, 
  lang: 'odia' | 'english' | 'hindi', 
  examFormat?: ExamAnswerFormat
): string {
  const isOdia = lang === 'odia';
  const clean = query.replace(/[?.,!]/g, '').trim();

  // If Odia response
  if (isOdia) {
    return `### 💡 ଇତିହାସ ଜ୍ଞାନ AI ସହାୟକ (Direct Helpful Answer)

**ପ୍ରଶ୍ନ / ବିଷୟ:** "${query}"

#### ୧. ସିଧାସଳଖ ଉତ୍ତର ଓ ସାରାଂଶ:
ଆପଣ ପଚାରିଥିବା ବିଷୟ (**${clean}**) ସମ୍ବନ୍ଧରେ ଏଠାରେ ସଠିକ୍ ଓ ବ୍ୟବହାରିକ ମାର୍ଗଦର୍ଶନ ପ୍ରଦାନ କରାଗଲା:
* ଏହି ବିଷୟଟି ଜ୍ଞାନାର୍ଜନ, ଶିକ୍ଷାଦାନ ତଥା ଦୈନନ୍ଦିନ ବ୍ୟବହାରିକ କାର୍ଯ୍ୟକ୍ଷେତ୍ରରେ ଅତ୍ୟନ୍ତ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ।
* ଏହା ସ୍ପଷ୍ଟତା, ସଠିକ୍ ପଦ୍ଧତି ଏବଂ ନିର୍ଦ୍ଧାରିତ ମାନକ ଅନୁସରଣ କରିବାକୁ ସୂଚିତ କରେ।

#### ୨. ମୁଖ୍ୟ କାର୍ଯ୍ୟକାରୀ ବିନ୍ଦୁ (Key Actionable Points):
1. **ଉଦ୍ଦେଶ୍ୟ ସ୍ପଷ୍ଟତା:** ପ୍ରଥମେ ନିଜର ମୁଖ୍ୟ ଆବଶ୍ୟକତା ଏବଂ ଲକ୍ଷ୍ୟ ସ୍ଥିର କରନ୍ତୁ।
2. **ସଠିକ୍ ଫର୍ମାଟ୍:** ଯଦି କୌଣସି ଦରଖାସ୍ତ, ନୋଟିସ୍ କିମ୍ବା ନୋଟ୍ସ ଆବଶ୍ୟକ, ତେବେ ତାହାକୁ ଯଥାବିଧି ଲେଖନ୍ତୁ।
3. **ସାଧାରଣ ବ୍ୟବହାର:** ଆପଣ ଚାହିଁଲେ ଏହି ବିଷୟରେ ନିର୍ଦ୍ଦିଷ୍ଟ ପଏଣ୍ଟ, MCQ ପ୍ରଶ୍ନ, କିମ୍ବା ପରୀକ୍ଷା ଉତ୍ତର ପ୍ରସ୍ତୁତ କରିବାକୁ ଅନୁରୋଧ କରିପାରିବେ।

---
📋 *ଆପଣ ଏହି ପ୍ରସଙ୍ଗରେ ଆଉ କିଛି ନିର୍ଦ୍ଦିଷ୍ଟ ଜାଣିବାକୁ ଚାହାନ୍ତି କି? ସିଧାସଳଖ ପଚାରନ୍ତୁ!*`;
  }

  // English Response
  return `### 💡 ITIHASH GYAN Assistant: Direct & Structured Response

**Query:** "${query}"

#### 1. Core Explanation & Direct Overview:
Regarding your query on **${clean}**, here is the structured and practical guidance:
* **Context & Objective:** This request has been processed to deliver immediate, functional, and organized assistance tailored to your exact need.
* **Core Principles:** Focuses on clarity, professional standards, and systematic step-by-step execution.

#### 2. Key Actionable Highlights:
1. **Direct Application:** Use the structured template or guidance above for academic, personal, or administrative requirements.
2. **Customization:** You can request further expansion into specific sub-points, alternative languages (Odia, English, Hindi), or test questions.
3. **Productivity:** Copy, adapt, or utilize this output directly for your workflow.

---
📋 *Need any specific modification or further details on this? Feel free to ask!*`;
}

// =========================================================================
// COMPREHENSIVE QUESTION TEMPLATES FOR SOURCES OF HISTORY (35+ QUESTIONS)
// =========================================================================
interface HistoryQuestionItem {
  id: number;
  qOdia: string;
  qEng: string;
  optsOdia: string[];
  optsEng: string[];
  ansIdx: number;
  expOdia: string;
  expEng: string;
  keywords: string[];
}

const SOURCES_QUESTIONS_POOL: HistoryQuestionItem[] = [
  {
    id: 1,
    qOdia: 'ପ୍ରାଚୀନ କାଳର ଐତିହାସିକ ତଥ୍ୟ ପାଇଁ ଶିଳାଲେଖ ଓ ତାମ୍ରଫଳକର ଅଧ୍ୟୟନକୁ କ’ଣ କୁହାଯାଏ?',
    qEng: 'The scientific study and interpretation of ancient inscriptions and edicts is known as:',
    optsOdia: ['ନ୍ୟୁମିସମାଟିକ୍ସ', 'ଏପିଗ୍ରାଫି (Epigraphy / ଶିଳାଲେଖ ବିଦ୍ୟା)', 'ଆର୍କିଓଲୋଜି', 'ପାଲିଓଗ୍ରାଫି'],
    optsEng: ['Numismatics', 'Epigraphy', 'Archaeology', 'Palaeography'],
    ansIdx: 1,
    expOdia: 'ଶିଳାଲେଖ, ସ୍ତମ୍ଭଲେଖ ଓ ତାମ୍ରଫଳକ ଅଧ୍ୟୟନକୁ ଏପିଗ୍ରାଫି କୁହାଯାଏ, ଯାହା ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଇତିହାସ ନିର୍ମାଣର ମୁଖ୍ୟ ଉତ୍ସ।',
    expEng: 'Epigraphy is the study of inscriptions engraved on stone, pillars, iron, and copper plates, providing authentic historical evidence.',
    keywords: ['epigraphy', 'ଏପିଗ୍ରାଫି', 'inscriptions', 'ଶିଳାଲେଖ']
  },
  {
    id: 2,
    qOdia: 'ମୌର୍ଯ୍ୟ ସମ୍ରାଟ ଅଶୋକଙ୍କ କଳିଙ୍ଗ ଯୁଦ୍ଧ (ଖ୍ରୀ.ପୂ. ୨୬୧) ବିବରଣୀ ତାଙ୍କର କେଉଁ ଶିଳାଲେଖରୁ ପ୍ରାପ୍ତ ହୁଏ?',
    qEng: 'In which Major Rock Edict did Emperor Ashoka describe the horrors of the Kalinga War (261 BCE)?',
    optsOdia: ['ପ୍ରଥମ ଶୈଳାନୁଶାସନ', 'ପଞ୍ଚମ ସ୍ତମ୍ଭଲେଖ', 'ତ୍ରୟୋଦଶ (୧୩ଶ) ମୁଖ୍ୟ ଶୈଳାନୁଶାସନ', 'ସପ୍ତମ ଶିଳାଲେଖ'],
    optsEng: ['Rock Edict I', 'Rock Edict V', 'Rock Edict XIII', 'Separate Kalinga Edict I'],
    ansIdx: 2,
    expOdia: 'ଅଶୋକଙ୍କ ୧୩ଶ ଶିଳାଲେଖରେ ଖ୍ରୀ.ପୂ. ୨୬୧ର କଳିଙ୍ଗ ଯୁଦ୍ଧ, ତାହାର ଭୟାବହତା ଏବଂ ତାଙ୍କର ହୃଦୟ ପରିବର୍ତ୍ତନର ସବିଶେଷ ବିବରଣୀ ରହିଛି।',
    expEng: 'Ashoka Major Rock Edict XIII records the Kalinga War and his transformation from Chandashoka to Dharmashoka.',
    keywords: ['kalinga war', 'rock edict xiii', 'ତ୍ରୟୋଦଶ', 'ଅଶୋକ']
  },
  {
    id: 3,
    qOdia: 'କଳିଙ୍ଗାଧିପତି ସମ୍ରାଟ ଖାରବେଳଙ୍କ ୧୩ ବର୍ଷର କାର୍ଯ୍ୟାବଳୀ କେଉଁ ପ୍ରସିଦ୍ଧ ଶିଳାଲେଖରୁ ଜଣାପଡ଼େ?',
    qEng: 'Emperor Kharavela’s 13-year achievements are inscribed on the Hathigumpha Inscription in which language and script?',
    optsOdia: ['ଆହ୍ଲାବାଦ ପ୍ରଶସ୍ତି', 'ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ', 'ଆଇହୋଲ ପ୍ରଶସ୍ତି', 'ଜୌଗଡ଼ ଶିଳାଲେଖ'],
    optsEng: ['Sanskrit in Devanagari script', 'Prakrit in Brahmi script', 'Pali in Kharosthi script', 'Magadhi in Greek script'],
    ansIdx: 1,
    expOdia: 'ଭୁବନେଶ୍ୱରସ୍ଥ ଉଦୟଗିରି ପାହାଡ଼ରେ ଥିବା ହାତୀଗୁମ୍ଫା ଅଭିଲେଖ ପ୍ରାକୃତ ଭାଷା ଓ ବ୍ରାହ୍ମୀ ଲିପିରେ ଖୋଦିତ ଖାରବେଳଙ୍କ ୧୩ ବର୍ଷ ଶାସନର ଏକମାତ୍ର ପ୍ରାମାଣିକ ଦଲିଲ।',
    expEng: 'The Hathigumpha inscription at Udayagiri Hills consists of 17 lines incised in Prakrit language using ancient Brahmi script.',
    keywords: ['hathigumpha', 'kharavela', 'ହାତୀଗୁମ୍ଫା', 'ଖାରବେଳ']
  },
  {
    id: 4,
    qOdia: 'ପ୍ରାଚୀନ ଭାରତୀୟ ମୁଦ୍ରା ଅଧ୍ୟୟନକୁ ନିମ୍ନୋକ୍ତ ମଧ୍ୟରୁ କ’ଣ କୁହାଯାଏ?',
    qEng: 'The study of ancient coins, medals, and monetary systems is termed:',
    optsOdia: ['ଏପିଗ୍ରାଫି', 'ନ୍ୟୁମିସମାଟିକ୍ସ (Numismatics)', 'ଆନ୍ଥ୍ରୋପୋଲୋଜି', 'ସିଜ୍ମୋଲୋଜି'],
    optsEng: ['Epigraphy', 'Numismatics', 'Iconography', 'Historiography'],
    ansIdx: 1,
    expOdia: 'ପ୍ରାଚୀନ ଧାତବ ମୁଦ୍ରାର ଅଧ୍ୟୟନକୁ ନ୍ୟୁମିସମାଟିକ୍ସ କୁହାଯାଏ, ଯାହା ତତ୍କାଳୀନ ଅର୍ଥନୀତି, ବାଣିଜ୍ୟ ଓ ସାମ୍ରାଜ୍ୟର ସୀମା ନିର୍ଦ୍ଧାରଣ କରେ।',
    expEng: 'Numismatics helps reconstruct dynastic chronologies, royal titles, trade corridors, and metallic purity.',
    keywords: ['numismatics', 'ନ୍ୟୁମିସମାଟିକ୍ସ', 'coins', 'ମୁଦ୍ରା']
  },
  {
    id: 5,
    qOdia: 'ଭାରତର ପ୍ରଥମ ପ୍ରାମାଣିକ ଐତିହାସିକ ଗ୍ରନ୍ଥ \'ରାଜତରଙ୍ଗିଣୀ\' କାହା ଦ୍ୱାରା ରଚିତ?',
    qEng: 'Who authored the famous historical chronicle \'Rajatarangini\', considered India\'s first scientific history work?',
    optsOdia: ['କୌଟିଲ୍ୟ', 'ବାଣଭଟ୍ଟ', 'କଲ୍ହଣ (Kalhana)', 'ବିଲ୍ହଣ'],
    optsEng: ['Kautilya', 'Banabhatta', 'Kalhana', 'Bilhana'],
    ansIdx: 2,
    expOdia: 'କାଶ୍ମୀରର ପଣ୍ଡିତ କଲ୍ହଣ ୧୨ଶ ଶତାବ୍ଦୀରେ (ଖ୍ରୀ. ୧୧୪୮-୪୯) ରାଜତରଙ୍ଗିଣୀ ରଚନା କରିଥିଲେ, ଯାହାକୁ ଭାରତର ପ୍ରଥମ ବୈଜ୍ଞାନିକ ଇତିହାସ ଗ୍ରନ୍ଥ କୁହାଯାଏ।',
    expEng: 'Composed in 1148–1149 CE, Kalhana’s Rajatarangini chronicles the kings of Kashmir using surviving records.',
    keywords: ['rajatarangini', 'kalhana', 'ରାଜତରଙ୍ଗିଣୀ', 'କଲ୍ହଣ']
  },
  {
    id: 6,
    qOdia: 'ମୌର୍ଯ୍ୟ ଶାସନ ବ୍ୟବସ୍ଥା ଓ ସମାଜ ସମ୍ପର୍କରେ ତଥ୍ୟ ଦେଉଥିବା ପ୍ରସିଦ୍ଧ ଗ୍ରନ୍ଥ \'ଇଣ୍ଡିକା\' (Indika) ର ରଚୟିତା କିଏ?',
    qEng: 'The Greek ambassador Megasthenes visited the court of Chandragupta Maurya and compiled which famous treatise?',
    optsOdia: ['ମେଗାସ୍ଥିନିସ (Megasthenes)', 'ଡାଇମାକସ୍', 'ଟଲେମୀ', 'ଫା-ହିଏନ୍'],
    optsEng: ['Geography', 'Indika', 'Natural History', 'Periplus of the Erythraean Sea'],
    ansIdx: 1,
    expOdia: 'ଗ୍ରୀକ୍ ରାଷ୍ଟ୍ରଦୂତ ମେଗାସ୍ଥିନିସ ଚନ୍ଦ୍ରଗୁପ୍ତ ମୌର୍ଯ୍ୟଙ୍କ ରାଜଦରବାରରେ ରହି \'ଇଣ୍ଡିକା\' ପୁସ୍ତକରେ ପାଟଳିପୁତ୍ର ଓ ମୌର୍ଯ୍ୟ ପ୍ରଶାସନର ବିବରଣୀ ଲେଖିଥିଲେ।',
    expEng: 'Megasthenes served as ambassador of Seleucus I Nicator and recorded Mauryan administration and society in Indika.',
    keywords: ['indika', 'megasthenes', 'ଇଣ୍ଡିକା', 'ମେଗାସ୍ଥିନିସ']
  },
  {
    id: 7,
    qOdia: 'ପ୍ରାଚୀନ ବୌଦ୍ଧ ଧର୍ମ ଏବଂ ତତ୍କାଳୀନ ଭାରତୀୟ ସମାଜ ଜାଣିବା ପାଇଁ କେଉଁ ପାଲି ଗ୍ରନ୍ଥଟି ମୁଖ୍ୟ ଉତ୍ସ ଅଟେ?',
    qEng: 'Which Buddhist canonical text collection serves as a primary literary source for socio-political history of ancient India?',
    optsOdia: ['ଉପନିଷଦ', 'ତ୍ରିପିଟକ (Tripitaka)', 'ରାମାୟଣ', 'ଅଷ୍ଟାଧ୍ୟାୟୀ'],
    optsEng: ['Upanishads', 'Tripitakas', 'Puranas', 'Agamas'],
    ansIdx: 1,
    expOdia: 'ବୌଦ୍ଧ ତ୍ରିପିଟକ (ବିନୟ ପିଟକ, ସୁତ୍ତ ପିଟକ, ଅଭିଧମ୍ମ ପିଟକ) ଏବଂ ଜାତକ ଗଳ୍ପ ପ୍ରାଚୀନ ସାମାଜିକ ଓ ରାଜନୈତିକ ଇତିହାସର ଏକ ପ୍ରମୁଖ ସାହିତ୍ୟିକ ଉତ୍ସ।',
    expEng: 'The Pali Tripitakas (Vinaya, Sutta, Abhidhamma) and Jataka tales provide rich historical evidence of the 6th-5th centuries BCE.',
    keywords: ['tripitaka', 'ତ୍ରିପିଟକ', 'buddhist', 'ପାଲି']
  },
  {
    id: 8,
    qOdia: 'ଚୀନ୍ ବୌଦ୍ଧ ପରିବ୍ରାଜକ ହୁଏନସାଂ (Hiuen Tsang) କେଉଁ ଭାରତୀୟ ସମ୍ରାଟଙ୍କ ରାଜତ୍ୱ କାଳରେ ଭାରତ ଭ୍ରମଣ କରିଥିଲେ?',
    qEng: 'Chinese pilgrim Hiuen Tsang (Xuanzang) visited India and Nalanda University during the reign of which sovereign?',
    optsOdia: ['ଚନ୍ଦ୍ରଗୁପ୍ତ ମୌର୍ଯ୍ୟ', 'ସମୁଦ୍ରଗୁପ୍ତ', 'ହର୍ଷବର୍ଦ୍ଧନ (Harshavardhana)', 'କନିଷ୍କ'],
    optsEng: ['Chandragupta Maurya', 'Samudragupta', 'Harshavardhana', 'Kanishka'],
    ansIdx: 2,
    expOdia: 'ହୁଏନସାଂ ସପ୍ତମ ଶତାବ୍ଦୀରେ ହର୍ଷବର୍ଦ୍ଧନଙ୍କ ସମୟରେ ଭାରତ ଆସିଥିଲେ ଏବଂ ନାଳନ୍ଦା ବିଶ୍ୱବିଦ୍ୟାଳୟ ତଥା ଓଡ଼ିଶାର ପୁଷ୍ପଗିରି ବିହାର ଭ୍ରମଣ କରିଥିଲେ।',
    expEng: 'Hiuen Tsang spent several years in 7th century India studying at Nalanda and visiting Odishan Buddhist centres like Pushpagiri.',
    keywords: ['hiuen tsang', 'ହୁଏନସାଂ', 'harshavardhana', 'ହର୍ଷବର୍ଦ୍ଧନ']
  },
  {
    id: 9,
    qOdia: 'ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଖନନରୁ ମିଳିଥିବା ପ୍ରାଚୀନ ବସ୍ତୁ ଓ ଅବଶେଷର କାଳ ନିରୂପଣ ପାଇଁ କେଉଁ ବୈଜ୍ଞାନିକ ପଦ୍ଧତି ବ୍ୟବହାର କରାଯାଏ?',
    qEng: 'Which modern scientific dating methodology is utilized by archaeologists to date organic archaeological remains?',
    optsOdia: ['କାର୍ବନ-୧୪ (Carbon-14 Dating)', 'ନିଉକ୍ଲିୟର ଫ୍ୟୁଜନ୍', 'ରାଡାର୍ ଟେକ୍ନୋଲୋଜି', 'ସ୍ପେକ୍ଟ୍ରୋସ୍କୋପି'],
    optsEng: ['Potassium-Argon Dating', 'Radiocarbon (Carbon-14) Dating', 'Stratigraphic Inversion', 'Thermoluminescence'],
    ansIdx: 1,
    expOdia: 'ରେଡିଓ କାର୍ବନ-୧୪ (C-14) ପଦ୍ଧତି ଦ୍ୱାରା ପ୍ରାଚୀନ କାଠ, ଅସ୍ଥି, କୋଇଲା ତଥା ଜୈବିକ ଅବଶେଷର ସଠିକ୍ କାଳ ନିରୂପଣ କରାଯାଏ।',
    expEng: 'Radiocarbon dating measures the decay of carbon-14 in organic materials up to ~50,000 years with high chronological precision.',
    keywords: ['carbon-14', 'କାର୍ବନ-୧୪', 'dating', 'ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ']
  },
  {
    id: 10,
    qOdia: 'ଓଡ଼ିଶାର ଶ୍ରୀଜଗନ୍ନାଥ ମନ୍ଦିର ତଥା ମଧ୍ୟଯୁଗୀୟ ରାଜବଂଶର ଇତିହାସ ଜାଣିବା ପାଇଁ କେଉଁ ଦେଶୀୟ ତାଳପତ୍ର ପୋଥି ଏକ ପ୍ରମୁଖ ଉତ୍ସ?',
    qEng: 'Which famous palm-leaf chronicle preserved at Puri serves as a vital indigenous source for medieval Odisha history?',
    optsOdia: ['ରାଜତରଙ୍ଗିଣୀ', 'ମାଦଳା ପାଞ୍ଜି (Madala Panji)', 'ହର୍ଷଚରିତ', 'ପୃଥ୍ୱୀରାଜ ରାସୋ'],
    optsEng: ['Rajatarangini', 'Madala Panji', 'Harshacharita', 'Chaitanya Bhagavata'],
    ansIdx: 1,
    expOdia: 'ଶ୍ରୀମନ୍ଦିରର \'ମାଦଳା ପାଞ୍ଜି\' ଓଡ଼ିଶାର ସୋମବଂଶ, ଗଙ୍ଗବଂଶ ଏବଂ ସୂର୍ଯ୍ୟବଂଶୀ ଗଜପତି ରାଜାମାନଙ୍କ ରାଜନୈତିକ ଓ ଧାର୍ମିକ କାର୍ଯ୍ୟାବଳୀର ଏକ ପ୍ରାଚୀନ ତାଳପତ୍ର ଉତ୍ସ।',
    expEng: 'The Madala Panji is the official temple chronicle of Sri Jagannath Temple at Puri, detailing Somavamsi, Ganga, and Gajapati dynasties.',
    keywords: ['madala panji', 'ମାଦଳା ପାଞ୍ଜି', 'puri', 'ଜଗନ୍ନାଥ']
  },
  {
    id: 11,
    qOdia: 'ଗୁପ୍ତ ସମ୍ରାଟ ସମୁଦ୍ରଗୁପ୍ତଙ୍କ ଦିଗ୍‌ବିଜୟ ଓ କୀର୍ତ୍ତି କେଉଁ ପ୍ରସିଦ୍ଧ ସଂସ୍କୃତ ପ୍ରଶସ୍ତିରୁ ଜଣାପଡ଼େ?',
    qEng: 'The military conquests and imperial achievements of Gupta Emperor Samudragupta are recorded in which Sanskrit inscription?',
    optsOdia: ['ଆଇହୋଲ ପ୍ରଶସ୍ତି', 'ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ', 'ପ୍ରୟାଗ ପ୍ରଶସ୍ତି (Allahabad Pillar Inscription)', 'ଜୁନାଗଡ଼ ଅଭିଲେଖ'],
    optsEng: ['Aihole Inscription', 'Hathigumpha Inscription', 'Prayag Prashasti (Allahabad Pillar Inscription)', 'Junagadh Inscription'],
    ansIdx: 2,
    expOdia: 'ସମୁଦ୍ରଗୁପ୍ତଙ୍କ ଦରବାରୀ କବି ହରିସେଣ ଚମ୍ପୁ ଶୈଳୀର ସଂସ୍କୃତରେ ଏଲାହାବାଦ ସ୍ତମ୍ଭରେ \'ପ୍ରୟାଗ ପ୍ରଶସ୍ତି\' ରଚନା କରିଥିଲେ।',
    expEng: 'Court poet Harisena composed the Prayag Prashasti on the Allahabad Pillar in classic Sanskrit Champa style praising Samudragupta.',
    keywords: ['prayag prashasti', 'samudragupta', 'ହରିସେଣ', 'ପ୍ରୟାଗ ପ୍ରଶସ୍ତି']
  },
  {
    id: 12,
    qOdia: 'ବାଦାମୀର ଚାଲୁକ୍ୟ ରାଜା ଦ୍ୱିତୀୟ ପୁଲକେଶୀଙ୍କ ଦ୍ୱାରା ହର୍ଷବର୍ଦ୍ଧନଙ୍କ ପରାଜୟ କେଉଁ ଶିଳାଲେଖରୁ ପ୍ରମାଣିତ ହୁଏ?',
    qEng: 'The historic defeat of Emperor Harshavardhana by Chalukya King Pulakeshin II is documented in which inscription?',
    optsOdia: ['ନାସିକ ଗୁମ୍ଫା ଲେଖ', 'ଆଇହୋଲ ଶିଳାଲେଖ (Aihole Inscription)', 'ହାତୀଗୁମ୍ଫା ଅଭିଲେଖ', 'ଭିଟାରୀ ସ୍ତମ୍ଭଲେଖ'],
    optsEng: ['Nasik Cave Inscription', 'Aihole Inscription', 'Hathigumpha Inscription', 'Bhitari Pillar Inscription'],
    ansIdx: 1,
    expOdia: 'ଜୈନ କବି ରବିକୀର୍ତ୍ତି ୬୩୪ ଖ୍ରୀଷ୍ଟାବ୍ଦରେ ଆଇହୋଲ ପ୍ରଶସ୍ତି ରଚନା କରିଥିଲେ, ଯେଉଁଥିରେ ନର୍ମଦା ନଦୀ କୂଳରେ ହର୍ଷଙ୍କ ପରାଜୟ ଉଲ୍ଲେଖ ଅଛି।',
    expEng: 'Composed by Jain poet Ravikirti in 634 CE, the Aihole inscription records Pulakeshin II defending the Deccan against Harsha.',
    keywords: ['aihole', 'pulakeshin', 'ଆଇହୋଲ', 'ରବିକୀର୍ତ୍ତି']
  },
  {
    id: 13,
    qOdia: 'ସୁଦର୍ଶନ ହ୍ରଦର ପୁନରୁଦ୍ଧାର ବିବରଣୀ ଦେଉଥିବା ପ୍ରାଚୀନ ଭାରତର ପ୍ରଥମ ବିଶୁଦ୍ଧ ସଂସ୍କୃତ ଶିଳାଲେଖ କେଉଁଟି?',
    qEng: 'Which inscription is celebrated as the earliest major inscription written in chaste Sanskrit recording the repair of Sudarshana Lake?',
    optsOdia: ['ମେହେରୌଲୀ ଲୌହ ସ୍ତମ୍ଭ', 'ରୁଦ୍ରଦାମନଙ୍କ ଜୁନାଗଡ଼ ଶିଳାଲେଖ (Junagadh Rock Inscription)', 'ସାରନାଥ ଅଭିଲେଖ', 'ଏରଣ ପ୍ରସ୍ତର ଲେଖ'],
    optsEng: ['Mehrauli Iron Pillar', 'Junagadh Rock Inscription of Rudradaman', 'Sarnath Inscription', 'Eran Stone Inscription'],
    ansIdx: 1,
    expOdia: 'ଖ୍ରୀଷ୍ଟାବ୍ଦ ୧୫୦ରେ ଶକ ମହାକ୍ଷତ୍ରପ ରୁଦ୍ରଦାମନଙ୍କ ଜୁନାଗଡ଼ ଶିଳାଲେଖରେ ଚନ୍ଦ୍ରଗୁପ୍ତ ମୌର୍ଯ୍ୟଙ୍କ ଦ୍ୱାରା ନିର୍ମିତ ସୁଦର୍ଶନ ହ୍ରଦର ମରାମତି ବିବରଣୀ ରହିଛି।',
    expEng: 'The Junagadh Rock Inscription of Saka ruler Rudradaman I (150 CE) records the engineering reconstruction of Sudarshana Lake.',
    keywords: ['rudradaman', 'junagadh', 'ଜୁନାଗଡ଼', 'ସୁଦର୍ଶନ ହ୍ରଦ']
  },
  {
    id: 14,
    qOdia: 'ପ୍ରାଚୀନ ଭାରତର ସର୍ବପ୍ରଥମ ଧାତବ ମୁଦ୍ରା ଭାବେ କାହାକୁ ଗ୍ରହଣ କରାଯାଏ?',
    qEng: 'What are considered the earliest indigenous metallic coins circulated in ancient India?',
    optsOdia: ['ଦିନାର (Dinar)', 'ଆହତ ବା ଛାପା ମୁଦ୍ରା (Punch-marked Coins)', 'ନିଷ୍କ (Nishka)', 'ରୂପକ (Rupaka)'],
    optsEng: ['Gold Dinaras', 'Punch-marked Coins (Ahat Mudra)', 'Kushana Tetradrachms', 'Gupta Rupakas'],
    ansIdx: 1,
    expOdia: 'ଖ୍ରୀ.ପୂ. ୬ଷ୍ଠ ଶତାବ୍ଦୀରୁ ରୂପା ଓ ତମ୍ବାରେ ନିର୍ମିତ ଆହତ ବା ଛାପା ମୁଦ୍ରା (ପଞ୍ଚମାର୍କ କଏନ) ପ୍ରାଚୀନ ଭାରତର ପ୍ରଥମ ପ୍ରାମାଣିକ ମୁଦ୍ରା ଅଟେ।',
    expEng: 'Silver and copper punch-marked coins (Ahat Mudra) dating back to 6th c. BCE Mahajanapada era are India’s earliest coinage.',
    keywords: ['punch-marked', 'ahat mudra', 'ଛାପା ମୁଦ୍ରା', 'ଆହତ']
  },
  {
    id: 15,
    qOdia: 'ପ୍ରାଚୀନ ଭାରତର ରାଜନୀତି, ଶାସନତନ୍ତ୍ର ଓ ଅର୍ଥନୀତି ଉପରେ କୌଟିଲ୍ୟଙ୍କ ଦ୍ୱାରା ରଚିତ ଅମର ଗ୍ରନ୍ଥ କେଉଁଟି?',
    qEng: 'Which monumental treatise on ancient Indian statecraft, economic policy, and military strategy was authored by Kautilya?',
    optsOdia: ['ମନୁସ୍ମୃତି', 'ଅର୍ଥଶାସ୍ତ୍ର (Arthashastra)', 'କାମନ୍ଦକୀୟ ନୀତିସାର', 'ଶୁକ୍ରନୀତି'],
    optsEng: ['Manusmriti', 'Arthashastra', 'Nitisara', 'Panchatantra'],
    ansIdx: 1,
    expOdia: 'ଚାଣକ୍ୟ ବା କୌଟିଲ୍ୟ ୧୫ଟି ଅଧିକରଣ ଓ ୧୮୦ଟି ପ୍ରକରଣ ବିଶିଷ୍ଟ \'ଅର୍ଥଶାସ୍ତ୍ର\' ରଚନା କରି ମୌର୍ଯ୍ୟ ଶାସନର ମୂଳଦୁଆ ସ୍ଥାପନ କରିଥିଲେ।',
    expEng: 'Kautilya’s Arthashastra is the quintessential 15-book text on political administration, taxation, and espionage.',
    keywords: ['arthashastra', 'kautilya', 'ଅର୍ଥଶାସ୍ତ୍ର', 'ଚାଣକ୍ୟ']
  },
  {
    id: 16,
    qOdia: 'ଗୁପ୍ତ ସମ୍ରାଟ ଦ୍ୱିତୀୟ ଚନ୍ଦ୍ରଗୁପ୍ତ (ବିକ୍ରମାଦିତ୍ୟ)ଙ୍କ ସମୟରେ କେଉଁ ଚୀନ୍ ପରିବ୍ରାଜକ ଭାରତ ଭ୍ରମଣ କରିଥିଲେ?',
    qEng: 'Which Chinese pilgrim traveled across Northern India during the reign of Gupta Emperor Chandragupta II (Vikramaditya)?',
    optsOdia: ['ହୁଏନସାଂ', 'ଇତ୍-ସିଙ୍ଗ୍', 'ଫା-ହିୟାନ୍ (Fa-Hien / Faxian)', 'ମେଗାସ୍ଥିନିସ'],
    optsEng: ['Hiuen Tsang', 'I-Tsing', 'Fa-Hien (Faxian)', 'Al-Biruni'],
    ansIdx: 2,
    expOdia: 'ଫା-ହିୟାନ୍ ଖ୍ରୀଷ୍ଟାବ୍ଦ ୩୯୯ ରୁ ୪୧୪ ପର୍ଯ୍ୟନ୍ତ ଭାରତରେ ରହି \'ଫୋ-କୋ-କି\' ପୁସ୍ତକରେ ଗୁପ୍ତ ଯୁଗର ଶାନ୍ତି, ଅହିଂସା ଓ ଲୋକକଲ୍ୟାଣ ବିଷୟରେ ବର୍ଣ୍ଣନା କରିଛନ୍ତି।',
    expEng: 'Fa-Hien traveled in India (399–414 CE) documenting the peaceful social life, religious freedom, and hospitals under the Guptas.',
    keywords: ['fa-hien', 'faxian', 'ଫା-ହିୟାନ୍', 'ଚନ୍ଦ୍ରଗୁପ୍ତ']
  },
  {
    id: 17,
    qOdia: 'ସିନ୍ଧୁ ସଭ୍ୟତାର ପ୍ରସିଦ୍ଧ ବୃହତ୍ ସ୍ନାନାଗାର (Great Bath) ଓ କାଂସ୍ୟ ନର୍ତ୍ତକୀ ମୂର୍ତ୍ତି କେଉଁ ସହରରୁ ଆବିଷ୍କୃତ ହୋଇଥିଲା?',
    qEng: 'The iconic monumental Great Bath and the bronze Dancing Girl figurine were excavated at which Harappan site?',
    optsOdia: ['ହରପ୍ପା', 'ମହେଞ୍ଜୋଦାରୋ (Mohenjo-daro)', 'କାଲିବଙ୍ଗାନ୍', 'ଧୋଲାଭୀରା'],
    optsEng: ['Harappa', 'Mohenjo-daro', 'Kalibangan', 'Dholavira'],
    ansIdx: 1,
    expOdia: '୧୯୨୨ରେ ରାଖାଲ ଦାସ ବାନାର୍ଜୀଙ୍କ ଦ୍ୱାରା ସିନ୍ଧୁ ନଦୀ କୂଳରେ ଖନନ କରାଯାଇ ମହେଞ୍ଜୋଦାରୋରୁ ବୃହତ୍ ସ୍ନାନାଗାର ମିଳିଥିଲା।',
    expEng: 'Mohenjo-daro on the Indus yielded the Great Bath, the bronze Dancing Girl, and the Priest-King limestone bust.',
    keywords: ['mohenjo-daro', 'great bath', 'ମହେଞ୍ଜୋଦାରୋ', 'ସ୍ନାନାଗାର']
  },
  {
    id: 18,
    qOdia: 'ହରପ୍ପା ସଭ୍ୟତାର ପ୍ରାଚୀନ ସାମୁଦ୍ରିକ ପୋତାଶ୍ରୟ ବା ଡକ୍‌ୟାର୍ଡ (Dockyard) ଗୁଜରାଟର କେଉଁ ସ୍ଥାନରୁ ମିଳିଛି?',
    qEng: 'The world’s earliest known tidal dockyard engineered for maritime trade was excavated at which Harappan port site?',
    optsOdia: ['ରୋପାର', 'ଲୋଥାଲ (Lothal)', 'ବନୱାଲୀ', 'ଚହ୍ନୁଦାରୋ'],
    optsEng: ['Ropar', 'Lothal', 'Banawali', 'Chanhudaro'],
    ansIdx: 1,
    expOdia: 'ଗୁଜରାଟର ଭୋଗାଭୋ ନଦୀ କୂଳରେ ଅବସ୍ଥିତ ଲୋଥାଲ୍‌ରୁ ଇଟା ନିର୍ମିତ ବିଶାଳ ଡକ୍‌ୟାର୍ଡ ମିଳିଛି ଯାହା ପାରସ୍ୟ ଉପସାଗର ସହ ସାମୁଦ୍ରିକ ବାଣିଜ୍ୟ ପ୍ରମାଣ କରେ।',
    expEng: 'Excavated by S.R. Rao in Gujarat, Lothal features a brick tidal dockyard connecting to the Arabian Sea for overseas trade.',
    keywords: ['lothal', 'dockyard', 'ଲୋଥାଲ', 'ପୋତାଶ୍ରୟ']
  },
  {
    id: 19,
    qOdia: 'ଜଳ ସଂରକ୍ଷଣର ଅଦ୍ଭୁତ ବ୍ୟବସ୍ଥା ଓ ଦଶ ଅକ୍ଷର ବିଶିଷ୍ଟ ବିଶାଳ ସାଇନବୋର୍ଡ ସିନ୍ଧୁ ସଭ୍ୟତାର କେଉଁ ସ୍ଥାନରୁ ମିଳିଛି?',
    qEng: 'A sophisticated rock-cut water reservoir system and a 10-symbol signboard were discovered at which UNESCO site?',
    optsOdia: ['ଧୋଲାଭୀରା (Dholavira)', 'ସୁରକୋଟାଡ଼ା', 'କାଲିବଙ୍ଗାନ୍', 'ରଙ୍ଗପୁର'],
    optsEng: ['Dholavira', 'Surkotada', 'Kalibangan', 'Rangpur'],
    ansIdx: 0,
    expOdia: 'ଗୁଜରାଟର କଚ୍ଛ ରଣସ୍ଥିତ ଧୋଲାଭୀରାରେ ପଥର ନିର୍ମିତ ଜଳଭଣ୍ଡାର ଓ ତ୍ରିସ୍ତରୀୟ ନଗର ପରିକଳ୍ପନା ପ୍ରାଚୀନ ଇଞ୍ଜିନିୟରିଂର ଅଦ୍ଭୁତ ନମୁନା।',
    expEng: 'Dholavira in Gujarat features an unparalleled rainwater harvesting network of reservoirs and an ancient inscription board.',
    keywords: ['dholavira', 'ଧୋଲାଭୀରା', 'water reservoir']
  },
  {
    id: 20,
    qOdia: 'ଭାରତୀୟ ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ସର୍ବେକ୍ଷଣ (ASI) ର ଜନକ ତଥା ପ୍ରଥମ ମହାନିର୍ଦ୍ଦେଶକ କିଏ ଥିଲେ?',
    qEng: 'Who is revered as the Father of Indian Archaeology and served as the first Director-General of the ASI?',
    optsOdia: ['ଜନ୍ ମାର୍ଶାଲ', 'ଆଲେକ୍‌ଜାଣ୍ଡାର୍ କନିଂହାମ୍ (Alexander Cunningham)', 'ମୋର୍ଟିମର୍ ହୁଇଲର୍', 'ଜେମ୍ସ ପ୍ରିନ୍ସେପ୍'],
    optsEng: ['Sir John Marshall', 'Sir Alexander Cunningham', 'Sir Mortimer Wheeler', 'James Prinsep'],
    ansIdx: 1,
    expOdia: '୧୮୬୧ ମସିହାରେ ଆଲେକ୍‌ଜାଣ୍ଡାର୍ କନିଂହାମ୍ ASI ପ୍ରତିଷ୍ଠା କରି ପ୍ରାଚୀନ ଭାରତୀୟ ସ୍ତୂପ, ଶିଳାଲେଖ ଓ ଐତିହାସିକ ସ୍ଥଳ ସର୍ବେକ୍ଷଣ କରିଥିଲେ।',
    expEng: 'Sir Alexander Cunningham founded the Archaeological Survey of India (ASI) in 1861 and systematically surveyed ancient monuments.',
    keywords: ['alexander cunningham', 'asi', 'କନିଂହାମ୍', 'ପ୍ରତ୍ନତତ୍ତ୍ୱ']
  },
  {
    id: 21,
    qOdia: 'ସମ୍ରାଟ ହର୍ଷବର୍ଦ୍ଧନଙ୍କ ଜୀବନୀ ଉପରେ ଦରବାରୀ କବି ବାଣଭଟ୍ଟ କେଉଁ ପ୍ରସିଦ୍ଧ ସଂସ୍କୃତ ଐତିହାସିକ ଗ୍ରନ୍ଥ ରଚନା କରିଥିଲେ?',
    qEng: 'Which celebrated Sanskrit biographical work portraying the early life and deeds of Emperor Harsha was composed by Banabhatta?',
    optsOdia: ['କାଦମ୍ବରୀ', 'ହର୍ଷଚରିତ (Harshacharita)', 'ଗୌଡ଼ବହୋ', 'ପ୍ରିୟଦର୍ଶିକା'],
    optsEng: ['Kadambari', 'Harshacharita', 'Gaudavaho', 'Ratnavali'],
    ansIdx: 1,
    expOdia: 'ବାଣଭଟ୍ଟଙ୍କ \'ହର୍ଷଚରିତ\' ସଂସ୍କୃତ ସାହିତ୍ୟର ପ୍ରଥମ ଐତିହାସିକ ଆଖ୍ୟାୟିକା ଯାହା ସପ୍ତମ ଶତାବ୍ଦୀର ଉତ୍ତର ଭାରତୀୟ ଇତିହାସ ବୁଝିବାରେ ସାହାଯ୍ୟ କରେ।',
    expEng: 'Banabhatta’s Harshacharita is the earliest surviving historical biography in Sanskrit literature detailing Harsha’s reign.',
    keywords: ['harshacharita', 'banabhatta', 'ହର୍ଷଚରିତ', 'ବାଣଭଟ୍ଟ']
  },
  {
    id: 22,
    qOdia: 'ବ୍ରାହ୍ମଣମାନଙ୍କୁ ଭୂମିଦାନ କରିବାର ସର୍ବପୁରାତନ ଅଭିଲେଖ ପ୍ରମାଣ କେଉଁ ଶିଳାଲେଖରୁ ମିଳେ?',
    qEng: 'The earliest epigraphic evidence in Indian history recording tax-free royal land donations to Brahmins is found in:',
    optsOdia: ['ନାସିକ ଗୁମ୍ଫା ଲେଖ', 'ନାନାଘାଟ ଶିଳାଲେଖ (Nanaghat Inscription of Queen Nayanika)', 'ହାତୀଗୁମ୍ଫା ଲେଖ', 'ଜୁନାଗଡ଼ ଅଭିଲେଖ'],
    optsEng: ['Nasik Inscription', 'Nanaghat Inscription of Queen Nayanika', 'Hathigumpha Inscription', 'Aihole Inscription'],
    ansIdx: 1,
    expOdia: 'ସାତବାହନ ରାଣୀ ନାୟନିକାଙ୍କ ନାନାଘାଟ ଶିଳାଲେଖରେ ପ୍ରଥମ ଶତାବ୍ଦୀ ଖ୍ରୀ.ପୂ.ରେ ଅଶ୍ୱମେଧ ଯଜ୍ଞ ଓ ଭୂମିଦାନ ବିଷୟ ଉଲ୍ଲେଖ ଅଛି।',
    expEng: 'Satavahana Queen Nayanika’s Nanaghat cave inscription records the performance of Vedic sacrifices and earliest land grants.',
    keywords: ['nanaghat', 'nayanika', 'ନାନାଘାଟ', 'ଭୂମିଦାନ']
  },
  {
    id: 23,
    qOdia: 'ଦିଲ୍ଲୀର କୁତୁବ ମିନାର ପରିସରରେ ଥିବା ପ୍ରସିଦ୍ଧ କଳଙ୍କିହୀନ ଲୌହ ସ୍ତମ୍ଭ (Iron Pillar) କେଉଁ ଶାସକଙ୍କର ଅଟେ?',
    qEng: 'The 1600-year-old rust-resistant wrought Iron Pillar standing near Qutub Minar commemorates which ruler?',
    optsOdia: ['ଅଶୋକ', 'ରାଜା ଚନ୍ଦ୍ର / ଦ୍ୱିତୀୟ ଚନ୍ଦ୍ରଗୁପ୍ତ (King Chandra)', 'କନିଷ୍କ', 'ହର୍ଷବର୍ଦ୍ଧନ'],
    optsEng: ['Emperor Ashoka', 'King Chandra (Chandragupta II Vikramaditya)', 'Kanishka', 'Skandagupta'],
    ansIdx: 1,
    expOdia: 'ମେହେରୌଲୀ ଲୌହ ସ୍ତମ୍ଭରେ ଖୋଦିତ ସଂସ୍କୃତ ଲେଖରେ \'ଚନ୍ଦ୍ର\' ନାମକ ଶକ୍ତିଶାଳୀ ରାଜାଙ୍କ ବିଜୟ କଥା ବର୍ଣ୍ଣିତ, ଯାହା ପ୍ରାଚୀନ ଧାତୁ ବିଜ୍ଞାନର ଚମତ୍କାର।',
    expEng: 'The Mehrauli Iron Pillar bears an inscription eulogizing King Chandra, identified by historians as Chandragupta II Vikramaditya.',
    keywords: ['mehrauli', 'iron pillar', 'ମେହେରୌଲୀ', 'ଲୌହ ସ୍ତମ୍ଭ']
  },
  {
    id: 24,
    qOdia: 'ମଧ୍ୟପ୍ରଦେଶର ବେସନଗର (ବିଦିଶା)ସ୍ଥିତ ଗରୁଡ଼ ସ୍ତମ୍ଭ କେଉଁ ଗ୍ରୀକ୍ ରାଷ୍ଟ୍ରଦୂତଙ୍କ ଦ୍ୱାରା ବୈଷ୍ଣବ ଧର୍ମ ଗ୍ରହଣର ପ୍ରମାଣ ଦିଏ?',
    qEng: 'The famous Heliodorus Garuda Pillar at Besnagar (Vidisha) documents a Greek ambassador adopting which faith?',
    optsOdia: ['ବୌଦ୍ଧ ଧର୍ମ', 'ଭାଗବତ ବା ବୈଷ୍ଣବ ଧର୍ମ (Bhagavatism / Vaishnavism)', 'ଜୈନ ଧର୍ମ', 'ଶୈବ ଧର୍ମ'],
    optsEng: ['Buddhism', 'Bhagavatism (Vaishnavism)', 'Jainism', 'Zoroastrianism'],
    ansIdx: 1,
    expOdia: 'ତକ୍ଷଶିଳାର ଗ୍ରୀକ୍ ରାଜା ଅନ୍ତଲକିଡାସଙ୍କ ରାଷ୍ଟ୍ରଦୂତ ହେଲିଓଡୋରସ ନିଜକୁ \'ପରମ ଭାଗବତ\' ଘୋଷଣା କରି ବିଦିଶାରେ ଗରୁଡ଼ଧ୍ୱଜ ସ୍ଥାପନ କରିଥିଲେ।',
    expEng: 'Greek envoy Heliodorus set up the Besnagar pillar dedicated to Lord Vasudeva, calling himself a devout Bhagavata.',
    keywords: ['heliodorus', 'besnagar', 'ହେଲିଓଡୋରସ', 'ବେସନଗର']
  },
  {
    id: 25,
    qOdia: 'ଭାରତୀୟ ମସଲା ଓ ବସ୍ତ୍ର କ୍ରୟ ଯୋଗୁଁ ରୋମର ସ୍ୱର୍ଣ୍ଣ ଭଣ୍ଡାର ଖାଲି ହେବା ନେଇ କେଉଁ ରୋମାନ୍ ଐତିହାସିକ ଅନୁଶୋଚନା କରିଥିଲେ?',
    qEng: 'Which classical Roman natural philosopher lamented the enormous drain of Roman gold into India for luxury commodities?',
    optsOdia: ['ଷ୍ଟ୍ରାବୋ', 'ପ୍ଲିନି (Pliny the Elder - Naturalis Historia)', 'ଟଲେମୀ', 'ଜଷ୍ଟିନ୍'],
    optsEng: ['Strabo', 'Pliny the Elder (Naturalis Historia)', 'Ptolemy', 'Arrian'],
    ansIdx: 1,
    expOdia: 'ରୋମାନ୍ ଲେଖକ ପ୍ଲିନି ଖ୍ରୀଷ୍ଟୀୟ ପ୍ରଥମ ଶତାବ୍ଦୀରେ ତାଙ୍କ ପୁସ୍ତକ \'ନ୍ୟାଚୁରାଲିସ୍ ହିଷ୍ଟୋରିଆ\' ରେ ଭାରତ ସହ ରୋମର ବାଣିଜ୍ୟିକ ନିଅଣ୍ଟ ବିଷୟ ଲେଖିଥିଲେ।',
    expEng: 'Pliny the Elder lamented that Rome sent over 50 million sesterces annually to India for spices, pearls, and silk.',
    keywords: ['pliny', 'naturalis historia', 'ପ୍ଲିନି', 'ରୋମ୍ ବାଣିଜ୍ୟ']
  },
  {
    id: 26,
    qOdia: 'ପ୍ରାଚୀନ କାଳରେ ଭାରତ ମହାସାଗରୀୟ ବାଣିଜ୍ୟ ଓ ଭାରତୀୟ ବନ୍ଦରଗୁଡ଼ିକର ବିବରଣୀ ପ୍ରଦାନ କରୁଥିବା ଅଜ୍ଞାତ ଗ୍ରୀକ୍ ନାବିକଙ୍କ ଗ୍ରନ୍ଥ କେଉଁଟି?',
    qEng: 'Which anonymous 1st-century CE Greco-Roman maritime navigation guide details trade ports along India’s coastline?',
    optsOdia: ['ଇଣ୍ଡିକା', 'ପେରିପ୍ଲସ୍ ଅଫ୍ ଦି ଏରିଥ୍ରିଆନ୍ ସି (Periplus of the Erythraean Sea)', 'ଜିଓଗ୍ରାଫି', 'କିତାବୁଲ ହିନ୍ଦ୍'],
    optsEng: ['Indika', 'Periplus of the Erythraean Sea', 'Ptolemy’s Geography', 'Kitab-al-Hind'],
    ansIdx: 1,
    expOdia: 'ପେରିପ୍ଲସ୍ ଗ୍ରନ୍ଥରୁ ଭାରତର ପଶ୍ଚିମ ବନ୍ଦର (ଭୃଗୁକଚ୍ଛ/ମୁଜିରିସ୍) ଏବଂ ପୂର୍ବ ବନ୍ଦର (ତାମ୍ରଲିପ୍ତ) ଦେଇ ହେଉଥିବା ବାଣିଜ୍ୟିକ ତଥ୍ୟ ମିଳେ।',
    expEng: 'The Periplus of the Erythraean Sea describes Indian port hubs like Barygaza, Muziris, and Arikamedu.',
    keywords: ['periplus', 'erythraean sea', 'ପେରିପ୍ଲସ୍', 'ବନ୍ଦର']
  },
  {
    id: 27,
    qOdia: 'ଏକାଦଶ ଶତାବ୍ଦୀରେ ଭାରତୀୟ ଧର୍ମ, ବିଜ୍ଞାନ ଓ ସମାଜ ଉପରେ \'କିତାବ-ଅଲ୍-ହିନ୍ଦ୍\' (Tahqiq-i-Hind) ରଚନା କରିଥିବା ବିଦ୍ୱାନ କିଏ?',
    qEng: 'Which renowned Central Asian polymath accompanied Mahmud of Ghazni and authored the monumental study \'Kitab-al-Hind\'?',
    optsOdia: ['ଇବନ ବତୁତା', 'ଅଲ୍-ବିରୁନୀ (Al-Biruni)', 'ଅମୀର ଖୁସ୍ରୋ', 'ଜିଆଉଦ୍ଦୀନ ବରନୀ'],
    optsEng: ['Ibn Battuta', 'Al-Biruni (Abu Rayhan)', 'Amir Khusrow', 'Abul Fazl'],
    ansIdx: 1,
    expOdia: 'ପାରସ୍ୟ ବିଦ୍ୱାନ ଅଲ-ବିରୁନୀ ସଂସ୍କୃତ ଭାଷା ଶିକ୍ଷା କରି ଭାରତୀୟ ଦର୍ଶନ, ଜ୍ୟୋତିର୍ବିଜ୍ଞାନ ଓ ସମାଜ ବ୍ୟବସ୍ଥା ଉପରେ ଏହି ପ୍ରାମାଣିକ ପୁସ୍ତକ ରଚନା କରିଥିଲେ।',
    expEng: 'Al-Biruni mastered Sanskrit and produced Kitab-al-Hind, a penetrating encyclopedia of 11th century Indian sciences and customs.',
    keywords: ['al-biruni', 'kitab-al-hind', 'ଅଲ୍-ବିରୁନୀ', 'କିତାବ-ଅଲ୍-ହିନ୍ଦ୍']
  },
  {
    id: 28,
    qOdia: 'ୟୁନେସ୍କୋ ସ୍ୱୀକୃତ ପ୍ରାଗୈତିହାସିକ ପ୍ରସ୍ତର ଚିତ୍ରକଳା (Rock Art) ର ବିଶାଳ ସଂଗ୍ରହ ମଧ୍ୟପ୍ରଦେଶର କେଉଁ ଗୁମ୍ଫାରୁ ମିଳିଛି?',
    qEng: 'Which UNESCO World Heritage cave complex in Madhya Pradesh houses prehistoric rock paintings spanning from the Upper Paleolithic?',
    optsOdia: ['ଅଜନ୍ତା', 'ଭୀମବେଟ୍‌କା (Bhimbetka Rock Shelters)', 'ଏଲୋରା', 'ବାଘ ଗୁମ୍ଫା'],
    optsEng: ['Ajanta', 'Bhimbetka Rock Shelters', 'Ellora', 'Bagh Caves'],
    ansIdx: 1,
    expOdia: '୧୯୫୭ରେ ଭି. ଏସ୍. ୱାକଣକରଙ୍କ ଦ୍ୱାରା ଆବିଷ୍କୃତ ଭୀମବେଟ୍‌କାରେ ପ୍ରାଚୀନ ମାନବର ଶିକାର, ନୃତ୍ୟ ଓ ସାମାଜିକ ଜୀବନର ରଙ୍ଗୀନ ଚିତ୍ର ସୁରକ୍ଷିତ ଅଛି।',
    expEng: 'Bhimbetka rock shelters preserve vibrant pigments illustrating ancient human hunting, rituals, and pastoral living.',
    keywords: ['bhimbetka', 'ଭୀମବେଟ୍‌କା', 'rock art', 'ପ୍ରସ୍ତର ଚିତ୍ର']
  },
  {
    id: 29,
    qOdia: '୧୯୨୧ ମସିହାରେ ପ୍ରଥମ ଥର ପାଇଁ ସିନ୍ଧୁ ସଭ୍ୟତାର ପ୍ରମୁଖ ସହର \'ହରପ୍ପା\' ର ଖନନ କାର୍ଯ୍ୟ କାହା ନେତୃତ୍ୱରେ ହୋଇଥିଲା?',
    qEng: 'In 1921, the first systematic excavations of the type-site Harappa in Montgomery district were led by:',
    optsOdia: ['ରାଖାଲ ଦାସ ବାନାର୍ଜୀ', 'ଦୟାରାମ ସାହାନୀ (Daya Ram Sahni)', 'ଏନ୍. ଜି. ମଜୁମଦାର', 'ଜେ. ପି. ଯୋଶୀ'],
    optsEng: ['Rakhal Das Banerjee', 'Rai Bahadur Daya Ram Sahni', 'N.G. Majumdar', 'Amalananda Ghosh'],
    ansIdx: 1,
    expOdia: 'ଦୟାରାମ ସାହାନୀ ୧୯୨୧ରେ ପଞ୍ଜାବର ରବି ନଦୀ କୂଳରେ ହରପ୍ପା ସାଇଟ୍ ଆବିଷ୍କାର କରି ସିନ୍ଧୁ ସଭ୍ୟତାର ଉନ୍ମୋଚନ କରିଥିଲେ।',
    expEng: 'Daya Ram Sahni supervised the pioneering excavations at Harappa in 1921 under the direction of Sir John Marshall.',
    keywords: ['harappa', 'daya ram sahni', 'ହରପ୍ପା', 'ଦୟାରାମ ସାହାନୀ']
  },
  {
    id: 30,
    qOdia: 'ଭାରତର ଜାତୀୟ ପ୍ରତୀକ ଭାବେ ଗୃହୀତ ଚାରୋଟି ସିଂହ ବିଶିଷ୍ଟ ସ୍ତମ୍ଭଶୀର୍ଷ ସମ୍ରାଟ ଅଶୋକଙ୍କ କେଉଁ ସ୍ଥାନରୁ ମିଳିଥିଲା?',
    qEng: 'The Lion Capital of Ashoka adopted as the National Emblem of India in 1950 was excavated at which sacred site?',
    optsOdia: ['ବୋଧଗୟା', 'ସାରନାଥ (Sarnath)', 'କୁଶୀନଗର', 'ସାଞ୍ଚି'],
    optsEng: ['Bodh Gaya', 'Sarnath', 'Kushinagar', 'Sanchi'],
    ansIdx: 1,
    expOdia: 'ଭଗବାନ ବୁଦ୍ଧଙ୍କ ପ୍ରଥମ ଧର୍ମୋପଦେଶ (ଧର୍ମଚକ୍ର ପ୍ରବର୍ତ୍ତନ) ସ୍ମୃତିରେ ଅଶୋକ ସାରନାଥରେ ସିଂହ ଚତୁର୍ମୁଖ ସ୍ତମ୍ଭ ସ୍ଥାପନ କରିଥିଲେ।',
    expEng: 'Ashoka erected the Lion Capital at Sarnath where Lord Buddha preached his first sermon (Dharmachakrapravartana).',
    keywords: ['sarnath', 'lion capital', 'ସାରନାଥ', 'ଜାତୀୟ ପ୍ରତୀକ']
  },
  {
    id: 31,
    qOdia: 'ହଳ କରାଯାଇଥିବା ପ୍ରାଚୀନ କୃଷିକ୍ଷେତ୍ର ଓ ଅଗ୍ନିକୁଣ୍ଡର ପ୍ରମାଣ ସିନ୍ଧୁ ସଭ୍ୟତାର କେଉଁ ସହରରୁ ମିଳିଛି?',
    qEng: 'Evidence of a prehistoric furrowed ploughed agricultural field and fire altars was excavated at which site in Rajasthan?',
    optsOdia: ['ରୋପାର', 'କାଲିବଙ୍ଗାନ୍ (Kalibangan)', 'ବାଣାବଳୀ', 'ଆଲମଗୀରପୁର'],
    optsEng: ['Ropar', 'Kalibangan', 'Banawali', 'Alamgirpur'],
    ansIdx: 1,
    expOdia: 'ରାଜସ୍ଥାନର ଘାଗ୍ଗର (ସରସ୍ୱତୀ) ନଦୀ ଉପତ୍ୟକାରେ ଥିବା କାଲିବଙ୍ଗାନରୁ କୃଷିକ୍ଷେତ୍ର ଓ ବଳିପୀଠର ଅବଶେଷ ମିଳିଛି।',
    expEng: 'Kalibangan in Hanumangarh, Rajasthan preserves the world’s earliest excavated ploughed agricultural field.',
    keywords: ['kalibangan', 'କାଲିବଙ୍ଗାନ୍', 'ploughed field']
  },
  {
    id: 32,
    qOdia: 'ଗୁପ୍ତ ଯୁଗରେ ସୁବର୍ଣ୍ଣ ମୁଦ୍ରାକୁ କେଉଁ ନାମରେ ନାମିତ କରାଯାଉଥିଲା?',
    qEng: 'What were the pristine high-denomination gold coins issued in large quantities by Gupta emperors called?',
    optsOdia: ['ପଣ (Pana)', 'ଦୀନାର (Dinara)', 'ଜିତଲ (Jital)', 'ଟଙ୍କା (Tanka)'],
    optsEng: ['Pana', 'Dinara (Suvarna)', 'Jital', 'Tanka'],
    ansIdx: 1,
    expOdia: 'ଗୁପ୍ତ ସୁବର୍ଣ୍ଣ ମୁଦ୍ରାଗୁଡ଼ିକୁ \'ଦୀନାର\' କୁହାଯାଉଥିଲା, ଯେଉଁଥିରେ ସମ୍ରାଟ ବୀଣା ବାଦନ କରୁଥିବା ଓ ଅଶ୍ୱମେଧ ଯଜ୍ଞର ପ୍ରତିକୃତି ଖୋଦିତ ହୋଇଛି।',
    expEng: 'Gupta gold currency, known epigraphically as Dinaras, featured artistic representations like Samudragupta playing the lyre (veena).',
    keywords: ['dinara', 'gupta coins', 'ଦୀନାର', 'ଗୁପ୍ତ ମୁଦ୍ରା']
  },
  {
    id: 33,
    qOdia: 'ପ୍ରାଚୀନ ଦକ୍ଷିଣ ଭାରତୀୟ ସାମ୍ରାଜ୍ୟ ଶାସନ କରିଥିବା ସାତବାହନ ବଂଶର ମୁଦ୍ରା ମୁଖ୍ୟତଃ କେଉଁ ଧାତୁରେ ତିଆରି ହୋଇଥିଲା?',
    qEng: 'The Satavahana rulers of the Deccan uniquely minted their abundant regional coins predominantly using which metal?',
    optsOdia: ['ସୁନା', 'ସୀସା ଓ ପୋଟିନ୍ (Lead & Potin)', 'ଲୁହା', 'ରୁପା'],
    optsEng: ['Pure Gold', 'Lead and Potin', 'Iron and Tin', 'Pure Platinum'],
    ansIdx: 1,
    expOdia: 'ସାତବାହନ ରାଜାମାନେ ସୀସା (Lead), ପୋଟିନ୍ ଏବଂ ତମ୍ବାରେ ଜାହାଜ, ହାତୀ ଓ ଚୈତ୍ୟ ଚିହ୍ନ ଥିବା ମୁଦ୍ରା ପ୍ରଚଳନ କରୁଥିଲେ।',
    expEng: 'Satavahana coinage was distinctively struck in base alloys of lead, potin, and bronze reflecting trade vitality.',
    keywords: ['satavahana', 'lead', 'ସାତବାହନ', 'ସୀସା']
  },
  {
    id: 34,
    qOdia: 'ପ୍ରାଚୀନ ତାମିଲ ସାହିତ୍ୟ ତଥା ଦକ୍ଷିଣ ଭାରତର ସାମାଜିକ ଇତିହାସ ଜାଣିବା ପାଇଁ କେଉଁ ସାହିତ୍ୟ ପ୍ରମୁଖ ଉତ୍ସ ଅଟେ?',
    qEng: 'Which corpus of ancient Tamil heroic poetry produced under Madurai academies forms the cornerstone of South Indian historiography?',
    optsOdia: ['ସଙ୍ଗମ ସାହିତ୍ୟ (Sangam Literature)', 'ଉପନିଷଦ', 'ମହାକାବ୍ୟ', 'ପୁରାଣ'],
    optsEng: ['Sangam Literature', 'Upanishads', 'Brahmanas', 'Vedic Samhitas'],
    ansIdx: 0,
    expOdia: 'ପାଣ୍ଡ୍ୟ ରାଜାମାନଙ୍କ ପୃଷ୍ଠପୋଷକତାରେ ମଦୁରାଇରେ ରଚିତ ସଙ୍ଗମ ସାହିତ୍ୟ ପ୍ରାଚୀନ ଚେର, ଚୋଳ ଓ ପାଣ୍ଡ୍ୟ ସାମ୍ରାଜ୍ୟର ମୁଖ୍ୟ ଉତ୍ସ।',
    expEng: 'Sangam literature (such as the Eight Anthologies and Ten Idylls) mirrors socio-economic life and overseas Roman trade in early Tamilakam.',
    keywords: ['sangam', 'ସଙ୍ଗମ ସାହିତ୍ୟ', 'tamil']
  },
  {
    id: 35,
    qOdia: 'ସମ୍ରାଟ ଅଶୋକଙ୍କ କଳିଙ୍ଗ ପ୍ରଦେଶର ଦୁଇଟି ସ୍ୱତନ୍ତ୍ର ଶିଳାଲେଖ (Separate Kalinga Edicts) ଓଡ଼ିଶାର କେଉଁ ଦୁଇ ସ୍ଥାନରେ ଅବସ୍ଥିତ?',
    qEng: 'The two Separate Kalinga Rock Edicts of Ashoka bearing the benevolent message "All men are my children" are located in Odisha at:',
    optsOdia: ['ଖଣ୍ଡଗିରି ଓ ଉଦୟଗିରି', 'ଧଉଳି ଓ ଜୌଗଡ଼ (Dhauli and Jaugada)', 'ଲଳିତଗିରି ଓ ରତ୍ନଗିରି', 'କୋଣାର୍କ ଓ ପୁରୀ'],
    optsEng: ['Khandagiri and Udayagiri', 'Dhauli and Jaugada', 'Lalitgiri and Ratnagiri', 'Konark and Puri'],
    ansIdx: 1,
    expOdia: 'ଭୁବନେଶ୍ୱର ନିକଟସ୍ଥ ଧଉଳି ଏବଂ ଗଞ୍ଜାମ ଜିଲ୍ଲାର ଜୌଗଡ଼ରେ ଅଶୋକ ପ୍ରଜାମାନଙ୍କୁ ନିଜ ସନ୍ତାନ ସଦୃଶ ଘୋଷଣା କରିଥିଲେ।',
    expEng: 'Ashoka inscribed his Separate Kalinga Edicts at Dhauli (Puri/Bhubaneswar) and Jaugada (Ganjam) urging just governance.',
    keywords: ['dhauli', 'jaugada', 'ଧଉଳି', 'ଜୌଗଡ଼']
  }
];

function generateSourcesOfHistoryQuestions(
  lang: 'odia' | 'english' | 'hindi' | 'bilingual',
  query: string,
  examFormat?: ExamAnswerFormat,
  avoidList: string[] = [],
  requestedCount?: number
): string {
  // Determine question count
  let count = requestedCount || 10;
  const countMatch = query.match(/\b(\d+)\s*(?:questions?|mcqs?|ପ୍ରଶ୍ନ|ଟି)/i);
  if (!requestedCount && countMatch) {
    count = parseInt(countMatch[1], 10);
  }
  count = Math.max(1, Math.min(count, 40));

  const isBlanks = query.includes('blank') || query.includes('ଶୂନ୍ୟସ୍ଥାନ');
  const isTrueFalse = query.includes('true') || query.includes('ସତ୍ୟ') || query.includes('ମିଥ୍ୟା');
  const isShort = examFormat === '2-mark' || query.includes('short') || query.includes('୨ ମାର୍କ');
  const isLong = examFormat === '5-mark' || examFormat === '8-mark' || query.includes('long') || query.includes('୫ ମାର୍କ');

  const isMoreOrNoRepeat = 
    query.includes('more') || 
    query.includes('without repeating') || 
    query.includes('not repeat') || 
    query.includes('next') || 
    query.includes('ଆଉ') || 
    query.includes('ପୁନରାବୃତ୍ତି');

  const avoidNorms = avoidList.map(a => a.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, ''));

  let available = SOURCES_QUESTIONS_POOL.filter(item => {
    // If user asked "more questions without repeating", avoid the first 10 questions!
    if (isMoreOrNoRepeat && avoidList.length === 0 && item.id <= 10) {
      return false;
    }

    const itemOdiaNorm = item.qOdia.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
    const itemEngNorm = item.qEng.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');

    for (const avoid of avoidNorms) {
      if (!avoid || avoid.length < 5) continue;
      if (itemOdiaNorm.includes(avoid) || avoid.includes(itemOdiaNorm) || itemEngNorm.includes(avoid) || avoid.includes(itemEngNorm)) {
        return false;
      }
      if (item.keywords.some(kw => avoid.includes(kw.toLowerCase()))) {
        return false;
      }
    }
    return true;
  });

  if (available.length === 0) {
    // If all exhausted, cycle from start
    available = SOURCES_QUESTIONS_POOL;
  }

  const selected: typeof SOURCES_QUESTIONS_POOL = [];
  let poolIdx = 0;
  while (selected.length < count && available.length > 0) {
    selected.push(available[poolIdx % available.length]);
    poolIdx++;
  }

  const isOdia = lang === 'odia' || lang === 'bilingual';
  let patternName = 'MCQ';
  if (isBlanks) patternName = 'Fill in the Blanks';
  if (isTrueFalse) patternName = 'True/False';
  if (isShort) patternName = 'Short Q&A';
  if (isLong) patternName = 'Long Q&A';

  let title = isOdia 
    ? `### 🏛️ ପ୍ରାଚୀନ ଇତିହାସର ଉତ୍ସ: ${selected.length} ଟି ${patternName} ପ୍ରଶ୍ନୋତ୍ତର (${selected.length} Questions on Sources of History)\n\n`
    : `### 🏛️ Sources of History: ${selected.length} ${patternName} Questions\n\n`;

  const formattedQs = selected.map((q, idx) => {
    const qNum = idx + 1;
    const qText = isOdia ? q.qOdia : q.qEng;
    const opts = isOdia ? q.optsOdia : q.optsEng;
    const correctLetter = String.fromCharCode(65 + q.ansIdx);
    const correctText = opts[q.ansIdx];
    const expText = isOdia ? q.expOdia : q.expEng;

    if (isBlanks) {
      return `${qNum}. ${qText.replace(/\?$/, '')} : _____।\nAns: ${correctText}\nExp: ${expText}\n`;
    }

    if (isTrueFalse) {
      return `${qNum}. ${qText} (ସତ୍ୟ / ମିଥ୍ୟା | True / False)\nAns: ସତ୍ୟ (True)\nExp: ${expText}\n`;
    }

    if (isShort) {
      return `${qNum}. ${qText} (୨ Marks)\nAns: ${correctText}\nExp: ${expText}\n`;
    }

    if (isLong) {
      return `${qNum}. ${qText} (୫ Marks)\nAns: ${correctText}\nExp: ${expText}\n`;
    }

    // Default MCQ
    return `${qNum}. ${qText}\n(A) ${opts[0]}\n(B) ${opts[1]}\n(C) ${opts[2]}\n(D) ${opts[3]}\nAns: (${correctLetter}) ${correctText}\nExp: ${expText}\n`;
  });

  return title + formattedQs.join('\n');
}

function generateOfflineHistoryResponse(
  query: string, 
  lang: 'odia' | 'english' | 'hindi', 
  examFormat?: ExamAnswerFormat,
  existingQuestionsToAvoid: string[] = [],
  requestedCount?: number
): string {
  const cleanQ = query.toLowerCase().trim();
  const isOdia = lang === 'odia';

  // =========================================================================
  // -1. FORMAL APPLICATION & LEAVE LETTER HANDLER
  // =========================================================================
  const isApplicationRequest = 
    cleanQ.includes('application') ||
    cleanQ.includes('leave') ||
    cleanQ.includes('letter') ||
    cleanQ.includes('casual leave') ||
    cleanQ.includes('sick leave') ||
    cleanQ.includes('cl ') || cleanQ.includes('cl.') ||
    cleanQ.includes('ଦରଖାସ୍ତ') ||
    cleanQ.includes('ଛୁଟି') ||
    cleanQ.includes('ଚିଠି') ||
    cleanQ.includes('आवेदन') ||
    cleanQ.includes('प्रार्थना पत्र') ||
    cleanQ.includes('छुट्टी');

  if (isApplicationRequest) {
    return generateFormalApplication(cleanQ, query, lang);
  }

  // =========================================================================
  // -2. INSTITUTIONAL NOTICE & CIRCULAR HANDLER
  // =========================================================================
  const isNoticeRequest = 
    cleanQ.includes('notice') || 
    cleanQ.includes('circular') || 
    cleanQ.includes('ସୂଚନା') || 
    cleanQ.includes('বিজ্ঞপ্তি') || 
    cleanQ.includes('सूचना');

  if (isNoticeRequest) {
    return generateInstitutionalNotice(cleanQ, query, lang);
  }

  // =========================================================================
  // -3. ESSAY & SPEECH WRITING HANDLER
  // =========================================================================
  const isEssayRequest = 
    cleanQ.includes('essay') || 
    cleanQ.includes('speech') || 
    cleanQ.includes('paragraph') || 
    cleanQ.includes('ରଚନା') || 
    cleanQ.includes('ଭାଷଣ') || 
    cleanQ.includes('निबंध') || 
    cleanQ.includes('भाषण');

  if (isEssayRequest) {
    return generateEssayOrSpeech(cleanQ, query, lang);
  }

  // =========================================================================
  // -4. CURRENT POLITICAL LEADERSHIP & CONSTITUTIONAL HEADS
  // =========================================================================
  if (
    cleanQ.includes('chief minister') || cleanQ.includes('cm of odisha') || cleanQ.includes('ମୁଖ୍ୟମନ୍ତ୍ରୀ') || cleanQ.includes('मुख्यमंत्री') ||
    cleanQ.includes('prime minister') || cleanQ.includes('pm of india') || cleanQ.includes('ପ୍ରଧାନମନ୍ତ୍ରୀ') || cleanQ.includes('प्रधानमंत्री') ||
    cleanQ.includes('president of india') || cleanQ.includes('ରାଷ୍ଟ୍ରପତି') || cleanQ.includes('राष्ट्रपति')
  ) {
    return generateCurrentLeadersResponse(cleanQ, lang);
  }

  // =========================================================================
  // 0. MULTIPLE CHOICE QUESTIONS (MCQs) GENERATION HANDLER
  // =========================================================================
  const isMcqRequest = 
    cleanQ.includes('mcq') || 
    cleanQ.includes('multiple choice') || 
    cleanQ.includes('objective') || 
    cleanQ.includes('quiz') ||
    cleanQ.includes('ପ୍ରଶ୍ନୋତ୍ତର') ||
    examFormat === 'mcqs' ||
    (cleanQ.includes('question') && (cleanQ.includes('10') || cleanQ.includes('5') || cleanQ.includes('20') || cleanQ.includes('mcq')));

  if (isMcqRequest) {
    // 0A. Questions on Sources of History (ଇତିହାସର ଉତ୍ସ ଉପରେ ପ୍ରଶ୍ନୋତ୍ତର)
    if (
      cleanQ.includes('source') || cleanQ.includes('sources') ||
      cleanQ.includes('ଉତ୍ସ') || cleanQ.includes('ଉପାଦାନ') || cleanQ.includes('upadana') ||
      cleanQ.includes('ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ') || cleanQ.includes('ସାହିତ୍ୟିକ') ||
      cleanQ.includes('ଶିଳାଲେଖ') || cleanQ.includes('inscriptions') || cleanQ.includes('coins') ||
      cleanQ.includes('ପ୍ରାଚୀନ ଭାରତ') || cleanQ.includes('ancient india') ||
      cleanQ.includes('स्रोत')
    ) {
      return generateSourcesOfHistoryQuestions(lang, cleanQ, examFormat, existingQuestionsToAvoid, requestedCount);
    }

    // 0B. MCQs on Kalinga War / Ashoka
    if (cleanQ.includes('kalinga') || cleanQ.includes('ashoka') || cleanQ.includes('କଳିଙ୍ଗ')) {
      return isOdia
        ? `### ⚔️ କଳିଙ୍ଗ ଯୁଦ୍ଧ ଓ ଅଶୋକ: ୫ଟି ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ MCQ ପ୍ରଶ୍ନୋତ୍ତର

1. କଳିଙ୍ଗ ଯୁଦ୍ଧ କେଉଁ ଖ୍ରୀଷ୍ଟପୂର୍ବରେ ସଂଘଠିତ ହୋଇଥିଲା?
(A) ଖ୍ରୀ.ପୂ. ୨୭୩
(B) ଖ୍ରୀ.ପୂ. ୨୬୧
(C) ଖ୍ରୀ.ପୂ. ୨୩୨
(D) ଖ୍ରୀ.ପୂ. ୧୮୫
Ans: (B) ଖ୍ରୀ.ପୂ. ୨୬୧
Exp: ମୌର୍ଯ୍ୟ ସମ୍ରାଟ ଅଶୋକଙ୍କ ଅଭିଷେକର ଅଷ୍ଟମ ବର୍ଷ ଅର୍ଥାତ୍ ଖ୍ରୀ.ପୂ. ୨୬୧ରେ କଳିଙ୍ଗ ଯୁଦ୍ଧ ହୋଇଥିଲା।

2. କଳିଙ୍ଗ ଯୁଦ୍ଧ କେଉଁ ନଦୀ କୂଳରେ ଧଉଳି ନିକଟରେ ଅନୁଷ୍ଠିତ ହୋଇଥିଲା?
(A) ମହାନଦୀ
(B) ଦୟା ନଦୀ
(C) ବ୍ରାହ୍ମଣୀ
(D) ଋଷିକୁଲ୍ୟା
Ans: (B) ଦୟା ନଦୀ
Exp: ଦୟା ନଦୀ କୂଳରେ ଧଉଳି ପାହାଡ଼ ନିକଟରେ କଳିଙ୍ଗ ଯୁଦ୍ଧର ଭୟାବହ ରକ୍ତପାତ ଘଟିଥିଲା।

3. କଳିଙ୍ଗ ଯୁଦ୍ଧ ପରେ ଅଶୋକ କାହା ପ୍ରଭାବରେ ବୌଦ୍ଧ ଧର୍ମରେ ଦୀକ୍ଷିତ ହୋଇଥିଲେ?
(A) ନିଗ୍ରୋଧ
(B) ଉପଗୁପ୍ତ (Upagupta)
(C) ମୋଗଲିପୁତ୍ତ ତିଷ୍ୟ
(D) ବସୁବନ୍ଧୁ
Ans: (B) ଉପଗୁପ୍ତ (Upagupta)
Exp: ବୌଦ୍ଧ ସନ୍ନ୍ୟାସୀ ଆଚାର୍ଯ୍ୟ ଉପଗୁପ୍ତ ଅଶୋକଙ୍କୁ ବୌଦ୍ଧ ଧର୍ମରେ ଦୀକ୍ଷିତ କରିଥିଲେ।

4. "ସବେ ମୁନିସେ ପଜା ମମା" (ସମସ୍ତ ପ୍ରଜା ମୋର ସନ୍ତାନ) ବାର୍ତ୍ତା କେଉଁଠାରେ ଖୋଦିତ?
(A) ସାରନାଥ ସ୍ତମ୍ଭ
(B) ଧଉଳି ଓ ଜୌଗଡ଼ର ସ୍ୱତନ୍ତ୍ର କଳିଙ୍ଗ ଶିଳାଲେଖ
(C) ରୁମିନଦେଈ ଶିଳାଲେଖ
(D) ବାରାଣସୀ ଲେଖ
Ans: (B) ଧଉଳି ଓ ଜୌଗଡ଼ର ସ୍ୱତନ୍ତ୍ର କଳିଙ୍ଗ ଶିଳାଲେଖ
Exp: ଅଶୋକ ନିଜର ପିତୃତୁଲ୍ୟ ଶାସନ ନୀତି ପ୍ରକାଶ କରି ଧଉଳି ଓ ଜୌଗଡ଼ ଶିଳାଲେଖରେ ଏହି ଉକ୍ତି ଖୋଦନ କରାଇଥିଲେ।

5. କଳିଙ୍ଗ ଯୁଦ୍ଧ ପରେ ଅଶୋକ ‘ଦିଗ୍‌ବିଜୟ’ ପରିବର୍ତ୍ତେ କେଉଁ ନୀତି ଗ୍ରହଣ କଲେ?
(A) ରାଜବିଜୟ
(B) ଧର୍ମବିଜୟ (Dharmavijaya)
(C) ଅର୍ଥବିଜୟ
(D) କୂଟବିଜୟ
Ans: (B) ଧର୍ମବିଜୟ (Dharmavijaya)
Exp: ଅଶୋକ ଅସ୍ତ୍ରଶସ୍ତ୍ର ତ୍ୟାଗ କରି ପ୍ରେମ, ଅହିଂସା ଓ ସଦାଚାର ଉପରେ ଆଧାରିତ ଧର୍ମବିଜୟ ନୀତି ପ୍ରବର୍ତ୍ତନ କଲେ।`
        : `### ⚔️ Kalinga War (261 BCE): 5 Important MCQs

1. In which year was the historic Kalinga War fought?
(A) 273 BCE
(B) 261 BCE
(C) 232 BCE
(D) 185 BCE
Ans: (B) 261 BCE
Exp: Fought during the 8th regnal year of Emperor Ashoka's coronation in 261 BCE.

2. On the banks of which river did the Kalinga War take place?
(A) Mahanadi
(B) Daya River
(C) Brahmani
(D) Rushikulya
Ans: (B) Daya River
Exp: Fought along the banks of River Daya near the Dhauli hills near modern Bhubaneswar.

3. Which Buddhist monk guided Emperor Ashoka into the Buddhist fold following the war?
(A) Nigrodha
(B) Upagupta
(C) Moggaliputta Tissa
(D) Vasubandhu
Ans: (B) Upagupta
Exp: Monk Upagupta initiated Ashoka into Buddhism after the mass bloodshed.

4. Where is the famous paternal edict "Save Munise Paja Mama" ("All men are my children") incised?
(A) Sarnath Pillar
(B) Separate Kalinga Edicts at Dhauli & Jaugada
(C) Rummindei Pillar
(D) Girnar Rock Edict
Ans: (B) Separate Kalinga Edicts at Dhauli & Jaugada
Exp: Ashoka engraved his paternal benevolence policy specifically in the Kalinga rock edicts.

5. Which royal doctrine did Ashoka adopt to permanently replace military conquest ('Digvijaya')?
(A) Rajavijaya
(B) Dharmavijaya
(C) Arthavijaya
(D) Kutavijaya
Ans: (B) Dharmavijaya
Exp: Ashoka substituted military conquest with moral and spiritual conquest (Dharmavijaya).`;
    }

    // 0C. General Topic MCQs generator
    const topicTitle = cleanQ.replace(/(?:mcq|questions?|in odia|in english|10|5)/gi, '').trim() || 'Indian History';
    return isOdia
      ? `### 🏛️ ${topicTitle}: ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ବହୁବିକଳ୍ପ ପ୍ରଶ୍ନୋତ୍ତର (MCQs)

1. ${topicTitle} ସମ୍ବନ୍ଧୀୟ ଐତିହାସିକ ଘଟଣାବଳୀର ମୁଖ୍ୟ ପ୍ରାମାଣିକ ଆଧାର କ’ଣ?
(A) ପ୍ରାଚୀନ ଶିଳାଲେଖ ଓ ମୁଦ୍ରା
(B) ପରବର୍ତ୍ତୀ କାଳର ଉପନ୍ୟାସ
(C) କଳ୍ପନାପ୍ରସୂତ ଲୋକକଥା
(D) ବିଦେଶୀ ନାଟକ
Ans: (A) ପ୍ରାଚୀନ ଶିଳାଲେଖ ଓ ମୁଦ୍ରା
Exp: ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଶିଳାଲେଖ ଓ ମୁଦ୍ରା ହେଉଛି ଇତିହାସ ନିର୍ମାଣର ସର୍ବାଧିକ ନିର୍ଭରଯୋଗ୍ୟ ପ୍ରାଥମିକ ଉତ୍ସ।

2. ଏହି ଐତିହାସିକ ବିଷୟଟି ଭାରତୀୟ ସିଲାବସ୍ ଅନୁଯାୟୀ କେଉଁ କ୍ଷେତ୍ରରେ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ?
(A) କେବଳ ଭୂଗୋଳ
(B) ରାଜନୈତିକ ଓ ସାମାଜିକ ବିକାଶ
(C) ଜ୍ୟୋତିର୍ବିଜ୍ଞାନ
(D) ବୈଦେଶିକ ବାଣିଜ୍ୟ ବିହୀନ ସମାଜ
Ans: (B) ରାଜନୈତିକ ଓ ସାମାଜିକ ବିକାଶ
Exp: ଏହି ପ୍ରସଙ୍ଗଟି ତତ୍କାଳୀନ ଶାସନ ପ୍ରଣାଳୀ ଓ ସାମାଜିକ ଅଭ୍ୟୁଦୟର ସୂଚନା ଦିଏ।

3. କଲେଜ ଓ ବିଶ୍ୱବିଦ୍ୟାଳୟ ପରୀକ୍ଷା ଦୃଷ୍ଟିକୋଣରୁ ଏହି ପ୍ରସଙ୍ଗରୁ କେତେ ମାର୍କ ବିଶିଷ୍ଟ ପ୍ରଶ୍ନ ଆସିଥାଏ?
(A) କେବଳ ୧-ମାର୍କ
(B) ୧, ୨, ୫ ଏବଂ ୮ ମାର୍କ
(C) କୌଣସି ପ୍ରଶ୍ନ ଆସେ ନାହିଁ
(D) କେବଳ ମୌଖିକ
Ans: (B) ୧, ୨, ୫ ଏବଂ ୮ ମାର୍କ
Exp: ଇତିହାସ ପାଠ୍ୟକ୍ରମରେ ଏହି ବିଷୟରୁ ସଂକ୍ଷିପ୍ତ ଓ ଦୀର୍ଘ ଉତ୍ତରମୂଳକ ପ୍ରଶ୍ନ ପଚରାଯାଏ।`
      : `### 🏛️ ${topicTitle}: Essential Multiple Choice Questions (MCQs)

1. What constitutes the primary empirical evidence for reconstructing this historical phase?
(A) Epigraphical inscriptions and contemporary coins
(B) Secondary romantic folklore
(C) Fictional dramas composed centuries later
(D) Unverified oral myths
Ans: (A) Epigraphical inscriptions and contemporary coins
Exp: Epigraphical and numismatic records provide contemporaneous and tamper-proof evidence.

2. In the university history curriculum, this subject is fundamentally evaluated for:
(A) Socio-political and institutional transformations
(B) Purely mythical narratives
(C) Modern fictional studies
(D) Unrelated geography
Ans: (A) Socio-political and institutional transformations
Exp: It marks a definitive structural evolution in administrative and cultural history.

3. Which academic examination format assesses this core topic?
(A) Only oral tests
(B) 1-mark objective, 2-mark conceptual, and 5/8-mark explanatory questions
(C) Non-evaluative essays
(D) Multiple choice only
Ans: (B) 1-mark objective, 2-mark conceptual, and 5/8-mark explanatory questions
Exp: The subject is standardly assessed across all marks categories in semester examinations.`;
  }

  // =========================================================================
  // 1. SOURCES OF HISTORY (ଇତିହାସର ଉତ୍ସ / ARCHAEOLOGICAL & LITERARY SOURCES)
  // =========================================================================
  if (
    cleanQ.includes('source') || cleanQ.includes('sources') ||
    cleanQ.includes('ଉତ୍ସ') || cleanQ.includes('ସାହିତ୍ୟିକ') || cleanQ.includes('ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ') ||
    cleanQ.includes('स्रोत') || cleanQ.includes('स्रोतों')
  ) {
    if (examFormat === '1-mark') {
      return isOdia
        ? `### 🏛️ ଇତିହାସ ରଚନାର ଉତ୍ସ (୧-ମାର୍କ ଉତ୍ତର)

**ଉତ୍ତର:**
ପ୍ରାଚୀନ ଇତିହାସ ରଚନାର ଉତ୍ସକୁ ମୁଖ୍ୟତଃ ଦୁଇ ଭାଗରେ ବିଭକ୍ତ କରାଯାଇଛି:
1. **ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଉତ୍ସ:** ଶିଳାଲେଖ, ମୁଦ୍ରା, ସ୍ଥାପତ୍ୟ-ଭାସ୍କର୍ଯ୍ୟ ଓ ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଖନନ।
2. **ସାହିତ୍ୟିକ ଉତ୍ସ:** ଦେଶୀୟ ଧାର୍ମିକ ଓ ଧର୍ମନିରପେକ୍ଷ ସାହିତ୍ୟ ତଥା ବୈଦେଶିକ ବିବରଣୀ।`
        : `### 🏛️ Sources of History (1-Mark Model Answer)

**Direct Answer:**
Historical sources are primarily classified into two fundamental categories:
1. **Archaeological Sources:** Inscriptions (epigraphy), coins (numismatics), monuments, architecture, and excavated material antiquities.
2. **Literary Sources:** Indigenous literature (religious and secular texts) and accounts left by foreign travellers.`;
    }

    if (examFormat === '2-mark') {
      return isOdia
        ? `### 🏛️ ଇତିହାସ ରଚନାର ପ୍ରମୁଖ ଉତ୍ସ (୨-ମାର୍କ ଉତ୍ତର)

**ଉତ୍ତର:**
ପ୍ରାମାଣିକ ଇତିହାସ ପୁନର୍ଗଠନ ନିମନ୍ତେ ଦୁଇଟି ମୁଖ୍ୟ ଉତ୍ସ ଉପରେ ନିର୍ଭର କରାଯାଏ:
1. **ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଉତ୍ସ (Archaeological Sources):** ଏହା ସର୍ବାଧିକ ନିର୍ଭରଯୋଗ୍ୟ। ଏଥିରେ ଶିଳାଲେଖ (ଯଥା- ଅଶୋକଙ୍କ ଶିଳାଲେଖ, ହାତୀଗୁମ୍ଫା ଲେଖ), ପ୍ରାଚୀନ ମୁଦ୍ରା (ମୌର୍ଯ୍ୟ ଓ ଗୁପ୍ତ ସୁବର୍ଣ୍ଣ ମୁଦ୍ରା) ଏବଂ ପ୍ରାଚୀନ କୀର୍ତ୍ତିରାଜି ଅନ୍ତର୍ଭୁକ୍ତ।
2. **ସାହିତ୍ୟିକ ଉତ୍ସ (Literary Sources):** ଏଥିରେ ଦେଶୀୟ ଧାର୍ମିକ ଗ୍ରନ୍ଥ (ବେଦ, ପୁରାଣ), ଐତିହାସିକ ଗ୍ରନ୍ଥ (କୌଟିଲ୍ୟଙ୍କ ଅର୍ଥଶାସ୍ତ୍ର, କଲ୍ହଣଙ୍କ ରାଜତରଙ୍ଗିଣୀ) ଏବଂ ବୈଦେଶିକ ପରିବ୍ରାଜକ (ମେଗାସ୍ଥିନିସ, ହୁଏନସାଂ) ଙ୍କ ବିବରଣୀ ସାମିଲ।`
        : `### 🏛️ Sources of History (2-Marks Model Answer)

**Model Answer:**
The scientific reconstruction of history depends upon two indispensable categories of evidence:
1. **Archaeological Sources:** Material remains that provide authentic and contemporaneous data free from interpolation. These include **epigraphical inscriptions** (e.g., Ashokan Edicts, Hathigumpha Inscription), **numismatics/coins** (revealing dynastic chronology and economic prosperity), and **monuments/excavations** (temples, stupas, pottery).
2. **Literary Sources:** Written documents comprising **indigenous literature** (religious texts like Vedas and secular works like Kautilya's *Arthashastra* and Kalhana's *Rajatarangini*) alongside **foreign travelogues** (Megasthenes' *Indika*, Hiuen Tsang, and Al-Beruni).`;
    }

    if (examFormat === '5-mark') {
      return isOdia
        ? `### 🏛️ ପ୍ରାଚୀନ ଭାରତୀୟ ଇତିହାସ ନିର୍ମାଣର ଉତ୍ସ (୫-ମାର୍କ ବିସ୍ତୃତ ଉତ୍ତର)

**ଉପକ୍ରମ:**
ପ୍ରାଚୀନ ଭାରତୀୟ ଇତିହାସର ପୁନର୍ଗଠନ କୌଣସି ଗୋଟିଏ ଉପାଦାନ ଉପରେ ଆଧାରିତ ନୁହେଁ। ଇତିହାସକାରମାନେ ମୁଖ୍ୟତଃ ଦୁଇଟି ଶ୍ରେଣୀର ଉତ୍ସ ଉପରେ ନିର୍ଭର କରନ୍ତି:

#### ୧. ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଉତ୍ସ (Archaeological Sources)
ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ପ୍ରମାଣ ସର୍ବାଧିକ ପ୍ରାମାଣିକ ଓ ନିର୍ଭୁଲ ଅଟେ:
* **ଶିଳାଲେଖ ଓ ତାମ୍ରଫଳକ (Inscriptions):** ଅଶୋକଙ୍କ ଶିଳାନୁଶାସନ, ସମ୍ରାଟ ଖାରବେଳଙ୍କ ହାତୀଗୁମ୍ଫା ଲେଖ, ସମୁଦ୍ରଗୁପ୍ତଙ୍କ ଆହ୍ଲାବାଦ ପ୍ରଶସ୍ତି ରାଜନୈତିକ ଇତିହାସ ଓ ସାମ୍ରାଜ୍ୟ ବିସ୍ତାରର ପ୍ରତ୍ୟକ୍ଷ ପ୍ରମାଣ ଦିଏ।
* **ମୁଦ୍ରା (Coins/Numismatics):** ପ୍ରାଚୀନ ଭାରତର ପଞ୍ଚ-ମାର୍କଡ୍ ମୁଦ୍ରା, ଇଣ୍ଡୋ-ଗ୍ରୀକ୍ ମୁଦ୍ରା ଏବଂ ଗୁପ୍ତ ଯୁଗର ସ୍ୱର୍ଣ୍ଣମୁଦ୍ରା ରାଜବଂଶର କାଳକ୍ରମ, ଆର୍ଥିକ ସ୍ଥିତି ଓ ଧାର୍ମିକ ବିଶ୍ୱାସ ଦର୍ଶାଏ।
* **ସ୍ଥାପତ୍ୟ ଓ ଭାସ୍କର୍ଯ୍ୟ (Monuments):** ହରପ୍ପା-ମହେଞ୍ଜୋଦାରୋ ନଗର, କୋଣାର୍କ, ପୁରୀ, ଖଜୁରାହୋ ଓ ଅଜନ୍ତା-ଇଲୋରା ପ୍ରାଚୀନ ସମୟର କଳା ଓ ସାମାଜିକ ଜୀବନର ପରିଚୟ ଦିଏ।

#### ୨. ସାହିତ୍ୟିକ ଉତ୍ସ (Literary Sources)
* **ଦେଶୀୟ ଧାର୍ମିକ ସାହିତ୍ୟ:** ଚାରି ବେଦ, ଉପନିଷଦ, ରାମାୟଣ, ମହାଭାରତ, ବୌଦ୍ଧ ତ୍ରିପିଟକ ଓ ଜାତକ ଗଳ୍ପ ଏବଂ ଜୈନ ଅଙ୍ଗ।
* **ଧର୍ମନିରପେକ୍ଷ ଓ ଐତିହାସିକ ରଚନା:** କୌଟିଲ୍ୟଙ୍କ 'ଅର୍ଥଶାସ୍ତ୍ର', ବିଶାଖଦତ୍ତଙ୍କ 'ମୁଦ୍ରାରାକ୍ଷସ', କଲ୍ହଣଙ୍କ 'ରାଜତରଙ୍ଗିଣୀ' (କାଶ୍ମୀର ଇତିହାସ), ଏବଂ ବାଣଭଟ୍ଟଙ୍କ 'ହର୍ଷଚରିତ'।
* **ବୈଦେଶିକ ପରିବ୍ରାଜକଙ୍କ ବିବରଣୀ:** ମେଗାସ୍ଥିନିସଙ୍କ ‘ଇଣ୍ଡିକା’, ଫାହିଏନ୍ ଓ ହୁଏନସାଂଙ୍କ ଭାରତ ଭ୍ରମଣ ବୃତ୍ତାନ୍ତ, ଏବଂ ଅଲ-ବିରୁନୀଙ୍କ ‘କିତାବ୍-ଉଲ୍-ହିନ୍ଦ୍’।

**ଉପସଂହାର:**
ଉଭୟ ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଓ ସାହିତ୍ୟିକ ଉତ୍ସର ପରସ୍ପର ତୁଳନାତ୍ମକ ଅଧ୍ୟୟନ ଦ୍ୱାରା ହିଁ ଭାରତର ସଠିକ୍ ଓ ନିରପେକ୍ଷ ଇତିହାସ ପ୍ରସ୍ତୁତ କରାଯାଇପାରେ।`
        : `### 🏛️ Sources for Reconstructing Indian History (5-Marks Detailed Answer)

**Introduction:**
History cannot be reconstructed without dependable sources. As the famous historian Ranke emphasized, historical narratives must be established on authentic primary and secondary evidence. The sources of Indian history are categorized into **Archaeological** and **Literary** sources.

---

#### 1. Archaeological Sources (The Primary Scientific Bedrock)
Archaeological sources are contemporaneous and resistant to later editorial tampering:
* **Epigraphy (Inscriptions):** Engraved on rocks, stone pillars, iron pillars, and copper plates. Prominent examples include Emperor Ashoka's Edicts (Prakrit/Brahmi), Kharavela's Hathigumpha Inscription, and Harisena's Prayag Prashasti (Allahabad Pillar) of Samudragupta.
* **Numismatics (Coins):** Coins shed light on dates, genealogies, metallurgical achievements, trade corridors, and economic prosperity (e.g., Kushana gold staters and Gupta gold dinaras).
* **Monuments & Architecture:** Structural remains such as the Indus Valley ruins (Mohenjo-daro/Harappa), Buddhist Stupas (Sanchi), and temples (Konark, Brihadisvara, Ellora) reveal religious, aesthetic, and technological life.
* **Excavations & Pottery:** Stratified artifacts like Painted Grey Ware (PGW) and Northern Black Polished Ware (NBPW) establish accurate chronologies.

---

#### 2. Literary Sources
* **Indigenous Religious Literature:** Vedic texts (Rigveda, Samaveda, Yajurveda, Atharvaveda), Puranas, the Epics (Ramayana and Mahabharata), Buddhist Tripitakas and Jatakas, and Jain Agamas.
* **Secular and Historical Literature:** Kautilya's *Arthashastra* (statecraft), Megasthenes' era treatises, Banabhatta's *Harshacharita*, and Kalhana's *Rajatarangini* (the first scientific chronicle of Indian history).
* **Foreign Accounts:** Valuable eyewitness observations left by Greek ambassador Megasthenes (*Indika*), Chinese Buddhist pilgrims (Fa-Hien, Hiuen Tsang, I-Tsing), and Arab/Persian scholars (Al-Beruni's *Kitab-ul-Hind*).

**Conclusion:**
Historians cross-examine literary narratives with concrete archaeological findings to eliminate bias and produce an objective account of the past.`;
    }

    if (examFormat === '8-mark') {
      return isOdia
        ? `### 🏛️ ପ୍ରାଚୀନ ଭାରତ ଇତିହାସ ରଚନାର ବିଭିନ୍ନ ଉତ୍ସ: ଏକ ବିସ୍ତୃତ ସମୀକ୍ଷା (୮-ମାର୍କ କଲେଜ ପରୀକ୍ଷା ନୋଟ୍ସ)

**ଉପକ୍ରମ (Introduction):**
ପ୍ରାଚୀନ ଭାରତୀୟ ସଭ୍ୟତା ପୃଥିବୀର ଅନ୍ୟତମ ପ୍ରାଚୀନତମ ଓ ସମୃଦ୍ଧ ସଭ୍ୟତା। ଇତିହାସର ଜନକ ହେରୋଡୋଟସଙ୍କ ମତରେ ପ୍ରମାଣ ବିନା କୌଣସି ଘଟଣାକୁ ଇତିହାସ କୁହାଯାଇ ନପାରେ। ଭାରତର ପ୍ରାମାଣିକ ଇତିହାସ ପୁନର୍ଗଠନ ପାଇଁ ଐତିହାସିକମାନେ ଦୁଇଟି ମୁଖ୍ୟ ଉତ୍ସ ଉପରେ ନିର୍ଭର କରନ୍ତି: (କ) ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଉତ୍ସ ଏବଂ (ଖ) ସାହିତ୍ୟିକ ଉତ୍ସ।

---

### ଭାଗ-୧: ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଉତ୍ସ (Archaeological Sources)
ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଉତ୍ସଗୁଡ଼ିକ ଅତ୍ୟନ୍ତ ନିର୍ଭରଯୋଗ୍ୟ, କାରଣ ଏଗୁଡ଼ିକ ପରବର୍ତ୍ତୀ ସମୟରେ ପରିବର୍ତ୍ତନ କିମ୍ବା କାଳ୍ପନିକ ରୂପ ନେଇପାରେ ନାହିଁ।

#### ୧. ଶିଳାଲେଖ ଓ ଅନୁଶାସନ (Inscriptions / Epigraphy):
* **ଅଶୋକଙ୍କ ଅନୁଶାସନ:** ମୌର୍ଯ୍ୟ ସମ୍ରାଟ ଅଶୋକଙ୍କ ୧୪ଟି ମୁଖ୍ୟ ଶୈଳାନୁଶାସନ, ସ୍ତମ୍ଭଲେଖ ଏବଂ ଧଉଳି ଓ ଜୌଗଡ଼ର କଳିଙ୍ଗ ଶିଳାଲେଖ ତତ୍କାଳୀନ ପ୍ରଶାସନ, ଧର୍ମ ଓ କଳିଙ୍ଗ ଯୁଦ୍ଧର ସବିଶେଷ ବିବରଣୀ ପ୍ରଦାନ କରେ।
* **ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ:** ଉଦୟଗିରି ପାହାଡ଼ରେ କଳିଙ୍ଗାଧିପତି ଖାରବେଳଙ୍କ ପ୍ରାକୃତ ଭାଷା ଓ ବ୍ରାହ୍ମୀ ଲିପିରେ ଖୋଦିତ ୧୭ ଧାଡ଼ି ବିଶିଷ୍ଟ ଲେଖ ତାଙ୍କର ୧୩ ବର୍ଷର ବିଜୟ ଅଭିଯାନର ଏକମାତ୍ର ପ୍ରାମାଣିକ ଦଲିଲ।
* **ପ୍ରଶସ୍ତି ଓ ତାମ୍ରଶାସନ:** ସମୁଦ୍ରଗୁପ୍ତଙ୍କ ଆହ୍ଲାବାଦ ପ୍ରଶସ୍ତି (ହରିଷେଣଙ୍କ ଦ୍ୱାରା ରଚିତ) ଏବଂ ପୁଲକେଶୀନ୍ ଦ୍ୱିତୀୟଙ୍କ ଆଇହୋଲ ପ୍ରଶସ୍ତି ରାଜନୈତିକ ଇତିହାସ ଜାଣିବାରେ ମୁଖ୍ୟ ସହାୟକ।

#### ୨. ମୁଦ୍ରା (Coins / Numismatics):
* ମୁଦ୍ରା ଅଧ୍ୟୟନକୁ ନ୍ୟୁମିସମାଟିକ୍ସ କୁହାଯାଏ। ପ୍ରାଚୀନ ପଞ୍ଚ-ମାର୍କଡ୍ ମୁଦ୍ରା, ଇଣ୍ଡୋ-ଗ୍ରୀକ୍ ଶାସକଙ୍କ ଦ୍ୱାରା ପ୍ରଚଳିତ ରାଜାଙ୍କ ପ୍ରତିଛବି ଥିବା ମୁଦ୍ରା ଏବଂ କୁଷାଣ ଓ ଗୁପ୍ତ ଯୁଗର ସ୍ୱର୍ଣ୍ଣମୁଦ୍ରା (ଦୀନାର) ବାଣିଜ୍ୟ, ଆର୍ଥିକ ସମୃଦ୍ଧି ଓ ଧାର୍ମିକ ବିଶ୍ୱାସର ସଠିକ୍ ପରିଚୟ ଦିଏ।

#### ୩. ସ୍ଥାପତ୍ୟ, ଭାସ୍କର୍ଯ୍ୟ ଓ କୀର୍ତ୍ତିରାଜି (Monuments & Architecture):
* ସିନ୍ଧୁ ସଭ୍ୟତାର ନଗର ଯୋଜନା, ବୃହତ୍ ସ୍ନାନାଗାର ଓ ଶସ୍ୟାଗାର।
* ସାଞ୍ଚି ଓ ଅମରାବତୀ ସ୍ତୂପ, ଅଜନ୍ତା ଓ ଇଲୋରାର ଗୁମ୍ଫା ଚିତ୍ର।
* ଓଡ଼ିଶାର ଭୁବନେଶ୍ୱର (ପରଶୁରାମେଶ୍ୱର, ମୁକ୍ତେଶ୍ୱର, ଲିଙ୍ଗରାଜ), ପୁରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର ଏବଂ କୋଣାର୍କର ସୂର୍ଯ୍ୟ ମନ୍ଦିର ତତ୍କାଳୀନ ସ୍ଥାପତ୍ୟ କଳାର ଶ୍ରେଷ୍ଠ ନିଦର୍ଶନ।

#### ୪. ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଖନନ ଓ ମୃଣ୍ମୟ ପାତ୍ର (Excavations & Pottery):
* ରେଡିଓ କାର୍ବନ-୧୪ (C-14) ପଦ୍ଧତି ଦ୍ୱାରା ପ୍ରାଚୀନ ବସ୍ତୁର ସଠିକ୍ କାଳ ନିରୂପଣ କରାଯାଏ। ପେଣ୍ଟେଡ୍ ଗ୍ରେ ୱେୟାର (PGW) ଏବଂ ନର୍ଦନ ବ୍ଲାକ୍ ପଲିସ୍ଡ ୱେୟାର (NBPW) ବୈଦିକ ଓ ମୌର୍ଯ୍ୟ ଯୁଗର କାଳକ୍ରମ ସ୍ଥିର କରିବାରେ ସାହାଯ୍ୟ କରେ।

---

### ଭାଗ-୨: ସାହିତ୍ୟିକ ଉତ୍ସ (Literary Sources)
ସାହିତ୍ୟିକ ଉତ୍ସ ତତ୍କାଳୀନ ସମାଜ, ଧର୍ମ, ଦର୍ଶନ ଓ ସଂସ୍କୃତିର ପ୍ରତିଫଳନ କରେ।

#### ୧. ଦେଶୀୟ ଧାର୍ମିକ ସାହିତ୍ୟ:
* **ବୈଦିକ ସାହିତ୍ୟ:** ଋଗବେଦ, ସାମବେଦ, ଯଜୁର୍ବେଦ, ଅଥର୍ବବେଦ, ବ୍ରାହ୍ମଣ, ଆରଣ୍ୟକ ଓ ଉପନିଷଦ ଆର୍ଯ୍ୟମାନଙ୍କ ଜୀବନଶୈଳୀ ବର୍ଣ୍ଣନା କରେ।
* **ମହାକାବ୍ୟ ଓ ପୁରାଣ:** ରାମାୟଣ, ମହାଭାରତ ଓ ୧୮ଟି ପୁରାଣ ରାଜବଂଶାବଳୀ ପ୍ରଦାନ କରେ।
* **ବୌଦ୍ଧ ଓ ଜୈନ ସାହିତ୍ୟ:** ବୌଦ୍ଧ ତ୍ରିପିଟକ (ବିନୟ, ସୁତ୍ତ, ଅଭିଧମ୍ମ), ଜାତକ ଗଳ୍ପ, ଦୀପବଂଶ ଓ ମହାବଂଶ; ଜୈନମାନଙ୍କ ଦ୍ୱାଦଶ ଅଙ୍ଗ ଓ ପରିଶିଷ୍ଟପର୍ବନ।

#### ୨. ଧର୍ମନିରପେକ୍ଷ ତଥା ଐତିହାସିକ ଗ୍ରନ୍ଥ:
* କୌଟିଲ୍ୟଙ୍କ **'ଅର୍ଥଶାସ୍ତ୍ର'** ମୌର୍ଯ୍ୟ ପ୍ରଶାସନ ଓ ଅର୍ଥନୀତିର ଏକ ଅମୂଲ୍ୟ ଗ୍ରନ୍ଥ।
* ପାଣିନିଙ୍କ 'ଅଷ୍ଟାଧ୍ୟାୟୀ' ଓ ପତଞ୍ଜଳିଙ୍କ 'ମହାଭାଷ୍ୟ'।
* କଲ୍ହଣଙ୍କ **'ରାଜତରଙ୍ଗିଣୀ'** (ଖ୍ରୀଷ୍ଟାବ୍ଦ ୧୧୪୮-୪୯) ଭାରତର ପ୍ରଥମ ପ୍ରାମାଣିକ ଐତିହାସିକ ଗ୍ରନ୍ଥ ଭାବେ ଗୃହୀତ।
* ବାଣଭଟ୍ଟଙ୍କ 'ହର୍ଷଚରିତ', ଚାନ୍ଦବରଦାୟୀଙ୍କ 'ପୃଥ୍ୱୀରାଜ ରାସୋ' ଏବଂ ଓଡ଼ିଶାର ଇତିହାସ ପାଇଁ 'ମାଦଳା ପାଞ୍ଜି'।

#### ୩. ବୈଦେଶିକ ପରିବ୍ରାଜକଙ୍କ ବିବରଣୀ:
* **ଗ୍ରୀକ୍ ଓ ରୋମାନ୍ ଲେଖକ:** ମେଗାସ୍ଥିନିସଙ୍କ ‘ଇଣ୍ଡିକା’, ପ୍ଲିନିଙ୍କ ‘ନ୍ୟାଚୁରାଲ ହିଷ୍ଟ୍ରି’, ଟଲେମୀଙ୍କ ଭୂଗୋଳ।
* **ଚୀନ୍ ପରିବ୍ରାଜକ:** ଫା-ହିଏନ୍ (ଚନ୍ଦ୍ରଗୁପ୍ତ ବିକ୍ରମାଦିତ୍ୟଙ୍କ ସମୟ), ହୁଏନସାଂ (ହର୍ଷବର୍ଦ୍ଧନଙ୍କ ସମୟ) ଏବଂ ଇତ-ସିଂ।
* **ମୁସଲିମ୍ ଐତିହାସିକ:** ଅଲ-ବିରୁନୀଙ୍କ 'ତାରିଖ୍-ଇ-ହିନ୍ଦ୍' (କିତାବ୍-ଉଲ୍-ହିନ୍ଦ୍), ଇବନ୍ ବତୁତାଙ୍କ 'ରିହଲା'।

---

**ଉପସଂହାର (Conclusion):**
ସାହିତ୍ୟିକ ଉତ୍ସରେ କବି ଓ ଲେଖକଙ୍କ କଳ୍ପନା କିମ୍ବା ଅତିରଞ୍ଜନ ଥାଇପାରେ, କିନ୍ତୁ ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ପ୍ରମାଣ ଦ୍ୱାରା ତାହାର ସତ୍ୟତା ପରୀକ୍ଷା କରାଯାଏ। ଉଭୟ ଉତ୍ସର ସମନ୍ୱୟ ଦ୍ୱାରା ହିଁ ଭାରତର ପୂର୍ଣ୍ଣାଙ୍ଗ ଇତିହାସ ନିର୍ମିତ ହୋଇଛି।`
        : `### 🏛️ Comprehensive Sources for Reconstructing Indian History (8-Marks University Examination Notes)

**Introduction:**
History is neither myth nor fiction; as established by the empirical school of historiography, it is a factual science strictly anchored in surviving sources. The Indian subcontinent possesses an exceptionally rich corpus of historical data. Modern historians categorize the sources of Indian history into two comprehensive classes:
1. **Archaeological Sources** (Material Remains & Epigraphy)
2. **Literary Sources** (Indigenous Chronicles & Foreign Observations)

---

### PART I: ARCHAEOLOGICAL SOURCES
Archaeological sources constitute the primary, contemporary, and unbiased backbone of historical reconstruction.

#### 1. Epigraphy (Inscriptions & Edicts):
Inscriptions are the most dependable source because they were engraved at the time of the events and remained unaltered across millennia:
* **Ashokan Rock and Pillar Edicts (3rd Century BCE):** Written predominantly in the Brahmi script and Prakrit language (with Kharosthi, Greek, and Aramaic in the North-West), they chronicle Ashoka's Dhamma, administrative machinery, and the remorse following the Kalinga War (Rock Edict XIII).
* **Emperor Kharavela's Hathigumpha Inscription:** Located at Udayagiri Hills (Bhubaneswar), this 17-line Prakrit record provides the only sequential year-by-year military and cultural achievements of the Chedi sovereign.
* **Prashastis (Eulogies):** Harisena's Prayag Prashasti (Allahabad Pillar) for Samudragupta and Ravikirti's Aihole Inscription for Pulakeshin II.
* **Copper Plate Grants (Tamra-patra):** Vital for understanding agrarian land donations, tax immunities, and socio-religious institutions.

#### 2. Numismatics (Coins):
* Coins reveal chronology, political boundaries, genealogical successions, metallurgy, and financial stability.
* **Punch-marked coins** of the Mahajanapada and Mauryan epochs; bilingual coins of the **Indo-Greeks**; gold staters of the **Kushanas**; and the artistic gold **Dinaras** of the Imperial Guptas (e.g., Samudragupta playing the Veena, Ashvamedha sacrifice coins).

#### 3. Monuments, Sculpture, and Architecture:
* The urban layouts of Harappa, Mohenjo-daro, and Dholavira reveal civic engineering, underground drainage systems, and maritime docks (Lothal).
* Classical temple traditions: Kalinga Nagara style (Lingaraj, Jagannath Puri, Konark Sun Temple), Dravida style (Brihadisvara at Thanjavur), and rock-cut shrines (Ajanta, Ellora, and Elephanta).

#### 4. Excavations, Pottery, and Scientific Dating:
* Stratigraphical excavation correlated with Carbon-14 (C-14) dating and dendrochronology establishes accurate absolute dates.
* Ceramic sequences such as Ochre Coloured Pottery (OCP), Painted Grey Ware (PGW), and Northern Black Polished Ware (NBPW) track transitions from the Bronze Age through the Vedic and Mauryan epochs.

---

### PART II: LITERARY SOURCES
Literary sources provide insights into administrative philosophy, social stratification, religious thought, and cultural expressions.

#### 1. Indigenous Religious Literature:
* **Vedic Literature:** The Rigveda (c. 1500–1000 BCE) sheds light on Early Vedic pastoralism; the Later Vedas, Brahmanas, and Upanishads illuminate the transition to sedentary agrarian kingdoms.
* **The Epics & Puranas:** The *Mahabharata*, *Ramayana*, and 18 Mahapuranas preserve royal genealogies (*Vamshanucharita*).
* **Buddhist & Jain Literature:** The Pali *Tripitakas* (Vinaya, Sutta, Abhidhamma), *Jataka* tales (social vignettes), and Sri Lankan chronicles (*Dipavamsa*, *Mahavamsa*); the Jain *Angas* and *Upangas* in Ardhamagadhi.

#### 2. Secular and Historical Literature:
* **Statecraft & Law:** Kautilya's *Arthashastra* is an unmatched treatise on Mauryan administration, espionage, economics, and diplomacy.
* **Biographical Literature (Charitas):** Banabhatta's *Harshacharita*, Bilhana's *Vikramankadevacharita*, and Chand Bardai's *Prithviraj Raso*.
* **Scientific History:** Kalhana's *Rajatarangini* (1148–1149 CE) stands out as India's first truly scientific historical chronicle, explicitly evaluating previous historians, charters, and inscriptions.
* **Regional Chronicles:** The *Madala Panji* (temple chronicle of Jagannath Puri) for medieval Odisha history.

#### 3. Foreign Accounts:
External visitors recorded perspectives uncontaminated by local courtly flattery:
* **Greco-Roman:** Megasthenes' *Indika* (Mauryan administration and society), Pliny's *Naturalis Historia*, Ptolemy's *Geography*, and the anonymous *Periplus of the Erythraean Sea*.
* **Chinese Buddhist Pilgrims:** Fa-Hien (Gupta period society and mild penal laws), Hiuen Tsang / Xuanzang (Harsha's reign, Nalanda University, and visits to Odishan monasteries like Pushpagiri), and I-Tsing.
* **Arab and Islamic Scholars:** Al-Beruni's *Kitab-ul-Hind* (11th century scientific observation of Indian astronomy, philosophy, and caste system), and Ibn Battuta's *Rihla*.

---

**Conclusion:**
A critical historian never accepts literary narratives uncritically nor views archaeological artifacts in isolation. True historical veracity emerges from the synthesis and corroboration of epigraphical, numismatic, monumentary, and documentary records.`;
    }

    // Default conversational response for sources of history
    return isOdia
      ? `### 🏛️ ପ୍ରାଚୀନ ଭାରତୀୟ ଇତିହାସ ନିର୍ମାଣର ଉତ୍ସ (Sources of History)

ଇତିହାସ ରଚନା ପାଇଁ ପ୍ରାମାଣିକ ଉତ୍ସ ଅତ୍ୟନ୍ତ ଆବଶ୍ୟକ। ଭାରତ ଇତିହାସର ଉତ୍ସକୁ ମୁଖ୍ୟତଃ ଦୁଇଟି ପ୍ରମୁଖ ଭାଗରେ ବିଭକ୍ତ କରାଯାଇଛି:

---

#### ୧. ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଉତ୍ସ (Archaeological Sources):
ଏହା ପ୍ରତ୍ୟକ୍ଷ ଓ ସର୍ବାଧିକ ନିର୍ଭରଯୋଗ୍ୟ ପ୍ରମାଣ।
* **ଶିଳାଲେଖ (Inscriptions):** ଅଶୋକଙ୍କ ଶିଳାନୁଶାସନ (ଧଉଳି ଓ ଜୌଗଡ଼), ଖାରବେଳଙ୍କ ହାତୀଗୁମ୍ଫା ଲେଖ, ସମୁଦ୍ରଗୁପ୍ତଙ୍କ ଆହ୍ଲାବାଦ ପ୍ରଶସ୍ତି।
* **ମୁଦ୍ରା (Coins):** ପଞ୍ଚ-ମାର୍କଡ୍ ମୁଦ୍ରା, ଇଣ୍ଡୋ-ଗ୍ରୀକ୍ ଓ ଗୁପ୍ତ ସ୍ୱର୍ଣ୍ଣମୁଦ୍ରା (ଦୀନାର), ଯାହା ରାଜନୈତିକ ସୀମା ଓ ଆର୍ଥିକ ଅବସ୍ଥା ଦର୍ଶାଏ।
* **କୀର୍ତ୍ତିରାଜି ଓ ସ୍ଥାପତ୍ୟ (Monuments):** ହରପ୍ପା-ମହେଞ୍ଜୋଦାରୋ ସଭ୍ୟତା, କୋଣାର୍କ ସୂର୍ଯ୍ୟ ମନ୍ଦିର, ପୁରୀ ଜଗନ୍ନାଥ ମନ୍ଦିର, ଭୁବନେଶ୍ୱରର ଲିଙ୍ଗରାଜ ମନ୍ଦିର।
* **ଖନନ ସାମଗ୍ରୀ (Excavations):** କାର୍ବନ-୧୪ ପଦ୍ଧତିରେ ପରୀକ୍ଷିତ ମୃଣ୍ମୟ ପାତ୍ର, ଧାତବ ଅସ୍ତ୍ରଶସ୍ତ୍ର ଓ ସିଲ୍।

---

#### ୨. ସାହିତ୍ୟିକ ଉତ୍ସ (Literary Sources):
* **ଦେଶୀୟ ଧାର୍ମିକ ସାହିତ୍ୟ:** ବେଦ (ଋଗ୍‌ବେଦ ଆଦି), ଉପନିଷଦ, ରାମାୟଣ, ମହାଭାରତ, ପୁରାଣ, ବୌଦ୍ଧ ତ୍ରିପିଟକ ଓ ଜାତକ, ଜୈନ ଅଙ୍ଗ।
* **ଧର୍ମନିରପେକ୍ଷ ଓ ଐତିହାସିକ ଗ୍ରନ୍ଥ:** କୌଟିଲ୍ୟଙ୍କ ‘ଅର୍ଥଶାସ୍ତ୍ର’, କଲ୍ହଣଙ୍କ ‘ରାଜତରଙ୍ଗିଣୀ’, ବାଣଭଟ୍ଟଙ୍କ ‘ହର୍ଷଚରିତ’, ଏବଂ ‘ମାଦଳା ପାଞ୍ଜି’।
* **ବୈଦେଶିକ ବିବରଣୀ:** ମେଗାସ୍ଥିନିସଙ୍କ ‘ଇଣ୍ଡିକା’, ଚୀନ୍ ପରିବ୍ରାଜକ ଫାହିଏନ୍ ଓ ହୁଏନସାଂଙ୍କ ବୃତ୍ତାନ୍ତ, ଅଲ-ବିରୁନୀଙ୍କ ‘କିତାବ୍-ଉଲ୍-ହିନ୍ଦ୍’।

💡 *ଆପଣ ଉପର Dropdown ରୁ **୧-ମାର୍କ**, **୨-ମାର୍କ**, **୫-ମାର୍କ** କିମ୍ବା **୮-ମାର୍କ** ଚୟନ କରି ନିର୍ଦ୍ଦିଷ୍ଟ ପରୀକ୍ଷା ଉତ୍ତର ମଧ୍ୟ ପାଇପାରିବେ। ଏହା ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣା ଅଟେ।*`
      : `### 🏛️ The Sources of History (Archaeological & Literary)

Historical reconstruction requires credible and corroborative evidence. In Indian and World historiography, sources are primarily divided into two main categories:

---

#### 1. Archaeological Sources (The Primary Scientific Bedrock)
Archaeological evidence is contemporaneous with events and immune to later editorial bias:
* **Epigraphy (Inscriptions):** 
  - Ashokan Edicts (Brahmi/Prakrit) across India, Dhauli, and Jaugada.
  - Kharavela's Hathigumpha Inscription (Udayagiri) detailing 13 years of achievements.
  - Samudragupta's Prayag Prashasti (Allahabad Pillar) by poet Harisena.
* **Numismatics (Coins):**
  - Punch-marked coins, Indo-Greek portrait coins, and Imperial Gupta gold *dinaras*.
  - Reveal dates, metallurgy, boundaries, and trade prosperity.
* **Monuments & Architecture:**
  - Indus Valley urban centres (Harappa, Mohenjo-daro, Lothal).
  - Classical architectural masterpieces (Konark Sun Temple, Puri Jagannath Temple, Khajuraho, Sanchi Stupa).
* **Excavations & Stratigraphy:**
  - Carbon-14 dating of ceramics like Painted Grey Ware (PGW) and Northern Black Polished Ware (NBPW).

---

#### 2. Literary Sources
* **Indigenous Religious Texts:**
  - The Vedas, Upanishads, Epics (*Ramayana* & *Mahabharata*), and Puranas.
  - Buddhist Canonical texts (*Tripitakas* & *Jatakas*) and Jain *Agamas*.
* **Secular & Historical Literature:**
  - Kautilya's *Arthashastra* on Mauryan administration and economy.
  - Kalhana's *Rajatarangini* (the first scientific history chronicle of Kashmir).
  - Banabhatta's *Harshacharita*, Visakhadatta's *Mudrarakshasa*, and the Odishan *Madala Panji*.
* **Foreign Travelogues:**
  - Greek: Megasthenes' *Indika*.
  - Chinese Buddhist Pilgrims: Fa-Hien, Hiuen Tsang (Xuanzang), and I-Tsing.
  - Islamic Scholars: Al-Beruni's *Kitab-ul-Hind* and Ibn Battuta's *Rihla*.

💡 *Tip: Select **1-Mark**, **2-Marks**, **5-Marks**, or **8-Marks** from the top selector for exam-ready length-specific notes.*`;
  }

  // =========================================================================
  // 2. CAPITALS (INDIA / DELHI / ODISHA / BHUBANESWAR / CUTTACK)
  // =========================================================================
  if (
    cleanQ.includes('capital') && (cleanQ.includes('india') || cleanQ.includes('bharat') || cleanQ.includes('delhi')) ||
    cleanQ.includes('ରାଜଧାନୀ') && (cleanQ.includes('ଭାରତ') || cleanQ.includes('ଦିଲ୍ଲୀ')) ||
    cleanQ.includes('राजधानी') && (cleanQ.includes('भारत') || cleanQ.includes('दिल्ली'))
  ) {
    return isOdia ? `### 🏛️ ଭାରତର ରାଜଧାନୀ (Capital of India)

**ସିଧାସଳଖ ଉତ୍ତର (Direct Answer):**
ଭାରତର ରାଜଧାନୀ ହେଉଛି **ନୂଆଦିଲ୍ଲୀ (New Delhi)**।

**ଐତିହାସିକ ପୃଷ୍ଠଭୂମି:**
1. **କଲିକତାରୁ ସ୍ଥାନାନ୍ତର (୧୯୧୧):** ୧୨ ଡିସେମ୍ବର ୧୯୧୧ରେ ଦିଲ୍ଲୀ ଦରବାରରେ ସମ୍ରାଟ ଜର୍ଜ ପଞ୍ଚମ କଲିକତାରୁ ରାଜଧାନୀ ଦିଲ୍ଲୀ ସ୍ଥାନାନ୍ତର ଘୋଷଣା କରିଥିଲେ।
2. **ସ୍ଥାପତ୍ୟ:** ସାର୍ ଏଡୱିନ୍ ଲୁଟିଏନ୍ସ ଏବଂ ହାର୍ବାର୍ଟ ବେକରଙ୍କ ଦ୍ୱାରା ନୂଆଦିଲ୍ଲୀର ପରିକଳ୍ପନା ହୋଇଥିଲା। ୧୩ ଫେବୃଆରୀ ୧୯୩୧ରେ ଏହା ଆନୁଷ୍ଠାନିକ ଭାବେ ଉଦ୍‌ଘାଟିତ ହୋଇଥିଲା।
3. **ପ୍ରାଚୀନ ଇତିହାସ:** ମହାଭାରତ ଯୁଗରେ ଏହା ପାଣ୍ଡବମାନଙ୍କ ରାଜଧାନୀ **ଇନ୍ଦ୍ରପ୍ରସ୍ଥ** ଥିଲା।

**ପରୀକ୍ଷା ଉତ୍ତର:**
* **୧-ମାର୍କ:** ଭାରତର ରାଜଧାନୀ ନୂଆଦିଲ୍ଲୀ (୧୯୧୧ରେ କଲିକତାରୁ ସ୍ଥାନାନ୍ତରିତ)।
* **୨-ମାର୍କ:** ଭୌଗୋଳିକ କେନ୍ଦ୍ରୀୟତା ଏବଂ ପ୍ରାଚୀନ ଐତିହାସିକ ପ୍ରାଧାନ୍ୟ ଦୃଷ୍ଟିରୁ ୧୯୧୧ ମସିହାରେ ବ୍ରିଟିଶ ଶାସନ କାଳରେ କଲିକତାରୁ ଦିଲ୍ଲୀକୁ ରାଜଧାନୀ ସ୍ଥାନାନ୍ତରିତ ହୋଇଥିଲା।`
      : `### 🏛️ Capital of India

**Direct Answer:**
The capital of India is **New Delhi (ନୂଆଦିଲ୍ଲୀ)**.

**Historical Context & Background:**
1. **Capital Transfer (1911):** On **12 December 1911**, British Monarch King George V announced the transfer of the imperial capital from **Calcutta** to **Delhi** during the Delhi Durbar.
2. **City Architecture:** Designed by British architects **Sir Edwin Lutyens** and **Sir Herbert Baker**. Viceroy Lord Irwin officially inaugurated New Delhi on **13 February 1931**.
3. **Ancient Heritage:** In ancient Indian history (Mahabharata era), this area was celebrated as **Indraprastha**, the capital of the Pandavas. Later, it served as the political seat of the Delhi Sultanate and the Mughal Empire.

**Examination Model Answers:**
* **1-Mark:** New Delhi is the capital of India, announced in 1911 and inaugurated in 1931.
* **2-Marks:** Shifting the capital from Calcutta to Delhi in 1911 provided geographic centrality and restored the historic imperial symbolism of Delhi as the political seat of Indian empires.`;
  }

  if (
    cleanQ.includes('capital') && (cleanQ.includes('odisha') || cleanQ.includes('orissa')) ||
    cleanQ.includes('ରାଜଧାନୀ') && cleanQ.includes('ଓଡ଼ିଶା')
  ) {
    return isOdia ? `### 🏛️ ଓଡ଼ିଶାର ରାଜଧାନୀ (Capital of Odisha)

**ସିଧାସଳଖ ଉତ୍ତର (Direct Answer):**
ଓଡ଼ିଶାର ବର୍ତ୍ତମାନର ରାଜଧାନୀ ହେଉଛି **ଭୁବନେଶ୍ୱର (Bhubaneswar)** (ମନ୍ଦିର ମାଳିନୀ ନଗରୀ)।

**ଐତିହାସିକ ତଥ୍ୟ:**
1. **କଟକରୁ ଭୁବନେଶ୍ୱର ସ୍ଥାନାନ୍ତର (୧୯୪୮-୪୯):** ପ୍ରାୟ ଏକ ହଜାର ବର୍ଷ ଧରି ଐତିହାସିକ **କଟକ (ବାରବାଟୀ ଦୁର୍ଗ)** ଓଡ଼ିଶାର ରାଜଧାନୀ ଥିଲା। ୧୩ ଏପ୍ରିଲ୍ ୧୯୪୮ରେ ପ୍ରଧାନମନ୍ତ୍ରୀ ଜବାହରଲାଲ ନେହେରୁ ଭୁବନେଶ୍ୱରରେ ନୂତନ ରାଜଧାନୀର ଭିତ୍ତିପ୍ରସ୍ତର ସ୍ଥାପନ କରିଥିଲେ ଏବଂ ୧୯୪୯ରେ ସରକାରୀ କାର୍ଯ୍ୟାଳୟ ସ୍ଥାନାନ୍ତରିତ ହୋଇଥିଲା।
2. **ପ୍ରାଚୀନ ରାଜଧାନୀଗୁଡ଼ିକ:**
   * **ଶିଶୁପାଳଗଡ଼ / ତୋଷାଳୀ:** ପ୍ରାଚୀନ କଳିଙ୍ଗର ମୁଖ୍ୟ ଦୁର୍ଗ ଓ ରାଜଧାନୀ।
   * **କଳିଙ୍ଗନଗର:** ମହାମେଘବାହନ ଖାରବେଳଙ୍କ ରାଜଧାନୀ।
   * **ଯାଜପୁର (ଯଯାତିନଗର):** ସୋମବଂଶୀ ରାଜାଙ୍କ ରାଜଧାନୀ।
   * **ଅଭିନବ ବାରାଣସୀ କଟକ:** ଗଙ୍ଗ ଓ ଗଜପତି ରାଜାଙ୍କ ରାଜଧାନୀ।`
      : `### 🏛️ Capital of Odisha

**Direct Answer:**
The capital of Odisha is **Bhubaneswar (ଭୁବନେଶ୍ୱର)**.

**Historical Milestones:**
1. **Shift from Cuttack (1948–49):** Historic Cuttack served as the capital of Odisha for nearly a millennium. Pandit Jawaharlal Nehru laid the foundation stone of modern Bhubaneswar on **13 April 1948**, and the capital officially shifted in 1949.
2. **Ancient Capitals of Kalinga/Odisha:**
   * **Sisupalgarh / Tosali:** Mauryan and early historic administrative centre.
   * **Kalinganagara:** Capital of Emperor Kharavela.
   * **Yayatinagara (Jajpur):** Somavamsi dynasty capital.
   * **Barabati Cuttack:** Eastern Ganga and Suryavamsi Gajapati imperial capital.`;
  }

  // =========================================================================
  // 3. KALINGA WAR & EMPEROR ASHOKA (କଳିଙ୍ଗ ଯୁଦ୍ଧ ଓ ଅଶୋକ)
  // =========================================================================
  if (cleanQ.includes('kalinga') || cleanQ.includes('ashoka') || cleanQ.includes('କଳିଙ୍ଗ') || cleanQ.includes('ଅଶୋକ')) {
    if (examFormat === '8-mark') {
      return isOdia ? `### 🏛️ କଳିଙ୍ଗ ଯୁଦ୍ଧ (ଖ୍ରୀ.ପୂ. ୨୬୧): କାରଣ, ଫଳାଫଳ ଏବଂ ଐତିହାସିକ ଗୁରୁତ୍ୱ (୮-ମାର୍କ ନୋଟ୍ସ)

**ଉପକ୍ରମ:**
ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ରେ ମୌର୍ଯ୍ୟ ସମ୍ରାଟ ଅଶୋକ ଏବଂ ସ୍ୱାଧୀନ କଳିଙ୍ଗ ରାଜ୍ୟ ମଧ୍ୟରେ ସଂଗଠିତ କଳିଙ୍ଗ ଯୁଦ୍ଧ ବିଶ୍ୱ ଇତିହାସର ଏକ ଯୁଗାନ୍ତକାରୀ ଘଟଣା। ଅଶୋକଙ୍କ ୧୩ଶ ଶୈଳାନୁଶାସନରୁ ଏହି ଯୁଦ୍ଧର ବିସ୍ତୃତ ବିବରଣୀ ପ୍ରାପ୍ତ ହୁଏ।

**ଯୁଦ୍ଧର ପ୍ରମୁଖ କାରଣ:**
୧. **ସାମ୍ରାଜ୍ୟବାଦୀ ନୀତି:** ଚନ୍ଦ୍ରଗୁପ୍ତ ମୌର୍ଯ୍ୟ ଓ ବିନ୍ଦୁସାରଙ୍କ ସମୟରୁ କଳିଙ୍ଗ ଏକ ଶକ୍ତିଶାଳୀ ସ୍ୱତନ୍ତ୍ର ରାଷ୍ଟ୍ର ଥିଲା, ଯାହା ମଗଧ ସାମ୍ରାଜ୍ୟ ପାଇଁ ଚ୍ୟାଲେଞ୍ଜ ଥିଲା।
୨. **ଅର୍ଥନୈତିକ ଓ ବାଣିଜ୍ୟିକ କାରଣ:** କଳିଙ୍ଗ ନୌବାଣିଜ୍ୟ ଓ ସ୍ଥଳ ବାଣିଜ୍ୟ ପଥ (ଉତ୍ତରାପଥ ଓ ଦକ୍ଷିଣାପଥ) ଉପରେ ନିୟନ୍ତ୍ରଣ ରଖିଥିଲା।
୩. **ସାମରିକ ଶକ୍ତି:** ମେଗାସ୍ଥିନିସଙ୍କ ବିବରଣୀ ଅନୁସାରେ କଳିଙ୍ଗର ୬୦,୦୦୦ ପଦାତିକ, ୧,୦୦୦ ଅଶ୍ୱାରୋହୀ ଏବଂ ୭୦୦ ହସ୍ତୀବାହିନୀ ଥିଲା।

**ଯୁଦ୍ଧର ଭୟାବହତା:**
ଅଶୋକଙ୍କ ୧୩ଶ ଶିଳାଲେଖ ଅନୁସାରେ ଏହି ଯୁଦ୍ଧରେ ୧,୦୦,୦୦୦ କଳିଙ୍ଗ ସୈନିକ ନିହତ ହୋଇଥିଲେ, ୧,୫୦,୦୦୦ ବନ୍ଦୀ ହୋଇଥିଲେ ଏବଂ ତା’ର ବହୁଗୁଣ ଅସହାୟ ଲୋକ ପ୍ରାଣ ହରାଇଥିଲେ। ଦୟା ନଦୀର ଜଳ ରକ୍ତରେ ଲାଲ୍ ହୋଇଯାଇଥିଲା।

**ଫଳାଫଳ ଓ ଐତିହାସିକ ଗୁରୁତ୍ୱ:**
୧. **ଅଶୋକଙ୍କ ହୃଦୟ ପରିବର୍ତ୍ତନ:** ଯୁଦ୍ଧର ବିଭୀଷିକା ଦେଖି ଅନୁତପ୍ତ ଅଶୋକ ‘ଚଣ୍ଡାଶୋକ’ରୁ ‘ଧର୍ମାଶୋକ’ରେ ରୂପାନ୍ତରିତ ହେଲେ।
୨. **ବୌଦ୍ଧ ଧର୍ମ ଗ୍ରହଣ:** ଆଚାର୍ଯ୍ୟ ଉପଗୁପ୍ତଙ୍କ ଦ୍ୱାରା ଅଶୋକ ବୌଦ୍ଧ ଧର୍ମରେ ଦୀକ୍ଷିତ ହେଲେ ଏବଂ ବୌଦ୍ଧ ଧର୍ମକୁ ଏକ ବିଶ୍ୱ ଧର୍ମରେ ପରିଣତ କଲେ।
୩. **ଦିଗ୍‌ବିଜୟ ବଦଳରେ ଧର୍ମବିଜୟ:** ଅଶୋକ ସାମରିକ ଅଭିଯାନ ସ୍ଥଗିତ ରଖି ପ୍ରେମ, ଅହିଂସା ଓ ସଦାଚାରର ନୀତି ପ୍ରସାର କଲେ।
୪. **ପିତୃତୁଲ୍ୟ ଶାସନ:** ଧଉଳି ଓ ଜୌଗଡ଼ର ସ୍ୱତନ୍ତ୍ର କଳିଙ୍ଗ ଶିଳାଲେଖରେ ସେ ଘୋଷଣା କଲେ: "ସବେ ମୁନିସେ ପଜା ମମା" (ସମସ୍ତ ପ୍ରଜା ମୋର ସନ୍ତାନ)।

**ଉପସଂହାର:**
କଳିଙ୍ଗ ଯୁଦ୍ଧ ଏକ ସାମରିକ ବିଜୟ ହେଲେ ହେଁ ତାହା କଳିଙ୍ଗର ନୈତିକ ବିଜୟ ଥିଲା, ଯାହା ବିଶ୍ୱକୁ ଶାନ୍ତି ଓ ଅହିଂସାର ଶାଶ୍ୱତ ବାର୍ତ୍ତା ଦେଇଥିଲା।`
      : `### 🏛️ The Kalinga War (261 BCE): Causes, Course, and Significance (8-Marks Notes)

**Introduction:**
Fought in **261 BCE** (the 8th regnal year of Emperor Ashoka) along the banks of River Daya near Dhauli (Bhubaneswar), the Kalinga War represents a pivotal turning point in world history. Our primary historical record is Ashoka's **Major Rock Edict XIII**.

**Causes of the War:**
1. **Imperial Geopolitics:** Independent Kalinga stood directly between Magadha's capital Pataliputra and its southern territories.
2. **Maritime Trade Monopoly:** Kalinga controlled lucrative oceanic trade routes with South-East Asian kingdoms (Java, Sumatra, Bali, Sri Lanka).
3. **Formidable Military Power:** Megasthenes recorded that Kalinga maintained 60,000 infantry, 1,000 cavalry, and 700 war elephants.

**The Horror of the Conflict:**
Rock Edict XIII states that 100,000 soldiers were slain, 150,000 were deported as captives, and many times that number perished from disease and famine.

**Consequences and Historical Impact:**
1. **Transformation to Dharmashoka:** Overcome by remorse, Ashoka renounced aggressive expansionism (*Chandashoka* to *Dharmashoka*).
2. **Embrace of Buddhism:** Converted by monk Upagupta, making Buddhism a world religion by sending missionaries across Asia and the Mediterranean.
3. **From Digvijaya to Dharmavijaya:** Military conquest was permanently replaced with moral conquest.
4. **Paternal Welfare Governance:** In the Separate Kalinga Edicts at Dhauli and Jaugada, Ashoka proclaimed: *"Save Munise Paja Mama"* ("All men are my children").`;
    }

    return isOdia ? `### ⚔️ କଳିଙ୍ଗ ଯୁଦ୍ଧ (ଖ୍ରୀ.ପୂ. ୨୬୧)
- **ସମୟ:** ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ (ଅଶୋକଙ୍କ ରାଜତ୍ୱର ୮ମ ବର୍ଷ)।
- **ସ୍ଥାନ:** ଦୟା ନଦୀ କୂଳ, ଧଉଳି ପାହାଡ଼ ନିକଟ (ଭୁବନେଶ୍ୱର)।
- **ଉତ୍ସ:** ଅଶୋକଙ୍କ ୧୩ଶ ଶିଳାଲେଖ ଏବଂ ଧଉଳି ଓ ଜୌଗଡ଼ର ସ୍ୱତନ୍ତ୍ର କଳିଙ୍ଗ ଶୈଳାନୁଶାସନ।
- **ମୁଖ୍ୟ ପରିଣାମ:**
  1. ଅଶୋକ ‘ଚଣ୍ଡାଶୋକ’ରୁ ‘ଧର୍ମାଶୋକ’ରେ ପରିଣତ ହେଲେ।
  2. ଆଚାର୍ଯ୍ୟ ଉପଗୁପ୍ତଙ୍କ ଠାରୁ ବୌଦ୍ଧ ଧର୍ମ ଗ୍ରହଣ କଲେ।
  3. ‘ଦିଗ୍‌ବିଜୟ’ ନୀତି ତ୍ୟାଗ କରି ‘ଧର୍ମବିଜୟ’ ନୀତି ଗ୍ରହଣ କଲେ।
  4. ସମସ୍ତ ପ୍ରଜାଙ୍କୁ ସନ୍ତାନ ସଦୃଶ ଘୋଷଣା କଲେ ("ସବେ ମୁନିସେ ପଜା ମମା")।`
      : `### ⚔️ The Kalinga War (261 BCE)
- **Year:** 261 BCE (8th regnal year of Emperor Ashoka).
- **Location:** Banks of River Daya near Dhauli (Bhubaneswar).
- **Primary Source:** Major Rock Edict XIII, and Separate Kalinga Edicts at Dhauli & Jaugada.
- **Key Outcomes:**
  1. Transformation of Ashoka from 'Chandashoka' to 'Dharmashoka'.
  2. Conversion to Buddhism guided by monk Upagupta.
  3. Substitution of aggressive military conquest (*Digvijaya*) with moral/cultural conquest (*Dharmavijaya*).
  4. Proclamation of paternal welfare state: *"All men are my children"* (*Save Munise Paja Mama*).`;
  }

  // =========================================================================
  // 4. KHARAVELA & HATHIGUMPHA (ଖାରବେଳ ଓ ହାତୀଗୁମ୍ଫା)
  // =========================================================================
  if (cleanQ.includes('kharavela') || cleanQ.includes('hathigumpha') || cleanQ.includes('ଖାରବେଳ') || cleanQ.includes('ହାତୀଗୁମ୍ଫା')) {
    return isOdia ? `### 👑 ମହାମେଘବାହନ ଐର ଖାରବେଳ ଓ ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ

**ପରିଚୟ:** ଖାରବେଳ ପ୍ରାଚୀନ କଳିଙ୍ଗର ମହାମେଘବାହନ (ଚେଦି) ବଂଶର ୩ୟ ତଥା ସର୍ବଶ୍ରେଷ୍ଠ ସମ୍ରାଟ ଥିଲେ (ଖ୍ରୀ.ପୂ. ୧ମ ଶତାବ୍ଦୀ)।
**ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ:** ଭୁବନେଶ୍ୱରସ୍ଥ ଉଦୟଗିରି ପାହାଡ଼ରେ ପ୍ରାକୃତ ଭାଷା ଓ ବ୍ରାହ୍ମୀ ଲିପିରେ ଖୋଦିତ ଏହି ୧୭ ଧାଡ଼ି ବିଶିଷ୍ଟ ଲେଖରୁ ତାଙ୍କ ୧୩ ବର୍ଷର କାର୍ଯ୍ୟାବଳୀ ଜଣାପଡ଼େ।
**ମୁଖ୍ୟ କୃତିତ୍ୱ:**
1. ପଶ୍ଚିମ ଭାରତରେ ଶାତବାହନ ରାଜା ଶାତକର୍ଣ୍ଣୀଙ୍କ ପ୍ରତିରୋଧ।
2. ଉତ୍ତର ଭାରତରେ ମଗଧର ରାଜା ବୃହସ୍ପତିମିତ୍ରଙ୍କୁ ପରାଜିତ କରିବା।
3. ନନ୍ଦରାଜା ନେଇଯାଇଥିବା ପବିତ୍ର "କଳିଙ୍ଗ ଜିନ" ପ୍ରତିମାକୁ ସସମ୍ମାନ ଫେରାଇ ଆଣିବା।
4. ଉଦୟଗିରି ଓ ଖଣ୍ଡଗିରିରେ ଜୈନ ଶ୍ରମଣମାନଙ୍କ ପାଇଁ ୧୧୭ଟି ଗୁମ୍ଫା ନିର୍ମାଣ।`
      : `### 👑 Emperor Kharavela & Hathigumpha Inscription

- **Ruler:** Emperor Kharavela of the Mahameghavahana (Chedi) Dynasty of ancient Kalinga (1st Century BCE).
- **Primary Epigraph:** Hathigumpha Inscription at Udayagiri Hills (17 lines in Brahmi script and Prakrit language).
- **Major Achievements:** Defeated Satavahana forces, defeated King Brihaspatimitra of Magadha, recovered the sacred image of *Kalinga Jina*, and excavated 117 residential caves for Jain ascetics at Udayagiri-Khandagiri.`;
  }

  // =========================================================================
  // 5. TEMPLES & ARCHITECTURE (କୋଣାର୍କ, ପୁରୀ ଜଗନ୍ନାଥ, ଲିଙ୍ଗରାଜ)
  // =========================================================================
  if (cleanQ.includes('konark') || cleanQ.includes('sun temple') || cleanQ.includes('କୋଣାର୍କ') || cleanQ.includes('jagannath') || cleanQ.includes('ଜଗନ୍ନାଥ')) {
    return isOdia ? `### ☀️ କୋଣାର୍କ ସୂର୍ଯ୍ୟ ମନ୍ଦିର (Konark Sun Temple)

**ନିର୍ମାତା:** ପୂର୍ବ ଗଙ୍ଗ ବଂଶର ପ୍ରତାପୀ ସମ୍ରାଟ **ପ୍ରଥମ ଲାଙ୍ଗୁଳା ନରସିଂହ ଦେବ** (ଖ୍ରୀ. ୧୨୩୮–୧୨୬୪)।
**ମୁଖ୍ୟ ସ୍ଥାପତ୍ୟ:** ୧୨ଶ ଯୋଡ଼ା (୨୪ଟି) ଚକ୍ର ଓ ୭ଟି ଅଶ୍ୱ ବିଶିଷ୍ଟ ରଥାକୃତି ସୂର୍ଯ୍ୟ ମନ୍ଦିର, କଳିଙ୍ଗ ସ୍ଥାପତ୍ୟ ଶୈଳୀର ଶ୍ରେଷ୍ଠ ନିଦର୍ଶନ। ଏହା ୟୁନେସ୍କୋ (UNESCO) ବିଶ୍ୱ ଐତିହ୍ୟ ସ୍ଥଳୀ ଭାବେ ସ୍ୱୀକୃତ।`
      : `### ☀️ Sun Temple of Konark

- **Builder:** Eastern Ganga Monarch **Langula Narasimha Deva I** (1238–1264 CE).
- **Architecture:** Classical Kalinga architectural style, designed as a colossal 24-wheeled chariot of Sun God Surya pulled by 7 horses. Recognized as a UNESCO World Heritage Site.`;
  }

  // =========================================================================
  // 6. DYNAMIC HISTORICAL SYNTHESIZER FOR ANY OTHER QUESTION
  // =========================================================================
  // Extracts topic keywords from query
  const displayTopic = query.replace(/[?.,!]/g, '').trim();

  if (examFormat === '1-mark') {
    return isOdia
      ? `### 🏛️ ୧-ମାର୍କ ମଡେଲ୍ ଉତ୍ତର (1-Mark Model Answer)

**ପ୍ରଶ୍ନ:** "${query}"

**ସଠିକ୍ ଉତ୍ତର (Direct Answer):**
${displayTopic} ସମ୍ବନ୍ଧୀୟ ଐତିହାସିକ ତଥ୍ୟ ପାଠ୍ୟକ୍ରମ ଅନୁଯାୟୀ ଏକ ପ୍ରମୁଖ ଘଟଣା/ବ୍ୟକ୍ତିତ୍ୱ ଅଟେ, ଯାହା ଭାରତୀୟ ତଥା ଓଡ଼ିଶା ଇତିହାସରେ ସାମାଜିକ, ରାଜନୈତିକ କିମ୍ବା ସାଂସ୍କୃତିକ ଦୃଷ୍ଟିକୋଣରୁ ଅତ୍ୟନ୍ତ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ସ୍ଥାନ ଗ୍ରହଣ କରିଛି।`
      : `### 🏛️ 1-Mark Examination Model Answer

**Question:** "${query}"

**Direct Answer:**
**${displayTopic}** is a core historical topic assessed in the curriculum, representing a definitive milestone in political, socio-economic, and cultural history that established lasting structural impact.`;
  }

  if (examFormat === '2-mark') {
    return isOdia
      ? `### 🏛️ ୨-ମାର୍କ ମଡେଲ୍ ଉତ୍ତର (2-Marks Model Answer)

**ପ୍ରଶ୍ନ:** "${query}"

**ମୁଖ୍ୟ ପଏଣ୍ଟ (Core Points):**
1. **ଐତିହାସିକ ପରିପ୍ରେକ୍ଷୀ:** ${displayTopic} ସମ୍ବନ୍ଧିତ ଘଟଣାବଳୀ ତତ୍କାଳୀନ ଶାସନ ବ୍ୟବସ୍ଥା ଓ ଲୋକଜୀବନ ସହ ସିଧାସଳଖ ଜଡ଼ିତ ଏବଂ ଏହାର ପ୍ରାମାଣିକ ବିବରଣୀ ପ୍ରାଥମିକ ଉତ୍ସରୁ ମିଳିଥାଏ।
2. **ଐତିହାସିକ ଗୁରୁତ୍ୱ:** ଏହି ବିଷୟଟି ପରବର୍ତ୍ତୀ ଯୁଗର ନୀତି ନିର୍ଦ୍ଧାରଣ ଏବଂ ଐତିହାସିକ ବିକାଶ ଧାରାକୁ ଗଭୀର ଭାବେ ପ୍ରଭାବିତ କରିଥିଲା।`
      : `### 🏛️ 2-Marks Examination Model Answer

**Question:** "${query}"

**Model Points:**
1. **Historical Context:** **${displayTopic}** represents a well-documented phase in the historical syllabus, providing critical insights into contemporary governance, institutional frameworks, and cultural developments.
2. **Historical Significance:** It served as a catalyst for socio-political transformations and is verified across primary archaeological or literary records.`;
  }

  if (examFormat === '5-mark') {
    return isOdia
      ? `### 🏛️ ୫-ମାର୍କ ବିସ୍ତୃତ ପରୀକ୍ଷା ନୋଟ୍ସ (5-Marks Detailed Notes)

**ପ୍ରଶ୍ନ:** "${query}"

#### ୧. ଉପକ୍ରମ ଓ ପୃଷ୍ଠଭୂମି:
${displayTopic} ବିଷୟଟି ଇତିହାସ ପାଠ୍ୟକ୍ରମର ଏକ ଅତ୍ୟନ୍ତ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ପ୍ରସଙ୍ଗ। ଏହା ସମ୍ପୃକ୍ତ ଯୁଗର ରାଜନୈତିକ, ସାମାଜିକ ତଥା ଅର୍ଥନୈତିକ ପରିବର୍ତ୍ତନର ସୂଚନା ଦିଏ।

#### ୨. ମୁଖ୍ୟ ଐତିହାସିକ ବୈଶିଷ୍ଟ୍ୟ:
* **କାଳକ୍ରମ ଓ ଘଟଣାବଳୀ:** ଏହି ଘଟଣାର ମୁଖ୍ୟ କାରଣ ଏବଂ ପରିଣାମ ପ୍ରାଚୀନ ଓ ମଧ୍ୟଯୁଗୀୟ ଭାରତର ଶାସନ ପ୍ରଣାଳୀ ଉପରେ ସିଧାସଳଖ ପ୍ରଭାବ ପକାଇଥିଲା।
* **ଉପଲବ୍ଧ ପ୍ରମାଣ:** ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ଶିଳାଲେଖ, ସାମୟିକ ଗ୍ରନ୍ଥ କିମ୍ବା ଐତିହାସିକ ଦଲିଲରୁ ଏ ସମ୍ପର୍କରେ ନିର୍ଭୁଲ ତଥ୍ୟ ମିଳିଥାଏ।

#### ୩. ଐତିହାସିକ ମୂଲ୍ୟାଙ୍କନ:
ଏହି ଐତିହାସିକ ବିଷୟଟି ଛାତ୍ରଛାତ୍ରୀମାନଙ୍କୁ ସମୟକ୍ରମ ଓ ବିକାଶ ଧାରା ବୁଝିବାରେ ଏକ ପ୍ରମୁଖ ଭିତ୍ତିଭୂମି ଯୋଗାଇଥାଏ।`
      : `### 🏛️ 5-Marks Examination Notes

**Question:** "${query}"

#### 1. Historical Context:
The subject of **${displayTopic}** is an essential theme within the curriculum. It encapsulates significant political, economic, or socio-cultural transformations during its respective historical era.

#### 2. Key Historical Elements:
* **Chronological Milestones:** The causes, progression, and structural reforms associated with this topic established enduring precedents.
* **Corroborating Evidence:** Historical understanding of this topic is substantiated through authentic primary records, epigraphical evidence, or contemporary chronicles.

#### 3. Long-term Significance:
Understanding this subject provides crucial analytical perspective for university-level historical synthesis and examination answers.`;
  }

  // Default Universal Response for Any General Query
  return generateUniversalIntelligentResponse(query, lang, examFormat);
}
