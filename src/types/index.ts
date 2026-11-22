export type QuestionPattern = 'mcq' | 'blanks' | 'true_false' | 'one_word' | 'short' | 'long';
export type QuestionLanguage = 'odia' | 'english' | 'bilingual';

export interface Student {
  id?: number;
  rollNo: string;
  name: string;
  department: string;
  semester: string;
  batch: string;
  subjectClass: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id?: number;
  question: string;
  questionOdia?: string;
  questionEnglish?: string;
  pattern: QuestionPattern;
  marks: number;
  options?: string[]; // 4 options for MCQ
  correctAnswer: string;
  explanationCorrect: string;
  explanationIncorrect?: string[]; // explanations for each incorrect option
  modelAnswer?: string;
  keywords?: string[];
  markingRubric?: string;
  subject: string;
  department: string;
  semester: string;
  paper: string;
  topic: string;
  chapter?: string;
  academicSession?: string;
  language: QuestionLanguage;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HandRaiseRecord {
  rollNo: string;
  name: string;
  timestamp: number;
  sequence: number;
  rank: number;
}

export interface QuestionScoreRecord {
  rollNo: string;
  name: string;
  questionIndex: number;
  marks: number;
  markingStatus: 'correct' | 'incorrect' | 'partial' | 'bonus' | 'no_marks';
  handRaisedRank?: number;
  notes?: string;
}

export interface QuizSession {
  id: string; // unique session UUID
  pin: string; // 4-6 digit numeric pin
  title: string;
  subject: string;
  topic: string;
  questionIds: number[];
  currentQuestionIndex: number;
  status: 'active' | 'paused' | 'ended';
  revealAnswer: boolean;
  showDescription: boolean;
  timerDuration: number; // in seconds (0 = off)
  createdAt: string;
  endedAt?: string;
}

export interface StudentSessionSummary {
  rollNo: string;
  name: string;
  totalMarks: number;
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  bonusCount: number;
  handRaiseCount: number;
  rank?: number;
}

export interface AppSettings {
  id: string;
  teacherName: string;
  collegeName: string;
  department: string;
  geminiApiKey: string;
  serverUrl: string;
  negativeMarking: boolean;
  negativeMarkValue: number;
  bonusMarkValue: number;
  autoBackupReminder: boolean;
  lastBackupDate?: string;
  defaultTimer: number;
  theme: 'emerald' | 'navy' | 'dark';
}
