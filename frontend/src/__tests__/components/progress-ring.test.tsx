import { render, screen } from "@testing-library/react";
import { ProgressRing } from "@/components/progress-ring";

describe("ProgressRing", () => {
  it("renders percentage text for 0%", () => {
    render(<ProgressRing value={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders percentage text for 75%", () => {
    render(<ProgressRing value={75} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("clamps value above 100 and shows 100%", () => {
    render(<ProgressRing value={120} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders SVG with correct default size", () => {
    const { container } = render(<ProgressRing value={50} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe("56px");
    expect(wrapper.style.height).toBe("56px");
  });

  it("renders SVG with custom size and strokeWidth", () => {
    const { container } = render(
      <ProgressRing value={50} size={80} strokeWidth={6} />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe("80px");
    expect(wrapper.style.height).toBe("80px");

    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(2);

    // radius = (80 - 6) / 2 = 37, center = 40
    const fg = circles[1];
    expect(fg.getAttribute("r")).toBe("37");
    expect(fg.getAttribute("cx")).toBe("40");
    expect(fg.getAttribute("cy")).toBe("40");
    expect(fg.getAttribute("stroke-width")).toBe("6");
  });

  it("sets correct stroke-dasharray and stroke-dashoffset at 50%", () => {
    const size = 56;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2; // 26
    const circumference = 2 * Math.PI * radius;
    const expectedOffset = circumference - (50 / 100) * circumference;

    const { container } = render(<ProgressRing value={50} />);
    const fg = container.querySelectorAll("circle")[1];
    expect(fg.getAttribute("stroke-dasharray")).toBe(String(circumference));
    expect(fg.getAttribute("stroke-dashoffset")).toBe(String(expectedOffset));
  });

  it("applies custom colorClass to foreground circle", () => {
    const { container } = render(
      <ProgressRing value={50} colorClass="text-secondary" />
    );
    const fg = container.querySelectorAll("circle")[1];
    expect(fg.classList.contains("text-secondary")).toBe(true);
  });
});
