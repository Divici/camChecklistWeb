"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { Loader2, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, isLoading, loginWithGoogle, loginAsGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/projects");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 -mt-16">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight">
            CamChecklist
          </h1>
          <p className="font-body text-on-surface-variant">
            Voice and photo-powered checklists
          </p>
        </div>

        {/* Auth options */}
        <div className="w-full space-y-4">
          {/* Google Sign In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(response) => {
                if (response.credential) {
                  loginWithGoogle(response.credential).catch(console.error);
                }
              }}
              onError={() => console.error("Google login error")}
              shape="pill"
              size="large"
              width="300"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-xs font-label text-outline uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>

          {/* Guest Mode */}
          <button
            onClick={() => loginAsGuest().catch(console.error)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-surface-container-high text-on-surface font-headline font-semibold hover:bg-surface-container-highest transition-colors"
          >
            <UserCircle className="w-5 h-5" />
            Continue as Guest
          </button>

          <p className="text-center text-xs font-body text-outline">
            Guest data is temporary. Sign in with Google to save your checklists.
          </p>
        </div>
      </div>
    </div>
  );
}
