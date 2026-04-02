import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/lib/auth";
import LoginPage from "@/app/login/page";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/login",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
});

describe("LoginPage", () => {
  it("shows loading spinner when isLoading is true", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,


      isLoading: true,
      loginWithGoogle: vi.fn(),
      loginAsGuest: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginPage />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders Google login button and guest button when not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,


      isLoading: false,
      loginWithGoogle: vi.fn(),
      loginAsGuest: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginPage />);

    expect(screen.getByTestId("google-login-button")).toBeInTheDocument();
    expect(screen.getByText("Continue as Guest")).toBeInTheDocument();
  });

  it("clicking guest button calls loginAsGuest", async () => {
    const mockLoginAsGuest = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuth).mockReturnValue({
      user: null,


      isLoading: false,
      loginWithGoogle: vi.fn(),
      loginAsGuest: mockLoginAsGuest,
      logout: vi.fn(),
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByText("Continue as Guest"));
    expect(mockLoginAsGuest).toHaveBeenCalledOnce();
  });

  it("redirects to /projects when user is already authenticated", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        name: "Test",
        email: "test@test.com",
        provider: "google",
        avatar_url: null,
      },


      isLoading: false,
      loginWithGoogle: vi.fn(),
      loginAsGuest: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/projects");
    });
  });

  it("shows app name CamChecklist", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,


      isLoading: false,
      loginWithGoogle: vi.fn(),
      loginAsGuest: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginPage />);

    expect(screen.getByText("CamChecklist")).toBeInTheDocument();
  });
});
