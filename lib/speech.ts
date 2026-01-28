interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export class SpeechRecorder {
  private recognition: SpeechRecognitionInstance | null = null;
  private isRecording = false;
  private transcript = "";

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  start(
    onTranscript: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition || this.isRecording) return;

    this.transcript = "";
    this.isRecording = true;

    this.recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result[0]) {
          if (result[0].transcript) {
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }
        }
      }

      this.transcript = finalTranscript || interimTranscript;
      onTranscript(this.transcript, !!finalTranscript);
    };

    this.recognition.onerror = (event) => {
      this.isRecording = false;
      onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isRecording = false;
    };

    this.recognition.start();
  }

  stop(): string {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    }
    return this.transcript;
  }

  abort(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.abort();
      this.isRecording = false;
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}
