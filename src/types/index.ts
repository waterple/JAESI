export interface Question {
  id: number;
  day: string;
  originalNumber: number;
  subject: string;
  questionText: string;
  images: string[];
  choices: string[];
  answer: number; // 1-indexed
  explanation: string;
  isOX: boolean;
}

export interface DayMeta {
  id: string;
  name: string;
  questionCount: number;
}

export interface SubjectMeta {
  id: string;
  name: string;
  day: string;
  questionRange: [number, number];
}

export interface QuestionsData {
  meta: {
    totalQuestions: number;
    days: DayMeta[];
    subjects: SubjectMeta[];
  };
  questions: Question[];
}

export interface SRCard {
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: string; // ISO date string
}

export interface HistoryEntry {
  questionId: number;
  correct: boolean;
  timestamp: number;
}

export interface Progress {
  version: number;
  srData: Record<string, SRCard>;
  history: HistoryEntry[];
  wrongAnswerBook: number[];
  sequentialProgress: Record<string, number>;
  stats: {
    totalAttempts: number;
    correctCount: number;
    streakDays: number;
    lastStudyDate: string;
  };
}

export type Confidence = "again" | "hard" | "good" | "easy";

export const CONFIDENCE_MAP: Record<Confidence, number> = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
};
