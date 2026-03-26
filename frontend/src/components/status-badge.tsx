interface StatusBadgeProps {
  status: string;
  progress?: number;
}

function getBadgeStyle(status: string, progress?: number) {
  const s = status.toLowerCase();
  if (s === "completed" || (progress !== undefined && progress >= 100)) {
    return "bg-secondary/10 text-secondary";
  }
  if (s === "high_priority" || s === "high priority") {
    return "bg-tertiary-container/10 text-tertiary-container";
  }
  if (
    s === "on_track" ||
    s === "on track" ||
    (progress !== undefined && progress >= 60)
  ) {
    return "bg-secondary/10 text-secondary";
  }
  return "bg-primary/10 text-primary";
}

function getLabel(status: string, progress?: number) {
  const s = status.toLowerCase();
  if (s === "completed" || (progress !== undefined && progress >= 100))
    return "Completed";
  if (s === "high_priority" || s === "high priority") return "High Priority";
  if (
    s === "on_track" ||
    s === "on track" ||
    (progress !== undefined && progress >= 60)
  )
    return "On Track";
  return "In Progress";
}

export function StatusBadge({ status, progress }: StatusBadgeProps) {
  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgeStyle(status, progress)}`}
    >
      {getLabel(status, progress)}
    </div>
  );
}
