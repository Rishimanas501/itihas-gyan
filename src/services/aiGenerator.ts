import type { Question, QuestionPattern, QuestionLanguage } from '../types';

export interface GenerateOptions {
  text: string;
  subject: string;
  department: string;
  semester: string;
  paper: string;
  topic: string;
  language: QuestionLanguage;
  patterns: QuestionPattern[];
  targetCount: number;
  apiKey?: string;
}

export async function generateQuestionsFromSource(options: GenerateOptions): Promise<Question[]> {
  const { apiKey, text } = options;

  // Check if user directly pasted formatted/structured questions (MCQs, True/False, Blanks, Q&A)
  const directlyParsed = parseAndConvertPastedText(text, options);
  if (directlyParsed && directlyParsed.length > 0) {
    return directlyParsed;
  }

  // If Gemini API Key is provided, use Google Gemini API
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const generated = await callGeminiAPI(options);
      if (generated && generated.length > 0) {
        return generated;
      }
    } catch (err) {
      console.warn('Gemini API call failed, switching to Intelligent Offline History Generator:', err);
    }
  }

  // Use Intelligent Offline Rule-Based Historical Generator
  return generateOfflineHistoryQuestions(options);
}

/**
 * Universal Smart Question Parser & Auto-Converter
 * Automatically analyzes any pasted questions (MCQ, Fill in the Blanks, True/False, One-Word, Short Q&A)
 * whether in Odia, English, or mixed format, extracts options, correct answers, and generates missing explanations.
 */
export function normalizeOdiaDigits(str: string): string {
  const odiaDigits = '୦୧୨୩୪୫୬୭୮୯';
  return str.replace(/[୦-୯]/g, (d) => String(odiaDigits.indexOf(d)));
}

export function normalizeQuestionForComparison(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/^(?:(?:q(?:uestion|\.|\:)?\s*[\d୦-୯]+[\.\:\-]?)|(?:[\d୦-୯]+[\.\)\-]))\s*/i, '')
    .replace(/^ପ୍ରଶ୍ନ\s*[\d୦-୯]+[\.\:\-]?\s*/i, '')
    .replace(/[\s\p{P}\p{S}]+/gu, '')
    .trim();
}

export function checkQuestionDuplicate(
  newQText: string,
  existingList: { question: string }[]
): { isDuplicate: boolean; matchedQuestion?: string } {
  const normNew = normalizeQuestionForComparison(newQText);
  if (!normNew || normNew.length < 5) return { isDuplicate: false };

  for (const item of existingList) {
    const normExisting = normalizeQuestionForComparison(item.question);
    if (!normExisting || normExisting.length < 5) continue;

    if (normNew === normExisting) {
      return { isDuplicate: true, matchedQuestion: item.question };
    }

    if (normNew.length > 20 && normExisting.length > 20) {
      if (normNew.includes(normExisting) || normExisting.includes(normNew)) {
        return { isDuplicate: true, matchedQuestion: item.question };
      }
    }
  }

  return { isDuplicate: false };
}

export interface DuplicateScanResult<T> {
  itemA: T;
  itemB: T;
  indexA: number;
  indexB: number;
  matchType: 'exact' | 'partial';
}

export function scanDuplicatesInQuestions<T extends { id?: any; question: string }>(
  items: T[]
): DuplicateScanResult<T>[] {
  const duplicates: DuplicateScanResult<T>[] = [];
  const normalizedList = items.map((it) => normalizeQuestionForComparison(it.question));

  for (let i = 0; i < items.length; i++) {
    const normA = normalizedList[i];
    if (!normA || normA.length < 5) continue;

    for (let j = i + 1; j < items.length; j++) {
      const normB = normalizedList[j];
      if (!normB || normB.length < 5) continue;

      if (normA === normB) {
        duplicates.push({
          itemA: items[i],
          itemB: items[j],
          indexA: i + 1,
          indexB: j + 1,
          matchType: 'exact'
        });
      } else if (normA.length > 22 && normB.length > 22 && (normA.includes(normB) || normB.includes(normA))) {
        duplicates.push({
          itemA: items[i],
          itemB: items[j],
          indexA: i + 1,
          indexB: j + 1,
          matchType: 'partial'
        });
      }
    }
  }

  return duplicates;
}

function extractTrailingAnswerKey(rawText: string): {
  questionsPart: string;
  answerMap: Map<number, string>;
} {
  const answerMap = new Map<number, string>();
  const lines = rawText.split('\n');

  // Dedicated trailing Answer Key header (must NOT be an individual question's "ଉତ୍ତର: <value>" line)
  const keyHeaderRegex =
    /^(?:\*{0,2})(?:answers?|answer\s*key|key|ଉତ୍ତରମାଳା|ଉତ୍ତର\s*ତାଲିକା|ସଠିକ୍?\s*ଉତ୍ତର(?:ଗୁଡ଼ିକ)?|ଉତ୍ତର)(?:\*{0,2})\s*[:\-–—.]?\s*$/i;
  const inlineKeyHeaderRegex =
    /^(?:\*{0,2})(?:answers?|answer\s*key|ଉତ୍ତରମାଳା|ଉତ୍ତର\s*ତାଲିକା)(?:\*{0,2})\s*[:\-–—.]\s*([\d୦-୯]+[\.\)\:\-–—].+)$/i;

  let splitIdx = -1;
  for (let i = Math.max(2, Math.floor(lines.length * 0.25)); i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!keyHeaderRegex.test(trimmed) && !inlineKeyHeaderRegex.test(trimmed)) {
      continue;
    }

    const tailLines = lines.slice(i + 1).map((l) => l.trim()).filter(Boolean);
    const tail = lines.slice(i).join('\n');
    const hasNumberedItems = /(?:^|\n|\s)[\d୦-୯]+\s*[\.\)\:\-–—]\s*\S/.test(tail);
    const looksLikeMoreQuestions = tailLines.some(
      (l) => /_{2,}|\.{3,}|\?|\([A-Da-d]\)/.test(l) || /^(?:Ans(?:wer)?|ଉତ୍ତର|Exp)\s*[:\-]/i.test(l)
    );

    if (hasNumberedItems && !looksLikeMoreQuestions) {
      splitIdx = i;
      break;
    }
  }

  if (splitIdx === -1) {
    return { questionsPart: rawText, answerMap };
  }

  const questionsPart = lines.slice(0, splitIdx).join('\n').trim();
  const keyText = lines.slice(splitIdx).join('\n');

  // Parse inline or multi-line numbered key entries: "1. Answer", "୧) Answer", "10 - Answer"
  const entryRegex = /(?:^|\n|\s)([\d୦-୯]+)\s*[\.\)\:\-–—]\s*([^\n]+?)(?=(?:\s+[\d୦-୯]+\s*[\.\)\:\-–—]\s)|$|\n)/g;
  for (const match of keyText.matchAll(entryRegex)) {
    const qNum = Number(normalizeOdiaDigits(match[1]));
    const ans = match[2].replace(/[,;]\s*$/, '').trim();
    if (!Number.isNaN(qNum) && qNum > 0 && ans) {
      answerMap.set(qNum, ans);
    }
  }

  return { questionsPart, answerMap };
}

export function parseAndConvertPastedText(rawText: string, meta: Partial<Question>): Question[] {
  if (!rawText || !rawText.trim()) return [];

  const { questionsPart, answerMap } = extractTrailingAnswerKey(rawText.trim());
  const text = questionsPart.trim();
  const now = new Date().toISOString();
  const questions: Question[] = [];

  // Split text into question blocks based on standard question delimiters
  // Supports English digits 0-9 AND all Odia digits ୦-୯ (e.g. ୧୦., ୨୦.)
  const blockDelimRegex =
    /(?:^|\n+)(?=(?:(?:Q(?:uestion|\.|\:)?\s*[\d୦-୯]+)|(?:[\d୦-୯]+[\.\)\-]))|(?:ପ୍ରଶ୍ନ\s*[\d୦-୯]+[\.\:\-]))/i;
  
  let rawBlocks = text.split(blockDelimRegex).map(b => b.trim()).filter(b => b.length > 0);

  // If no numbered delimiters found, attempt splitting by double newlines
  if (rawBlocks.length <= 1) {
    const doubleNewlineBlocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 10);
    if (doubleNewlineBlocks.length > 1) {
      rawBlocks = doubleNewlineBlocks;
    }
  }

  // If still a single block with multiple lines and no options/Ans markers (e.g., list of blank questions or answers without numbers), split by lines
  if (rawBlocks.length <= 1 && text.includes('\n')) {
    const nonEmptyLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
    const hasExplicitMarkers = nonEmptyLines.some(l => /^(?:\([A-Da-dକ-ଘ1-4]\)|[A-Da-dକ-ଘ][\.\)\-]|Ans|Answer|ଉତ୍ତର|Exp)/i.test(l));
    if (!hasExplicitMarkers && nonEmptyLines.length > 1) {
      rawBlocks = nonEmptyLines;
    }
  }

  // Fallback: If still single block, treat as single question block
  if (rawBlocks.length === 0 && text.length > 5) {
    rawBlocks = [text];
  }

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    const numMatch = block.match(/^(?:(?:Q(?:uestion|\.|\:)?\s*)|(?:ପ୍ରଶ୍ନ\s*))?([\d୦-୯]+)/i);
    const explicitNum = numMatch ? Number(normalizeOdiaDigits(numMatch[1])) : i + 1;
    const keyAns = answerMap.get(explicitNum) || answerMap.get(i + 1) || '';
    const parsedQ = parseSingleQuestionBlock(block, i + 1, meta, now, keyAns);
    if (parsedQ) {
      questions.push(parsedQ);
    }
  }

  return questions;
}

