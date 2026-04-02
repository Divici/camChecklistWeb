import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithQueryClient } from "../setup/test-utils";
import ChecklistPage from "@/app/projects/[projectId]/checklists/[id]/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/projects/1/checklists/1",
  useParams: () => ({ projectId: "1", id: "1" }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

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

describe("ChecklistPage", () => {
  it("shows loading state then renders checklist name", async () => {
    renderWithQueryClient(<ChecklistPage />);

    expect(await screen.findByText("Test Checklist")).toBeInTheDocument();
  });

  it("displays items", async () => {
    renderWithQueryClient(<ChecklistPage />);

    expect(await screen.findByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Clean house")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
  });

  it("shows voice mic button", async () => {
    renderWithQueryClient(<ChecklistPage />);

    await screen.findByText("Buy groceries");

    // The mic button has a large size (w-24 h-24) with gradient styling
    const buttons = document.querySelectorAll("button");
    const micButtons = Array.from(buttons).filter((btn) => {
      return btn.className.includes("w-24") || btn.className.includes("from-tertiary");
    });
    expect(micButtons.length).toBeGreaterThan(0);
  });

  it("shows camera/photo button", async () => {
    renderWithQueryClient(<ChecklistPage />);

    await screen.findByText("Buy groceries");

    // Camera button has w-14 h-14 styling
    const buttons = document.querySelectorAll("button");
    const cameraButtons = Array.from(buttons).filter((btn) => {
      return btn.className.includes("w-14");
    });
    expect(cameraButtons.length).toBeGreaterThan(0);
  });

  it("completed items have visual distinction (line-through)", async () => {
    renderWithQueryClient(<ChecklistPage />);

    // "Clean house" is the completed item in mockItems
    const completedItem = await screen.findByText("Clean house");
    expect(completedItem.className).toContain("line-through");
  });
});
