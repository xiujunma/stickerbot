"use client";

interface ImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export default function ImageDisplay({
  imageUrl,
  isLoading,
  error,
}: ImageDisplayProps) {
  if (error) {
    return (
      <div className="w-full max-w-xs aspect-square bg-candy-pink/10 rounded-3xl border-4 border-candy-pink flex flex-col items-center justify-center p-4 gap-2">
        <span className="text-4xl">😢</span>
        <p className="text-candy-pink text-center font-bold">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-xs aspect-square bg-white/70 rounded-3xl border-4 border-candy-purple animate-rainbow-border flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-candy-blue/30 border-t-candy-purple rounded-full animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl animate-sparkle">
            ✨
          </span>
        </div>
        <p className="text-candy-purple font-bold text-lg">
          Creating magic...
        </p>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="w-full max-w-xs">
        <div className="aspect-square bg-white rounded-3xl border-4 border-candy-green overflow-hidden shadow-candy-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Generated sticker"
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-center text-candy-green mt-3 text-lg font-bold flex items-center justify-center gap-2">
          <span className="animate-bounce-gentle">🎉</span>
          Ready to print!
          <span className="animate-bounce-gentle" style={{ animationDelay: "0.2s" }}>🎉</span>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs aspect-square bg-white/50 rounded-3xl border-4 border-dashed border-candy-purple/40 flex flex-col items-center justify-center gap-3 p-4">
      <span className="text-5xl animate-bounce-gentle">🎨</span>
      <p className="text-candy-purple/70 text-center font-semibold text-lg">
        Tell me what to draw!
      </p>
    </div>
  );
}
