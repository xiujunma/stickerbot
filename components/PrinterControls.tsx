"use client";

import { useState, useEffect, useCallback } from "react";
import { getCatPrinter, PrinterStatus } from "@/lib/catPrinter";
import { processImageForPrinter } from "@/lib/imageProcessor";

interface PrinterControlsProps {
  imageUrl: string | null;
}

export default function PrinterControls({ imageUrl }: PrinterControlsProps) {
  const [status, setStatus] = useState<PrinterStatus>("disconnected");
  const [deviceName, setDeviceName] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const printer = getCatPrinter();
    setIsSupported(printer.isSupported());
    printer.setStatusCallback((newStatus) => {
      setStatus(newStatus);
      if (newStatus === "connected") {
        setDeviceName(printer.getDeviceName());
      }
    });
  }, []);

  const handleConnect = useCallback(async () => {
    const printer = getCatPrinter();
    setError(null);

    try {
      await printer.connect();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("User cancelled")) {
          return;
        }
        setError(err.message);
      }
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    const printer = getCatPrinter();
    await printer.disconnect();
    setDeviceName("");
    setError(null);
  }, []);

  const handlePrint = useCallback(async () => {
    if (!imageUrl) return;

    const printer = getCatPrinter();
    setError(null);
    setIsPrinting(true);
    setPrintProgress(0);

    try {
      const { bitmap, width, height } = await processImageForPrinter(imageUrl);
      await printer.printImage(bitmap, width, height, (progress) => {
        setPrintProgress(progress);
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsPrinting(false);
      setPrintProgress(0);
    }
  }, [imageUrl]);

  if (!isSupported) {
    return (
      <div className="text-center text-candy-orange p-4 bg-candy-yellow/20 rounded-2xl">
        <span className="text-3xl">📱</span>
        <p className="font-bold mt-2">Bluetooth not working here</p>
        <p className="text-sm">Try Chrome or Edge browser!</p>
      </div>
    );
  }

  const canPrint = status === "connected" && imageUrl && !isPrinting;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Connection status */}
      <div className="flex items-center gap-2 bg-white/70 px-4 py-2 rounded-full">
        <div
          className={`w-4 h-4 rounded-full ${
            status === "connected"
              ? "bg-candy-green animate-pulse"
              : status === "connecting"
              ? "bg-candy-yellow animate-pulse"
              : "bg-gray-300"
          }`}
        />
        <span className="text-sm font-semibold text-candy-purple">
          {status === "connected"
            ? `${deviceName} ready!`
            : status === "connecting"
            ? "Looking for printer..."
            : "No printer connected"}
        </span>
      </div>

      {/* Connect/Disconnect button */}
      {status === "disconnected" ? (
        <button
          onClick={handleConnect}
          className="w-full py-3 px-6 bg-gradient-button text-white rounded-2xl hover:scale-105 transition-all duration-300 font-bold text-lg shadow-candy flex items-center justify-center gap-2"
        >
          <span>🖨️</span> Connect Printer
        </button>
      ) : (
        <button
          onClick={handleDisconnect}
          disabled={isPrinting}
          className="w-full py-2 px-6 bg-white/80 text-candy-purple rounded-2xl hover:bg-white transition-colors text-sm font-semibold disabled:opacity-50 border-2 border-candy-purple/20"
        >
          Disconnect
        </button>
      )}

      {/* Print button */}
      <button
        onClick={handlePrint}
        disabled={!canPrint}
        className={`
          w-full py-4 px-6 rounded-2xl font-bold text-xl
          transition-all duration-300 flex items-center justify-center gap-2
          ${
            canPrint
              ? "bg-gradient-print text-white hover:scale-105 shadow-candy-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        {isPrinting ? (
          <>
            <span className="animate-spin">⚙️</span>
            Printing... {printProgress}%
          </>
        ) : (
          <>
            <span className={canPrint ? "animate-bounce-gentle" : ""}>🖨️</span>
            Print My Sticker!
          </>
        )}
      </button>

      {/* Progress bar */}
      {isPrinting && (
        <div className="w-full bg-white/50 rounded-full h-4 overflow-hidden border-2 border-candy-green/30">
          <div
            className="bg-gradient-print h-full rounded-full transition-all duration-200 flex items-center justify-end pr-2"
            style={{ width: `${printProgress}%` }}
          >
            {printProgress > 10 && <span className="text-xs">🚀</span>}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="text-candy-pink text-sm text-center font-semibold bg-candy-pink/10 px-4 py-2 rounded-xl">
          😕 {error}
        </div>
      )}
    </div>
  );
}
