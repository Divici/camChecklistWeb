import { renderHook, act } from "@testing-library/react";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";

describe("useVoiceRecognition", () => {
  let mockInstance: {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    continuous: boolean;
    onresult: ((event: unknown) => void) | null;
    onerror: ((event: unknown) => void) | null;
    onend: (() => void) | null;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  } | null;

  beforeEach(() => {
    mockInstance = null;

    class TestSpeechRecognition {
      lang = "en-US";
      interimResults = false;
      maxAlternatives = 1;
      continuous = false;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn().mockImplementation(() => {
        this.onend?.();
      });

      constructor() {
        mockInstance = this;
      }
    }

    Object.defineProperty(window, "SpeechRecognition", {
      value: TestSpeechRecognition,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      value: TestSpeechRecognition,
      writable: true,
      configurable: true,
    });
  });

  it("isSupported is true when SpeechRecognition exists", () => {
    const { result } = renderHook(() =>
      useVoiceRecognition({ onResult: vi.fn() })
    );
    expect(result.current.isSupported).toBe(true);
  });

  it("startListening sets isListening to true", () => {
    const { result } = renderHook(() =>
      useVoiceRecognition({ onResult: vi.fn() })
    );

    act(() => {
      result.current.startListening();
    });

    expect(result.current.isListening).toBe(true);
    expect(mockInstance?.start).toHaveBeenCalled();
  });

  it("stopListening sets isListening to false", () => {
    const { result } = renderHook(() =>
      useVoiceRecognition({ onResult: vi.fn() })
    );

    act(() => {
      result.current.startListening();
    });
    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.stopListening();
    });
    expect(result.current.isListening).toBe(false);
  });

  it("onResult callback receives transcript when recognition fires result", () => {
    const onResult = vi.fn();
    const { result } = renderHook(() =>
      useVoiceRecognition({ onResult })
    );

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockInstance?.onresult?.({
        results: [[{ transcript: "buy milk" }]],
      });
    });

    expect(onResult).toHaveBeenCalledWith("buy milk");
    expect(result.current.isListening).toBe(false);
  });

  it("onError callback receives friendly message for known errors", () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useVoiceRecognition({ onResult: vi.fn(), onError })
    );

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockInstance?.onerror?.({ error: "not-allowed" });
    });

    expect(onError).toHaveBeenCalledWith(
      "Microphone access denied. Check your browser and OS permissions."
    );
    expect(result.current.isListening).toBe(false);
  });

  it("onError callback passes through unknown error strings", () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useVoiceRecognition({ onResult: vi.fn(), onError })
    );

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockInstance?.onerror?.({ error: "some-unknown-error" });
    });

    expect(onError).toHaveBeenCalledWith("some-unknown-error");
  });

  it("isSupported is false when SpeechRecognition is removed from window", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useVoiceRecognition({ onResult: vi.fn(), onError })
    );

    act(() => {
      result.current.startListening();
    });

    expect(result.current.isSupported).toBe(false);
    expect(onError).toHaveBeenCalledWith(
      "Speech recognition not supported in this browser"
    );
  });
});
