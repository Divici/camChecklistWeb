import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithQueryClient } from "../setup/test-utils";
import AssistantPage from "@/app/assistant/page";

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      provider: "google",
      avatar_url: null,
    },
    token: "mock-token",
    isLoading: false,
    loginWithGoogle: vi.fn(),
    loginAsGuest: vi.fn(),
    logout: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  localStorage.setItem("auth_token", "mock-token");
});

describe("AssistantPage", () => {
  it("shows project selector dropdown", async () => {
    renderWithQueryClient(<AssistantPage />);

    // MSW returns mockProject with name "Test Project"
    // The project selector shows the project name once loaded
    expect(await screen.findByText("Test Project")).toBeInTheDocument();
  });

  it("shows input field for questions", async () => {
    renderWithQueryClient(<AssistantPage />);

    // Wait for data to load and checklist to auto-select
    await screen.findByText("Test Project");

    // The input field should be present
    const input = await screen.findByPlaceholderText(
      "Ask anything or tell me what to do..."
    );
    expect(input).toBeInTheDocument();
  });

  it("disables input when no checklist selected", async () => {
    // Override MSW to return empty checklists so none gets auto-selected
    const { server } = await import("../setup/msw-handlers");
    const { http, HttpResponse } = await import("msw");

    server.use(
      http.get("http://localhost:3001/api/v1/projects/:projectId/checklists", () => {
        return HttpResponse.json([]);
      })
    );

    renderWithQueryClient(<AssistantPage />);

    // Wait for project to load
    await screen.findByText("Test Project");

    // With no checklists, the input should show "Select a checklist first" and be disabled
    const input = await screen.findByPlaceholderText("Select a checklist first");
    expect(input).toBeDisabled();
  });

  it("shows mic button for voice input", async () => {
    renderWithQueryClient(<AssistantPage />);

    await screen.findByText("Test Project");

    // The mic button is rendered when isSupported is true (SpeechRecognition is mocked)
    // It's in the input area, a round button
    const buttons = document.querySelectorAll("button");
    const micButtons = Array.from(buttons).filter((btn) => {
      return btn.className.includes("rounded-full") && !btn.className.includes("bg-primary");
    });
    // There should be at least one mic-like button (the one with Mic icon)
    expect(micButtons.length).toBeGreaterThan(0);
  });
});
