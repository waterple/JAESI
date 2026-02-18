import { useState, useEffect, useCallback } from "react";
import { useQuestions } from "@/hooks/useQuestions";
import { useProgress } from "@/context/ProgressContext";
import {
  getDueCards,
  getNewCards,
  getOrCreateCard,
  reviewCard,
} from "@/lib/spacedRepetition";
import QuestionCard from "@/components/QuestionCard";
import ConfidenceButtons from "@/components/ConfidenceButtons";
import ProgressBar from "@/components/ProgressBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { Confidence, Question } from "@/types";

const MAX_NEW = Infinity;

export default function SpacedRepPage() {
  const { data, loading } = useQuestions();
  const { progress, dispatch } = useProgress();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionIndex, setSessionIndex] = useState(0);

  const [queue, setQueue] = useState<Question[]>([]);

  useEffect(() => {
    if (!data) return;
    const allIds = data.questions.map((q) => q.id);
    const dueIds = getDueCards(progress, allIds);
    const newIds = getNewCards(progress, allIds, MAX_NEW);
    const combined = [...dueIds, ...newIds];
    setQueue(combined.map((id) => data.questions.find((q) => q.id === id)!));
    setSessionIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const current = queue[sessionIndex] ?? null;

  const handleReveal = useCallback(() => {
    if (selectedAnswer !== null) setRevealed(true);
  }, [selectedAnswer]);

  const handleConfidence = useCallback(
    (c: Confidence) => {
      if (!current) return;
      const card = getOrCreateCard(progress, current.id);
      const updated = reviewCard(card, c);
      dispatch({ type: "UPDATE_SR", questionId: current.id, card: updated });
      dispatch({
        type: "RECORD_ANSWER",
        questionId: current.id,
        correct: selectedAnswer === current.answer,
      });

      setSelectedAnswer(null);
      setRevealed(false);
      setSessionIndex((i) => i + 1);
    },
    [current, progress, dispatch, selectedAnswer]
  );

  if (loading || !data) {
    return <LoadingSpinner />;
  }

  if (queue.length === 0 || !current) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">복습 완료!</h2>
        <p className="text-gray-500">오늘 복습할 카드가 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">간격 반복</h2>
      <ProgressBar current={sessionIndex + 1} total={queue.length} />
      <QuestionCard
        question={current}
        selectedAnswer={selectedAnswer}
        revealed={revealed}
        onSelect={setSelectedAnswer}
      />
      <div className="mt-4">
        {!revealed ? (
          <button
            onClick={handleReveal}
            disabled={selectedAnswer === null}
            className="w-full py-3 bg-green-500 text-white font-medium rounded-lg min-h-[48px] disabled:opacity-50"
          >
            정답 확인
          </button>
        ) : (
          <ConfidenceButtons onSelect={handleConfidence} />
        )}
      </div>
    </div>
  );
}
