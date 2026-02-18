import { Link } from "react-router-dom";
import { useProgress } from "@/context/ProgressContext";
import { useQuestions } from "@/hooks/useQuestions";
import { getDueCards } from "@/lib/spacedRepetition";
import StatsCard from "@/components/StatsCard";
import { exportProgress, importProgress } from "@/lib/storage";
import { useRef } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function HomePage() {
  const { progress, dispatch } = useProgress();
  const { data, loading } = useQuestions();
  const fileRef = useRef<HTMLInputElement>(null);

  if (loading || !data) {
    return <LoadingSpinner />;
  }

  const { stats, wrongAnswerBook, sequentialProgress } = progress;
  const accuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.correctCount / stats.totalAttempts) * 100)
      : 0;
  const allIds = data.questions.map((q) => q.id);
  const dueCount = getDueCards(progress, allIds).length;
  const studiedCount = data.questions.filter(
    (q) => !!progress.srData[String(q.id)]
  ).length;
  const seqDay1 = sequentialProgress.day1 || 0;
  const seqDay2 = sequentialProgress.day2 || 0;
  const seqTotal = seqDay1 + seqDay2;
  const seqMax = data.meta.totalQuestions;

  const modes = [
    {
      to: "/study",
      title: "📖 암기 모드",
      desc: "문제+답+해설 한눈에 보기",
      color: "bg-teal-500",
    },
    {
      to: "/quiz/random",
      title: "🎲 랜덤 퀴즈",
      desc: "과목별/일차별 필터 + 랜덤 문제",
      color: "bg-blue-500",
    },
    {
      to: "/quiz/spaced",
      title: "🔄 간격 반복",
      desc: `복습 대기 ${dueCount}문제`,
      color: "bg-green-500",
    },
    {
      to: "/quiz/spaced?cram=1",
      title: "⚡ 벼락치기",
      desc:
        studiedCount > 0
          ? `${studiedCount}문제 전체 복습`
          : "학습 기록 없음",
      color: "bg-amber-500",
    },
    {
      to: "/quiz/sequential",
      title: "📝 순차 학습",
      desc: `${seqTotal > 0 ? `${seqTotal}/${seqMax} 진행` : "순서대로 풀기"}`,
      color: "bg-purple-500",
    },
    {
      to: "/wrong-answers",
      title: "❌ 오답노트",
      desc: `${wrongAnswerBook.length}문제`,
      color: "bg-red-500",
    },
  ];

  function handleExport() {
    const json = exportProgress();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pseudoanki_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = importProgress(reader.result as string);
        dispatch({ type: "IMPORT", data });
      } catch {
        alert("잘못된 백업 파일입니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">PseudoANKI</h1>
      <p className="text-sm text-gray-500 mb-1">21학번 총괄평가 재시험 대비</p>
      <p className="text-xs text-gray-400 mb-6">총 {data.meta.totalQuestions}문제 (1일차 {data.meta.days[0].questionCount} + 2일차 {data.meta.days[1].questionCount})</p>

      <StatsCard
        items={[
          { label: "총 풀이", value: stats.totalAttempts },
          { label: "정답률", value: `${accuracy}%` },
          { label: "연속 학습", value: `${stats.streakDays}일` },
          { label: "오답 문제", value: wrongAnswerBook.length },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        {modes.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className={`${m.color} text-white rounded-xl p-4 min-h-[100px] flex flex-col justify-between transition-transform active:scale-[0.98]`}
          >
            <span className="font-bold text-lg">{m.title}</span>
            <span className="text-sm opacity-90">{m.desc}</span>
          </Link>
        ))}
      </div>

      {stats.totalAttempts === 0 && (
        <p className="text-xs text-center text-gray-400 mb-4">
          처음이라면 암기 모드로 전체 훑어보기 → 랜덤 퀴즈로 테스트 → 오답노트 복습 순서를 추천합니다
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 min-h-[48px]"
        >
          진행상황 내보내기
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 min-h-[48px]"
        >
          진행상황 가져오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </div>
  );
}
