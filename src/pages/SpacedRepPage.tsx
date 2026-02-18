import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuestions } from "@/hooks/useQuestions";
import { useProgress } from "@/context/ProgressContext";
import {
  getDueCards,
  getNewCards,
  getCramCards,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCramMode, setIsCramMode] = useState(
    searchParams.get("cram") === "1"
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionIndex, setSessionIndex] = useState(0);

  const [queue, setQueue] = useState<Question[]>([]);

  useEffect(() => {
    if (!data) return;
    const allIds = data.questions.map((q) => q.id);

    let combined: number[];
    if (isCramMode) {
      combined = getCramCards(progress, allIds);
    } else {
      const dueIds = getDueCards(progress, allIds);
      const newIds = getNewCards(progress, allIds, MAX_NEW);
      combined = [...dueIds, ...newIds];
    }

    setQueue(combined.map((id) => data.questions.find((q) => q.id === id)!));
    setSessionIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isCramMode]);

  const current = queue[sessionIndex] ?? null;

  const handleReveal = useCallback(() => {
    if (selectedAnswer !== null) setRevealed(true);
  }, [selectedAnswer]);

  const handleConfidence = useCallback(
    (c: Confidence) => {
      if (!current) return;

      if (!isCramMode) {
        const card = getOrCreateCard(progress, current.id);
        const updated = reviewCard(card, c);
        dispatch({ type: "UPDATE_SR", questionId: current.id, card: updated });
      }

      dispatch({
        type: "RECORD_ANSWER",
        questionId: current.id,
        correct: selectedAnswer === current.answer,
      });

      setSelectedAnswer(null);
      setRevealed(false);
      setSessionIndex((i) => i + 1);
    },
    [current, progress, dispatch, selectedAnswer, isCramMode]
  );

  const toggleCramMode = useCallback(() => {
    setIsCramMode((prev) => {
      const next = !prev;
      if (next) {
        setSearchParams({ cram: "1" });
      } else {
        setSearchParams({});
      }
      return next;
    });
  }, [setSearchParams]);

  if (loading || !data) {
    return <LoadingSpinner />;
  }

  if (queue.length === 0 || !current) {
    const studiedCount = !isCramMode
      ? data.questions.filter((q) => !!progress.srData[String(q.id)]).length
      : 0;

    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">
          {isCramMode ? "벼락치기 완료!" : "복습 완료!"}
        </h2>
        <p className="text-gray-500 mb-4">
          {isCramMode
            ? "모든 학습 카드를 복습했습니다."
            : "오늘 복습할 카드가 없습니다."}
        </p>
        {!isCramMode && studiedCount > 0 && (
          <button
            onClick={toggleCramMode}
            className="px-6 py-3 bg-amber-500 text-white font-medium rounded-lg min-h-[48px]"
          >
            벼락치기 모드로 {studiedCount}문제 복습
          </button>
        )}
        {isCramMode && (
          <button
            onClick={toggleCramMode}
            className="px-6 py-3 bg-green-500 text-white font-medium rounded-lg min-h-[48px]"
          >
            일반 모드로 돌아가기
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold">
          {isCramMode ? "벼락치기 모드" : "간격 반복"}
        </h2>
        <button
          onClick={toggleCramMode}
          className={`px-3 py-1 text-sm rounded-full font-medium min-h-[36px] ${
            isCramMode
              ? "bg-amber-100 text-amber-700 border border-amber-300"
              : "bg-gray-100 text-gray-600 border border-gray-300"
          }`}
        >
          {isCramMode ? "일반 모드로" : "벼락치기"}
        </button>
      </div>
      {isCramMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-sm text-amber-800">
          모든 학습 카드를 약한 순서로 복습합니다. SM-2 일정은 변경되지 않습니다.
        </div>
      )}
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
            className={`w-full py-3 text-white font-medium rounded-lg min-h-[48px] disabled:opacity-50 ${
              isCramMode ? "bg-amber-500" : "bg-green-500"
            }`}
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
