"use client";

import Image from "next/image";

interface ResultViewProps {
  originalUrl: string;
  renderedUrl: string;
  onReset: () => void;
}

export default function ResultView({
  originalUrl,
  renderedUrl,
  onReset,
}: ResultViewProps) {
  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/download?url=${encodeURIComponent(renderedUrl)}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `kitchen-render-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(renderedUrl, "_blank");
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-8">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400">
            Original Design
          </p>
          <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-sm border border-neutral-100">
            <Image
              src={originalUrl}
              alt="Original kitchen design"
              fill
              className="object-contain bg-neutral-50"
            />
          </div>
        </div>

        {/* Rendered */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-neutral-400">
            AI Render
          </p>
          <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md border border-neutral-100">
            <Image
              src={renderedUrl}
              alt="AI photorealistic kitchen render"
              fill
              className="object-contain bg-neutral-50"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Render
        </button>

        <button
          onClick={onReset}
          className="px-6 py-3 border border-neutral-200 text-neutral-600 text-sm font-medium rounded-xl hover:border-neutral-400 hover:text-neutral-900 transition-colors"
        >
          Try Another
        </button>
      </div>
    </div>
  );
}
