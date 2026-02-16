import type { Progress } from "@/types";

const STORAGE_KEY = "pseudoanki_progress";

const defaultProgress: Progress = {
  version: 1,
  srData: {},
  history: [],
  wrongAnswerBook: [],
  sequentialProgress: { day1: 0, day2: 0 },
  stats: {
    totalAttempts: 0,
    correctCount: 0,
    streakDays: 0,
    lastStudyDate: "",
  },
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProgress };
    return JSON.parse(raw) as Progress;
  } catch {
    return { ...defaultProgress };
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveProgress(progress: Progress): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, 500);
}

export function saveProgressImmediate(progress: Progress): void {
  if (saveTimer) clearTimeout(saveTimer);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function exportProgress(): string {
  return localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultProgress);
}

export function importProgress(json: string): Progress {
  const data = JSON.parse(json) as Progress;
  if (data.version !== 1) throw new Error("Unsupported version");
  localStorage.setItem(STORAGE_KEY, json);
  return data;
}
