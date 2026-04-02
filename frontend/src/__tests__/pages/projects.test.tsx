import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "../setup/test-utils";
import ProjectsPage from "@/app/projects/page";

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      provider: "google",
      avatar_url: null,
    },
    isLoading: false,
    loginWithGoogle: vi.fn(),
    loginAsGuest: vi.fn(),
    logout: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  // No localStorage setup needed -- auth is cookie-based
});

describe("ProjectsPage", () => {
  it("shows loading state initially then renders projects", async () => {
    renderWithQueryClient(<ProjectsPage />);

    // Should eventually show the project from MSW
    expect(await screen.findByText("Test Project")).toBeInTheDocument();
  });

  it("displays project name and progress", async () => {
    renderWithQueryClient(<ProjectsPage />);

    expect(await screen.findByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("1/3 tasks completed")).toBeInTheDocument();
  });

  it("shows New Project card/button", async () => {
    renderWithQueryClient(<ProjectsPage />);

    expect(await screen.findByText("New Project")).toBeInTheDocument();
  });

  it("can open create dialog", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProjectsPage />);

    // Wait for page to load
    await screen.findByText("New Project");

    // Click the New Project button
    await user.click(screen.getByText("New Project"));

    // Dialog should appear with "Create New Project" heading
    expect(await screen.findByText("Create New Project")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Home Renovation")).toBeInTheDocument();
  });
});
