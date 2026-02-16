interface StatItem {
  label: string;
  value: string | number;
}

interface Props {
  items: StatItem[];
}

export default function StatsCard({ items }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-lg border border-gray-200 p-4 text-center"
        >
          <div className="text-2xl font-bold text-blue-600">{item.value}</div>
          <div className="text-xs text-gray-500 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
