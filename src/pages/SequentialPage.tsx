import { useState, useMemo, useCallback } from "react";
import { useQuestions } from "@/hooks/useQuestions";
import { useProgress } from "@/context/ProgressContext";
import QuestionCard from "@/components/QuestionCard";
import ProgressBar from "@/components/ProgressBar";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SequentialPage() {
  const { data, loading } = useQuestions();
  const { progress, dispatch } = useProgress();
  const [day, setDay] = useState<"day1" | "day2">("day1");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [jumpInput, setJumpInput] = useState("");

  const questions = useMemo(
    () => (data ? data.questions.filter((q) => q.day === day) : []),
    [data, day]
  );

  const currentIndex = progress.sequentialProgress[day] ?? 0;
  const current = questions[currentIndex] ?? null;

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, questions.length - 1));
      dispatch({ type: "SET_SEQUENTIAL", day, index: clamped });
      setSelectedAnswer(null);
      setRevealed(false);
    },
    [day, questions.length, dispatch]
  );

  const handleReveal = useCallback(() => {
    if (selectedAnswer === null || !current) return;
    setRevealed(true);
    dispatch({
      type: "RECORD_ANSWER",
      questionId: current.id,
      correct: selectedAnswer === current.answer,
    });
  }, [selectedAnswer, current, dispatch]);

  const handleJump = useCallback(() => {
    const num = parseInt(jumpInput);
    if (isNaN(num)) return;
    const idx = questions.findIndex((q) => q.originalNumber === num);
    if (idx >= 0) goTo(idx);
    setJumpInput("");
  }, [jumpInput, questions, goTo]);

  const handleReset = useCallback(() => {
    goTo(0);
  }, [goTo]);

  if (loading || !data) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">순차 학습</h2>
        <div className="flex gap-2">
          {(["day1", "day2"] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDay(d);
                setSelectedAnswer(null);
                setRevealed(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium min-h-[40px] ${
                day === d
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {d === "day1" ? "1일차" : "2일차"}
            </button>
          ))}
        </div>
      </div>

      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <div className="flex gap-2 mb-4">
        <input
          type="number"
          placeholder="문제 번호 이동"
          value={jumpInput}
          onChange={(e) => setJumpInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJump()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[40px]"
        />
        <button
          onClick={handleJump}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm min-h-[40px]"
        >
          이동
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg min-h-[40px] disabled:opacity-30"
        >
          이전
        </button>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          {currentIndex + 1} / {questions.length}
        </div>
        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex >= questions.length - 1}
          className="py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg min-h-[40px] disabled:opacity-30"
        >
          다음
        </button>
      </div>

      {!current || currentIndex >= questions.length ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-bold mb-2">모두 완료!</h3>
          <p className="text-gray-500 mb-4">
            {day === "day1" ? "1일차" : "2일차"} 전체 문제를 풀었습니다.
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg min-h-[48px]"
          >
            처음부터 다시
          </button>
        </div>
      ) : (
        <>
          <QuestionCard
            question={current}
            selectedAnswer={selectedAnswer}
            revealed={revealed}
            onSelect={(c) => !revealed && setSelectedAnswer(c)}
          />
          <div className="mt-4">
            {!revealed ? (
              <button
                onClick={handleReveal}
                disabled={selectedAnswer === null}
                className="w-full py-3 bg-purple-500 text-white font-medium rounded-lg min-h-[48px] disabled:opacity-50"
              >
                정답 확인
              </button>
            ) : (
              <button
                onClick={() => goTo(currentIndex + 1)}
                className="w-full py-3 bg-purple-500 text-white font-medium rounded-lg min-h-[48px]"
              >
                {currentIndex + 1 < questions.length ? "다음 문제" : "완료"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
