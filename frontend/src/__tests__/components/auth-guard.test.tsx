import { render, screen } from "@testing-library/react";
import { useAuth } from "@/lib/auth";
import { AuthGuard } from "@/components/auth-guard";

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(),
}));

const mockReplace = vi.fn();
const mockUseRouter = vi.fn();
const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: (...args: unknown[]) => mockUseRouter(...args),
  usePathname: (...args: unknown[]) => mockUsePathname(...args),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    token: null,
    isLoading: false,
    loginWithGoogle: vi.fn(),
    loginAsGuest: vi.fn(),
    logout: vi.fn(),
  });

  mockUseRouter.mockReturnValue({
    push: vi.fn(),
    replace: mockReplace,
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  });

  mockUsePathname.mockReturnValue("/");
  mockReplace.mockClear();
});

describe("AuthGuard", () => {
  it("shows loading spinner when isLoading is true", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      isLoading: true,
      loginWithGoogle: vi.fn(),
      loginAsGuest: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("redirects to /login when no user and not on login page", () => {
    mockUsePathname.mockReturnValue("/projects");

    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });

  it("renders children when user exists", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, email: "test@test.com", name: "Test", avatar_url: null, provider: "google" },
      token: "tok",
      isLoading: false,
      loginWithGoogle: vi.fn(),
      loginAsGuest: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected</div>
      </AuthGuard>
    );

    expect(screen.getByText("Protected")).toBeInTheDocument();
  });

  it("renders children on /login page even without user", () => {
    mockUsePathname.mockReturnValue("/login");

    render(
      <AuthGuard>
        <div>Login Page</div>
      </AuthGuard>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
