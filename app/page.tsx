"use client";

import { useState, useCallback } from "react";
import DropZone from "@/components/DropZone";
import ResultView from "@/components/ResultView";

type AppState = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    // Create a local preview URL
    const preview = URL.createObjectURL(file);
    setOriginalUrl(preview);
    setState("loading");
    setErrorMessage(null);

    try {
      const form = new FormData();
      form.append("image", file);

      const res = await fetch("/api/render", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Generation failed.");
      }

      setRenderedUrl(json.url);
      setState("done");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setState("error");
    }
  }, []);

  const reset = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setRenderedUrl(null);
    setErrorMessage(null);
    setState("idle");
  }, [originalUrl]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-neutral-100 py-6 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex items-baseline gap-3">
          <span className="text-lg font-semibold tracking-tight text-neutral-900">
            Kitchen Render AI
          </span>
          <span className="hidden sm:inline text-sm text-neutral-400">
            Upload your design. See it in real life.
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-12 py-12 flex flex-col items-center">
        {state === "idle" && (
          <div className="w-full max-w-xl flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
                Turn your design into reality
              </h1>
              <p className="mt-3 text-neutral-500 text-base leading-relaxed max-w-md mx-auto">
                Upload a kitchen screenshot from Winner Design or a photo.
                Our AI will generate a photorealistic interior render.
              </p>
            </div>
            <DropZone onFile={handleFile} />
          </div>
        )}

        {state === "loading" && (
          <div className="flex flex-col items-center gap-8 w-full max-w-xl">
            {/* Preview of uploaded image while loading */}
            {originalUrl && (
              <div className="w-full max-w-sm aspect-square rounded-xl overflow-hidden border border-neutral-100 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalUrl}
                  alt="Uploaded kitchen"
                  className="w-full h-full object-contain bg-neutral-50"
                />
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              {/* Spinner */}
              <div className="w-10 h-10 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-700">
                  Generating your render…
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Analysing design with GPT-4o, then rendering with DALL-E 3.
                  This takes 20–40 seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        {state === "done" && originalUrl && renderedUrl && (
          <ResultView
            originalUrl={originalUrl}
            renderedUrl={renderedUrl}
            onReset={reset}
          />
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-6 max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-800">
                Something went wrong
              </p>
              <p className="mt-1 text-xs text-neutral-500">{errorMessage}</p>
            </div>
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-100 py-5 px-6">
        <p className="text-center text-xs text-neutral-300">
          Powered by GPT-4o + DALL-E 3
        </p>
      </footer>
    </div>
  );
}
