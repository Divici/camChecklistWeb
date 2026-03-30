import { render, screen } from "@testing-library/react";
import { ConfirmationToast } from "@/components/confirmation-toast";

describe("ConfirmationToast", () => {
  it("renders the message text", () => {
    render(<ConfirmationToast message="Item completed" />);
    expect(screen.getByText("Item completed")).toBeInTheDocument();
  });

  it('renders default "Just Now" timestamp', () => {
    render(<ConfirmationToast message="Done" />);
    expect(screen.getByText("Just Now")).toBeInTheDocument();
  });

  it("renders a custom timestamp", () => {
    render(<ConfirmationToast message="Done" timestamp="2 min ago" />);
    expect(screen.getByText("2 min ago")).toBeInTheDocument();
    expect(screen.queryByText("Just Now")).not.toBeInTheDocument();
  });

  it("renders the CheckCircle icon as an SVG", () => {
    const { container } = render(<ConfirmationToast message="Done" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
