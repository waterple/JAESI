import { useState } from "react";

interface Props {
  images: string[];
}

export default function ImageViewer({ images }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 my-3">
        {images.map((src) => (
          <img
            key={src}
            src={`${import.meta.env.BASE_URL}data/${src}`}
            alt="문제 이미지"
            loading="lazy"
            className="max-w-full sm:max-w-[500px] rounded border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setExpanded(src)}
          />
        ))}
      </div>
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
          onClick={() => setExpanded(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50"
            onClick={() => setExpanded(null)}
            aria-label="닫기"
          >
            &times;
          </button>
          <img
            src={`${import.meta.env.BASE_URL}data/${expanded}`}
            alt="확대 이미지"
            className="max-w-[95vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-white/60 text-sm mt-2">바깥을 탭하여 닫기</p>
        </div>
      )}
    </>
  );
}
