import { render } from "@testing-library/react";
import { PageSpinner } from "@/components/page-spinner";

describe("PageSpinner", () => {
  it("renders without crashing", () => {
    const { container } = render(<PageSpinner />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("contains an SVG element (the Loader2 icon)", () => {
    const { container } = render(<PageSpinner />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("has the spin animation class", () => {
    const { container } = render(<PageSpinner />);
    const svg = container.querySelector("svg");
    expect(svg?.classList.contains("animate-spin")).toBe(true);
  });
});
