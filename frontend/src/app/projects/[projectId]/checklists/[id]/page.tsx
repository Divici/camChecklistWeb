"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  GripVertical,
  Pencil,
  Camera,
  Mic,
  Video,
} from "lucide-react";
import { useProject, useChecklist, useItems, useToggleItem } from "@/lib/hooks";
import { ConfirmationToast } from "@/components/confirmation-toast";
import type { Item } from "@/lib/types";

export default function ChecklistPage() {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const router = useRouter();
  const { data: project } = useProject(projectId);
  const { data: checklist } = useChecklist(projectId, id);
  const { data: items } = useItems(id);
  const toggleItem = useToggleItem(id);

  const lastVoiceCompleted = items?.find(
    (i) => i.completed && i.completed_via === "voice"
  );

  function handleToggle(item: Item) {
    toggleItem.mutate({ itemId: item.id, completed: !item.completed });
  }

  // Sort: completed first, then by position
  const sortedItems = items
    ? [...items].sort((a, b) => {
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;
        return a.position - b.position;
      })
    : [];

  // Find first uncompleted item (active item)
  const activeItemId = sortedItems.find((i) => !i.completed)?.id;

  return (
    <div className="px-6 pt-8 pb-48 max-w-2xl mx-auto min-h-screen">
      {/* Header */}
      <header className="mb-10 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="p-2 hover:bg-surface-container-high transition-colors rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase font-label">
            {project?.name ?? "Project"}
          </span>
        </div>
        <h2 className="font-headline font-bold text-3xl md:text-4xl text-on-surface tracking-tight">
          {checklist?.name ?? "Loading..."}
        </h2>
        {checklist?.description && (
          <p className="text-on-surface-variant font-body leading-relaxed max-w-md">
            {checklist.description}
          </p>
        )}
      </header>

      {/* Checklist Canvas */}
      <div className="space-y-4">
        {/* Voice confirmation toast */}
        {lastVoiceCompleted && (
          <ConfirmationToast
            message={`"${lastVoiceCompleted.text}" confirmed`}
          />
        )}

        {/* Item List */}
        <div className="grid gap-3">
          {sortedItems.map((item) => {
            const isCompleted = item.completed;
            const isActive = item.id === activeItemId;

            if (isCompleted) {
              return (
                <div
                  key={item.id}
                  className="group flex items-center p-5 bg-surface-container-low rounded-2xl transition-all hover:bg-surface-container hover:translate-x-1"
                >
                  <div className="mr-4">
                    <button
                      onClick={() => handleToggle(item)}
                      className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-headline font-bold text-lg text-on-surface line-through decoration-secondary/40 opacity-60">
                      {item.text}
                    </h3>
                    <p className="text-xs font-label text-secondary font-semibold uppercase tracking-wider">
                      {item.completed_via === "voice"
                        ? "Completed via Voice"
                        : "Completed"}
                    </p>
                  </div>
                  <GripVertical className="w-5 h-5 text-on-surface-variant opacity-40" />
                </div>
              );
            }

            if (isActive) {
              return (
                <div
                  key={item.id}
                  className="group flex items-center p-5 bg-surface-container-highest rounded-2xl transition-all shadow-sm ring-2 ring-primary/10"
                >
                  <div className="mr-4">
                    <button
                      onClick={() => handleToggle(item)}
                      className="w-8 h-8 rounded-xl border-2 border-primary bg-surface-container-lowest flex items-center justify-center"
                    >
                      <div className="w-4 h-4 rounded-sm bg-transparent" />
                    </button>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-headline font-bold text-lg text-on-surface">
                      {item.text}
                    </h3>
                    <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider">
                      Priority: {item.priority || "Normal"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full hover:bg-surface-bright text-on-surface-variant">
                      <Pencil className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            }

            // Pending item
            return (
              <div
                key={item.id}
                className="group flex items-center p-5 bg-surface-container-low rounded-2xl transition-all hover:bg-surface-container"
              >
                <div className="mr-4">
                  <button
                    onClick={() => handleToggle(item)}
                    className="w-8 h-8 rounded-xl border-2 border-outline-variant bg-surface-container-lowest"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="font-headline font-bold text-lg text-on-surface">
                    {item.text}
                  </h3>
                  <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider">
                    Priority: {item.priority || "Normal"}
                  </p>
                </div>
                <GripVertical className="w-5 h-5 text-on-surface-variant opacity-20" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Voice/Camera HUD */}
      <div className="fixed bottom-24 left-0 w-full px-6 flex justify-center items-end pointer-events-none z-30">
        <div className="bg-surface-variant/60 backdrop-blur-xl p-6 rounded-[2.5rem] w-full max-w-md flex items-center justify-between pointer-events-auto shadow-2xl">
          {/* Camera Button */}
          <button className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
            <Camera className="w-6 h-6" />
          </button>

          {/* Mic Button */}
          <div className="relative">
            <button className="w-24 h-24 rounded-full bg-gradient-to-br from-tertiary to-tertiary-container flex items-center justify-center text-on-tertiary shadow-xl z-10 relative">
              <Mic className="w-10 h-10" />
            </button>
            {/* Decorative waveform */}
            <div className="absolute -top-4 -right-2 flex gap-1 items-center">
              <div
                className="w-1 h-4 bg-tertiary-fixed-dim rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-1 h-8 bg-tertiary-fixed rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />
              <div
                className="w-1 h-6 bg-tertiary-fixed-dim rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>

          {/* Video Button */}
          <button className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
            <Video className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
