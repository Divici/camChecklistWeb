import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";

vi.mock("@/lib/auth", () => ({
  useAuth: vi.fn(),
}));

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: (...args: unknown[]) => mockUsePathname(...args),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

const mockLogout = vi.fn();

const mockUser = {
  id: 1,
  email: "cam@example.com",
  name: "Cameron",
  avatar_url: null,
  provider: "google" as const,
};

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    user: mockUser,
    token: "tok",
    isLoading: false,
    loginWithGoogle: vi.fn(),
    loginAsGuest: vi.fn(),
    logout: mockLogout,
  });

  mockUsePathname.mockReturnValue("/projects");
  mockLogout.mockClear();
});

describe("Header", () => {
  it('renders logo text "CamChecklist"', () => {
    render(<Header />);
    expect(screen.getByText("CamChecklist")).toBeInTheDocument();
  });

  it("returns null on /login page", () => {
    mockUsePathname.mockReturnValue("/login");
    const { container } = render(<Header />);
    expect(container.innerHTML).toBe("");
  });

  it("shows user initial when user has a name", () => {
    render(<Header />);
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it('shows "G" initial for guest user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, email: null, name: null, avatar_url: null, provider: "guest" },
      token: "tok",
      isLoading: false,
      loginWithGoogle: vi.fn(),
      loginAsGuest: vi.fn(),
      logout: mockLogout,
    });

    render(<Header />);
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("clicking avatar opens dropdown menu", async () => {
    const user = userEvent.setup();
    render(<Header />);

    expect(screen.queryByText("Sign out")).not.toBeInTheDocument();

    const avatarButton = screen.getByText("C").closest("button")!;
    await user.click(avatarButton);

    expect(screen.getByText("Cameron")).toBeInTheDocument();
    expect(screen.getByText("cam@example.com")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("Sign out button calls logout", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const avatarButton = screen.getByText("C").closest("button")!;
    await user.click(avatarButton);

    await user.click(screen.getByText("Sign out"));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
