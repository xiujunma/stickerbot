"use client";

import { useState, useCallback } from "react";
import MicButton from "@/components/MicButton";
import ImageDisplay from "@/components/ImageDisplay";
import PrinterControls from "@/components/PrinterControls";

const DEFAULT_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 384">
  <rect width="384" height="384" fill="#fff"/>
  <!-- Cat outline -->
  <path d="M192 340 C80 340 40 260 40 200 C40 120 80 80 100 60 L100 20 L140 80 C160 70 180 65 192 65 C204 65 224 70 244 80 L284 20 L284 60 C304 80 344 120 344 200 C344 260 304 340 192 340 Z" fill="#000" stroke="#000" stroke-width="4"/>
  <!-- Left eye -->
  <ellipse cx="130" cy="180" rx="28" ry="35" fill="#fff"/>
  <ellipse cx="138" cy="185" rx="14" ry="20" fill="#000"/>
  <!-- Right eye -->
  <ellipse cx="254" cy="180" rx="28" ry="35" fill="#fff"/>
  <ellipse cx="246" cy="185" rx="14" ry="20" fill="#000"/>
  <!-- Nose -->
  <path d="M192 230 L175 255 L209 255 Z" fill="#fff"/>
  <!-- Mouth -->
  <path d="M160 275 Q192 310 224 275" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
  <!-- Whiskers -->
  <g stroke="#fff" stroke-width="4" stroke-linecap="round">
    <line x1="30" y1="200" x2="110" y2="220"/>
    <line x1="30" y1="230" x2="110" y2="240"/>
    <line x1="30" y1="260" x2="110" y2="255"/>
    <line x1="354" y1="200" x2="274" y2="220"/>
    <line x1="354" y1="230" x2="274" y2="240"/>
    <line x1="354" y1="260" x2="274" y2="255"/>
  </g>
</svg>
`)}`;

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(DEFAULT_IMAGE);
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
