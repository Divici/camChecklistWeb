import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/status-badge";

describe("StatusBadge", () => {
  it('shows "Completed" for status=completed', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it('shows "Completed" when progress is 100', () => {
    render(<StatusBadge status="in_progress" progress={100} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it('shows "Completed" when progress exceeds 100', () => {
    render(<StatusBadge status="in_progress" progress={110} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it('shows "High Priority" for status=high_priority', () => {
    render(<StatusBadge status="high_priority" />);
    expect(screen.getByText("High Priority")).toBeInTheDocument();
  });

  it('shows "High Priority" for status="high priority" (space)', () => {
    render(<StatusBadge status="high priority" />);
    expect(screen.getByText("High Priority")).toBeInTheDocument();
  });

  it('shows "On Track" for status=on_track', () => {
    render(<StatusBadge status="on_track" />);
    expect(screen.getByText("On Track")).toBeInTheDocument();
  });

  it('shows "On Track" when progress >= 60', () => {
    render(<StatusBadge status="in_progress" progress={60} />);
    expect(screen.getByText("On Track")).toBeInTheDocument();
  });

  it('shows "In Progress" as default', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it('shows "In Progress" when progress is below 60', () => {
    render(<StatusBadge status="in_progress" progress={30} />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });
});
