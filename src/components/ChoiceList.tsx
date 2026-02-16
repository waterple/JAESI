interface Props {
  choices: string[];
  selectedAnswer: number | null;
  correctAnswer: number;
  revealed: boolean;
  onSelect: (choice: number) => void;
}

export default function ChoiceList({
  choices,
  selectedAnswer,
  correctAnswer,
  revealed,
  onSelect,
}: Props) {
  return (
    <div className="space-y-3 my-4">
      {choices.map((text, i) => {
        const num = i + 1;
        const isSelected = selectedAnswer === num;
        const isCorrect = num === correctAnswer;

        let cls = "border-gray-200 bg-white";
        if (revealed) {
          if (isCorrect) cls = "border-green-500 bg-green-50";
          else if (isSelected) cls = "border-red-500 bg-red-50";
        } else if (isSelected) {
          cls = "border-blue-500 bg-blue-50";
        }

        return (
          <button
            key={num}
            onClick={() => onSelect(num)}
            disabled={revealed}
            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors min-h-[48px] ${cls} ${
              revealed ? "cursor-default" : "active:bg-gray-100"
            }`}
          >
            <span className="font-semibold mr-2">{num}.</span>
            {text}
          </button>
        );
      })}
    </div>
  );
}
