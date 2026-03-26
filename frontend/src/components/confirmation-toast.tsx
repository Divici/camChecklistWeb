"use client";

import { CheckCircle } from "lucide-react";

interface ConfirmationToastProps {
  message: string;
  timestamp?: string;
}

export function ConfirmationToast({
  message,
  timestamp = "Just Now",
}: ConfirmationToastProps) {
  return (
    <div className="bg-secondary text-on-secondary px-6 py-4 rounded-2xl flex items-center justify-between shadow-lg mb-8 transition-all">
      <div className="flex items-center gap-3">
        <CheckCircle className="w-5 h-5 fill-current" />
        <span className="font-headline font-semibold">{message}</span>
      </div>
      <span className="text-xs font-label uppercase tracking-widest opacity-80">
        {timestamp}
      </span>
    </div>
  );
}
