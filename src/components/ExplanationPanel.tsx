import { formatLabText } from "@/lib/utils";

interface Props {
  explanation: string;
  visible: boolean;
}

export default function ExplanationPanel({ explanation, visible }: Props) {
  if (!visible || !explanation) return null;

  return (
    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <h4 className="font-semibold text-amber-800 mb-1">해설</h4>
      <p className="text-sm text-amber-900 whitespace-pre-line">{formatLabText(explanation)}</p>
    </div>
  );
}
