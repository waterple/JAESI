import type { SubjectMeta } from "@/types";

interface Props {
  subjects: SubjectMeta[];
  selectedDay: string;
  selectedSubject: string;
  onDayChange: (day: string) => void;
  onSubjectChange: (subject: string) => void;
}

export default function SubjectFilter({
  subjects,
  selectedDay,
  selectedSubject,
  onDayChange,
  onSubjectChange,
}: Props) {
  const filteredSubjects =
    selectedDay === "all" ? subjects : subjects.filter((s) => s.day === selectedDay);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <select
        value={selectedDay}
        onChange={(e) => {
          onDayChange(e.target.value);
          onSubjectChange("all");
        }}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[48px]"
      >
        <option value="all">전체 일차</option>
        <option value="day1">1일차</option>
        <option value="day2">2일차</option>
      </select>
      <select
        value={selectedSubject}
        onChange={(e) => onSubjectChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[48px] flex-1"
      >
        <option value="all">전체 과목</option>
        {filteredSubjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
