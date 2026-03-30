import { render, screen } from "@testing-library/react";
import { ProgressBar } from "@/components/progress-bar";

describe("ProgressBar", () => {
  it("renders with 0% width", () => {
    const { container } = render(<ProgressBar value={0} />);
    const inner = container.querySelector("[style]") as HTMLElement;
    expect(inner.style.width).toBe("0%");
  });

  it("renders with 50% width", () => {
    const { container } = render(<ProgressBar value={50} />);
    const inner = container.querySelector("[style]") as HTMLElement;
    expect(inner.style.width).toBe("50%");
  });

  it("renders with 100% width", () => {
    const { container } = render(<ProgressBar value={100} />);
    const inner = container.querySelector("[style]") as HTMLElement;
    expect(inner.style.width).toBe("100%");
  });

  it("clamps negative values to 0%", () => {
    const { container } = render(<ProgressBar value={-20} />);
    const inner = container.querySelector("[style]") as HTMLElement;
    expect(inner.style.width).toBe("0%");
  });

  it("clamps values above 100 to 100%", () => {
    const { container } = render(<ProgressBar value={150} />);
    const inner = container.querySelector("[style]") as HTMLElement;
    expect(inner.style.width).toBe("100%");
  });

  it("uses custom colorClass", () => {
    const { container } = render(
      <ProgressBar value={50} colorClass="bg-secondary" />
    );
    const inner = container.querySelector("[style]") as HTMLElement;
    expect(inner.className).toContain("bg-secondary");
    expect(inner.className).not.toContain("bg-primary");
  });
});
