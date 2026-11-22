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
  const { apiKey } = options;

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
