"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { SpeechRecorder } from "@/lib/speech";

interface MicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function MicButton({ onTranscript, disabled }: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recorderRef = useRef<SpeechRecorder | null>(null);

  useEffect(() => {
    recorderRef.current = new SpeechRecorder();
    setIsSupported(recorderRef.current.isSupported());
  }, []);

  const startRecording = useCallback(() => {
    if (!recorderRef.current || disabled) return;

    setIsRecording(true);
    setCurrentTranscript("");

    recorderRef.current.start(
      (text) => {
        setCurrentTranscript(text);
      },
      (error) => {
        console.error("Speech recognition error:", error);
        setIsRecording(false);
      }
    );
  }, [disabled]);

  const stopRecording = useCallback(() => {
    if (!recorderRef.current) return;

    const transcript = recorderRef.current.stop();
    setIsRecording(false);

    if (transcript.trim()) {
      onTranscript(transcript.trim());
    }
    setCurrentTranscript("");
  }, [onTranscript]);

  if (!isSupported) {
    return (
      <div className="text-center text-candy-purple bg-white/60 rounded-2xl p-4">
        <p className="font-bold">Oops! Can&apos;t hear you</p>
        <p className="text-sm">Try using Chrome or Edge browser</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-candy-pink animate-pulse-ring" />
            <div
              className="absolute inset-0 rounded-full bg-candy-purple animate-pulse-ring"
              style={{ animationDelay: "0.5s" }}
            />
          </>
        )}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={disabled}
          className={`
            relative z-10 w-36 h-36 rounded-full
            flex items-center justify-center
            transition-all duration-300
            ${
              disabled
                ? "bg-gray-300 cursor-not-allowed"
                : isRecording
                ? "bg-gradient-to-br from-candy-pink to-candy-orange scale-110 animate-wiggle"
                : "bg-gradient-mic hover:scale-105 active:scale-95"
            }
            shadow-candy-lg border-4 border-white
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-16 h-16 drop-shadow-md"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>
      </div>

      <p className="text-candy-purple font-bold text-lg">
        {disabled
          ? "Making magic..."
          : isRecording
          ? "I&apos;m listening!"
          : "Hold & tell me what to draw!"}
      </p>

      {currentTranscript && (
        <p className="text-candy-purple/80 text-center max-w-xs font-medium bg-white/70 px-4 py-2 rounded-full">
          &ldquo;{currentTranscript}&rdquo;
        </p>
      )}
    </div>
  );
}
