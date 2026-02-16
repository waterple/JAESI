import type { Question } from "@/types";
import ImageViewer from "./ImageViewer";
import ChoiceList from "./ChoiceList";
import ExplanationPanel from "./ExplanationPanel";

interface Props {
  question: Question;
  selectedAnswer: number | null;
  revealed: boolean;
  onSelect: (choice: number) => void;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  revealed,
  onSelect,
}: Props) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xs text-gray-400">
          #{question.id} · {question.day === "day1" ? "1일차" : "2일차"} Q
          {question.originalNumber}
        </span>
        {question.isOX && (
          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
            O/X
          </span>
        )}
      </div>
      <p className="text-base font-medium whitespace-pre-line leading-relaxed">
        {question.questionText}
      </p>
      <ImageViewer images={question.images} />
      <ChoiceList
        choices={question.choices}
        selectedAnswer={selectedAnswer}
        correctAnswer={question.answer}
        revealed={revealed}
        onSelect={onSelect}
      />
      <ExplanationPanel explanation={question.explanation} visible={revealed} />
    </div>
  );
}
