import { useState, useMemo, useCallback } from "react";
import { useQuestions } from "@/hooks/useQuestions";
import { useProgress } from "@/context/ProgressContext";
import { useQuiz } from "@/hooks/useQuiz";
import { shuffle } from "@/lib/utils";
import QuestionCard from "@/components/QuestionCard";
import ProgressBar from "@/components/ProgressBar";
import type { Question } from "@/types";

export default function WrongAnswerPage() {
  const { data, loading } = useQuestions();
  const { progress, dispatch } = useProgress();
  const [started, setStarted] = useState(false);

  const wrongQuestions = useMemo(() => {
    if (!data) return [] as Question[];
    return progress.wrongAnswerBook
      .map((id) => data.questions.find((q) => q.id === id))
      .filter((q): q is Question => !!q);
  }, [data, progress.wrongAnswerBook]);

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const quiz = useQuiz(quizQuestions);

  const startReview = useCallback(() => {
    const selected = shuffle(wrongQuestions);
    setQuizQuestions(selected);
    quiz.reset(selected);
    setStarted(true);
  }, [wrongQuestions, quiz]);

  const handleReveal = useCallback(() => {
    quiz.reveal();
    if (quiz.current && quiz.selectedAnswer !== null) {
      dispatch({
        type: "RECORD_ANSWER",
        questionId: quiz.current.id,
        correct: quiz.selectedAnswer === quiz.current.answer,
      });
    }
  }, [quiz, dispatch]);

  if (loading || !data) {
    return <div className="text-center py-12 text-gray-400">로딩 중...</div>;
  }

  if (wrongQuestions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold mb-2">오답노트</h2>
        <p className="text-gray-500">틀린 문제가 없습니다!</p>
      </div>
    );
  }

  if (!started) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">오답노트</h2>
        <p className="text-gray-500 mb-2">{wrongQuestions.length}문제가 오답 목록에 있습니다.</p>
        <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
          {wrongQuestions.map((q) => (
            <div
              key={q.id}
              className="text-sm p-2 bg-white border border-gray-200 rounded"
            >
              <span className="text-gray-400 mr-2">#{q.id}</span>
              {q.questionText.slice(0, 60)}...
            </div>
          ))}
        </div>
        <button
          onClick={startReview}
          className="w-full py-3 bg-red-500 text-white font-medium rounded-lg min-h-[48px]"
        >
          오답 복습 시작
        </button>
      </div>
    );
  }

  if (quiz.finished) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">복습 완료!</h2>
        <p className="text-gray-500 mb-6">
          맞힌 문제는 오답노트에서 자동 제거됩니다.
        </p>
        <button
          onClick={() => setStarted(false)}
          className="px-6 py-3 bg-red-500 text-white rounded-lg min-h-[48px]"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">오답 복습</h2>
      <ProgressBar current={quiz.currentIndex + 1} total={quiz.total} />
      <QuestionCard
        question={quiz.current!}
        selectedAnswer={quiz.selectedAnswer}
        revealed={quiz.revealed}
        onSelect={quiz.selectAnswer}
      />
      <div className="mt-4 flex gap-2">
        {!quiz.revealed ? (
          <button
            onClick={handleReveal}
            disabled={quiz.selectedAnswer === null}
            className="flex-1 py-3 bg-red-500 text-white font-medium rounded-lg min-h-[48px] disabled:opacity-50"
          >
            정답 확인
          </button>
        ) : (
          <button
            onClick={quiz.next}
            className="flex-1 py-3 bg-red-500 text-white font-medium rounded-lg min-h-[48px]"
          >
            다음 문제
          </button>
        )}
      </div>
    </div>
  );
}