function parseSingleQuestionBlock(
  block: string,
  _index: number,
  meta: Partial<Question>,
  now: string,
  answerFromKey: string = ''
): Question | null {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return null;

  // Extract Question text, options, answer, and explanation
  let questionText = '';
  const options: string[] = [];
  let answerStr = '';
  let explanationStr = '';
  let incorrectExplanations: string[] = [];
  let pattern: QuestionPattern = 'mcq';
  let marks = 1;

  // Regex patterns (Odia + English variants including shorthand "ଉ:" / "ଉତ୍ତର -" / "ସଠିକ ଉତ୍ତର:")
  const ansRegex = /^(?:Ans(?:wer)?|ଉତ୍ତର|ଉ|ସଠିକ୍?\s*ଉତ୍ତର|Correct(?:\s*Ans(?:wer)?)?)\s*[\:\.\-\–\—\=]\s*(.+)$/i;
  const expRegex = /^(?:Exp(?:lanation)?|ବ୍ୟାଖ୍ୟା|Reason|ତଥ୍ୟ)\s*[\:\.\-\–\—\=]\s*(.+)$/i;
  const inlineAnsRegex = /\s*(?:[\(\[]\s*(?:Ans(?:wer)?|ଉତ୍ତର|ଉ|ସଠିକ୍?\s*ଉତ୍ତର)\s*[\:\.\-\–\—\=]?\s*([^\)\]]+?)\s*[\)\]]|(?:—|–|->|→)\s*(?:(?:Ans(?:wer)?|ଉତ୍ତର|ଉ)\s*[\:\-\=]?\s*)?([^\n]+))$/i;
  
  // Option prefixes: (A), (B), A., A), [A], a., (କ), (ଖ), (1), 1., etc.
  const optLineRegex = /^(?:\(([A-Da-dକ-ଘ1-4])\)|([A-Da-dକ-ଘ1-4])[\.\)\-]|\b([A-Da-d])\s*[\:\-])\s*(.+)$/;

  // Check inline options: e.g. "A) Apple B) Banana C) Cherry D) Date" or "(A) ... (B) ... (C) ... (D) ..."
  const inlineOptRegex = /(?:\(([A-Da-dକ-ଘ1-4])\)|(?:\b|\s)([A-Da-dକ-ଘ])[\.\)\-])\s*([^(\n]+?)(?=(?:\([A-Da-dକ-ଘ1-4]\)|(?:\b|\s)[A-Da-dକ-ଘ][\.\)\-])|$)/g;

  let parsingOptions = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    let line = lines[lineIdx];

    // Check Answer line
    const ansMatch = line.match(ansRegex);
    if (ansMatch) {
      answerStr = ansMatch[1].trim();
      continue;
    }

    // Check Explanation line
    const expMatch = line.match(expRegex);
    if (expMatch) {
      explanationStr = expMatch[1].trim();
      continue;
    }

    // Check Option line (only after questionText exists so leading question numbers 1., 2., 3., 4. are never mistaken for options)
    const optMatch = lineIdx > 0 && questionText.trim().length > 0 ? line.match(optLineRegex) : null;
    if (optMatch) {
      parsingOptions = true;
      const optVal = optMatch[4].trim();
      options.push(optVal);
      continue;
    }

    // If we are not parsing options yet, check if this line contains inline options
    if (!parsingOptions && options.length === 0) {
      const inlineMatches = Array.from(line.matchAll(inlineOptRegex));
      if (inlineMatches.length >= 2) {
        parsingOptions = true;
        // The text before the first option is part of question
        const firstMatchIndex = inlineMatches[0].index || 0;
        const qPrefix = line.substring(0, firstMatchIndex).trim();
        if (qPrefix) {
          questionText += (questionText ? ' ' : '') + qPrefix;
        }
        for (const match of inlineMatches) {
          options.push(match[3].trim());
        }
        continue;
      }
    }

    // If options are already found or explanation continues
    if (explanationStr && !line.match(ansRegex)) {
      explanationStr += ' ' + line;
      continue;
    }

    // Check inline answer at end of question line: e.g. "... ____ ... (Ans: Numismatics)" or "... -> Numismatics"
    if (!parsingOptions && !answerStr) {
      const inlineAnsMatch = line.match(inlineAnsRegex);
      if (inlineAnsMatch) {
        const extracted = (inlineAnsMatch[1] || inlineAnsMatch[2] || '').trim();
        if (extracted) {
          answerStr = extracted;
          line = line.replace(inlineAnsRegex, '').trim();
        }
      }
    }

    // Otherwise, it is question text
    if (!parsingOptions && line) {
      questionText += (questionText ? '\n' : '') + line;
    }
  }

  if (!answerStr && answerFromKey) {
    answerStr = answerFromKey.trim();
  }

  // Clean Question text: Remove leading question numbering like "1.", "Q1:", "୧୦."
  questionText = questionText.replace(/^(?:(?:Q(?:uestion|\.|\:)?\s*[\d୦-୯]+[\.\:\-]?)|(?:[\d୦-୯]+[\.\)\-]))\s*/i, '').trim();
  questionText = questionText.replace(/^ପ୍ରଶ୍ନ\s*[\d୦-୯]+[\.\:\-]?\s*/i, '').trim();

  // If question text is empty, fallback to first line
  if (!questionText && lines.length > 0) {
    questionText = lines[0];
  }

  // Determine Pattern
  const lowerQ = questionText.toLowerCase();
  const lowerAns = answerStr.toLowerCase();

  const isTrueFalseIndic = (
    lowerQ.includes('true/false') || 
    lowerQ.includes('(true / false)') ||
    lowerQ.includes('true or false') ||
    questionText.includes('ସତ୍ୟ / ମିଥ୍ୟା') ||
    questionText.includes('ସତ୍ୟ/ମିଥ୍ୟା') ||
    lowerAns === 'true' || 
    lowerAns === 'false' ||
    answerStr === 'ସତ୍ୟ' ||
    answerStr === 'ମିଥ୍ୟା'
  );

  const isBlankIndic = (
    /_{2,}|\.{3,}|-{3,}|\(\s{2,}\)|\[\s{2,}\]/.test(questionText) ||
    lowerQ.includes('fill in the blank') ||
    questionText.includes('ଶୂନ୍ୟସ୍ଥାନ')
  );

  if (isTrueFalseIndic) {
    pattern = 'true_false';
    marks = 1;
    if (options.length === 0) {
      options.push('ସତ୍ୟ (True)', 'ମିଥ୍ୟା (False)');
    }
  } else if (isBlankIndic && options.length === 0) {
    pattern = 'blanks';
    marks = 1;
  } else if (options.length >= 2) {
    pattern = 'mcq';
    marks = 1;
  } else if (answerStr && (answerStr.length > 100 || questionText.toLowerCase().includes('discuss') || questionText.toLowerCase().includes('explain'))) {
    pattern = 'short';
    marks = 2;
  } else if (answerStr && answerStr.length <= 40) {
    pattern = 'one_word';
    marks = 1;
  } else {
    pattern = meta.pattern || 'mcq';
  }

  // Resolve Correct Answer
  let resolvedCorrect = '';
  if (pattern === 'true_false') {
    if (lowerAns.includes('true') || answerStr.includes('ସତ୍ୟ')) {
      resolvedCorrect = options.find(o => o.includes('True') || o.includes('ସତ୍ୟ')) || 'ସତ୍ୟ (True)';
    } else {
      resolvedCorrect = options.find(o => o.includes('False') || o.includes('ମିଥ୍ୟା')) || 'ମିଥ୍ୟା (False)';
    }
  } else if (options.length > 0) {
    // If answerStr specified letter e.g. "A", "(B)", "C", "କ", "ଖ", "1", "2"
    const letterMatch = answerStr.match(/^\(?([A-Da-dକ-ଘ1-4])\)?$/);
    if (letterMatch) {
      const char = letterMatch[1].toUpperCase();
      let optIdx = -1;
      if (char === 'A' || char === '1' || char === 'କ') optIdx = 0;
      else if (char === 'B' || char === '2' || char === 'ଖ') optIdx = 1;
      else if (char === 'C' || char === '3' || char === 'ଗ') optIdx = 2;
      else if (char === 'D' || char === '4' || char === 'ଘ') optIdx = 3;

      if (optIdx >= 0 && optIdx < options.length) {
        resolvedCorrect = options[optIdx];
      }
    }

    // If still not matched, check if answer matches text of one of options
    if (!resolvedCorrect && answerStr) {
      const match = options.find(o => 
        o.toLowerCase().trim() === answerStr.toLowerCase().trim() ||
        answerStr.toLowerCase().includes(o.toLowerCase().trim()) ||
        o.toLowerCase().includes(answerStr.toLowerCase().trim())
      );
      if (match) {
        resolvedCorrect = match;
      }
    }

    // Fallback: If no answer was specified and options exist, select first option
    if (!resolvedCorrect && options.length > 0) {
      resolvedCorrect = options[0];
    }
  } else {
    resolvedCorrect = answerStr || '';
  }

  // Build Explanations
  let explanationCorrect = explanationStr;
  if (!explanationCorrect && resolvedCorrect) {
    explanationCorrect = `ଐତିହାସିକ ତଥ୍ୟ ଓ ପାଠ୍ୟାଂଶ ଅନୁସାରେ "${resolvedCorrect}" ଏହି ପ୍ରଶ୍ନର ସମ୍ପୂର୍ଣ୍ଣ ସଠିକ୍ ଉତ୍ତର ଅଟେ। (According to historical records, "${resolvedCorrect}" is the verified correct answer.)`;
  }

  if (options.length > 0) {
    incorrectExplanations = options.map((opt) => {
      if (opt === resolvedCorrect) return '';
      return `"${opt}" ଏହି ପ୍ରଶ୍ନ ପାଇଁ ଭୁଲ୍ ବିକଳ୍ପ ଅଟେ ଏବଂ ପ୍ରଦତ୍ତ ଐତିହାସିକ ଘଟଣା ସହ ମେଳ ଖାଉନାହିଁ। (Incorrect option for this historical context.)`;
    }).filter(e => e.length > 0);
  }

  return {
    question: questionText,
    pattern,
    marks,
    options: options.length > 0 ? options : undefined,
    correctAnswer: resolvedCorrect,
    explanationCorrect,
    explanationIncorrect: incorrectExplanations.length > 0 ? incorrectExplanations : undefined,
    modelAnswer: pattern === 'short' || pattern === 'long' ? (answerStr || explanationStr) : undefined,
    subject: meta.subject || 'History of Odisha',
    department: meta.department || 'History',
    semester: meta.semester || '4th Semester',
    paper: meta.paper || 'Core Paper VII',
    topic: meta.topic || 'Classroom Evaluation',
    language: meta.language || 'bilingual',
    approved: true, // auto-ready for live quiz
    createdAt: now,
    updatedAt: now
  };
}

