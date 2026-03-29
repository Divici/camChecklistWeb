"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePathname } from "next/navigation";

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  // Don't show header on login page
  if (pathname === "/login") return null;

  const initial = user?.name?.[0]?.toUpperCase() || (user?.provider === "guest" ? "G" : "U");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest flex items-center justify-between w-full px-6 h-16">
      <h1 className="font-headline font-extrabold text-primary tracking-tight text-xl">
        CamChecklist
      </h1>

      {user && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden"
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name || "User"} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-on-surface-variant text-sm font-headline font-bold">
                {initial}
              </span>
            )}
          </button>

          {showMenu && (
            <div className="absolute top-full mt-2 right-0 bg-surface-container-highest rounded-2xl shadow-xl z-50 overflow-hidden min-w-[180px]">
              <div className="px-4 py-3 border-b border-outline-variant/20">
                <p className="text-sm font-headline font-bold text-on-surface truncate">
                  {user.name || "Guest"}
                </p>
                {user.email && (
                  <p className="text-xs font-body text-on-surface-variant truncate">
                    {user.email}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-body text-error hover:bg-surface-container-high transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
