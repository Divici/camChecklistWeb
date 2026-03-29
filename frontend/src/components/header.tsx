"use client";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest flex items-center w-full px-6 h-16">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
          <span className="text-on-surface-variant text-sm font-headline font-bold">
            U
          </span>
        </div>
        <h1 className="font-headline font-extrabold text-primary tracking-tight text-xl">
          CamChecklist
        </h1>
      </div>
    </header>
  );
}
