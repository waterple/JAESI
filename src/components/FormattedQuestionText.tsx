import { formatLabText } from "@/lib/utils";

interface Props {
  text: string;
}

export default function FormattedQuestionText({ text }: Props) {
  const formatted = formatLabText(text);
  const newlineIdx = formatted.indexOf("\n");

  // 검사 결과가 없으면 일반 텍스트로 렌더
  if (newlineIdx === -1) {
    return (
      <p className="text-base font-medium leading-relaxed">{formatted}</p>
    );
  }

  const questionPart = formatted.substring(0, newlineIdx);
  const labPart = formatted.substring(newlineIdx + 1);
  const labLines = labPart.split("\n").filter((l) => l.trim());

  return (
    <div>
      <p className="text-base font-medium leading-relaxed">{questionPart}</p>
      {labLines.length > 0 && (
        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden text-sm">
          {labLines.map((line, i) => {
            const trimmed = line.trim();
            const isHeader = /^\[.+\]$/.test(trimmed);
            return (
              <div
                key={i}
                className={`px-4 py-1.5 ${isHeader ? "bg-slate-100 font-semibold text-slate-600" : ""}`}
              >
                {trimmed}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
