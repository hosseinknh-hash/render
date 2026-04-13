"use client";

import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export default function DropZone({ onFile, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ACCEPTED.includes(file.type)) {
      return "Only .jpg, .png, or .webp files are accepted.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must be under ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFile(file);
    },
    [onFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          "relative flex flex-col items-center justify-center gap-3",
          "w-full min-h-[280px] rounded-2xl border-2 border-dashed",
          "transition-all duration-200 cursor-pointer select-none",
          disabled
            ? "border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-60"
            : dragging
            ? "border-neutral-800 bg-neutral-50"
            : "border-neutral-300 bg-white hover:border-neutral-500 hover:bg-neutral-50",
        ].join(" ")}
      >
        {/* Upload icon */}
        <svg
          className={`w-10 h-10 ${disabled ? "text-neutral-300" : "text-neutral-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>

        <div className="text-center px-4">
          <p className="text-sm font-medium text-neutral-700">
            Drop your kitchen image here
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            or <span className="underline underline-offset-2">browse files</span>
            {" "}— .jpg, .png, .webp up to {MAX_SIZE_MB} MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={onChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
