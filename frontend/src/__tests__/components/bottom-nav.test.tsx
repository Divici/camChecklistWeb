import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/bottom-nav";

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

beforeEach(() => {
  mockUsePathname.mockReturnValue("/projects");
});

describe("BottomNav", () => {
  it("renders two navigation links", () => {
    render(<BottomNav />);
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Assistant")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
  });

  it("returns null on /login page", () => {
    mockUsePathname.mockReturnValue("/login");
    const { container } = render(<BottomNav />);
    expect(container.innerHTML).toBe("");
  });

  it("highlights Projects tab when pathname starts with /projects", () => {
    mockUsePathname.mockReturnValue("/projects/123");
    render(<BottomNav />);

    const projectsLink = screen.getByText("Projects").closest("a")!;
    const assistantLink = screen.getByText("Assistant").closest("a")!;

    // Active tab has "text-primary" as a standalone class (not just hover:text-primary)
    expect(projectsLink.className.split(" ")).toContain("text-primary");
    expect(assistantLink.className).toContain("text-outline");
  });

  it("highlights Assistant tab when pathname starts with /assistant", () => {
    mockUsePathname.mockReturnValue("/assistant");
    render(<BottomNav />);

    const projectsLink = screen.getByText("Projects").closest("a")!;
    const assistantLink = screen.getByText("Assistant").closest("a")!;

    expect(assistantLink.className).toContain("text-primary");
    expect(projectsLink.className).toContain("text-outline");
  });
});
