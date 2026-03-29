import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CheckVoice",
  description:
    "Voice-powered checklist management — create, manage, and complete checklists using your voice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="font-body bg-surface-container-lowest text-on-surface min-h-full flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1 pt-16 pb-28">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
