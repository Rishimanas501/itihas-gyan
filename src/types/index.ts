export type QuestionPattern = 'mcq' | 'blanks' | 'true_false' | 'one_word' | 'short' | 'long';
export type QuestionLanguage = 'odia' | 'english' | 'bilingual';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type CourseType = 'Major' | 'Minor' | 'AEC' | 'SEC' | 'VAC' | 'Multidisciplinary';
export type CourseCategory = 'Major' | 'Minor' | 'MDC' | 'AEC' | 'SEC' | 'VAC';

export interface CourseEnrolment {
  id?: number;
  studentId?: number; // Foreign key linking to Student.id
  rollNo: string; // College Roll Number
  courseCategory: CourseCategory; // 'Major' | 'Minor' | 'MDC' | 'AEC' | 'SEC' | 'VAC'
  specificCategory?: string; // e.g. 'Major (Core-I)', 'Minor-I (Core-II)', 'SEMESTER-I (MDC)'
  subject: string; // Actual subject / paper name (e.g. History, Political Science, ESDM)
  paperName?: string;
  department?: string; // Department where applicable
  semester?: string; // e.g. '1st Semester', '2nd Semester', etc.
  batch: string; // '2024-27' | '2025-28' | '2026-29'
  academicSession?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id?: number;
  rollNo: string;
  name: string;
  department: string; // Department (e.g. History, Political Science)
  semester: string;
  batch: string; // '2024-27' | '2025-28' | '2026-29'
  courseType?: CourseType | string; // Primary / Major course
  subjectClass?: string;
  status: 'active' | 'inactive';
  universityRoll?: string;
  gender?: string;
  category?: string; // SC / ST / General / OBC
  mobile?: string;
  admissionDate?: string;
  enrolments?: CourseEnrolment[]; // Linked academic enrolments
  createdAt: string;
  updatedAt: string;
}

export interface Paper {
  id: string; // unique ID e.g. "paper_ancient_india"
  name: string;
  nameOdia?: string;
  code?: string; // e.g. "HIST-C1"
  courseType?: CourseType | string; // Major, Minor, AEC, SEC, VAC, Multidisciplinary
  subject: string;
  department: string;
  semester?: string;
  academicSession?: string; // Batch / Session e.g. '2024-27'
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string; // unique ID e.g. "chap_indus_valley"
  paperId: string;
  name: string;
  nameOdia?: string;
  chapterNumber?: number;
  description?: string;
  subtopics?: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id?: number;
  paperId?: string; // Foreign key to Paper.id
  chapterId?: string; // Foreign key to Chapter.id
  subtopicId?: string; // Optional subtopic identifier
  difficulty?: DifficultyLevel;
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
  source?: string; // source / reference book
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

export interface SavedTest {
  id: string;
  title: string;
  paperId: string;
  paperName: string;
  chapterIds: string[];
  chapterNames: string[];
  questionIds: number[];
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number; // Duration in minutes
  language: QuestionLanguage;
  patternDistribution?: Record<string, number>;
  instructions?: string;
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
  openaiApiKey?: string;
  googleMapsApiKey?: string;
  serverUrl: string;
  negativeMarking: boolean;
  negativeMarkValue: number;
  bonusMarkValue: number;
  autoBackupReminder: boolean;
  lastBackupDate?: string;
  defaultTimer: number;
  defaultLanguage?: 'bilingual' | 'odia' | 'english';
  defaultAiProvider?: 'existing' | 'gemini' | 'openai';
  defaultAiModel?: string;
  theme: 'emerald' | 'navy' | 'dark';
}

// ----------------------------------------------------
// Historical Map Generator & Flipbook Animation Types
// ----------------------------------------------------

export type PoliticalStatus = 
  | 'direct_annexation' 
  | 'tributary_vassal' 
  | 'protectorate' 
  | 'frontier_sphere';

export interface HistoricalRegion {
  id: string;
  name: string;
  modernLocation: string;
  previousRulerOrDynasty: string;
  conqueringRuler: string;
  conquestYear: string;
  battlesInvolved: string;
  historicalBackground: string;
  conquestReasons: string;
  historicalSignificance: string;
  aftermathAndRebellions: string;
  politicalStatus: PoliticalStatus;
  svgPath: string;
  labelCoordinates: { x: number; y: number };
  fillColor?: string;
  geoCoordinates?: { lat: number; lng: number }[];
  centerCoord?: { lat: number; lng: number };
}

export interface RulerProfile {
  name: string;
  odiaName?: string;
  reignPeriod: string;
  title?: string;
  avatarIcon?: string;
  achievements: string[];
  importantBattles: string[];
  capitals: string[];
  historicalSignificance: string;
  interestingFacts: string[];
}

export interface CampaignVector {
  id: string;
  name: string;
  from: { x: number; y: number; lat?: number; lng?: number };
  to: { x: number; y: number; lat?: number; lng?: number };
  path?: string;
  geoPath?: { lat: number; lng: number }[];
  year: string;
  description: string;
  commander?: string;
}

export interface HistoricalCity {
  name: string;
  odiaName?: string;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  type: 'capital' | 'fort' | 'battlefield' | 'port' | 'city';
  yearFoundedOrConquered?: string;
}

export interface HistoricalFrame {
  id: string;
  frameNumber: number;
  yearDisplay: string;
  title: string;
  subtitle: string;
  ruler: RulerProfile;
  controlledRegionIds: string[];
  newlyAcquiredRegionIds: string[];
  campaignVectors: CampaignVector[];
  cities: HistoricalCity[];
  summaryText: string;
  territorialExtentSqKm?: string;
}

export interface ChronologicalEvent {
  year: string;
  frameIndex: number;
  eventTitle: string;
  ruler: string;
  location: string;
  description: string;
  impact: string;
}

export interface HistoricalMap {
  id: string;
  title: string;
  odiaTitle?: string;
  topic: string;
  era: string;
  category?: 'empire' | 'figure' | 'movement' | 'event' | 'civilisation';
  description: string;
  baseMapType: 'subcontinent' | 'odisha' | 'asia';
  viewBox: string;
  regions: HistoricalRegion[];
  frames: HistoricalFrame[];
  events: ChronologicalEvent[];
  geographicFeatures: {
    rivers: { name: string; path: string }[];
    mountains?: { name: string; x: number; y: number }[];
    seas?: { name: string; x: number; y: number }[];
  };
  isBuiltin?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// Chat with AI Assistant & Vision Multi-Turn Models
// ----------------------------------------------------

export type AiProviderType = 'existing' | 'gemini' | 'openai';

export interface AiModelInfo {
  id: string;
  name: string;
  provider: AiProviderType;
  description: string;
  supportsVision: boolean;
  supportsDocuments: boolean;
  isDefault?: boolean;
}

export interface ChatAttachment {
  id: string;
  conversationId: string;
  messageId: string;
  name: string;
  type: 'image' | 'document';
  mimeType: string;
  size: number;
  dataUrl: string; // Base64 data URL for persistent rendering
  extractedText?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  provider?: AiProviderType;
  model?: string;
  attachments?: ChatAttachment[];
  historyTeacherTopic?: string;
  isError?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  provider: AiProviderType;
  model: string;
  historyMode?: string;
  createdAt: string;
  updatedAt: string;
}

export type HistoryEra =
  | 'all'
  | 'ancient_india'
  | 'medieval_india'
  | 'modern_india'
  | 'odisha_history'
  | 'world_history'
  | 'historical_sources'
  | 'art_architecture_maps';

export type ExamAnswerFormat = '1-mark' | '2-mark' | '5-mark' | '8-mark' | 'notes' | 'mcqs' | 'mindmap';


