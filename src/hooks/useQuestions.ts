import { useState, useEffect } from "react";
import type { QuestionsData, Question } from "@/types";
import { loadQuestions } from "@/data/questionLoader";

export function useQuestions() {
  const [data, setData] = useState<QuestionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

export function filterBySubject(questions: Question[], subject: string): Question[] {
  return questions.filter((q) => q.subject === subject);
}

export function filterByDay(questions: Question[], day: string): Question[] {
  return questions.filter((q) => q.day === day);
}
