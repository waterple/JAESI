import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from "react";
import type { Progress, HistoryEntry } from "@/types";
import { loadProgress, saveProgress, saveProgressImmediate } from "@/lib/storage";
import { todayStr } from "@/lib/utils";

type Action =
  | { type: "RECORD_ANSWER"; questionId: number; correct: boolean }
  | { type: "UPDATE_SR"; questionId: number; card: Progress["srData"][string] }
  | { type: "SET_SEQUENTIAL"; day: string; index: number }
  | { type: "IMPORT"; data: Progress };

function reducer(state: Progress, action: Action): Progress {
  switch (action.type) {
    case "RECORD_ANSWER": {
      const entry: HistoryEntry = {
        questionId: action.questionId,
        correct: action.correct,
        timestamp: Date.now(),
      };
      const today = todayStr();
      const stats = { ...state.stats };
      stats.totalAttempts++;
      if (action.correct) stats.correctCount++;

      if (stats.lastStudyDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        stats.streakDays = stats.lastStudyDate === yStr ? stats.streakDays + 1 : 1;
        stats.lastStudyDate = today;
      }

      const wrongAnswerBook = action.correct
        ? state.wrongAnswerBook.filter((id) => id !== action.questionId)
        : state.wrongAnswerBook.includes(action.questionId)
          ? state.wrongAnswerBook
          : [...state.wrongAnswerBook, action.questionId];

      return { ...state, history: [...state.history, entry], stats, wrongAnswerBook };
    }
    case "UPDATE_SR":
      return {
        ...state,
        srData: { ...state.srData, [String(action.questionId)]: action.card },
      };
    case "SET_SEQUENTIAL":
      return {
        ...state,
        sequentialProgress: { ...state.sequentialProgress, [action.day]: action.index },
      };
    case "IMPORT":
      return action.data;
    default:
      return state;
  }
}

const ProgressContext = createContext<{
  progress: Progress;
  dispatch: Dispatch<Action>;
} | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, dispatch] = useReducer(reducer, null, loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    const handleUnload = () => saveProgressImmediate(progress);
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [progress]);

  return (
    <ProgressContext.Provider value={{ progress, dispatch }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be inside ProgressProvider");
  return ctx;
}
