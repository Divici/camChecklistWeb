import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { server } from "./src/__tests__/setup/msw-handlers";

// MSW server lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

// Mock next/navigation globally
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock @react-oauth/google globally
vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => children,
  GoogleLogin: ({
    onSuccess,
  }: {
    onSuccess: (response: { credential: string }) => void;
  }) => (
    <button
      onClick={() => onSuccess({ credential: "mock-google-id-token" })}
      data-testid="google-login-button"
    >
      Sign in with Google
    </button>
  ),
}));

// Mock window.SpeechRecognition
class MockSpeechRecognition {
  lang = "en-US";
  interimResults = false;
  maxAlternatives = 1;
  continuous = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start() {}
  stop() {
    this.onend?.();
  }
  abort() {
    this.onend?.();
  }
}

Object.defineProperty(window, "SpeechRecognition", {
  value: MockSpeechRecognition,
  writable: true,
  configurable: true,
});
Object.defineProperty(window, "webkitSpeechRecognition", {
  value: MockSpeechRecognition,
  writable: true,
  configurable: true,
});
