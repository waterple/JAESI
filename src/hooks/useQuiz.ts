import { useState, useCallback } from "react";
import type { Question } from "@/types";

interface QuizState {
  questions: Question[];
  currentIndex: number;
  selectedAnswer: number | null;
  revealed: boolean;
  finished: boolean;
}

export function useQuiz(questions: Question[]) {
  const [state, setState] = useState<QuizState>({
    questions,
    currentIndex: 0,
    selectedAnswer: null,
    revealed: false,
    finished: false,
  });

  const current = state.questions[state.currentIndex] ?? null;
  const isCorrect =
    state.selectedAnswer !== null && current
      ? state.selectedAnswer === current.answer
      : null;

  const selectAnswer = useCallback((choice: number) => {
    setState((s) => (s.revealed ? s : { ...s, selectedAnswer: choice }));
  }, []);

  const reveal = useCallback(() => {
    setState((s) => (s.selectedAnswer === null ? s : { ...s, revealed: true }));
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      const nextIdx = s.currentIndex + 1;
      if (nextIdx >= s.questions.length) return { ...s, finished: true };
      return { ...s, currentIndex: nextIdx, selectedAnswer: null, revealed: false };
    });
  }, []);

  const reset = useCallback((newQuestions: Question[]) => {
    setState({
      questions: newQuestions,
      currentIndex: 0,
      selectedAnswer: null,
      revealed: false,
      finished: false,
    });
  }, []);

  return {
    current,
    currentIndex: state.currentIndex,
    total: state.questions.length,
    selectedAnswer: state.selectedAnswer,
    revealed: state.revealed,
    finished: state.finished,
    isCorrect,
    selectAnswer,
    reveal,
    next,
    reset,
  };
}
