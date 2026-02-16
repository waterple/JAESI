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
            className="max-w-full sm:max-w-[300px] rounded border border-gray-200 cursor-pointer"
            onClick={() => setExpanded(src)}
          />
        ))}
      </div>
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpanded(null)}
        >
          <img
            src={`${import.meta.env.BASE_URL}data/${expanded}`}
            alt="확대 이미지"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}
