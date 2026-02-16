import type { Confidence } from "@/types";

interface Props {
  onSelect: (c: Confidence) => void;
}

const buttons: { key: Confidence; label: string; color: string }[] = [
  { key: "again", label: "Again", color: "bg-red-500 active:bg-red-600" },
  { key: "hard", label: "Hard", color: "bg-orange-500 active:bg-orange-600" },
  { key: "good", label: "Good", color: "bg-green-500 active:bg-green-600" },
  { key: "easy", label: "Easy", color: "bg-blue-500 active:bg-blue-600" },
];

export default function ConfidenceButtons({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 mt-4">
      {buttons.map((b) => (
        <button
          key={b.key}
          onClick={() => onSelect(b.key)}
          className={`${b.color} text-white font-medium py-3 rounded-lg text-sm min-h-[48px] transition-colors`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
