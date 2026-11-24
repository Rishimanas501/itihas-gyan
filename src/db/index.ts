import Dexie, { type Table } from 'dexie';
import type { 
  Student, 
  CourseEnrolment,
  Question, 
  QuizSession, 
  QuestionScoreRecord, 
  AppSettings,
  Paper,
  Chapter,
  SavedTest,
  HistoricalMap,
  ChatConversation,
  ChatMessage,
  ChatAttachment
} from '../types';

export class ItihasGyanDB extends Dexie {
  students!: Table<Student, number>;
  enrolments!: Table<CourseEnrolment, number>;
  questions!: Table<Question, number>;
  sessions!: Table<QuizSession, string>;
  scores!: Table<QuestionScoreRecord, number>;
  settings!: Table<AppSettings, string>;
  papers!: Table<Paper, string>;
  chapters!: Table<Chapter, string>;
  savedTests!: Table<SavedTest, string>;
  historicalMaps!: Table<HistoricalMap, string>;
  conversations!: Table<ChatConversation, string>;
  chatMessages!: Table<ChatMessage, string>;
  chatAttachments!: Table<ChatAttachment, string>;

  constructor() {
    super('ItihasGyanDatabase');
    this.version(1).stores({
      students: '++id, &rollNo, name, department, semester, batch, status',
      questions: '++id, question, pattern, marks, subject, department, semester, paper, topic, language, approved',
      sessions: 'id, &pin, status, createdAt',
      scores: '++id, [rollNo+questionIndex], rollNo, questionIndex, markingStatus',
      settings: 'id'
    });
    this.version(2).stores({
      students: '++id, &rollNo, name, department, semester, batch, status',
      questions: '++id, question, pattern, marks, subject, department, semester, paper, topic, language, approved, paperId, chapterId, difficulty',
      sessions: 'id, &pin, status, createdAt',
      scores: '++id, [rollNo+questionIndex], rollNo, questionIndex, markingStatus',
      settings: 'id',
      papers: 'id, name, code, subject, department, semester, order, createdAt',
      chapters: 'id, paperId, name, chapterNumber, order, createdAt',
      savedTests: 'id, paperId, title, createdAt'
    });
    this.version(3).stores({
      students: '++id, &rollNo, name, department, semester, batch, status',
      enrolments: '++id, studentId, rollNo, courseCategory, subject, department, batch, semester',
      questions: '++id, question, pattern, marks, subject, department, semester, paper, topic, language, approved, paperId, chapterId, difficulty',
      sessions: 'id, &pin, status, createdAt',
      scores: '++id, [rollNo+questionIndex], rollNo, questionIndex, markingStatus',
      settings: 'id',
      papers: 'id, name, code, subject, department, semester, order, createdAt',
      chapters: 'id, paperId, name, chapterNumber, order, createdAt',
      savedTests: 'id, paperId, title, createdAt'
    });
    this.version(4).stores({
      students: '++id, &rollNo, name, department, semester, batch, status',
      enrolments: '++id, studentId, rollNo, courseCategory, subject, department, batch, semester',
      questions: '++id, question, pattern, marks, subject, department, semester, paper, topic, language, approved, paperId, chapterId, difficulty',
      sessions: 'id, &pin, status, createdAt',
      scores: '++id, [rollNo+questionIndex], rollNo, questionIndex, markingStatus',
      settings: 'id',
      papers: 'id, name, code, subject, department, semester, order, createdAt',
      chapters: 'id, paperId, name, chapterNumber, order, createdAt',
      savedTests: 'id, paperId, title, createdAt',
      historicalMaps: 'id, title, topic, era, createdAt'
    });
    this.version(5).stores({
      students: '++id, &rollNo, name, department, semester, batch, status',
      enrolments: '++id, studentId, rollNo, courseCategory, subject, department, batch, semester',
      questions: '++id, question, pattern, marks, subject, department, semester, paper, topic, language, approved, paperId, chapterId, difficulty',
      sessions: 'id, &pin, status, createdAt',
      scores: '++id, [rollNo+questionIndex], rollNo, questionIndex, markingStatus',
      settings: 'id',
      papers: 'id, name, code, subject, department, semester, order, createdAt',
      chapters: 'id, paperId, name, chapterNumber, order, createdAt',
      savedTests: 'id, paperId, title, createdAt',
      historicalMaps: 'id, title, topic, era, createdAt',
      conversations: 'id, title, provider, model, updatedAt, createdAt',
      chatMessages: 'id, conversationId, role, timestamp',
      chatAttachments: 'id, conversationId, messageId, type, name, createdAt'
    });
  }
}

export const db = new ItihasGyanDB();

// Default App Settings
export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app_settings',
  teacherName: 'ଅଧ୍ୟାପକ / Teacher',
  collegeName: 'ଇତିହାସ ବିଭାଗ, ସ୍ୱୟଂଶାସିତ ମହାବିଦ୍ୟାଳୟ',
  department: 'History',
  geminiApiKey: '',
  openaiApiKey: '',
  googleMapsApiKey: '',
  serverUrl: '',
  negativeMarking: false,
  negativeMarkValue: 0.25,
  bonusMarkValue: 1,
  autoBackupReminder: true,
  defaultTimer: 30,
  defaultLanguage: 'bilingual',
  defaultAiProvider: 'existing',
  defaultAiModel: 'existing-history-nlp',
  theme: 'emerald'
};

