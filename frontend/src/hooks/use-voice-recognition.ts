"use client";
import { useState, useCallback, useRef } from "react";

interface UseVoiceRecognitionOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export function useVoiceRecognition({
  onResult,
  onError,
  lang = "en-US",
}: UseVoiceRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      onError?.("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      const friendly: Record<string, string> = {
        "not-allowed": "Microphone access denied. Check your browser and OS permissions.",
        "no-speech": "No speech detected. Try again.",
        "audio-capture": "No microphone found. Check your device.",
        "network": "Network error during speech recognition.",
        "aborted": "Speech recognition was aborted.",
      };
      onError?.(friendly[event.error] || event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onResult, onError, lang]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
