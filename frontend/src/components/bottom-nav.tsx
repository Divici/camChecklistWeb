"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Mic } from "lucide-react";

const tabs = [
  { href: "/projects", label: "Home", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: ClipboardList },
  { href: "/assistant", label: "Assistant", icon: Mic },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string, label: string) {
    if (label === "Home") return pathname === "/projects";
    if (label === "Projects") return pathname.startsWith("/projects/");
    if (label === "Assistant") return pathname.startsWith("/assistant");
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-lowest/80 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-3xl">
      {tabs.map((tab) => {
        const active = isActive(tab.href, tab.label);
        const Icon = tab.icon;

        if (tab.href === "/assistant") {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center px-5 py-2 text-outline hover:text-primary"
            >
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg -mt-8 pulse-animation-on-mic-icon border-4 border-white">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-1">
                {tab.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center px-5 py-2 rounded-2xl transition-colors ${
              active
                ? "bg-primary-fixed text-primary"
                : "text-outline hover:text-primary"
            }`}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium tracking-tight">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