// Rich Sample Data to seed initially if empty
export const SAMPLE_STUDENTS: Omit<Student, 'id'>[] = [
  {
    rollNo: 'BA24-001',
    name: 'ସୁଭାଶିଷ ମହାନ୍ତି (Subhasis Mohanty)',
    department: 'History',
    semester: '4th Semester',
    batch: '2024-27',
    subjectClass: 'Core Paper VII: History of Odisha',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    rollNo: 'BA24-002',
    name: 'ପ୍ରିୟଙ୍କା ଦାସ (Priyanka Das)',
    department: 'History',
    semester: '4th Semester',
    batch: '2024-27',
    subjectClass: 'Core Paper VII: History of Odisha',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    rollNo: 'BA24-003',
    name: 'ସୌମ୍ୟରଞ୍ଜନ ପଟ୍ଟନାୟକ (Soumya Ranjan Patnaik)',
    department: 'History',
    semester: '4th Semester',
    batch: '2024-27',
    subjectClass: 'Core Paper VII: History of Odisha',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    rollNo: 'BA24-004',
    name: 'ଇପ୍ସିତା ପ୍ରିୟଦର୍ଶିନୀ (Ipsita Priyadarshini)',
    department: 'History',
    semester: '4th Semester',
    batch: '2024-27',
    subjectClass: 'Core Paper VII: History of Odisha',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    rollNo: 'BA24-005',
    name: 'ରାକେଶ କୁମାର ସାହୁ (Rakesh Kumar Sahu)',
    department: 'History',
    semester: '4th Semester',
    batch: '2024-27',
    subjectClass: 'Core Paper VII: History of Odisha',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 6 Exemplary Papers
export const SAMPLE_PAPERS: Paper[] = [
  {
    id: 'paper_ancient_india',
    name: 'Ancient History of India',
    nameOdia: 'ଭାରତର ପ୍ରାଚୀନ ଇତିହାସ',
    code: 'HIST-C1',
    subject: 'History of India (From Earliest Times to c. 300 CE)',
    department: 'History',
    semester: '1st Semester',
    academicSession: '2024-25',
    description: 'Comprehensive study of prehistoric cultures, Indus valley civilization, Vedic age, and early empires.',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'paper_odisha',
    name: 'History of Odisha',
    nameOdia: 'ଓଡ଼ିଶାର ଇତିହାସ',
    code: 'HIST-C5',
    subject: 'History of Odisha (Earliest Times to 1568 CE)',
    department: 'History',
    semester: '3rd Semester',
    academicSession: '2024-25',
    description: 'Political and cultural history of ancient and medieval Odisha: Kalinga, Kharavela, Bhaumakara, Somavamshi and Gajapatis.',
    order: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'paper_medieval_india',
    name: 'Medieval History of India',
    nameOdia: 'ଭାରତର ମଧ୍ୟଯୁଗୀୟ ଇତିହାସ',
    code: 'HIST-C3',
    subject: 'History of India (c. 1206 to 1707 CE)',
    department: 'History',
    semester: '2nd Semester',
    academicSession: '2024-25',
    description: 'Delhi Sultanate, regional kingdoms, Bhakti & Sufi movements, and the Mughal Empire.',
    order: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'paper_modern_india',
    name: 'Modern History of India',
    nameOdia: 'ଭାରତର ଆଧୁନିକ ଇତିହାସ',
    code: 'HIST-C8',
    subject: 'History of India (1757 to 1947 CE)',
    department: 'History',
    semester: '4th Semester',
    academicSession: '2024-25',
    description: 'Colonial rule, socio-religious reforms, freedom struggle, and attainment of independence.',
    order: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'paper_art_architecture',
    name: 'Art and Architecture',
    nameOdia: 'ଭାରତୀୟ କଳା ଓ ସ୍ଥାପତ୍ୟ',
    code: 'HIST-DSE1',
    subject: 'Indian Art, Iconography and Architecture',
    department: 'History',
    semester: '5th Semester',
    academicSession: '2024-25',
    description: 'Temple architecture of Kalinga, rock-cut architecture of Khandagiri, Buddhist stupas and monuments.',
    order: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'paper_national_movement',
    name: 'Indian National Movement',
    nameOdia: 'ଭାରତର ଜାତୀୟ ଆନ୍ଦୋଳନ',
    code: 'HIST-C12',
    subject: 'Freedom Struggle and Gandhian Mass Movements',
    department: 'History',
    semester: '6th Semester',
    academicSession: '2024-25',
    description: 'Non-cooperation, Civil Disobedience, Quit India, and Odisha’s contribution to India’s freedom.',
    order: 6,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

// Sample Chapters per Paper
export const SAMPLE_CHAPTERS: Chapter[] = [
  // Ancient History of India Chapters (Exact 10 chapters from user specification)
  {
    id: 'chap_sources_ancient',
    paperId: 'paper_ancient_india',
    name: 'Sources of Ancient Indian History',
    nameOdia: 'ପ୍ରାଚୀନ ଭାରତ ଇତିହାସର ଉପାଦାନ',
    chapterNumber: 1,
    description: 'Literary, archaeological, numismatic, and epigraphic sources of early India.',
    subtopics: ['Literary Sources', 'Inscriptions and Epigraphy', 'Numismatics and Coins', 'Archaeological Excavations'],
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_prehistoric',
    paperId: 'paper_ancient_india',
    name: 'Prehistoric Age',
    nameOdia: 'ପ୍ରାଗୈତିହାସିକ ଯୁଗ',
    chapterNumber: 2,
    description: 'Palaeolithic, Mesolithic, Neolithic, and Chalcolithic cultures in the Indian subcontinent.',
    subtopics: ['Palaeolithic Tools and Sites', 'Mesolithic Rock Art', 'Neolithic Revolution', 'Chalcolithic Settlements'],
    order: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_indus_valley',
    paperId: 'paper_ancient_india',
    name: 'Indus Valley Civilization',
    nameOdia: 'ସିନ୍ଧୁ ଉପତ୍ୟକା ସଭ୍ୟତା',
    chapterNumber: 3,
    description: 'Town planning, social structure, trade, religion, script, and causes of decline.',
    subtopics: ['Town Planning and Drainage', 'Harappa and Mohenjo-daro', 'Economy and Trade', 'Religion and Decline'],
    order: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_vedic_age',
    paperId: 'paper_ancient_india',
    name: 'Vedic Age',
    nameOdia: 'ବୈଦିକ ଯୁଗ',
    chapterNumber: 4,
    description: 'Early Vedic and Later Vedic society, religion, polity, economy, and literature.',
    subtopics: ['Rigvedic Polity and Society', 'Later Vedic Transformation', 'Vedic Literature and Upanishads'],
    order: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_mahajanapadas',
    paperId: 'paper_ancient_india',
    name: 'Mahajanapadas',
    nameOdia: 'ଷୋଡ଼ଶ ମହାଜନପଦ',
    chapterNumber: 5,
    description: 'The 16 Mahajanapadas, rise of Magadha, Bimbisara, Ajatashatru, and Nandas.',
    subtopics: ['Sixteen States and Republics', 'Rise of Magadhan Empire', 'Nanda Dynasty'],
    order: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_buddhism_jainism',
    paperId: 'paper_ancient_india',
    name: 'Buddhism and Jainism',
    nameOdia: 'ବୌଦ୍ଧ ଓ ଜୈନ ଧର୍ମର ଅଭ୍ୟୁଦୟ',
    chapterNumber: 6,
    description: 'Life and teachings of Gautama Buddha and Mahavira, Buddhist Councils, and impact.',
    subtopics: ['Teachings of Buddha', 'Four Noble Truths and Eightfold Path', 'Jain Doctrine and Tirthankaras'],
    order: 6,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_mauryan',
    paperId: 'paper_ancient_india',
    name: 'Mauryan Empire',
    nameOdia: 'ମୌର୍ଯ୍ୟ ସାମ୍ରାଜ୍ୟ',
    chapterNumber: 7,
    description: 'Chandragupta Maurya, Kautilya’s Arthashastra, Ashoka, Kalinga War, Dhamma, and administration.',
    subtopics: ['Chandragupta Maurya and Bindusara', 'Emperor Ashoka and Dhamma', 'Kalinga War (261 BCE)', 'Mauryan Administration and Edicts'],
    order: 7,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_post_mauryan',
    paperId: 'paper_ancient_india',
    name: 'Post-Mauryan Period',
    nameOdia: 'ମୌର୍ଯ୍ୟ ପରବର୍ତ୍ତୀ କାଳ',
    chapterNumber: 8,
    description: 'Shungas, Kanvas, Satavahanas, Indo-Greeks, and Kushanas (Kanishka).',
    subtopics: ['Shunga and Kanva Dynasties', 'Satavahana Rule', 'Kushanas and Kanishka'],
    order: 8,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_gupta_empire',
    paperId: 'paper_ancient_india',
    name: 'Gupta Empire',
    nameOdia: 'ଗୁପ୍ତ ସାମ୍ରାଜ୍ୟ',
    chapterNumber: 9,
    description: 'Golden Age of India: Samudragupta, Chandragupta II, literature, science, art, and administration.',
    subtopics: ['Samudragupta’s Conquests', 'Chandragupta II Vikramaditya', 'Golden Age of Art and Science', 'Decline of the Guptas'],
    order: 9,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_post_gupta',
    paperId: 'paper_ancient_india',
    name: 'Post-Gupta Period',
    nameOdia: 'ପରବର୍ତ୍ତୀ ଭାରତ ଓ ହର୍ଷବର୍ଦ୍ଧନ',
    chapterNumber: 10,
    description: 'Harshavardhana of Kannauj, Hiuen Tsang’s account, Chalukyas, and Pallavas.',
    subtopics: ['Harshavardhana and Kannauj', 'Hiuen Tsang’s Travelogue', 'Chalukyas of Badami and Pallavas'],
    order: 10,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },

  // History of Odisha Chapters
  {
    id: 'chap_odisha_sources',
    paperId: 'paper_odisha',
    name: 'Geographical Setting and Sources',
    nameOdia: 'ଭୌଗୋଳିକ ପରିଚୟ ଓ ଐତିହାସିକ ଉପାଦାନ',
    chapterNumber: 1,
    description: 'Historical geography of Kalinga, Utkala, Odra, and Kosala, and epigraphic sources.',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_kalinga_war',
    paperId: 'paper_odisha',
    name: 'Kalinga War and Ashoka',
    nameOdia: 'କଳିଙ୍ଗ ଯୁଦ୍ଧ ଓ ସମ୍ରାଟ ଅଶୋକ',
    chapterNumber: 2,
    description: 'Causes and consequences of Kalinga War (261 BCE), Dhauli and Jaugada rock edicts.',
    subtopics: ['Causes of the War', 'Dhauli & Jaugada Inscriptions', 'Impact on Ashoka & Buddhism'],
    order: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_kharavela',
    paperId: 'paper_odisha',
    name: 'Kharavela and Chedi Dynasty',
    nameOdia: 'ମହାମେଘବାହନ ଖାରବେଳ ଓ ଚେଦି ବଂଶ',
    chapterNumber: 3,
    description: 'Hatigumpha inscription, military campaigns, patron of Jainism, and civic works.',
    subtopics: ['Hatigumpha Inscription Analysis', 'Military Expeditions', 'Patronage to Jainism and Art'],
    order: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_maritime_odisha',
    paperId: 'paper_odisha',
    name: 'Maritime Heritage and Boita Bandana',
    nameOdia: 'ପ୍ରାଚୀନ କଳିଙ୍ଗର ନୌବାଣିଜ୍ୟ ଓ ସାଧବ ପରମ୍ପରା',
    chapterNumber: 4,
    description: 'Ancient ports of Tamralipti, Chelitalo, Palur, trade with Bali, Java, Sumatra, and Kartika Purnima.',
    order: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_ganga_dynasty',
    paperId: 'paper_odisha',
    name: 'Ganga Dynasty and Jagannath Culture',
    nameOdia: 'ଗଙ୍ଗ ବଂଶ ଓ ଶ୍ରୀଜଗନ୍ନାଥ ସଂସ୍କୃତି',
    chapterNumber: 5,
    description: 'Chodagangadeva, construction of Jagannath temple at Puri, and Ganga administration.',
    order: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_gajapati',
    paperId: 'paper_odisha',
    name: 'Suryavamshi Gajapati Rule',
    nameOdia: 'ସୂର୍ଯ୍ୟବଂଶୀ ଗଜପତି ସାମ୍ରାଜ୍ୟ',
    chapterNumber: 6,
    description: 'Kapilendradeva, Purushottamadeva, Prataparudradeva, and Sri Chaitanya in Odisha.',
    order: 6,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'chap_paika_rebellion',
    paperId: 'paper_odisha',
    name: 'Paika Rebellion of 1817',
    nameOdia: '୧୮୧୭ର ପାଇକ ବିଦ୍ରୋହ',
    chapterNumber: 7,
    description: 'Bakshi Jagabandhu, causes, nature, events, and significance as India’s early freedom struggle.',
    order: 7,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },

  // Indian National Movement Chapters
  {
    id: 'chap_national_civil_disobedience',
    paperId: 'paper_national_movement',
    name: 'Civil Disobedience and Salt Satyagraha',
    nameOdia: 'ଆଇନ ଅମାନ୍ୟ ଆନ୍ଦୋଳନ ଓ ଲବଣ ସତ୍ୟାଗ୍ରହ',
    chapterNumber: 4,
    description: 'Dandi March, Salt Satyagraha at Inchudi (Balasore) and Kujanga, mass participation.',
    order: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

// Rich Sample Questions with complete Paper and Chapter linkage
export const SAMPLE_QUESTIONS: Omit<Question, 'id'>[] = [
  // Indus Valley Civilization Questions
  {
    paperId: 'paper_ancient_india',
    chapterId: 'chap_indus_valley',
    paper: 'Ancient History of India',
    chapter: 'Indus Valley Civilization',
    topic: 'Town Planning and Drainage',
    subject: 'Ancient Indian History',
    department: 'History',
    semester: '1st Semester',
    difficulty: 'medium',
    pattern: 'mcq',
    marks: 1,
    language: 'bilingual',
    question: 'ସିନ୍ଧୁ ସଭ୍ୟତାର ‘ବୃହତ ସ୍ନାନାଗାର’ (Great Bath) କେଉଁ ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ସ୍ଥଳରେ ଆବିଷ୍କୃତ ହୋଇଥିଲା?\n(In which archaeological site was the Great Bath of Indus Valley Civilization discovered?)',
    questionOdia: 'ସିନ୍ଧୁ ସଭ୍ୟତାର ‘ବୃହତ ସ୍ନାନାଗାର’ (Great Bath) କେଉଁ ପ୍ରତ୍ନତାତ୍ତ୍ୱିକ ସ୍ଥଳରେ ଆବିଷ୍କୃତ ହୋଇଥିଲା?',
    questionEnglish: 'In which archaeological site was the Great Bath of Indus Valley Civilization discovered?',
    options: ['ମହେଞ୍ଜୋଦାରୋ (Mohenjo-daro)', 'ହରପ୍ପା (Harappa)', 'ଲୋଥାଲ (Lothal)', 'କାଲିବଙ୍ଗାନ (Kalibangan)'],
    correctAnswer: 'ମହେଞ୍ଜୋଦାରୋ (Mohenjo-daro)',
    explanationCorrect: 'ସିନ୍ଧୁ ସଭ୍ୟତାର ପ୍ରସିଦ୍ଧ ‘ବୃହତ ସ୍ନାନାଗାର’ ମହେଞ୍ଜୋଦାରୋଠାରେ ଆବିଷ୍କୃତ ହୋଇଥିଲା। ଏହାର ଲମ୍ବ ପ୍ରାୟ ୧୧.୮୮ ମିଟର, ପ୍ରସ୍ଥ ୭.୦୧ ମିଟର ଓ ଗଭୀରତା ୨.୪୩ ମିଟର ଥିଲା। ଏହା ଧାର୍ମିକ ସ୍ନାନ ପାଇଁ ବ୍ୟବହୃତ ହେଉଥିବା ବିଶ୍ୱାସ କରାଯାଏ।',
    explanationIncorrect: [
      'ହରପ୍ପାଠାରେ ବୃହତ ଶସ୍ୟାଗାର (Great Granary) ମିଳିଥିଲା, ସ୍ନାନାଗାର ନୁହେଁ।',
      'ଲୋଥାଲ ଏକ ପ୍ରାଚୀନ ବନ୍ଦର ଓ ଡକ୍‌ୟାର୍ଡ଼ (Dockyard) ଥିଲା।',
      'କାଲିବଙ୍ଗାନଠାରେ ହଳ କରାଯାଇଥିବା ଚାଷଜମି ଏବଂ ଅଗ୍ନିବେଦୀ ମିଳିଥିଲା।'
    ],
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    paperId: 'paper_ancient_india',
    chapterId: 'chap_indus_valley',
    paper: 'Ancient History of India',
    chapter: 'Indus Valley Civilization',
    topic: 'Trade and Economy',
    subject: 'Ancient Indian History',
    department: 'History',
    semester: '1st Semester',
    difficulty: 'easy',
    pattern: 'blanks',
    marks: 1,
    language: 'bilingual',
    question: 'ହରପ୍ପା ସଭ୍ୟତାର ପ୍ରସିଦ୍ଧ ପୋତାଶ୍ରୟ ବା ଡକ୍‌ୟାର୍ଡ଼ (Dockyard) ______ ଠାରେ ଅବସ୍ଥିତ ଥିଲା।\n(The famous port town and dockyard of Harappan civilization was located at ______.)',
    questionOdia: 'ହରପ୍ପା ସଭ୍ୟତାର ପ୍ରସିଦ୍ଧ ପୋତାଶ୍ରୟ ବା ଡକ୍‌ୟାର୍ଡ଼ (Dockyard) ______ ଠାରେ ଅବସ୍ଥିତ ଥିଲା।',
    questionEnglish: 'The famous port town and dockyard of Harappan civilization was located at ______.',
    options: ['ଲୋଥାଲ (Lothal)', 'ରୋପାର (Ropar)', 'ବନୱାଲି (Banawali)', 'ସୁରକୋଟାଡ଼ା (Surkotada)'],
    correctAnswer: 'ଲୋଥାଲ (Lothal)',
    explanationCorrect: 'ଗୁଜରାଟର ଭୋଗାଭୋ ନଦୀ ତଟରେ ଅବସ୍ଥିତ ଲୋଥାଲ ସିନ୍ଧୁ ସଭ୍ୟତାର ଏକ ପ୍ରମୁଖ ସାମୁଦ୍ରିକ ବାଣିଜ୍ୟ ବନ୍ଦର ଏବଂ ଡକ୍‌ୟାର୍ଡ଼ ଥିଲା, ଯେଉଁଠାରୁ ପଶ୍ଚିମ ଏସିଆ ଓ ମେସୋପୋଟାମିଆ ସହ ନୌବାଣିଜ୍ୟ ଚାଲୁଥିଲା।',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    paperId: 'paper_ancient_india',
    chapterId: 'chap_indus_valley',
    paper: 'Ancient History of India',
    chapter: 'Indus Valley Civilization',
    topic: 'Town Planning and Engineering',
    subject: 'Ancient Indian History',
    department: 'History',
    semester: '1st Semester',
    difficulty: 'hard',
    pattern: 'short',
    marks: 2,
    language: 'bilingual',
    question: 'ସିନ୍ଧୁ ସଭ୍ୟତାର ନଗର ପରିକଳ୍ପନା ଓ ଜଳ ନିଷ୍କାସନ ବ୍ୟବସ୍ଥା ସମ୍ପର୍କରେ ଦୁଇଟି ମୁଖ୍ୟ ବୈଶିଷ୍ଟ୍ୟ ଉଲ୍ଲେଖ କର।\n(Mention two salient features of town planning and drainage system in Indus Valley Civilization.)',
    questionOdia: 'ସିନ୍ଧୁ ସଭ୍ୟତାର ନଗର ପରିକଳ୍ପନା ଓ ଜଳ ନିଷ୍କାସନ ବ୍ୟବସ୍ଥା ସମ୍ପର୍କରେ ଦୁଇଟି ମୁଖ୍ୟ ବୈଶିଷ୍ଟ୍ୟ ଉଲ୍ଲେଖ କର।',
    questionEnglish: 'Mention two salient features of town planning and drainage system in Indus Valley Civilization.',
    correctAnswer: 'ମଡେଲ ଉତ୍ତର: ୧. ଗ୍ରିଡ୍ ପଦ୍ଧତିରେ ସମକୋଣରେ ଛେଦ କରୁଥିବା ପ୍ରଶସ୍ତ ରାସ୍ତା। ୨. ପ୍ରତ୍ୟେକ ଘରୁ ନିର୍ଗତ ପୋଡ଼ାଇଟା ନିର୍ମିତ ଆବୃତ ଡ୍ରେନେଜ୍ ବ୍ୟବସ୍ଥା।',
    modelAnswer: '୧. ଗ୍ରିଡ୍ ସିଷ୍ଟମ୍: ସିନ୍ଧୁ ନଗରଗୁଡ଼ିକ ଗ୍ରିଡ୍ ପଦ୍ଧତିରେ ନିର୍ମିତ ହୋଇଥିଲା, ଯେଉଁଠାରେ ମୁଖ୍ୟ ରାସ୍ତାଗୁଡ଼ିକ ପରସ୍ପରକୁ ସମକୋଣ (୯୦ ଡିଗ୍ରୀ)ରେ ଛେଦ କରୁଥିଲେ।\n୨. ଉନ୍ନତ ଜଳ ନିଷ୍କାସନ: ପ୍ରତି ଗୃହରୁ ମଇଳା ପାଣି ପୋଡ଼ାଇଟା ନିର୍ମିତ ଆଚ୍ଛାଦିତ ନର୍ଦ୍ଦମା ଦେଇ ରାସ୍ତା କଡ଼ର ମୁଖ୍ୟ ଡ୍ରେନକୁ ଯାଉଥିଲା, ଯାହା ସେତେବେଳର ବିଶ୍ୱରେ ଅଦ୍ୱିତୀୟ ଥିଲା।',
    keywords: ['ଗ୍ରିଡ୍ ପଦ୍ଧତି', 'ଆବୃତ ନର୍ଦ୍ଦମା', 'ପୋଡ଼ାଇଟା', 'ସମକୋଣ ରାସ୍ତା'],
    markingRubric: 'ରାସ୍ତା ଓ ଗୃହ ନିର୍ମାଣ ବିବରଣୀ (୧ ମାର୍କ), ଜଳ ନିଷ୍କାସନ ପ୍ରଣାଳୀ (୧ ମାର୍କ)।',
    explanationCorrect: 'ହରପ୍ପା ଓ ମହେଞ୍ଜୋଦାରୋର ନଗର ଯୋଜନା ସମକାଳୀନ ମିଶର ଓ ମେସୋପୋଟାମିଆ ସଭ୍ୟତାଠାରୁ ଯଥେଷ୍ଟ ଉନ୍ନତ ଥିଲା।',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Vedic Age Questions
  {
    paperId: 'paper_ancient_india',
    chapterId: 'chap_vedic_age',
    paper: 'Ancient History of India',
    chapter: 'Vedic Age',
    topic: 'Vedic Literature and Society',
    subject: 'Ancient Indian History',
    department: 'History',
    semester: '1st Semester',
    difficulty: 'easy',
    pattern: 'mcq',
    marks: 1,
    language: 'bilingual',
    question: 'ଭାରତର ପ୍ରାଚୀନତମ ଧର୍ମଗ୍ରନ୍ଥ ଭାବେ କେଉଁ ବେଦ ସର୍ବପ୍ରଥମେ ରଚିତ ହୋଇଥିଲା?\n(Which Veda is the oldest religious text of India?)',
    questionOdia: 'ଭାରତର ପ୍ରାଚୀନତମ ଧର୍ମଗ୍ରନ୍ଥ ଭାବେ କେଉଁ ବେଦ ସର୍ବପ୍ରଥମେ ରଚିତ ହୋଇଥିଲା?',
    questionEnglish: 'Which Veda is the oldest religious text of India?',
    options: ['ଋଗ୍‌ବେଦ (Rigveda)', 'ସାମବେଦ (Samaveda)', 'ଯଜୁର୍ବେଦ (Yajurveda)', 'ଅଥର୍ବବେଦ (Atharvaveda)'],
    correctAnswer: 'ଋଗ୍‌ବେଦ (Rigveda)',
    explanationCorrect: 'ଋଗ୍‌ବେଦ ହେଉଛି ବିଶ୍ୱ ତଥା ଭାରତର ପ୍ରାଚୀନତମ ବୈଦିକ ଗ୍ରନ୍ଥ। ଏଥିରେ ୧୦ ଟି ମଣ୍ଡଳ ଓ ୧୦୨୮ ଟି ସୂକ୍ତ ରହିଛି। ଏହା ପ୍ରାଚୀନ ଆର୍ଯ୍ୟମାନଙ୍କ ଧାର୍ମିକ ଓ ସାମାଜିକ ଜୀବନର ମୁଖ୍ୟ ଉତ୍ସ।',
    explanationIncorrect: [
      'ସାମବେଦ ଭାରତୀୟ ସଙ୍ଗୀତର ଉତ୍ସ, କିନ୍ତୁ ଏହା ପ୍ରାଚୀନତମ ନୁହେଁ।',
      'ଯଜୁର୍ବେଦ ଯଜ୍ଞ ଓ କର୍ମକାଣ୍ଡ ସମ୍ବନ୍ଧୀୟ ମନ୍ତ୍ର ଧାରଣ କରେ।',
      'ଅଥର୍ବବେଦ ଚିକିତ୍ସା, ଔଷଧ ଓ ଲୌକିକ ବିଦ୍ୟାର ବର୍ଣ୍ଣନା କରେ।'
    ],
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Mauryan Empire / Ashoka / Kalinga War Questions
  {
    paperId: 'paper_ancient_india',
    chapterId: 'chap_mauryan',
    paper: 'Ancient History of India',
    chapter: 'Mauryan Empire',
    topic: 'The Kalinga War and Ashoka',
    subject: 'Ancient Indian History',
    department: 'History',
    semester: '1st Semester',
    difficulty: 'easy',
    pattern: 'true_false',
    marks: 1,
    language: 'bilingual',
    question: 'ଐତିହାସିକ କଳିଙ୍ଗ ଯୁଦ୍ଧ ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ରେ ଦୟାନଦୀ ତଟରେ ସଂଗଠିତ ହୋଇଥିଲା। ଏହି ବିବୃତି ସତ୍ୟ କି ମିଥ୍ୟା?\n(The historic Kalinga War was fought in 261 BCE on the banks of Daya River. Is this statement True or False?)',
    questionOdia: 'ଐତିହାସିକ କଳିଙ୍ଗ ଯୁଦ୍ଧ ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ରେ ଦୟାନଦୀ ତଟରେ ସଂଗଠିତ ହୋଇଥିଲା। ଏହି ବିବୃତି ସତ୍ୟ କି ମିଥ୍ୟା?',
    questionEnglish: 'The historic Kalinga War was fought in 261 BCE on the banks of Daya River. Is this statement True or False?',
    options: ['ସତ୍ୟ (True)', 'ମିଥ୍ୟା (False)'],
    correctAnswer: 'ସତ୍ୟ (True)',
    explanationCorrect: 'ଏହି ବିବୃତି ସତ୍ୟ। ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ରେ ମୌର୍ଯ୍ୟ ସମ୍ରାଟ ଅଶୋକ ଏବଂ କଳିଙ୍ଗ ସୈନ୍ୟବାହିନୀ ମଧ୍ୟରେ ଦୟାନଦୀ ତଟବର୍ତ୍ତୀ ଧଉଳି ନିକଟରେ ଏହି ଭୟଙ୍କର ଯୁଦ୍ଧ ହୋଇଥିଲା, ଯାହା ଅଶୋକଙ୍କ ହୃଦୟ ପରିବର୍ତ୍ତନ କରାଇ ବୌଦ୍ଧଧର୍ମ ଦିଗକୁ ଆକୃଷ୍ଟ କରିଥିଲା।',
    explanationIncorrect: [
      'ଏହା ଏକ ଐତିହାସିକ ସତ୍ୟତା। ଅଶୋକଙ୍କ ୧୩ଶ ଶିଳାଲେଖରେ ଏହି ଯୁଦ୍ଧର ବର୍ଣ୍ଣନା ରହିଛି।'
    ],
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // History of Odisha: Kharavela
  {
    paperId: 'paper_odisha',
    chapterId: 'chap_kharavela',
    paper: 'History of Odisha',
    chapter: 'Kharavela and Chedi Dynasty',
    topic: 'Hatigumpha Inscription',
    subject: 'History of Odisha',
    department: 'History',
    semester: '3rd Semester',
    difficulty: 'medium',
    pattern: 'mcq',
    marks: 1,
    language: 'bilingual',
    question: 'ଉଦୟଗିରିସ୍ଥିତ ପ୍ରସିଦ୍ଧ ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ କେଉଁ ଐତିହାସିକ ଶାସକଙ୍କ ଜୀବନୀ ଓ କୀର୍ତ୍ତିକଳାପ ବର୍ଣ୍ଣନା କରେ?\n(The famous Hatigumpha inscription at Udayagiri describes the life and reign of which historical ruler?)',
    questionOdia: 'ଉଦୟଗିରିସ୍ଥିତ ପ୍ରସିଦ୍ଧ ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ କେଉଁ ଐତିହାସିକ ଶାସକଙ୍କ ଜୀବନୀ ଓ କୀର୍ତ୍ତିକଳାପ ବର୍ଣ୍ଣନା କରେ?',
    questionEnglish: 'The famous Hatigumpha inscription at Udayagiri describes the life and reign of which historical ruler?',
    options: ['ମହାମେଘବାହନ ଖାରବେଳ (Kharavela)', 'ସମ୍ରାଟ ଅଶୋକ (Emperor Ashoka)', 'କପିଳେନ୍ଦ୍ର ଦେବ (Kapilendradeva)', 'ଚୋଡ଼ଗଙ୍ଗ ଦେବ (Chodagangadeva)'],
    correctAnswer: 'ମହାମେଘବାହନ ଖାରବେଳ (Kharavela)',
    explanationCorrect: 'ଭୁବନେଶ୍ୱର ନିକଟସ୍ଥ ଉଦୟଗିରି ପାହାଡ଼ର ହାତୀଗୁମ୍ଫାରେ ପ୍ରାକୃତ ଭାଷା ଓ ବ୍ରାହ୍ମୀ ଲିପିରେ ଖୋଦିତ ୧୭ ଧାଡ଼ି ବିଶିଷ୍ଟ ପ୍ରସିଦ୍ଧ ଶିଳାଲେଖ ମହାମେଘବାହନ ଐର ଖାରବେଳଙ୍କ ୧୩ ବର୍ଷର ରାଜତ୍ୱ କାଳର ଘଟଣାବଳୀ ବର୍ଣ୍ଣନା କରେ।',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // History of Odisha: Maritime Trade & Boita Bandana
  {
    paperId: 'paper_odisha',
    chapterId: 'chap_maritime_odisha',
    paper: 'History of Odisha',
    chapter: 'Maritime Heritage and Boita Bandana',
    topic: 'Maritime Trade and Cultural Expansion',
    subject: 'History of Odisha',
    department: 'History',
    semester: '3rd Semester',
    difficulty: 'medium',
    pattern: 'short',
    marks: 2,
    language: 'bilingual',
    question: 'ପ୍ରାଚୀନ କଳିଙ୍ଗର ନୌବାଣିଜ୍ୟ ପରମ୍ପରା ଏବଂ ‘ବୋଇତ ବନ୍ଦାଣ’ ଉତ୍ସବ ସମ୍ପର୍କରେ ଏକ ସଂକ୍ଷିପ୍ତ ଟିପ୍ପଣୀ ଲେଖ।\n(Write a short note on Maritime trade of Ancient Kalinga and Boita Bandana.)',
    questionOdia: 'ପ୍ରାଚୀନ କଳିଙ୍ଗର ନୌବାଣିଜ୍ୟ ପରମ୍ପରା ଏବଂ ‘ବୋଇତ ବନ୍ଦାଣ’ ଉତ୍ସବ ସମ୍ପର୍କରେ ଏକ ସଂକ୍ଷିପ୍ତ ଟିପ୍ପଣୀ ଲେଖ।',
    questionEnglish: 'Write a short note on Maritime trade of Ancient Kalinga and Boita Bandana.',
    correctAnswer: 'ମଡେଲ ଉତ୍ତର: ପ୍ରାଚୀନ କଳିଙ୍ଗର ସାଧବପୁଅମାନେ ବୋଇତ ଯୋଗେ ସୁବର୍ଣ୍ଣଦ୍ୱୀପ, ଜାଭା, ବାଲି, ସୁମାତ୍ରା ଓ ଶ୍ରୀଲଙ୍କା ସହ ନୌବାଣିଜ୍ୟ କରୁଥିଲେ। କାର୍ତ୍ତିକ ପୂର୍ଣ୍ଣିମାରେ ବୋଇତ ବନ୍ଦାଣ ଉତ୍ସବ ଏହାର ଗୌରବମୟ ସ୍ମୃତି ବହନ କରେ।',
    modelAnswer: 'ପ୍ରାଚୀନ କଳିଙ୍ଗର ସାଧବପୁଅମାନେ ବୃହତ ବୋଇତ ଯୋଗେ ଦକ୍ଷିଣ-ପୂର୍ବ ଏସିଆର ଦ୍ୱୀପପୁଞ୍ଜ ଯଥା ଜାଭା, ବାଲି, ସୁମାତ୍ରା, ବୋର୍ଣ୍ଣିଓ ଓ ସିଂହଳ (ଶ୍ରୀଲଙ୍କା) ସହ ବ୍ୟାପକ ସାମୁଦ୍ରିକ ବାଣିଜ୍ୟ କରୁଥିଲେ। ସେମାନେ ମସଲା, ଚନ୍ଦନ କାଠ, ହସ୍ତୀଦନ୍ତ ଓ ରେଶମ ବସ୍ତ୍ର ରପ୍ତାନି କରୁଥିଲେ। କାର୍ତ୍ତିକ ପୂର୍ଣ୍ଣିମାର ‘ବୋଇତ ବନ୍ଦାଣ’ ଏହି ଗୌରବମୟ ନୌବାଣିଜ୍ୟ ଇତିହାସର ଏକ ଜୀବନ୍ତ ପ୍ରତୀକ।',
    keywords: ['ସାଧବପୁଅ', 'ବୋଇତ ବନ୍ଦାଣ', 'ଜାଭା ବାଲି ସୁମାତ୍ରା', 'କାର୍ତ୍ତିକ ପୂର୍ଣ୍ଣିମା', 'ଦକ୍ଷିଣ-ପୂର୍ବ ଏସିଆ'],
    markingRubric: 'ବାଣିଜ୍ୟିକ ସମ୍ପର୍କ ଓ ଦେଶଗୁଡ଼ିକର ନାମ (୧ ମାର୍କ), ବୋଇତ ବନ୍ଦାଣ ତାତ୍ପର୍ଯ୍ୟ (୧ ମାର୍କ)।',
    explanationCorrect: 'କଳିଙ୍ଗର ଚେଳିତାଲୋ, ତାମ୍ରଲିପ୍ତି, ପାଲୁର ଆଦି ପ୍ରାଚୀନ ବନ୍ଦରରୁ ବାଣିଜ୍ୟ ପରିଚାଳିତ ହେଉଥିଲା।',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Indian National Movement: Salt Satyagraha
  {
    paperId: 'paper_national_movement',
    chapterId: 'chap_national_civil_disobedience',
    paper: 'Indian National Movement',
    chapter: 'Civil Disobedience and Salt Satyagraha',
    topic: 'Salt Satyagraha in Odisha',
    subject: 'National Movement in Odisha',
    department: 'History',
    semester: '6th Semester',
    difficulty: 'easy',
    pattern: 'blanks',
    marks: 1,
    language: 'bilingual',
    question: 'ଓଡ଼ିଶାରେ ଲବଣ ସତ୍ୟାଗ୍ରହର ମୁଖ୍ୟ କେନ୍ଦ୍ର ______ ଠାରେ ଅବସ୍ଥିତ ଥିଲା।\n(The main center of Salt Satyagraha in Odisha was at ______.)',
    questionOdia: 'ଓଡ଼ିଶାରେ ଲବଣ ସତ୍ୟାଗ୍ରହର ମୁଖ୍ୟ କେନ୍ଦ୍ର ______ ଠାରେ ଅବସ୍ଥିତ ଥିଲା।',
    questionEnglish: 'The main center of Salt Satyagraha in Odisha was at ______.',
    options: ['ଇଞ୍ଚୁଡ଼ି (Inchudi)', 'ପୁରୀ (Puri)', 'କଟକ (Cuttack)', 'ସମ୍ବଲପୁର (Sambalpur)'],
    correctAnswer: 'ଇଞ୍ଚୁଡ଼ି (Inchudi)',
    explanationCorrect: 'ବାଲେଶ୍ୱର ଜିଲ୍ଲାର ଇଞ୍ଚୁଡ଼ି ଓଡ଼ିଶାର ଲବଣ ସତ୍ୟାଗ୍ରହର ମୁଖ୍ୟ କେନ୍ଦ୍ର ଥିଲା। ଆଚାର୍ଯ୍ୟ ହରିହର ଦାସଙ୍କ ନେତୃତ୍ୱରେ ସତ୍ୟାଗ୍ରହୀମାନେ ଏଠାରେ ୧୩ ଏପ୍ରିଲ ୧୯୩୦ରେ ଲବଣ ଆଇନ ଭଙ୍ଗ କରିଥିଲେ। ଭାରତରେ ଦାଣ୍ଡି ପରେ ଇଞ୍ଚୁଡ଼ି ଦ୍ୱିତୀୟ ସ୍ଥାନ ଥିଲା।',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Sample Initial Saved Test
export const SAMPLE_SAVED_TESTS: SavedTest[] = [
  {
    id: 'test_sample_indus_valley',
    title: 'Indus Valley Civilization Unit Test',
    paperId: 'paper_ancient_india',
    paperName: 'Ancient History of India',
    chapterIds: ['chap_indus_valley'],
    chapterNames: ['Indus Valley Civilization'],
    questionIds: [], // Populated dynamically upon seeding
    totalQuestions: 3,
    totalMarks: 4,
    durationMinutes: 20,
    language: 'bilingual',
    instructions: 'All questions are compulsory. Read the questions carefully in Odia or English before answering.',
    patternDistribution: {
      mcq: 1,
      blanks: 1,
      short: 1
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

import { initStudentsAndEnrolments } from '../services/studentDataService';

// Helper to seed initial data and migrate existing questions if needed
export async function initDatabaseDefaults(): Promise<void> {
  try {
    // 1. Seed & Migrate Students and Multi-Enrolment Course Records
    await initStudentsAndEnrolments();

    // 2. Ensure all Papers exist
    for (const p of SAMPLE_PAPERS) {
      const exists = await db.papers.get(p.id);
      if (!exists) {
        await db.papers.put(p);
      }
    }

    // 3. Ensure all Chapters exist
    for (const c of SAMPLE_CHAPTERS) {
      const exists = await db.chapters.get(c.id);
      if (!exists) {
        await db.chapters.put(c);
      }
    }

    // 4. Seed Questions if empty
    const questionCount = await db.questions.count();
    if (questionCount === 0) {
      await db.questions.bulkAdd(SAMPLE_QUESTIONS);
    } else {
      // Safe Migration: Ensure all existing questions have valid paperId and chapterId
      const allExistingQuestions = await db.questions.toArray();
      for (const q of allExistingQuestions) {
        let needsUpdate = false;
        let pId = q.paperId;
        let cId = q.chapterId;

        if (!pId) {
          const lower = (q.paper || q.subject || '').toLowerCase();
          if (lower.includes('odisha') || lower.includes('kalinga')) {
            pId = 'paper_odisha';
          } else if (lower.includes('national') || lower.includes('freedom') || lower.includes('satyagraha')) {
            pId = 'paper_national_movement';
          } else if (lower.includes('medieval') || lower.includes('mughal') || lower.includes('sultanate')) {
            pId = 'paper_medieval_india';
          } else if (lower.includes('art') || lower.includes('architecture')) {
            pId = 'paper_art_architecture';
          } else {
            pId = 'paper_ancient_india';
          }
          needsUpdate = true;
        }

        if (!cId) {
          const lowerTopic = (q.topic || q.chapter || q.question || '').toLowerCase();
          if (lowerTopic.includes('indus') || lowerTopic.includes('harappa') || lowerTopic.includes('mohenjo') || lowerTopic.includes('lothal')) {
            cId = 'chap_indus_valley';
          } else if (lowerTopic.includes('veda') || lowerTopic.includes('rigveda') || lowerTopic.includes('vedic')) {
            cId = 'chap_vedic_age';
          } else if (lowerTopic.includes('kalinga war') || lowerTopic.includes('ashoka') || lowerTopic.includes('dhauli')) {
            cId = pId === 'paper_odisha' ? 'chap_kalinga_war' : 'chap_mauryan';
          } else if (lowerTopic.includes('kharavela') || lowerTopic.includes('hatigumpha')) {
            cId = 'chap_kharavela';
          } else if (lowerTopic.includes('boita') || lowerTopic.includes('maritime') || lowerTopic.includes('bali')) {
            cId = 'chap_maritime_odisha';
          } else if (lowerTopic.includes('salt') || lowerTopic.includes('inchudi') || lowerTopic.includes('satyagraha')) {
            cId = 'chap_national_civil_disobedience';
          } else {
            cId = pId === 'paper_ancient_india' ? 'chap_indus_valley' : 'chap_odisha_sources';
          }
          needsUpdate = true;
        }

        if (needsUpdate && q.id) {
          await db.questions.update(q.id, {
            paperId: pId,
            chapterId: cId,
            difficulty: q.difficulty || (q.marks >= 5 ? 'hard' : q.marks >= 2 ? 'medium' : 'easy')
          });
        }
      }
    }

    // 5. Seed Saved Tests if empty
    const savedTestCount = await db.savedTests.count();
    if (savedTestCount === 0) {
      // Connect with actual question IDs from Indus Valley
      const indusQuestions = await db.questions.where('chapterId').equals('chap_indus_valley').toArray();
      const testSeed = { ...SAMPLE_SAVED_TESTS[0] };
      testSeed.questionIds = indusQuestions.map(q => q.id!).filter(Boolean);
      testSeed.totalQuestions = testSeed.questionIds.length || 1;
      testSeed.totalMarks = indusQuestions.reduce((sum, q) => sum + (q.marks || 1), 0) || 4;
      await db.savedTests.put(testSeed);
    }

    // 6. Settings
    const settings = await db.settings.get('app_settings');
    if (!settings) {
      await db.settings.put(DEFAULT_SETTINGS);
    }
  } catch (error) {
    console.error('Error initializing database defaults:', error);
  }
}
