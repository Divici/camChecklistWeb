import { Loader2 } from "lucide-react";

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );
}
