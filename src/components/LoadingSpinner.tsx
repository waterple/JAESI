export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-sm text-gray-400">문제를 불러오는 중...</span>
    </div>
  );
}
