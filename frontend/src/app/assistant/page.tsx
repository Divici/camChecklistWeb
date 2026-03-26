"use client";

import { Mic, Sparkles, ArrowRight } from "lucide-react";

export default function AssistantPage() {
  return (
    <div className="flex-1 px-4 pt-8 pb-48 max-w-2xl mx-auto w-full flex flex-col gap-8">
      {/* Welcome Section */}
      <section className="mb-4">
        <h2 className="font-headline font-extrabold text-on-surface tracking-tight text-3xl leading-tight">
          How can I help you <br />
          <span className="text-primary">stay on track?</span>
        </h2>
      </section>

      {/* Conversational Area */}
      <div className="flex flex-col gap-6">
        {/* User Query */}
        <div className="flex flex-col items-end pl-12">
          <div className="bg-surface-container-high rounded-2xl rounded-tr-none px-5 py-4 shadow-sm">
            <p className="text-on-surface-variant font-body leading-relaxed">
              What&apos;s next on my list?
            </p>
          </div>
          <span className="font-label text-[10px] text-outline mt-2 tracking-widest uppercase">
            Just now
          </span>
        </div>

        {/* AI Response Card */}
        <div className="flex flex-col items-start pr-8">
          <div className="bg-white rounded-3xl rounded-tl-none p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
            {/* Subtle Glass Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl" />
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-primary-container p-2 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-body text-lg font-medium text-on-surface leading-tight">
                  Your next uncompleted task is:
                </p>
              </div>
            </div>

            {/* Task Highlight Card */}
            <div className="bg-surface-container-low p-5 rounded-2xl flex flex-col gap-3 group transition-all">
              <div className="flex justify-between items-center">
                <span className="font-label text-[10px] font-bold text-secondary tracking-widest uppercase">
                  Project: Kitchen Prep
                </span>
                <ArrowRight className="w-4 h-4 text-outline-variant" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 rounded border-2 border-primary/20 flex items-center justify-center" />
                <h3 className="font-headline font-bold text-xl text-on-surface">
                  Buy Paint
                </h3>
              </div>
              <div className="flex gap-2 mt-1">
                <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-[10px] font-bold">
                  HIGH PRIORITY
                </span>
                <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold">
                  VOICE-ADDED
                </span>
              </div>
            </div>

            <p className="mt-5 font-body text-on-surface-variant leading-relaxed">
              Would you like me to find the nearest hardware store or set a
              reminder for when you leave the house?
            </p>
          </div>
          <span className="font-label text-[10px] text-outline mt-2 ml-1 tracking-widest uppercase">
            Assistant
          </span>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-2">
          <button className="bg-surface-container-lowest border border-outline-variant/30 px-4 py-2 rounded-full text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
            Find stores nearby
          </button>
          <button className="bg-surface-container-lowest border border-outline-variant/30 px-4 py-2 rounded-full text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
            Set reminder
          </button>
          <button className="bg-surface-container-lowest border border-outline-variant/30 px-4 py-2 rounded-full text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
            Done
          </button>
        </div>
      </div>

      {/* Tap to Dictate */}
      <div className="mt-auto pt-12 text-center">
        <p className="font-label text-[10px] text-outline tracking-[0.2em] uppercase mb-4">
          Tap to dictate
        </p>
      </div>

      {/* Recording Mic Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
        <button className="w-20 h-20 rounded-full bg-primary shadow-2xl flex items-center justify-center text-on-primary transition-transform active:scale-90 relative">
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 scale-125" />
          <Mic className="w-10 h-10 relative z-10" />
        </button>
      </div>
    </div>
  );
}
