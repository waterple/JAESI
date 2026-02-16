import { useState, useMemo } from "react";
import { useQuestions } from "@/hooks/useQuestions";
import SubjectFilter from "@/components/SubjectFilter";
import ImageViewer from "@/components/ImageViewer";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { Question } from "@/types";

export default function StudyPage() {
  const { data, loading } = useQuestions();
  const [day, setDay] = useState("all");
  const [subject, setSubject] = useState("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jumpInput, setJumpInput] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [] as Question[];
    let qs = data.questions;
    if (day !== "all") qs = qs.filter((q) => q.day === day);
    if (subject !== "all") qs = qs.filter((q) => q.subject === subject);
    return qs;
  }, [data, day, subject]);

  const current = filtered[currentIndex] ?? null;

  function goTo(idx: number) {
    setCurrentIndex(Math.max(0, Math.min(idx, filtered.length - 1)));
    setJumpInput("");
  }

  function handleJump() {
    const num = parseInt(jumpInput);
    if (isNaN(num)) return;
    const idx = filtered.findIndex((q) => q.id === num || q.originalNumber === num);
    if (idx >= 0) goTo(idx);
  }

  if (loading || !data) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">암기 모드</h2>
      <SubjectFilter
        subjects={data.meta.subjects}
        selectedDay={day}
        selectedSubject={subject}
        onDayChange={(d) => { setDay(d); setCurrentIndex(0); }}
        onSubjectChange={(s) => { setSubject(s); setCurrentIndex(0); }}
      />

      {!current ? (
        <p className="text-center text-gray-500 py-12">문제가 없습니다.</p>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg min-h-[40px] disabled:opacity-30"
            >
              이전
            </button>
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
              {currentIndex + 1} / {filtered.length}
            </div>
            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex >= filtered.length - 1}
              className="py-2 px-4 bg-teal-500 text-white font-medium rounded-lg min-h-[40px] disabled:opacity-30"
            >
              다음
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="number"
              placeholder="문제 번호"
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

          <div className="flex items-center justify-end text-xs text-gray-400 mb-2">
            <span>
              #{current.id} · {current.day === "day1" ? "1일차" : "2일차"} Q
              {current.originalNumber}
              {current.isOX && (
                <span className="ml-1 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                  O/X
                </span>
              )}
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <p className="text-base font-medium leading-relaxed">{current.questionText}</p>
            <ImageViewer images={current.images} />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
            <h4 className="text-sm font-semibold text-gray-500 mb-2">선지</h4>
            <ol className="space-y-1">
              {current.choices.map((c, i) => (
                <li
                  key={i}
                  className={`text-sm py-1 ${
                    i + 1 === current.answer ? "text-green-700 font-bold" : "text-gray-700"
                  }`}
                >
                  <span className="mr-2">{i + 1}.</span>
                  {c}
                  {i + 1 === current.answer && <span className="ml-2 text-green-600">&#10003;</span>}
                </li>
              ))}
            </ol>
          </div>

          {current.explanation && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
              <h4 className="font-semibold text-amber-800 mb-1">해설</h4>
              <p className="text-sm text-amber-900">{current.explanation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
