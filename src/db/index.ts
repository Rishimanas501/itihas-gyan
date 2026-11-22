import Dexie, { type Table } from 'dexie';
import type { Student, Question, QuizSession, QuestionScoreRecord, AppSettings } from '../types';

export class ItihasGyanDB extends Dexie {
  students!: Table<Student, number>;
  questions!: Table<Question, number>;
  sessions!: Table<QuizSession, string>;
  scores!: Table<QuestionScoreRecord, number>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('ItihasGyanDatabase');
    this.version(1).stores({
      students: '++id, &rollNo, name, department, semester, batch, status',
      questions: '++id, question, pattern, marks, subject, department, semester, paper, topic, language, approved',
      sessions: 'id, &pin, status, createdAt',
      scores: '++id, [rollNo+questionIndex], rollNo, questionIndex, markingStatus',
      settings: 'id'
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
  serverUrl: '',
  negativeMarking: false,
  negativeMarkValue: 0.25,
  bonusMarkValue: 1,
  autoBackupReminder: true,
  defaultTimer: 30,
  defaultLanguage: 'bilingual',
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
  },
  {
    rollNo: 'BA24-006',
    name: 'ସ୍ମୃତିରେଖା ନାୟକ (Smrutirekha Nayak)',
    department: 'History',
    semester: '4th Semester',
    batch: '2024-27',
    subjectClass: 'Core Paper VII: History of Odisha',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SAMPLE_QUESTIONS: Omit<Question, 'id'>[] = [
  {
    question: 'କୋଣାର୍କ ସୂର୍ଯ୍ୟ ମନ୍ଦିର କେଉଁ ଗଙ୍ଗ ବଂଶର ରାଜାଙ୍କ ଦ୍ୱାରା ନିର୍ମିତ ହୋଇଥିଲା?\n(Which Ganga Dynasty king built the Konark Sun Temple?)',
    questionOdia: 'କୋଣାର୍କ ସୂର୍ଯ୍ୟ ମନ୍ଦିର କେଉଁ ଗଙ୍ଗ ବଂଶର ରାଜାଙ୍କ ଦ୍ୱାରା ନିର୍ମିତ ହୋଇଥିଲା?',
    questionEnglish: 'Which Ganga Dynasty king built the Konark Sun Temple?',
    pattern: 'mcq',
    marks: 1,
    options: [
      'ପ୍ରଥମ ନରସିଂହ ଦେବ (Narasimhadeva I)',
      'ଅନନ୍ତବର୍ମନ ଚୋଡ଼ଗଙ୍ଗ ଦେବ (Anantavarman Chodaganga Deva)',
      'ଅନଙ୍ଗଭୀମ ଦେବ ତୃତୀୟ (Anangabhima Deva III)',
      'ଭାନୁଦେବ ପ୍ରଥମ (Bhanudeva I)'
    ],
    correctAnswer: 'ପ୍ରଥମ ନରସିଂହ ଦେବ (Narasimhadeva I)',
    explanationCorrect: 'ପ୍ରଥମ ନରସିଂହ ଦେବ (ଖ୍ରୀଷ୍ଟାବ୍ଦ ୧୨୩୮-୧୨୬୪) ତ୍ରୟୋଦଶ ଶତାବ୍ଦୀରେ କୋଣାର୍କର ବିଶ୍ୱପ୍ରସିଦ୍ଧ ସୂର୍ଯ୍ୟ ମନ୍ଦିର ନିର୍ମାଣ କରିଥିଲେ। ମୁସଲିମ ଆକ୍ରମଣକାରୀଙ୍କ ବିରୁଦ୍ଧରେ ବିଜୟର ସ୍ମାରକୀ ସ୍ୱରୂପ ଏହା ନିର୍ମିତ ହୋଇଥିଲା।',
    explanationIncorrect: [
      'ଅନନ୍ତବର୍ମନ ଚୋଡ଼ଗଙ୍ଗ ଦେବ ପୁରୀ ଶ୍ରୀଜଗନ୍ନାଥ ମନ୍ଦିରର ନିର୍ମାଣ ଆରମ୍ଭ କରିଥିଲେ, କୋଣାର୍କ ନୁହେଁ।',
      'ଅନଙ୍ଗଭୀମ ଦେବ ତୃତୀୟ ପୁରୀ ମନ୍ଦିରର ନିର୍ମାଣ ସମ୍ପୂର୍ଣ୍ଣ କରିଥିଲେ ଏବଂ ବାରବାଟୀ ଦୁର୍ଗ ସହ ଜଡ଼ିତ।',
      'ଭାନୁଦେବ ପ୍ରଥମ ନରସିଂହ ଦେବଙ୍କ ପରବର୍ତ୍ତୀ ଶାସକ ଥିଲେ।'
    ],
    subject: 'History of Odisha',
    department: 'History',
    semester: '4th Semester',
    paper: 'Core Paper VII',
    topic: 'Eastern Ganga Dynasty & Temple Architecture',
    chapter: 'Imperial Gangas of Odisha',
    language: 'bilingual',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    question: 'ପ୍ରସିଦ୍ଧ ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ କେଉଁ ଐତିହାସିକ ଶାସକଙ୍କ ରାଜତ୍ୱ କାଳର ବିବରଣୀ ପ୍ରଦାନ କରେ?\n(Which historical ruler\'s reign is detailed in the famous Hatigumpha Inscription?)',
    questionOdia: 'ପ୍ରସିଦ୍ଧ ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖ କେଉଁ ଐତିହାସିକ ଶାସକଙ୍କ ରାଜତ୍ୱ କାଳର ବିବରଣୀ ପ୍ରଦାନ କରେ?',
    questionEnglish: 'Which historical ruler\'s reign is detailed in the famous Hatigumpha Inscription?',
    pattern: 'mcq',
    marks: 1,
    options: [
      'ମହାମେଘବାହନ ଐର ଖାରବେଳ (Kharavela)',
      'ସମ୍ରାଟ ଅଶୋକ (Emperor Ashoka)',
      'କପିଳେନ୍ଦ୍ର ଦେବ (Kapilendra Deva)',
      'ଧର୍ମପାଳ (Dharmapala)'
    ],
    correctAnswer: 'ମହାମେଘବାହନ ଐର ଖାରବେଳ (Kharavela)',
    explanationCorrect: 'ଉଦୟଗିରିସ୍ଥିତ ହାତୀଗୁମ୍ଫା ଶିଳାଲେଖରେ ମହାମେଘବାହନ ଚେଦି ବଂଶର ମହାନ ସମ୍ରାଟ ଖାରବେଳଙ୍କ ୧୩ ବର୍ଷର ରାଜତ୍ୱର ଘଟଣାବଳୀ ବ୍ରାହ୍ମୀ ଲିପି ଓ ପ୍ରାକୃତ ଭାଷାରେ ଲିପିବଦ୍ଧ ରହିଛି।',
    explanationIncorrect: [
      'ସମ୍ରାଟ ଅଶୋକଙ୍କ ଶିଳାଲେଖ ଧଉଳି ଓ ଜୌଗଡ଼ରେ ଦେଖିବାକୁ ମିଳେ।',
      'କପିଳେନ୍ଦ୍ର ଦେବ ସୂର୍ଯ୍ୟବଂଶର ପ୍ରତିଷ୍ଠାତା ଥିଲେ (୧୫ଶ ଶତାବ୍ଦୀ)।',
      'ଧର୍ମପାଳ ବଙ୍ଗଳାର ପାଳ ବଂଶୀୟ ଶାସକ ଥିଲେ।'
    ],
    subject: 'Ancient Indian History',
    department: 'History',
    semester: '2nd Semester',
    paper: 'Core Paper III',
    topic: 'Kharavela and Kalinga Empire',
    chapter: 'Post-Mauryan Kalinga',
    language: 'bilingual',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    question: 'ଓଡ଼ିଶାରେ ୧୮୧୭ ମସିହାରେ ବକ୍ସି ଜଗବନ୍ଧୁଙ୍କ ନେତୃତ୍ୱରେ ସଂଗଠିତ ବିଦ୍ରୋହର ନାମ କ’ଣ?\n(Name of the 1817 armed uprising led by Buxi Jagabandhu in Odisha?)',
    questionOdia: 'ଓଡ଼ିଶାରେ ୧୮୧୭ ମସିହାରେ ବକ୍ସି ଜଗବନ୍ଧୁଙ୍କ ନେତୃତ୍ୱରେ ସଂଗଠିତ ବିଦ୍ରୋହର ନାମ କ’ଣ?',
    questionEnglish: 'Name of the 1817 armed uprising led by Buxi Jagabandhu in Odisha?',
    pattern: 'one_word',
    marks: 1,
    correctAnswer: 'ପାଇକ ବିଦ୍ରୋହ (Paika Rebellion)',
    explanationCorrect: '୧୮୧୭ ଖ୍ରୀଷ୍ଟାବ୍ଦରେ ଖୋର୍ଦ୍ଧାର ପାଇକମାନେ ଇଂରେଜ ସରକାରଙ୍କ ଶୋଷଣ ବିରୁଦ୍ଧରେ ସଶସ୍ତ୍ର ସଂଗ୍ରାମ କରିଥିଲେ। ଏହାକୁ ଭାରତର ପ୍ରଥମ ସ୍ୱାଧୀନତା ସଂଗ୍ରାମ ଭାବେ ଅନେକ ଐତିହାସିକ ଗଣନା କରନ୍ତି।',
    subject: 'Modern Odisha History',
    department: 'History',
    semester: '6th Semester',
    paper: 'Core Paper XIII',
    topic: 'Resistance Movements in Odisha',
    chapter: 'The Great Paika Rebellion 1817',
    language: 'bilingual',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    question: 'ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ରେ ଦୟା ନଦୀ କୂଳରେ ଐତିହାସିକ କଳିଙ୍ଗ ଯୁଦ୍ଧ ସଂଘଠିତ ହୋଇଥିଲା। (ସତ୍ୟ / ମିଥ୍ୟା)\n(The historic Kalinga War took place on the banks of river Daya in 261 BCE. True/False)',
    questionOdia: 'ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ରେ ଦୟା ନଦୀ କୂଳରେ ଐତିହାସିକ କଳିଙ୍ଗ ଯୁଦ୍ଧ ସଂଘଠିତ ହୋଇଥିଲା।',
    questionEnglish: 'The historic Kalinga War took place on the banks of river Daya in 261 BCE.',
    pattern: 'true_false',
    marks: 1,
    options: ['ସତ୍ୟ (True)', 'ମିଥ୍ୟା (False)'],
    correctAnswer: 'ସତ୍ୟ (True)',
    explanationCorrect: 'ଏହି ବିବୃତି ସତ୍ୟ। ଖ୍ରୀଷ୍ଟପୂର୍ବ ୨୬୧ରେ ମୌର୍ଯ୍ୟ ସମ୍ରାଟ ଅଶୋକ ଏବଂ କଳିଙ୍ଗ ସୈନ୍ୟବାହିନୀ ମଧ୍ୟରେ ଦୟାନଦୀ ତଟବର୍ତ୍ତୀ ଧଉଳି ନିକଟରେ ଏହି ଭୟଙ୍କର ଯୁଦ୍ଧ ହୋଇଥିଲା, ଯାହା ଅଶୋକଙ୍କ ହୃଦୟ ପରିବର୍ତ୍ତନ କରାଇ ବୌଦ୍ଧଧର୍ମ ଦିଗକୁ ଆକୃଷ୍ଟ କରିଥିଲା।',
    subject: 'Ancient Indian History',
    department: 'History',
    semester: '1st Semester',
    paper: 'Core Paper I',
    topic: 'The Kalinga War and Ashoka',
    chapter: 'Mauryan Imperialism',
    language: 'bilingual',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    question: 'ଓଡ଼ିଶାରେ ଲବଣ ସତ୍ୟାଗ୍ରହର ମୁଖ୍ୟ କେନ୍ଦ୍ର ______ ଠାରେ ଅବସ୍ଥିତ ଥିଲା।\n(The main center of Salt Satyagraha in Odisha was at ______.)',
    questionOdia: 'ଓଡ଼ିଶାରେ ଲବଣ ସତ୍ୟାଗ୍ରହର ମୁଖ୍ୟ କେନ୍ଦ୍ର ______ ଠାରେ ଅବସ୍ଥିତ ଥିଲା।',
    questionEnglish: 'The main center of Salt Satyagraha in Odisha was at ______.',
    pattern: 'blanks',
    marks: 1,
    correctAnswer: 'ଇଞ୍ଚୁଡ଼ି (Inchudi)',
    options: ['ଇଞ୍ଚୁଡ଼ି (Inchudi)', 'ପୁରୀ (Puri)', 'କଟକ (Cuttack)', 'ସମ୍ବଲପୁର (Sambalpur)'],
    explanationCorrect: 'ବାଲେଶ୍ୱର ଜିଲ୍ଲାର ଇଞ୍ଚୁଡ଼ି ଓଡ଼ିଶାର ଲବଣ ସତ୍ୟାଗ୍ରହର ମୁଖ୍ୟ କେନ୍ଦ୍ର ଥିଲା। ଆଚାର୍ଯ୍ୟ ହରିହର ଦାସଙ୍କ ନେତୃତ୍ୱରେ ସତ୍ୟାଗ୍ରହୀମାନେ ଏଠାରେ ୧୩ ଏପ୍ରିଲ ୧୯୩୦ରେ ଲବଣ ଆଇନ ଭଙ୍ଗ କରିଥିଲେ। ଭାରତରେ ଦାଣ୍ଡି ପରେ ଇଞ୍ଚୁଡ଼ି ଦ୍ୱିତୀୟ ସ୍ଥାନ ଥିଲା।',
    subject: 'National Movement in Odisha',
    department: 'History',
    semester: '6th Semester',
    paper: 'Core Paper XIV',
    topic: 'Civil Disobedience in Odisha',
    chapter: 'Salt Satyagraha at Inchudi',
    language: 'bilingual',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    question: 'ପ୍ରାଚୀନ କଳିଙ୍ଗର ନୌବାଣିଜ୍ୟ ପରମ୍ପରା ଏବଂ ‘ବୋଇତ ବନ୍ଦାଣ’ ଉତ୍ସବ ସମ୍ପର୍କରେ ଏକ ସଂକ୍ଷିପ୍ତ ଟିପ୍ପଣୀ ଲେଖ।\n(Write a short note on Maritime trade of Ancient Kalinga and Boita Bandana.)',
    questionOdia: 'ପ୍ରାଚୀନ କଳିଙ୍ଗର ନୌବାଣିଜ୍ୟ ପରମ୍ପରା ଏବଂ ‘ବୋଇତ ବନ୍ଦାଣ’ ଉତ୍ସବ ସମ୍ପର୍କରେ ଏକ ସଂକ୍ଷିପ୍ତ ଟିପ୍ପଣୀ ଲେଖ।',
    questionEnglish: 'Write a short note on Maritime trade of Ancient Kalinga and Boita Bandana.',
    pattern: 'short',
    marks: 2,
    correctAnswer: 'ମଡେଲ ଉତ୍ତର: ପ୍ରାଚୀନ କଳିଙ୍ଗର ସାଧବପୁଅମାନେ ବୋଇତ ଯୋଗେ ସୁବର୍ଣ୍ଣଦ୍ୱୀପ, ଜାଭା, ବାଲି, ସୁମାତ୍ରା ଓ ଶ୍ରୀଲଙ୍କା ସହ ନୌବାଣିଜ୍ୟ କରୁଥିଲେ। କାର୍ତ୍ତିକ ପୂର୍ଣ୍ଣିମାରେ ବୋଇତ ବନ୍ଦାଣ ଉତ୍ସବ ଏହାର ଗୌରବମୟ ସ୍ମୃତି ବହନ କରେ।',
    modelAnswer: 'ପ୍ରାଚୀନ କଳିଙ୍ଗର ସାଧବପୁଅମାନେ ବୃହତ ବୋଇତ ଯୋଗେ ଦକ୍ଷିଣ-ପୂର୍ବ ଏସିଆର ଦ୍ୱୀପପୁଞ୍ଜ ଯଥା ଜାଭା, ବାଲି, ସୁମାତ୍ରା, ବୋର୍ଣ୍ଣିଓ ଓ ସିଂହଳ (ଶ୍ରୀଲଙ୍କା) ସହ ବ୍ୟାପକ ସାମୁଦ୍ରିକ ବାଣିଜ୍ୟ କରୁଥିଲେ। ସେମାନେ ମସଲା, ଚନ୍ଦନ କାଠ, ହସ୍ତୀଦନ୍ତ ଓ ରେଶମ ବସ୍ତ୍ର ରପ୍ତାନି କରୁଥିଲେ। କାର୍ତ୍ତିକ ପୂର୍ଣ୍ଣିମାର ‘ବୋଇତ ବନ୍ଦାଣ’ ଏହି ଗୌରବମୟ ନୌବାଣିଜ୍ୟ ଇତିହାସର ଏକ ଜୀବନ୍ତ ପ୍ରତୀକ।',
    keywords: ['ସାଧବପୁଅ', 'ବୋଇତ ବନ୍ଦାଣ', 'ଜାଭା ବାଲି ସୁମାତ୍ରା', 'କାର୍ତ୍ତିକ ପୂର୍ଣ୍ଣିମା', 'ଦକ୍ଷିଣ-ପୂର୍ବ ଏସିଆ'],
    markingRubric: 'ବାଣିଜ୍ୟିକ ସମ୍ପର୍କ ଓ ଦେଶଗୁଡ଼ିକର ନାମ (୧ ମାର୍କ), ବୋଇତ ବନ୍ଦାଣ ତାତ୍ପର୍ଯ୍ୟ (୧ ମାର୍କ)।',
    explanationCorrect: 'କଳିଙ୍ଗର ଚେଳିତାଲୋ, ତାମ୍ରଲିପ୍ତି, ପାଲୁର ଆଦି ପ୍ରାଚୀନ ବନ୍ଦରରୁ ବାଣିଜ୍ୟ ପରିଚାଳିତ ହେଉଥିଲା।',
    subject: 'History of Odisha',
    department: 'History',
    semester: '3rd Semester',
    paper: 'Core Paper V',
    topic: 'Maritime Trade and Cultural Expansion',
    chapter: 'Maritime Heritage of Kalinga',
    language: 'bilingual',
    approved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper to seed initial data if database is fresh
export async function initDatabaseDefaults(): Promise<void> {
  try {
    const studentCount = await db.students.count();
    if (studentCount === 0) {
      await db.students.bulkAdd(SAMPLE_STUDENTS);
    }

    const questionCount = await db.questions.count();
    if (questionCount === 0) {
      await db.questions.bulkAdd(SAMPLE_QUESTIONS);
    }

    const settings = await db.settings.get('app_settings');
    if (!settings) {
      await db.settings.put(DEFAULT_SETTINGS);
    }
  } catch (error) {
    console.error('Error initializing database defaults:', error);
  }
}