// Intelligent Offline Fallback Generator
function generateOfflineHistoryQuestions(options: GenerateOptions): Question[] {
  const { text, subject, department, semester, paper, topic, language, patterns, targetCount } = options;
  const questions: Question[] = [];

  // Parse lines, sentences and key entities from the input text
  const cleanText = text.trim();
  const sentences = cleanText
    .split(/[।.\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const now = new Date().toISOString();

  // Pattern 1: MCQ
  if (patterns.includes('mcq')) {
    // Generate MCQ based on sentences or Odisha/Indian history context
    const isOdia = language === 'odia' || language === 'bilingual';
    
    questions.push({
      question: isOdia
        ? `କଳିଙ୍ଗ ଯୁଦ୍ଧ (ଖ୍ରୀ.ପୂ. ୨୬୧) ପରେ ସମ୍ରାଟ ଅଶୋକ କେଉଁ ଧର୍ମ ଗ୍ରହଣ କରିଥିଲେ?\n(Which religion was adopted by Emperor Ashoka after Kalinga War?)`
        : `Which religion did Emperor Ashoka adopt after the historic Kalinga War (261 BCE)?`,
      questionOdia: `କଳିଙ୍ଗ ଯୁଦ୍ଧ (ଖ୍ରୀ.ପୂ. ୨୬୧) ପରେ ସମ୍ରାଟ ଅଶୋକ କେଉଁ ଧର୍ମ ଗ୍ରହଣ କରିଥିଲେ?`,
      questionEnglish: `Which religion did Emperor Ashoka adopt after the historic Kalinga War (261 BCE)?`,
      pattern: 'mcq',
      marks: 1,
      options: [
        'ବୌଦ୍ଧ ଧର୍ମ (Buddhism)',
        'ଜୈନ ଧର୍ମ (Jainism)',
        'ଆଜୀବିକ ଧର୍ମ (Ajivika)',
        'ବୈଦିକ ଧର୍ମ (Vedic Hinduism)'
      ],
      correctAnswer: 'ବୌଦ୍ଧ ଧର୍ମ (Buddhism)',
      explanationCorrect: 'କଳିଙ୍ଗ ଯୁଦ୍ଧର ଭୟାବହ ରକ୍ତପାତ ଦେଖି ଅନୁତପ୍ତ ଅଶୋକ ଉପଗୁପ୍ତଙ୍କ ଦ୍ୱାରା ବୌଦ୍ଧ ଧର୍ମରେ ଦୀକ୍ଷିତ ହୋଇଥିଲେ ଏବଂ ‘ଦିଗ୍‌ବିଜୟ’ ପରିବର୍ତ୍ତେ ‘ଧର୍ମବିଜୟ’ ନୀତି ଆପଣାଇଥିଲେ।',
      explanationIncorrect: [
        'ଜୈନ ଧର୍ମ ଚନ୍ଦ୍ରଗୁପ୍ତ ମୌର୍ଯ୍ୟ ଏବଂ ସମ୍ରାଟ ଖାରବେଳଙ୍କ ସହ ଜଡ଼ିତ।',
        'ଆଜୀବିକ ଧର୍ମ ବିନ୍ଦୁସାରଙ୍କ ପ୍ରିୟ ଥିଲା।',
        'ବୈଦିକ ଧର୍ମ ମୌର୍ଯ୍ୟ ସାମ୍ରାଜ୍ୟ ପୂର୍ବରୁ ପ୍ରଧାନ ଥିଲା।'
      ],
      subject,
      department,
      semester,
      paper,
      topic,
      language,
      approved: false,
      createdAt: now,
      updatedAt: now
    });

    // If source text contains sentences, extract dynamic MCQ
    if (sentences.length > 0) {
      const focalSentence = sentences[0];
      const words = focalSentence.split(/\s+/).filter(w => w.length > 3);
      const keyKeyword = words[Math.floor(words.length / 2)] || 'ଐତିହାସିକ ଘଟଣା';

      questions.push({
        question: isOdia
          ? `ପ୍ରଦତ୍ତ ପାଠ୍ୟ ଅନୁସାରେ: "${focalSentence.substring(0, 80)}..." ଉକ୍ତ ତଥ୍ୟ କାହା ସହିତ ସମ୍ପର୍କିତ?`
          : `According to the source text: "${focalSentence.substring(0, 80)}..." this statement relates to which historical context?`,
        pattern: 'mcq',
        marks: 1,
        options: [
          `ପ୍ରଧାନ ଐତିହାସିକ ବିବରଣୀ: ${keyKeyword}`,
          'ପରବର୍ତ୍ତୀ ମୁଗଲ ଶାସନ କାଳ',
          'ବ୍ରିଟିଶ ଇଷ୍ଟ ଇଣ୍ଡିଆ କମ୍ପାନୀର ଆରମ୍ଭ',
          'ଆଞ୍ଚଳିକ ରାଜବଂଶର ପତନ'
        ],
        correctAnswer: `ପ୍ରଧାନ ଐତିହାସିକ ବିବରଣୀ: ${keyKeyword}`,
        explanationCorrect: `ପ୍ରଦତ୍ତ ମୂଳ ପାଠ୍ୟାଂଶରୁ ସିଧାସଳଖ ଏହି ତଥ୍ୟ ପ୍ରମାଣିତ ହୋଇଛି ଯେଉଁଥିରେ ${keyKeyword} ବିଷୟରେ ବର୍ଣ୍ଣନା କରାଯାଇଛି।`,
        explanationIncorrect: [
          'ଏହା ପରବର୍ତ୍ତୀ ସମୟର ଘଟଣା ଏବଂ ପାଠ୍ୟରେ ଏହାର ଉଲ୍ଲେଖ ନାହିଁ।',
          'ବ୍ରିଟିଶ ଶାସନ ଏହି ଘଟଣାଠାରୁ ଭିନ୍ନ ସମୟର।',
          'ଏହା କୌଣସି ରାଜବଂଶର ପତନ ସହିତ ଜଡ଼ିତ ନୁହେଁ।'
        ],
        subject,
        department,
        semester,
        paper,
        topic,
        language,
        approved: false,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  // Pattern 2: Fill in the Blanks
  if (patterns.includes('blanks')) {
    questions.push({
      question: language === 'odia' || language === 'bilingual'
        ? `ପ୍ରାଚୀନ କଳିଙ୍ଗର ପ୍ରସିଦ୍ଧ ବନ୍ଦର ______ ରୁ ଦକ୍ଷିଣ-ପୂର୍ବ ଏସିଆକୁ ସାମୁଦ୍ରିକ ବାଣିଜ୍ୟ ଚାଲୁଥିଲା।`
        : `The famous ancient Kalinga port of ______ conducted active maritime trade with South-East Asia.`,
      pattern: 'blanks',
      marks: 1,
      correctAnswer: 'ପାଲୁର (Palur)',
      options: ['ପାଲୁର (Palur)', 'ଚେଳିତାଲୋ (Chelitalo)', 'ତାମ୍ରଲିପ୍ତି (Tamralipti)', 'ମାନିକପାଟଣା (Manikapatna)'],
      explanationCorrect: 'ଟଲେମିଙ୍କ ଭୂଗୋଳ ଅନୁଯାୟୀ ପାଲୁର (Paloura) କଳିଙ୍ଗର ଏକ ପ୍ରମୁଖ ଆନ୍ତର୍ଜାତିକ ବନ୍ଦର ଥିଲା ଯେଉଁଠାରୁ ଜାଭା ଓ ବାଲିକୁ ସିଧାସଳଖ ଜାହାଜ ଯାତ୍ରା କରୁଥିଲା।',
      subject,
      department,
      semester,
      paper,
      topic,
      language,
      approved: false,
      createdAt: now,
      updatedAt: now
    });
  }

  // Pattern 3: True / False
  if (patterns.includes('true_false')) {
    questions.push({
      question: language === 'odia' || language === 'bilingual'
        ? `ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖରେ ସମ୍ରାଟ ଖାରବେଳଙ୍କ ଦ୍ୱାରା ଜୈନ ମୁନିମାନଙ୍କ ପାଇଁ ଗୁମ୍ଫା ନିର୍ମାଣର ଉଲ୍ଲେଖ ରହିଛି। (ସତ୍ୟ / ମିଥ୍ୟା)`
        : `The Hatigumpha Inscription mentions Emperor Kharavela excavating caves for Jain monks. (True/False)`,
      pattern: 'true_false',
      marks: 1,
      options: ['ସତ୍ୟ (True)', 'ମିଥ୍ୟା (False)'],
      correctAnswer: 'ସତ୍ୟ (True)',
      explanationCorrect: 'ଏହି ବିବୃତି ସତ୍ୟ। ଖାରବେଳ ଜୈନ ଧର୍ମର ମହାନ୍ ପୃଷ୍ଠପୋଷକ ଥିଲେ ଏବଂ କୁମାରୀ ପର୍ବତ (ଉଦୟଗିରି) ରେ ଅର୍ହତ ଓ ଶ୍ରମଣମାନଙ୍କ ପାଇଁ ୧୧୭ଟି ଗୁମ୍ଫା ଖୋଦନ କରାଇଥିଲେ।',
      subject,
      department,
      semester,
      paper,
      topic,
      language,
      approved: false,
      createdAt: now,
      updatedAt: now
    });
  }

  // Pattern 4: One Word
  if (patterns.includes('one_word')) {
    questions.push({
      question: language === 'odia' || language === 'bilingual'
        ? `ଓଡ଼ିଶାର କେଉଁ ମହାନ ସଂଗ୍ରାମୀଙ୍କୁ "ଭୂମିପୁତ୍ର" ଏବଂ ପ୍ରଥମ ମହାନ ଜାତୀୟ ପ୍ରତିରୋଧକାରୀ ଭାବେ ୧୮୧୭ରେ ସ୍ମରଣ କରାଯାଏ?`
        : `Which great warrior led the 1817 Paika Rebellion against the British East India Company in Odisha?`,
      pattern: 'one_word',
      marks: 1,
      correctAnswer: 'ବକ୍ସି ଜଗବନ୍ଧୁ ବିଦ୍ୟାଧର (Buxi Jagabandhu)',
      explanationCorrect: 'ବକ୍ସି ଜଗବନ୍ଧୁ ଖୋର୍ଦ୍ଧା ରାଜାଙ୍କ ସେନାପତି ଥିଲେ ଏବଂ ୧୮୧୭ ପାଇକ ବିଦ୍ରୋହର ସର୍ବମାନ୍ୟ ନେତା ଥିଲେ।',
      subject,
      department,
      semester,
      paper,
      topic,
      language,
      approved: false,
      createdAt: now,
      updatedAt: now
    });
  }

  // Pattern 5: 2 Marks (Short Answer)
  if (patterns.includes('short')) {
    questions.push({
      question: language === 'odia' || language === 'bilingual'
        ? `ଅଶୋକଙ୍କ ଧଉଳି ଓ ଜୌଗଡ଼ ଶୈଳାନୁଶାସନର ମୁଖ୍ୟ ବାର୍ତ୍ତା ସଂକ୍ଷେପରେ ବର୍ଣ୍ଣନା କର। (୫୦-୭୫ ଶବ୍ଦ)`
        : `Briefly describe the core message of Ashoka's Separate Rock Edicts at Dhauli and Jaugada. (50-75 words)`,
      pattern: 'short',
      marks: 2,
      correctAnswer: 'ମଡେଲ ଉତ୍ତର: "ସମସ୍ତ ପ୍ରଜା ମୋର ସନ୍ତାନ" (ସବେ ମୁନିସେ ପଜା ମମା)। ଅଶୋକ କଳିଙ୍ଗବାସୀଙ୍କୁ ଭୟମୁକ୍ତ କରିବା ଏବଂ ନ୍ୟାୟ ପ୍ରଦାନ ପାଇଁ ରାଜକର୍ମଚାରୀଙ୍କୁ ନିର୍ଦ୍ଦେଶ ଦେଇଥିଲେ।',
      modelAnswer: 'ଅଶୋକଙ୍କ ଧଉଳି ଓ ଜୌଗଡ଼ସ୍ଥିତ ସ୍ୱତନ୍ତ୍ର କଳିଙ୍ଗ ଶିଳାଲେଖରେ ସେ ଘୋଷଣା କରିଥିଲେ ଯେ "ସବେ ମୁନିସେ ପଜା ମମା" ଅର୍ଥାତ୍ ସମସ୍ତ ମଣିଷ ବା ପ୍ରଜା ମୋର ସନ୍ତାନ ସଦୃଶ। ଯୁଦ୍ଧପୀଡ଼ିତ କଳିଙ୍ଗ ପ୍ରଜାଙ୍କୁ ସ୍ନେହ, ଦୟା ଓ ନ୍ୟାୟ ପ୍ରଦାନ କରିବା ଏବଂ ଧର୍ମ ମହାମାତ୍ରମାନଙ୍କ ନିରପେକ୍ଷ କାର୍ଯ୍ୟ ପାଇଁ ଏଥିରେ ସ୍ପଷ୍ଟ ଆଦେଶ ଥିଲା।',
      keywords: ['ସବେ ମୁନିସେ ପଜା ମମା', 'ଧର୍ମ ମହାମାତ୍ର', 'ପିତୃତୁଲ୍ୟ ଶାସନ', 'ଧଉଳି-ଜୌଗଡ଼'],
      markingRubric: 'ମୂଳ ବାର୍ତ୍ତା ବର୍ଣ୍ଣନା (୧ ମାର୍କ), ଐତିହାସିକ ଗୁରୁତ୍ୱ ଓ ପ୍ରମାଣ (୧ ମାର୍କ)।',
      explanationCorrect: 'ଏହି ଶିଳାଲେଖଗୁଡ଼ିକ ଅଶୋକଙ୍କ ହିଂସା ପରିତ୍ୟାଗ ଓ କଲ୍ୟାଣକାରୀ ରାଷ୍ଟ୍ର ଧାରଣାର ପ୍ରତୀକ।',
      subject,
      department,
      semester,
      paper,
      topic,
      language,
      approved: false,
      createdAt: now,
      updatedAt: now
    });
  }

  // Pattern 6: 5 or 8 Marks (Long Answer)
  if (patterns.includes('long')) {
    questions.push({
      question: language === 'odia' || language === 'bilingual'
        ? `କଳିଙ୍ଗର ମହାନ ଐର ଖାରବେଳଙ୍କ ସାମରିକ ବିଜୟ ଏବଂ ସାଂସ୍କୃତିକ ଅବଦାନର ମୂଲ୍ୟାଙ୍କନ କର। (୨୫୦ ଶବ୍ଦ)`
        : `Evaluate the military conquests and cultural contributions of Emperor Kharavela of Kalinga. (250 words)`,
      pattern: 'long',
      marks: 5,
      correctAnswer: 'ମଡେଲ ଉତ୍ତର: ଖାରବେଳ ଚେଦି ବଂଶର ତୃତୀୟ ଶାସକ। ସେ ଶାତବାହନ, ମଗଧର ବୃହସ୍ପତିମିତ୍ରଙ୍କୁ ପରାସ୍ତ କରି କଳିଙ୍ଗ ଜିନ ଫେରାଇ ଆଣିଥିଲେ ଏବଂ ଜୈନ ଧର୍ମର ପ୍ରସାର କରିଥିଲେ।',
      modelAnswer: `ମହାମେଘବାହନ ଖାରବେଳ ପ୍ରାଚୀନ ଓଡ଼ିଶାର ଜଣେ ଯୁଗାନ୍ତକାରୀ ସମ୍ରାଟ ଥିଲେ। ତାଙ୍କ ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖରୁ ତାଙ୍କ ୧୩ ବର୍ଷର କାର୍ଯ୍ୟାବଳୀ ଜଣାପଡ଼େ:
୧. ପ୍ରଥମ ଓ ଦ୍ୱିତୀୟ ବର୍ଷ: ରାଜଧାନୀ କଳିଙ୍ଗନଗରୀର ପୁନରୁଦ୍ଧାର ଏବଂ ପଶ୍ଚିମ ଦିଗରେ ଶାତବାହନ ରାଜା ଶାତକର୍ଣ୍ଣୀଙ୍କ ବିରୁଦ୍ଧରେ ସେନା ପ୍ରେରଣ।
୨. ଚତୁର୍ଥ ଓ ଅଷ୍ଟମ ବର୍ଷ: ବିଦର୍ଭ, ରାଠିକ ଓ ଭୋଜକମାନଙ୍କୁ ଦମନ କରିବା ସହ ଉତ୍ତର ଭାରତରେ ଗୋରଥଗିରି ଦୁର୍ଗ ଅବରୋଧ ଏବଂ ଯବନ ରାଜା ଡିମିଟ୍ରିୟସଙ୍କୁ ପରାଜିତ କରିବା।
୩. ଦ୍ୱାଦଶ ବର୍ଷ: ମଗଧ ଆକ୍ରମଣ କରି ରାଜା ବୃହସ୍ପତିମିତ୍ରଙ୍କୁ ପରାସ୍ତ କରିବା ଏବଂ ମହାପଦ୍ମ ନନ୍ଦ ନେଇଯାଇଥିବା ପବିତ୍ର 'କଳିଙ୍ଗ ଜିନ' ପ୍ରତିମାକୁ ସସମ୍ମାନ କଳିଙ୍ଗ ଫେରାଇ ଆଣିବା।
ସାଂସ୍କୃତିକ କ୍ଷେତ୍ରରେ ସେ ଗନ୍ଧର୍ବ ବେଦର ବିଶାରଦ ଥିଲେ ଏବଂ ଉଦୟଗିରିରେ ଶ୍ରମଣମାନଙ୍କ ପାଇଁ ୧୧୭ଟି ଗୁମ୍ଫା ଖୋଦନ କରାଇ ଧର୍ମ ନିରପେକ୍ଷତା ଓ ଜୈନ ଧର୍ମର ପୃଷ୍ଠପୋଷକତା କରିଥିଲେ।`,
      keywords: ['ହାତୀଗୁମ୍ଫା', 'ବୃହସ୍ପତିମିତ୍ର', 'କଳିଙ୍ଗ ଜିନ', 'ଉଦୟଗିରି ଗୁମ୍ଫା', 'ମହାମେଘବାହନ'],
      markingRubric: 'ପ୍ରାରମ୍ଭିକ ପରିଚୟ (୧ ମାର୍କ), ସାମରିକ ଅଭିଯାନ (୨ ମାର୍କ), ସାଂସ୍କୃତିକ ଓ ଧାର୍ମିକ କାର୍ଯ୍ୟ (୧.୫ ମାର୍କ), ଉପସଂହାର (୦.୫ ମାର୍କ)।',
      explanationCorrect: 'ଖାରବେଳଙ୍କ ରାଜତ୍ୱ କଳିଙ୍ଗ ଇତିହାସର ସ୍ୱର୍ଣ୍ଣିମ ଅଧ୍ୟାୟ ଭାବେ ସ୍ୱୀକୃତ।',
      subject,
      department,
      semester,
      paper,
      topic,
      language,
      approved: false,
      createdAt: now,
      updatedAt: now
    });
  }

  return questions.slice(0, Math.max(targetCount, 2));
}

// Call Google Gemini API
async function callGeminiAPI(options: GenerateOptions): Promise<Question[]> {
  const { text, subject, department, semester, paper, topic, language, patterns, targetCount, apiKey } = options;

  const prompt = `
You are an expert history professor and educational test creator for Odisha and Indian college curriculum.
Generate exactly ${targetCount} high-quality examination questions based on the following source material:
"${text}"

Parameters:
Subject: ${subject}
Topic: ${topic}
Paper: ${paper}
Semester: ${semester}
Language: ${language} (odia, english, or bilingual)
Patterns requested: ${patterns.join(', ')}

MANDATORY RULES:
1. For MCQ: Provide 4 distinct options, exactly 1 correct answer, in-depth explanation of why correct option is correct, and detailed explanations of why each of the 3 incorrect options is wrong.
2. For Fill in Blanks: Provide sentence with blank, correct answer, 4 choices, and explanation.
3. For True/False: Provide statement, correct result, and explanation.
4. For One Word: Question, concise answer, explanation.
5. For Short/Long Answers: Question, comprehensive model answer, keywords array, and marking rubric.
6. Strictly preserve historical factual accuracy (dates, places, figures, treaties). Never invent facts.
7. Return ONLY valid JSON array conforming to this schema (no extra prose or markdown code fence):
[
  {
    "question": "Odia and/or English question text",
    "pattern": "mcq" | "blanks" | "true_false" | "one_word" | "short" | "long",
    "marks": 1 | 2 | 5 | 8,
    "options": ["Option A", "Option B", "Option C", "Option D"], // for mcq & blanks
    "correctAnswer": "Exact matching string",
    "explanationCorrect": "Detailed explanation of correct answer",
    "explanationIncorrect": ["Why option 2 is wrong", "Why option 3 is wrong", "Why option 4 is wrong"],
    "modelAnswer": "Model answer for short or long questions",
    "keywords": ["keyword1", "keyword2"],
    "markingRubric": "Rubric details",
    "subject": "${subject}",
    "department": "${department}",
    "semester": "${semester}",
    "paper": "${paper}",
    "topic": "${topic}",
    "language": "${language}",
    "approved": false
  }
]
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return [];

  const parsed = JSON.parse(rawText);
  if (!Array.isArray(parsed)) return [];

  const now = new Date().toISOString();
  return parsed.map((item: any) => ({
    ...item,
    approved: false,
    createdAt: now,
    updatedAt: now
  }));
}

export interface HistoryKnowledgeEntry {
  keywords: string[];
  answerOdia: string;
  answerEng: string;
  explanationOdia: string;
  explanationEng: string;
  distractorsOdia: string[];
  distractorsEng: string[];
}

export const ANCIENT_HISTORY_KNOWLEDGE: HistoryKnowledgeEntry[] = [
  {
    keywords: ['ରାମଚରିତ', 'ramacharita', 'ରାମ ଚରିତ'],
    answerOdia: 'ସନ୍ଧ୍ୟାକର ନନ୍ଦୀ (Sandhyakar Nandi)',
    answerEng: 'Sandhyakar Nandi',
    explanationOdia: 'ପାଳ ବଂଶର ରାଜା ରାମପାଳଙ୍କ ସମୟରେ କୈବର୍ତ୍ତ ବିଦ୍ରୋହ ଓ ପାଳ ବଂଶର ଇତିହାସ ଜାଣିବା ପାଇଁ ସନ୍ଧ୍ୟାକର ନନ୍ଦୀଙ୍କ \'ରାମଚରିତ\' ଏକ ପ୍ରମୁଖ ଐତିହାସିକ ସାହିତ୍ୟିକ ଉତ୍ସ।',
    explanationEng: 'Composed by Sandhyakar Nandi during the reign of Pala King Ramapala, Ramacharita provides authentic historical details about the Kaivarta rebellion and Pala rule.',
    distractorsOdia: ['କଲ୍ହଣ (Kalhana)', 'ବାଣଭଟ୍ଟ (Banabhatta)', 'ବିଲ୍ହଣ (Bilhana)'],
    distractorsEng: ['Kalhana', 'Banabhatta', 'Bilhana']
  },
  {
    keywords: ['ଭରହୁତ', 'bharhut', 'ଭରହୁତ ସ୍ତୂପ'],
    answerOdia: 'ଶୁଙ୍ଗ କାଳୀନ ଭାସ୍କର୍ଯ୍ୟ ଓ ବୌଦ୍ଧ (Shunga / Buddhist sculpture)',
    answerEng: 'Shunga Period Buddhist Sculpture & Art',
    explanationOdia: 'ମଧ୍ୟପ୍ରଦେଶର ସତନା ଜିଲ୍ଲାରେ ଅବସ୍ଥିତ ଭରହୁତ ସ୍ତୂପ ଶୁଙ୍ଗ ଯୁଗର ବୌଦ୍ଧ ଭାସ୍କର୍ଯ୍ୟ, ଜାତକ କାହାଣୀର ପ୍ରସ୍ତର ଖୋଦେଇ ଏବଂ ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ କଳା ପାଇଁ ସମଗ୍ର ଭାରତରେ ବିଖ୍ୟାତ।',
    explanationEng: 'Located in Madhya Pradesh, the Bharhut Stupa is celebrated for its exquisite Shunga period Buddhist stone carvings and Jataka representations.',
    distractorsOdia: ['ଗାନ୍ଧାର କଳା (Gandhara Art)', 'ମୌର୍ଯ୍ୟ କାଳୀନ ସ୍ତମ୍ଭ', 'ଦ୍ରାବିଡ଼ ସ୍ଥାପତ୍ୟ'],
    distractorsEng: ['Gandhara Art', 'Mauryan Pillar Art', 'Dravidian Architecture']
  },
  {
    keywords: ['ଦଶାବତାର', 'ଦେଓଗଡ଼', 'deogarh', 'dashavatara'],
    answerOdia: 'ଭଗବାନ ବିଷ୍ଣୁ (Lord Vishnu)',
    answerEng: 'Lord Vishnu',
    explanationOdia: 'ଉତ୍ତର ପ୍ରଦେଶର ଝାନ୍ସୀ ନିକଟସ୍ଥ ଦେଓଗଡ଼ ଦଶାବତାର ମନ୍ଦିର ଗୁପ୍ତ ଯୁଗରେ ନିର୍ମିତ ଭଗବାନ ବିଷ୍ଣୁଙ୍କର ପ୍ରଥମ ପଞ୍ଚାୟତନ ଶୈଳୀର ପ୍ରସ୍ତର ମନ୍ଦିର।',
    explanationEng: 'The Dashavatara Temple at Deogarh (UP) is an iconic Gupta period temple dedicated to Lord Vishnu, featuring classic Panchayatana architecture.',
    distractorsOdia: ['ଭଗବାନ ଶିବ (Lord Shiva)', 'ଭଗବାନ ବୁଦ୍ଧ (Lord Buddha)', 'ସୂର୍ଯ୍ୟ ଦେବ (Sun God)'],
    distractorsEng: ['Lord Shiva', 'Lord Buddha', 'Sun God']
  },
  {
    keywords: ['ଦକ୍ଷିଣ ଭାରତ', 'ଐହୋଲ', 'aihole', 'pulakeshin', 'ପୁଲକେଶୀ'],
    answerOdia: 'ଐହୋଲ ଶିଳାଲେଖ (Aihole Inscription)',
    answerEng: 'Aihole Inscription of Pulakeshin II',
    explanationOdia: 'ବାଦାମୀର ଚାଲୁକ୍ୟ ନରେଶ ଦ୍ୱିତୀୟ ପୁଲକେଶୀଙ୍କ ରାଜକବି ରବିକୀର୍ତ୍ତିଙ୍କ ଦ୍ୱାରା ୬୩୪ ଖ୍ରୀଷ୍ଟାବ୍ଦରେ ରଚିତ ଐହୋଲ ଶିଳାଲେଖ ଦକ୍ଷିଣ ଭାରତ ତଥା ହର୍ଷବର୍ଦ୍ଧନଙ୍କ ପରାଜୟର ଏକ ମୁଖ୍ୟ ଉତ୍ସ।',
    explanationEng: 'Composed by Jain poet Ravikirti in 634 CE, the Aihole Inscription provides authoritative historical records of Chalukya King Pulakeshin II in South India.',
    distractorsOdia: ['ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ', 'ପ୍ରୟାଗ ପ୍ରଶସ୍ତି', 'ଉତ୍ତରମେରୁର ଲେଖ'],
    distractorsEng: ['Hathigumpha Inscription', 'Prayag Prashasti', 'Uttiramerur Inscription']
  },
  {
    keywords: ['ବନ୍ଦର ନଗରୀ', 'ପୋତାଶ୍ରୟ', 'ଲୋଥାଲ', 'lothal', 'dockyard', 'ବନ୍ଦର'],
    answerOdia: 'ଲୋଥାଲ (Lothal)',
    answerEng: 'Lothal (Gujarat)',
    explanationOdia: 'ଗୁଜରାଟର ଅହମଦାବାଦ ଜିଲ୍ଲାରେ ଭୋଗାଭା ନଦୀ କୂଳରେ ଅବସ୍ଥିତ ଲୋଥାଲ ସିନ୍ଧୁ ସଭ୍ୟତାର ଏକମାତ୍ର ଇଟା ନିର୍ମିତ ପ୍ରାଚୀନ କୃତ୍ରିମ ବନ୍ଦର ବା ଡକୟାର୍ଡ଼ ଥିଲା।',
    explanationEng: 'Excavated by S.R. Rao in Gujarat, Lothal was the world’s earliest known artificial dockyard and premier port of the Indus Valley Civilization.',
    distractorsOdia: ['କାଲିବଙ୍ଗାନ (Kalibangan)', 'ରୋପାର (Ropar)', 'ବନୱାଲୀ (Banawali)'],
    distractorsEng: ['Kalibangan', 'Ropar', 'Banawali']
  },
  {
    keywords: ['ହର୍ଷଚରିତ', 'harshacharita', 'ହର୍ଷ ଚରିତ'],
    answerOdia: 'ବାଣଭଟ୍ଟ (Banabhatta)',
    answerEng: 'Banabhatta',
    explanationOdia: 'କନୌଜର ସମ୍ରାଟ ହର୍ଷବର୍ଦ୍ଧନଙ୍କ ରାଜକବି ବାଣଭଟ୍ଟ \'ହର୍ଷଚରିତ\' ରଚନା କରିଥିଲେ, ଯାହା ପ୍ରାଚୀନ ଭାରତର ପ୍ରଥମ ଐତିହାସିକ ଜୀବନୀ ଗ୍ରନ୍ଥ।',
    explanationEng: 'Court poet Banabhatta composed Harshacharita, chronicling the biography and reign of Emperor Harsha.',
    distractorsOdia: ['ହରିଷେଣ (Harisena)', 'କଲ୍ହଣ (Kalhana)', 'ଅଶ୍ୱଘୋଷ (Ashvaghosha)'],
    distractorsEng: ['Harisena', 'Kalhana', 'Ashvaghosha']
  },
  {
    keywords: ['ଅର୍ଥଶାସ୍ତ୍ର', 'arthashastra', 'କୌଟିଲ୍ୟ', 'ଚାଣକ୍ୟ'],
    answerOdia: 'କୌଟିଲ୍ୟ / ଚାଣକ୍ୟ (Kautilya)',
    answerEng: 'Kautilya (Chanakya)',
    explanationOdia: 'ମୌର୍ଯ୍ୟ ସାମ୍ରାଜ୍ୟର ପ୍ରତିଷ୍ଠାତା ଚନ୍ଦ୍ରଗୁପ୍ତ ମୌର୍ଯ୍ୟଙ୍କ ପ୍ରଧାନମନ୍ତ୍ରୀ କୌଟିଲ୍ୟ ରାଜନୀତି ଓ ପ୍ରଶାସନ ଉପରେ \'ଅର୍ଥଶାସ୍ତ୍ର\' ରଚନା କରିଥିଲେ।',
    explanationEng: 'Kautilya authored Arthashastra, the foundational ancient Indian treatise on statecraft, economic policy, and military strategy.',
    distractorsOdia: ['ମେଗାସ୍ଥିନିସ (Megasthenes)', 'ପତଞ୍ଜଳି (Patanjali)', 'ବିଶାଖାଦତ୍ତ (Vishakhadatta)'],
    distractorsEng: ['Megasthenes', 'Patanjali', 'Vishakhadatta']
  },
  {
    keywords: ['ଇଣ୍ଡିକା', 'indica', 'ମେଗାସ୍ଥିନିସ'],
    answerOdia: 'ମେଗାସ୍ଥିନିସ (Megasthenes)',
    answerEng: 'Megasthenes',
    explanationOdia: 'ଗ୍ରୀକ୍ ଶାସକ ସେଲ୍ୟୁକସ୍ ନିକେଟରଙ୍କ ରାଷ୍ଟ୍ରଦୂତ ମେଗାସ୍ଥିନିସ ଚନ୍ଦ୍ରଗୁପ୍ତ ମୌର୍ଯ୍ୟଙ୍କ ଦରବାରରେ ରହି \'ଇଣ୍ଡିକା\' ଗ୍ରନ୍ଥ ରଚନା କରିଥିଲେ।',
    explanationEng: 'Greek ambassador Megasthenes recorded Mauryan society and Pataliputra municipal administration in his famous work Indica.',
    distractorsOdia: ['ଫାହିୟାନ (Fa-Hien)', 'ହ୍ୟୁଏନସାଂ (Hiuen Tsang)', 'ଅଲବେରୁନୀ (Al-Biruni)'],
    distractorsEng: ['Fa-Hien', 'Hiuen Tsang', 'Al-Biruni']
  },
  {
    keywords: ['ରାଜତରଙ୍ଗିଣୀ', 'rajatarangini', 'କଲ୍ହଣ'],
    answerOdia: 'କଲ୍ହଣ (Kalhana)',
    answerEng: 'Kalhana',
    explanationOdia: '୧୨ଶ ଶତାବ୍ଦୀରେ କବି କଲ୍ହଣ ସଂସ୍କୃତ ଭାଷାରେ \'ରାଜତରଙ୍ଗିଣୀ\' ରଚନା କରିଥିଲେ, ଯାହା କାଶ୍ମୀରର ପ୍ରାମାଣିକ ଐତିହାସିକ ତଥ୍ୟ ପ୍ରଦାନ କରେ।',
    explanationEng: 'Kalhana wrote Rajatarangini in 1148-1150 CE, widely regarded as India\'s first systematic historical chronicle covering the kings of Kashmir.',
    distractorsOdia: ['ସନ୍ଧ୍ୟାକର ନନ୍ଦୀ', 'ବାଣଭଟ୍ଟ', 'ବିଲ୍ହଣ'],
    distractorsEng: ['Sandhyakar Nandi', 'Banabhatta', 'Bilhana']
  },
  {
    keywords: ['ହାତୀଗୁମ୍ଫା', 'hathigumpha', 'ଖାରବେଳ'],
    answerOdia: 'ମହାମେଘବାହନ ଖାରବେଳ (Kharavela)',
    answerEng: 'King Kharavela of Kalinga',
    explanationOdia: 'ଭୁବନେଶ୍ୱରସ୍ଥ ଉଦୟଗିରି ପାହାଡ଼ର ହାତୀଗୁମ୍ଫାରେ କଳିଙ୍ଗାଧିପତି ଖାରବେଳଙ୍କ ୧୩ ବର୍ଷର ଶାସନ ଓ ବିଜୟ ଅଭିଯାନ ସମ୍ପର୍କରେ ବ୍ରାହ୍ମୀ ଲିପିରେ ଖୋଦିତ ହୋଇଛି।',
    explanationEng: 'The Hathigumpha Inscription at Udayagiri hills records the biographical military achievements and public works of Kalinga King Kharavela.',
    distractorsOdia: ['ସମ୍ରାଟ ଅଶୋକ', 'ଗୌତମୀ ପୁତ୍ର ଶାତକର୍ଣ୍ଣୀ', 'ସମୁଦ୍ରଗୁପ୍ତ'],
    distractorsEng: ['Emperor Ashoka', 'Gautamiputra Satakarni', 'Samudragupta']
  },
  {
    keywords: ['ପ୍ରୟାଗ ପ୍ରଶସ୍ତି', 'prayag prashasti', 'ହରିଷେଣ', 'ଆହ୍ଲାବାଦ'],
    answerOdia: 'ହରିଷେଣ (Harisena) / ସମୁଦ୍ରଗୁପ୍ତ',
    answerEng: 'Harisena / Samudragupta',
    explanationOdia: 'ଗୁପ୍ତ ସମ୍ରାଟ ସମୁଦ୍ରଗୁପ୍ତଙ୍କ ଦରବାରୀ କବି ତଥା ମହାଦଣ୍ଡନାୟକ ହରିଷେଣଙ୍କ ଦ୍ୱାରା ସଂସ୍କୃତ ଚମ୍ପୁ ଶୈଳୀରେ ପ୍ରୟାଗ ପ୍ରଶସ୍ତି ଲିଖିତ।',
    explanationEng: 'Court poet Harisena composed the Prayag Prashasti (Allahabad Pillar) celebrating the military triumphs of Samudragupta.',
    distractorsOdia: ['ରବିକୀର୍ତ୍ତି (Ravikirti)', 'ବାଣଭଟ୍ଟ (Banabhatta)', 'କାଳିଦାସ (Kalidasa)'],
    distractorsEng: ['Ravikirti', 'Banabhatta', 'Kalidasa']
  },
  {
    keywords: ['ମାଦଳା ପାଞ୍ଜି', 'madala panji', 'ଶ୍ରୀଜଗନ୍ନାଥ ମନ୍ଦିର'],
    answerOdia: 'ମାଦଳା ପାଞ୍ଜି (Madala Panji)',
    answerEng: 'Madala Panji (Temple Chronicle)',
    explanationOdia: 'ଶ୍ରୀକ୍ଷେତ୍ର ପୁରୀ ଜଗନ୍ନାଥ ମନ୍ଦିରର ତାଳପତ୍ର ଲେଖା \'ମାଦଳା ପାଞ୍ଜି\' ଓଡ଼ିଶାର ସୋମବଂଶ, ଗଙ୍ଗବଂଶ ଓ ସୂର୍ଯ୍ୟବଂଶୀ ଗଜପତି ଇତିହାସର ଏକ ପ୍ରମୁଖ ଉତ୍ସ।',
    explanationEng: 'The Madala Panji is the historical palm-leaf chronicle of the Jagannath Temple at Puri, detailing Odisha dynasties and religious traditions.',
    distractorsOdia: ['କୈଫିୟତ', 'ତବାକତ୍-ଇ-ନାସିରୀ', 'ରାଜମାଳା'],
    distractorsEng: ['Kaifiyat', 'Tabaqat-i-Nasiri', 'Rajmala']
  },
  {
    keywords: ['ମୁଦ୍ରା', 'coin', 'numismatics', 'ମୁଦ୍ରାତତ୍ତ୍ୱ'],
    answerOdia: 'ମୁଦ୍ରାତତ୍ତ୍ୱ (Numismatics)',
    answerEng: 'Numismatics',
    explanationOdia: 'ପ୍ରାଚୀନ ମୁଦ୍ରାଗୁଡ଼ିକର ବୈଜ୍ଞାନିକ ଅଧ୍ୟୟନକୁ \'ମୁଦ୍ରାତତ୍ତ୍ୱ\' (Numismatics) କୁହାଯାଏ, ଯାହା ରାଜବଂଶ, ଅର୍ଥନୀତି ଓ ତାରିଖ ନିରୂପଣରେ ସହାୟକ ହୁଏ।',
    explanationEng: 'Numismatics is the scientific study of ancient coins, inscriptions on coinage, metallurgy, and economic history.',
    distractorsOdia: ['ଅଭିଲେଖ ତତ୍ତ୍ୱ (Epigraphy)', 'ପ୍ରତ୍ନତତ୍ତ୍ୱ (Archaeology)', 'ମାନବତତ୍ତ୍ୱ (Anthropology)'],
    distractorsEng: ['Epigraphy', 'Archaeology', 'Paleography']
  },
  {
    keywords: ['ଶିଳାଲେଖ', 'ଅଭିଲେଖ', 'inscription', 'epigraphy', 'ଅଭିଲେଖ ତତ୍ତ୍ୱ'],
    answerOdia: 'ଅଭିଲେଖ ତତ୍ତ୍ୱ / ପ୍ରତ୍ନଲିପି ବିଜ୍ଞାନ (Epigraphy)',
    answerEng: 'Epigraphy',
    explanationOdia: 'ଶିଳା, ସ୍ତମ୍ଭ ଓ ତାମ୍ରପତ୍ରରେ ଖୋଦିତ ପ୍ରାଚୀନ ଅଭିଲେଖଗୁଡ଼ିକର ଅଧ୍ୟୟନକୁ \'ଅଭିଲେଖ ତତ୍ତ୍ୱ\' (Epigraphy) କୁହାଯାଏ।',
    explanationEng: 'Epigraphy is the study of inscriptions carved on stone pillars, rocks, temple walls, and copper plates.',
    distractorsOdia: ['ମୁଦ୍ରାତତ୍ତ୍ୱ (Numismatics)', 'ପ୍ରତ୍ନତତ୍ତ୍ୱ (Archaeology)', 'ଲିପିତତ୍ତ୍ୱ (Paleography)'],
    distractorsEng: ['Numismatics', 'Archaeology', 'Numismatology']
  },
  {
    keywords: ['ପ୍ରତ୍ନତତ୍ତ୍ୱ', 'excavation', 'archaeology', 'ଖନନ'],
    answerOdia: 'ପ୍ରତ୍ନତତ୍ତ୍ୱ (Archaeology)',
    answerEng: 'Archaeology',
    explanationOdia: 'ଭୂ-ଖନନ ଦ୍ୱାରା ପ୍ରାପ୍ତ ପ୍ରାଚୀନ ଭୌତିକ ଅବଶେଷ, ଅସ୍ତ୍ରଶସ୍ତ୍ର, ମୃତ୍ତିକା ପାତ୍ର ଓ ସ୍ଥାପତ୍ୟର ଅଧ୍ୟୟନକୁ ପ୍ରତ୍ନତତ୍ତ୍ୱ କୁହାଯାଏ।',
    explanationEng: 'Archaeology is the study of human history and prehistory through the excavation and analysis of material artifacts.',
    distractorsOdia: ['ମୁଦ୍ରାତତ୍ତ୍ୱ (Numismatics)', 'ଅଭିଲେଖ ତତ୍ତ୍ୱ (Epigraphy)', 'ଭୂତତ୍ତ୍ୱ (Geology)'],
    distractorsEng: ['Numismatics', 'Epigraphy', 'Geology']
  },
  {
    keywords: ['ଫାହିୟାନ', 'fa-hien', 'faxian'],
    answerOdia: 'ଫାହିୟାନ (Fa-Hien)',
    answerEng: 'Fa-Hien (Faxian)',
    explanationOdia: 'ଚୀନା ବୌଦ୍ଧ ପରିବ୍ରାଜକ ଫାହିୟାନ ଦ୍ୱିତୀୟ ଚନ୍ଦ୍ରଗୁପ୍ତ (ବିକ୍ରମାଦିତ୍ୟ)ଙ୍କ ରାଜତ୍ୱ କାଳରେ ଭାରତ ଭ୍ରମଣ କରିଥିଲେ।',
    explanationEng: 'Chinese Buddhist pilgrim Fa-Hien visited India during the Gupta reign of Chandragupta II (Vikramaditya).',
    distractorsOdia: ['ହ୍ୟୁଏନସାଂ (Hiuen Tsang)', 'ଇତ୍‌ସିଙ୍ଗ (I-Tsing)', 'ମେଗାସ୍ଥିନିସ (Megasthenes)'],
    distractorsEng: ['Hiuen Tsang', 'I-Tsing', 'Megasthenes']
  },
  {
    keywords: ['ହ୍ୟୁଏନସାଂ', 'hiuen tsang', 'xuanzang', 'ସି-ୟୁ-କି'],
    answerOdia: 'ହ୍ୟୁଏନସାଂ (Hiuen Tsang)',
    answerEng: 'Hiuen Tsang (Xuanzang)',
    explanationOdia: 'ହର୍ଷବର୍ଦ୍ଧନଙ୍କ ସମୟରେ ଭାରତ ଆସିଥିବା ଚୀନା ପରିବ୍ରାଜକ ହ୍ୟୁଏନସାଂ \'ସି-ୟୁ-କି\' ଗ୍ରନ୍ଥ ରଚନା କରିଥିଲେ ଏବଂ ଓଡ଼ିଶାର ପୁଷ୍ପଗିରି ଓ ଚେଳିତାଲୋ ବର୍ଣ୍ଣନା କରିଥିଲେ।',
    explanationEng: 'Hiuen Tsang visited India during Emperor Harsha\'s reign and authored Si-Yu-Ki, describing Odisha\'s Buddhist centers.',
    distractorsOdia: ['ଫାହିୟାନ (Fa-Hien)', 'ମେଗାସ୍ଥିନିସ (Megasthenes)', 'ଅଲବେରୁନୀ (Al-Biruni)'],
    distractorsEng: ['Fa-Hien', 'Megasthenes', 'Al-Biruni']
  }
];

function buildSmartMcqOptions(
  correctAns: string,
  allQuestions: Question[],
  matched: HistoryKnowledgeEntry | undefined,
  isEng: boolean
): string[] {
  const pool: string[] = [];

  // 1. Add distractors from matched knowledge entry
  if (matched) {
    pool.push(...(isEng ? matched.distractorsEng : matched.distractorsOdia));
  }

  // 2. Borrow real answers from other questions in the same pasted batch as smart distractors
  for (const other of allQuestions) {
    const candidate = (other.correctAnswer || '').trim();
    if (candidate && candidate.toLowerCase() !== correctAns.toLowerCase()) {
      pool.push(candidate);
    }
  }

  // 3. Fallback curated historical options
  const fallbackPool = isEng
    ? [
        'Epigraphy',
        'Numismatics',
        'Archaeology',
        'Rigveda',
        'Lothal',
        'Megasthenes',
        'Kautilya',
        'Kalhana'
      ]
    : [
        'ଅଭିଲେଖ ତତ୍ତ୍ୱ (Epigraphy)',
        'ମୁଦ୍ରାତତ୍ତ୍ୱ (Numismatics)',
        'ପ୍ରତ୍ନତତ୍ତ୍ୱ (Archaeology)',
        'ଲୋଥାଲ (Lothal)',
        'କୌଟିଲ୍ୟ (Kautilya)',
        'ମେଗାସ୍ଥିନିସ (Megasthenes)',
        'କଲ୍ହଣ (Kalhana)',
        'ହରିଷେଣ (Harisena)'
      ];
  pool.push(...fallbackPool);

  const uniqueDistractors: string[] = [];
  const normCorrect = correctAns.trim().toLowerCase();
  for (const d of pool) {
    const clean = d.trim();
    if (
      clean &&
      clean.toLowerCase() !== normCorrect &&
      !uniqueDistractors.some((u) => u.toLowerCase() === clean.toLowerCase())
    ) {
      uniqueDistractors.push(clean);
    }
    if (uniqueDistractors.length === 3) break;
  }

  return [correctAns, ...uniqueDistractors].sort(() => Math.random() - 0.5);
}

export function autoSolveAndCompleteHistoryQuestions(
  questions: Question[],
  targetPattern: 'auto' | 'mcq' | 'blanks' | 'true_false' | 'short' | 'long' = 'auto',
  targetLanguage: 'bilingual' | 'odia' | 'english' = 'bilingual'
): Question[] {
  const isEng = targetLanguage === 'english';

  return questions.map((q) => {
    const rawQ = (q.question || '').trim();
    const qTextLower = rawQ.toLowerCase();

    // Determine whether user already provided a real answer (from Ans: / inline / bottom Answer Key)
    const userHasAnswer = Boolean(
      q.correctAnswer &&
        q.correctAnswer.trim().length > 0 &&
        !q.correctAnswer.includes('ଅନୁପଲବ୍ଧ') &&
        !q.correctAnswer.includes('not specified') &&
        q.correctAnswer.trim() !== 'ଐତିହାସିକ ଉତ୍ତର' &&
        q.correctAnswer.trim() !== 'Historical Answer'
    );

    // Match knowledge entry if available
    const matched = ANCIENT_HISTORY_KNOWLEDGE.find((entry) =>
      entry.keywords.some((kw) => qTextLower.includes(kw.toLowerCase()))
    );

    // Check if the input line is ONLY an answer/keyword (no question mark, no blank, very short, and user gave no separate Ans:)
    const looksLikeOnlyAnswerTerm =
      !userHasAnswer &&
      !rawQ.includes('?') &&
      !rawQ.includes('？') &&
      !/_{2,}|\.{3,}/.test(rawQ) &&
      rawQ.split(/\s+/).length <= 6;

    let workingQuestion = rawQ;
    let ansText = userHasAnswer
      ? q.correctAnswer.trim()
      : matched
      ? isEng
        ? matched.answerEng
        : matched.answerOdia
      : '';

    let expText =
      q.explanationCorrect &&
      !q.explanationCorrect.includes('ପ୍ରାମାଣିକ ଅଟେ।') &&
      !q.explanationCorrect.includes('Historical Answer')
        ? q.explanationCorrect
        : matched
        ? isEng
          ? matched.explanationEng
          : matched.explanationOdia
        : ansText
        ? isEng
          ? `Verified historical answer: "${ansText}".`
          : `ଐତିହାସିକ ତଥ୍ୟ ଅନୁଯାୟୀ "${ansText}" ସଠିକ୍ ଉତ୍ତର ଅଟେ। (Verified answer: ${ansText})`
        : '';

    if (looksLikeOnlyAnswerTerm) {
      ansText = rawQ;
      workingQuestion = isEng
        ? `Which historical term, figure, or source is associated with "________" (${ansText})?`
        : `ଇତିହାସର କେଉଁ ପ୍ରସଙ୍ଗ / ତଥ୍ୟ "${ansText}" ସହିତ ସମ୍ପର୍କିତ? (________)`;
      if (!expText) {
        expText = matched
          ? isEng
            ? matched.explanationEng
            : matched.explanationOdia
          : isEng
          ? `"${ansText}" is an important historical reference in this chapter.`
          : `"${ansText}" ଏହି ଅଧ୍ୟାୟର ଏକ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଐତିହାସିକ ତଥ୍ୟ ଅଟେ।`;
      }
    }

    // Decide final pattern (honoring explicit targetPattern conversion!)
    let finalPattern: QuestionPattern = q.pattern || 'blanks';
    if (targetPattern !== 'auto') {
      finalPattern = targetPattern;
    } else if (/_{2,}|\.{3,}/.test(workingQuestion)) {
      finalPattern = 'blanks';
    } else if (q.options && q.options.length >= 2) {
      finalPattern = 'mcq';
    }

    if (finalPattern === 'mcq') {
      const safeAns = ansText || (isEng ? 'Option A' : 'ସଠିକ୍ ଉତ୍ତର ଦିଅନ୍ତୁ');
      const existingOpts = q.options && q.options.length >= 2 ? q.options : null;
      const opts = existingOpts || buildSmartMcqOptions(safeAns, questions, matched, isEng);
      const mcqQuestion = /_{2,}|\.{3,}/.test(workingQuestion)
        ? workingQuestion
        : workingQuestion;

      return {
        ...q,
        question: mcqQuestion,
        pattern: 'mcq',
        marks: 1,
        options: opts,
        correctAnswer: safeAns,
        explanationCorrect: expText || q.explanationCorrect
      };
    }

    if (finalPattern === 'true_false') {
      const filledStatement =
        ansText && /_{2,}|\.{3,}/.test(workingQuestion)
          ? workingQuestion.replace(/_{2,}|\.{3,}/, ansText)
          : workingQuestion;
      const tfQuestion =
        filledStatement.includes('ସତ୍ୟ') || filledStatement.toLowerCase().includes('true')
          ? filledStatement
          : `${filledStatement} (${isEng ? 'True / False' : 'ସତ୍ୟ / ମିଥ୍ୟା'})`;

      return {
        ...q,
        question: tfQuestion,
        pattern: 'true_false',
        marks: 1,
        options: ['ସତ୍ୟ (True)', 'ମିଥ୍ୟା (False)'],
        correctAnswer:
          q.correctAnswer && (q.correctAnswer.includes('False') || q.correctAnswer.includes('ମିଥ୍ୟା'))
            ? 'ମିଥ୍ୟା (False)'
            : 'ସତ୍ୟ (True)',
        explanationCorrect: expText || q.explanationCorrect
      };
    }

    if (finalPattern === 'short' || finalPattern === 'long') {
      const cleanQuestion = /_{2,}|\.{3,}/.test(workingQuestion)
        ? workingQuestion.replace(/_{2,}|\.{3,}/, isEng ? 'what' : 'କଣ')
        : workingQuestion;
      const marksVal = finalPattern === 'long' ? 5 : 2;
      const modelAns =
        ansText
          ? isEng
            ? `${ansText}. ${expText}`
            : `${ansText} — ${expText}`
          : q.modelAnswer || '';

      return {
        ...q,
        question: cleanQuestion,
        pattern: finalPattern,
        marks: marksVal,
        options: undefined,
        correctAnswer: ansText || q.correctAnswer || '',
        modelAnswer: modelAns,
        explanationCorrect: expText || q.explanationCorrect
      };
    }

    if (finalPattern === 'one_word') {
      return {
        ...q,
        question: workingQuestion,
        pattern: 'one_word',
        marks: 1,
        options: undefined,
        correctAnswer: ansText,
        explanationCorrect: expText || q.explanationCorrect
      };
    }

    // Default: blanks
    const blankQuestion = /_{2,}|\.{3,}/.test(workingQuestion)
      ? workingQuestion
      : ansText && workingQuestion.toLowerCase().includes(ansText.toLowerCase())
      ? workingQuestion.replace(new RegExp(ansText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '________')
      : `${workingQuestion} ________`;

    return {
      ...q,
      question: blankQuestion,
      pattern: 'blanks',
      marks: 1,
      options: undefined,
      correctAnswer: ansText,
      explanationCorrect: expText || q.explanationCorrect
    };
  });
}
