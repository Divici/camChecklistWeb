import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithQueryClient } from "../setup/test-utils";
import ProjectDetailPage from "@/app/projects/[projectId]/page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/projects/1",
  useParams: () => ({ projectId: "1" }),
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

describe("ProjectDetailPage", () => {
  it("shows loading state then renders project name", async () => {
    renderWithQueryClient(<ProjectDetailPage />);

    expect(await screen.findByText("Test Project")).toBeInTheDocument();
  });

  it("displays checklists", async () => {
    renderWithQueryClient(<ProjectDetailPage />);

    expect(await screen.findByText("Test Checklist")).toBeInTheDocument();
    expect(screen.getByText(/3 Items/i)).toBeInTheDocument();
    expect(screen.getByText(/2 Remaining/i)).toBeInTheDocument();
  });

  it("shows Add Checklist button", async () => {
    renderWithQueryClient(<ProjectDetailPage />);

    expect(await screen.findByText("Add Checklist")).toBeInTheDocument();
  });
});
