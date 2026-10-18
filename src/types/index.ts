export type EducationLevel = 'JHS' | 'SHS' | 'University' | 'Other';

export interface UserProfile {
  name: string;
  email: string;
  level: EducationLevel;
  country: string;
  curriculum: string;
  language: string;
  subjects: string[];
}

export type PlanTier = 'starter' | 'plus' | 'pro';

export interface UserPlan {
  tier: PlanTier;
  since: number;
  renews: number;
  source: 'free' | 'test' | 'live';
  annual?: boolean;
}

export interface PlanLimits {
  tutorMsgs: number;
  quizzes: number;
  flashcardGen: number;
  notes: number;
  docs: boolean;
  analytics: 'basic' | 'advanced' | 'detailed';
  examTools: boolean;
}

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  price: number;
  currency: string;
  tagline: string;
  badge: string;
  limits: PlanLimits;
  features: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  subject: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type QuestionType = 'mcq' | 'tf' | 'short';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  answers: Array<{
    questionId: string;
    givenAnswer: string;
    isCorrect: boolean;
  }>;
  score: number;
  total: number;
  startedAt: number;
  finishedAt: number;
}

export interface Flashcard {
  id: string;
  q: string;
  a: string;
  hint?: string;
  box: number; // 1 to 5 (Leitner system)
  due: number; // timestamp
  reps: number;
  lastReviewed?: number;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  folder?: string;
  cards: Flashcard[];
  createdAt: number;
  updatedAt: number;
}

export interface NoteItem {
  id: string;
  title: string;
  subject: string;
  sourceText: string;
  sections: {
    title: string;
    summary: string;
    detailedNotes: string;
    keyPoints: string[];
    terms: Array<{ term: string; definition: string }>;
    practiceQuestions: Array<{ question: string; answer: string }>;
    checklist: string[];
  };
  createdAt: number;
}

export interface PlannerTask {
  id: string;
  title: string;
  due?: string;
  done: boolean;
  doneAt?: number;
  createdAt: number;
}

export interface ExamCountdown {
  id: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
}

export interface DayPlan {
  dayNumber: number;
  dayName: string;
  focusSubject: string;
  topic: string;
  tasks: string[];
  estimatedMinutes: number;
}

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  unlockedAt?: number;
}

export interface DailyActivity {
  minutes: number;
  tutorMsgs: number;
  quizzes: number;
  flashcards: number;
  notes: number;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  tutorMsgs: number;
  quizzes: number;
  flashcardGen: number;
  notes: number;
}
