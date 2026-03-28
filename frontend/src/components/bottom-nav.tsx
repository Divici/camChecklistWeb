"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Mic } from "lucide-react";

const tabs = [
  { href: "/projects", label: "Projects", icon: ClipboardList },
  { href: "/assistant", label: "Assistant", icon: Mic },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-3xl">
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center cursor-pointer w-20 py-2 rounded-2xl transition-colors ${
              active
                ? "text-primary"
                : "text-outline hover:text-primary"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                active
                  ? "bg-primary-fixed"
                  : "bg-transparent"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium tracking-tight">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
