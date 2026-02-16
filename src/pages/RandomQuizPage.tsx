import { useState, useCallback, useMemo } from "react";
import { useQuestions } from "@/hooks/useQuestions";
import { useQuiz } from "@/hooks/useQuiz";
import { useProgress } from "@/context/ProgressContext";
import { shuffle } from "@/lib/utils";
import QuestionCard from "@/components/QuestionCard";
import ProgressBar from "@/components/ProgressBar";
import SubjectFilter from "@/components/SubjectFilter";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { Question } from "@/types";

const SIZE_OPTIONS = [
  { label: "20문제", value: 20 },
  { label: "50문제", value: 50 },
  { label: "전체", value: 0 },
];

export default function RandomQuizPage() {
  const { data, loading } = useQuestions();
  const { dispatch } = useProgress();
  const [day, setDay] = useState("all");
  const [subject, setSubject] = useState("all");
  const [quizSize, setQuizSize] = useState(0); // 기본: 전체
  const [started, setStarted] = useState(false);

  const filtered = useMemo(() => {
    if (!data) return [];
    let qs = data.questions;
    if (day !== "all") qs = qs.filter((q) => q.day === day);
    if (subject !== "all") qs = qs.filter((q) => q.subject === subject);
    return qs;
  }, [data, day, subject]);

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const quiz = useQuiz(quizQuestions);

  const startQuiz = useCallback(() => {
    const shuffled = shuffle(filtered);
    const selected = quizSize > 0 ? shuffled.slice(0, quizSize) : shuffled;
    setQuizQuestions(selected);
    quiz.reset(selected);
    setStarted(true);
  }, [filtered, quizSize, quiz]);

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
    return <LoadingSpinner />;
  }

  if (!started) {
    const count = quizSize > 0 ? Math.min(quizSize, filtered.length) : filtered.length;
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">랜덤 퀴즈</h2>
        <SubjectFilter
          subjects={data.meta.subjects}
          selectedDay={day}
          selectedSubject={subject}
          onDayChange={setDay}
          onSubjectChange={setSubject}
        />
        <div className="flex gap-2 mb-4">
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setQuizSize(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium min-h-[40px] ${
                quizSize === opt.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mb-4">{count}문제 출제</p>
        <button
          onClick={startQuiz}
          disabled={filtered.length === 0}
          className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg min-h-[48px] disabled:opacity-50"
        >
          시작
        </button>
      </div>
    );
  }

  if (quiz.finished) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">완료!</h2>
        <p className="text-gray-500 mb-6">{quiz.total}문제를 모두 풀었습니다.</p>
        <button
          onClick={() => setStarted(false)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg min-h-[48px]"
        >
          다시 시작
        </button>
      </div>
    );
  }

  return (
    <div>
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
            className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg min-h-[48px] disabled:opacity-50"
          >
            정답 확인
          </button>
        ) : (
          <button
            onClick={quiz.next}
            className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-lg min-h-[48px]"
          >
            다음 문제
          </button>
        )}
      </div>
    </div>
  );
}
