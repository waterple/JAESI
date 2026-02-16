import type { QuestionsData } from "@/types";

let cached: QuestionsData | null = null;

export async function loadQuestions(): Promise<QuestionsData> {
  if (cached) return cached;
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}data/questions.json`);
  if (!res.ok) throw new Error("Failed to load questions.json");
  cached = (await res.json()) as QuestionsData;
  return cached;
}
