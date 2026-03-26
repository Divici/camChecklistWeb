interface ProgressBarProps {
  value: number;
  colorClass?: string;
}

export function ProgressBar({
  value,
  colorClass = "bg-primary",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
