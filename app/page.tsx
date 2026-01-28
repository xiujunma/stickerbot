"use client";

import { useState, useCallback } from "react";
import MicButton from "@/components/MicButton";
import ImageDisplay from "@/components/ImageDisplay";
import PrinterControls from "@/components/PrinterControls";

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  const handleTranscript = useCallback(async (transcript: string) => {
    setIsGenerating(true);
    setError(null);
    setLastPrompt(transcript);
    setImageUrl(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: transcript }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-4xl font-extrabold text-gradient-rainbow animate-bounce-gentle">
        StickerBot
      </h1>
      <p className="text-candy-purple font-semibold text-lg -mt-4">
        Make Magic Stickers!
      </p>

      <ImageDisplay
        imageUrl={imageUrl}
        isLoading={isGenerating}
        error={error}
      />

      {lastPrompt && !isGenerating && (
        <p className="text-candy-purple/70 text-sm text-center max-w-xs font-medium bg-white/50 px-4 py-2 rounded-full">
          &ldquo;{lastPrompt}&rdquo;
        </p>
      )}

      <MicButton onTranscript={handleTranscript} disabled={isGenerating} />

      <div className="w-full max-w-sm bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-candy">
        <PrinterControls imageUrl={imageUrl} />
      </div>
    </main>
  );
}
