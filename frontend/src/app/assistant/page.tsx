"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Mic,
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Check,
  Undo2,
} from "lucide-react";
import {
  useProjects,
  useChecklists,
  useAssistant,
} from "@/lib/hooks";
import type { AssistantAction, ContextSwitch } from "@/lib/hooks";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import type { Item } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  items?: Item[];
  actions?: AssistantAction[];
  contextSwitch?: ContextSwitch;
}

const ACTION_ICONS: Record<string, typeof Plus> = {
  added: Plus,
  edited: Pencil,
  deleted: Trash2,
  completed: Check,
  unchecked: Undo2,
};

const ACTION_LABELS: Record<string, string> = {
  added: "Added",
  edited: "Edited",
  deleted: "Deleted",
  completed: "Checked off",
  unchecked: "Unchecked",
};

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: projects } = useProjects();
  const { data: checklists } = useChecklists(selectedProjectId ?? "");

  // Auto-select first project
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects, selectedProjectId]);

  // Auto-select first checklist when project changes
  useEffect(() => {
    if (checklists && checklists.length > 0) {
      setSelectedChecklistId(String(checklists[0].id));
    } else {
      setSelectedChecklistId(null);
    }
  }, [checklists]);

  const assistant = useAssistant(selectedChecklistId ?? "");

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick() {
      setShowProjectSelector(false);
      setShowSelector(false);
    }
    if (showProjectSelector || showSelector) {
      setTimeout(() => document.addEventListener("click", handleClick, { once: true }), 0);
    }
  }, [showProjectSelector, showSelector]);

  const handleContextSwitch = useCallback(
    (cs: ContextSwitch) => {
      setSelectedProjectId(String(cs.project_id));
      // Checklist will auto-select via the effect, but we want a specific one
      setTimeout(() => setSelectedChecklistId(String(cs.checklist_id)), 100);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Switched to the suggested project and checklist. You can now ask about or manage items there.`,
        },
      ]);
    },
    []
  );

  const handleSend = useCallback(
    (text: string) => {
      const question = text.trim();
      if (!question || !selectedChecklistId) return;

      setMessages((prev) => [...prev, { role: "user", content: question }]);
      setInputText("");

      assistant.mutate(question, {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.answer,
              items: data.related_items,
              actions: data.actions,
              contextSwitch: data.context_switch,
            },
          ]);
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: err instanceof Error
                ? err.message
                : "Sorry, I had trouble processing that. Please try again.",
            },
          ]);
        },
      });
    },
    [selectedChecklistId, assistant]
  );

  const { isListening, isSupported, startListening, stopListening } =
    useVoiceRecognition({
      onResult: (transcript) => handleSend(transcript),
      onError: (err) => console.error("Voice error:", err),
    });

  const handleMicPress = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  const selectedProject = projects?.find((p) => String(p.id) === selectedProjectId);
  const selectedChecklist = checklists?.find((c) => String(c.id) === selectedChecklistId);

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      {/* Sticky selector bar */}
      <div className="sticky top-16 z-40 bg-primary px-4 py-3 flex items-center gap-2 shadow-md">
        {/* Project dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProjectSelector(!showProjectSelector);
              setShowSelector(false);
            }}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm font-semibold text-on-primary transition-colors"
          >
            <span className="truncate max-w-[120px]">
              {selectedProject?.name ?? "Project"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          </button>
          {showProjectSelector && projects && (
            <div className="absolute top-full mt-2 left-0 bg-surface-container-highest rounded-2xl shadow-xl z-50 overflow-hidden min-w-[200px]">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    setSelectedProjectId(String(proj.id));
                    setShowProjectSelector(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-body hover:bg-surface-container-high transition-colors ${
                    String(proj.id) === selectedProjectId
                      ? "text-primary font-semibold"
                      : "text-on-surface"
                  }`}
                >
                  {proj.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Checklist dropdown */}
        {checklists && checklists.length > 0 && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSelector(!showSelector);
                setShowProjectSelector(false);
              }}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm font-semibold text-on-primary transition-colors"
            >
              <span className="truncate max-w-[140px]">
                {selectedChecklist?.name ?? "Checklist"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            </button>
            {showSelector && (
              <div className="absolute top-full mt-2 left-0 bg-surface-container-highest rounded-2xl shadow-xl z-50 overflow-hidden min-w-[200px]">
                {checklists.map((cl) => (
                  <button
                    key={cl.id}
                    onClick={() => {
                      setSelectedChecklistId(String(cl.id));
                      setShowSelector(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-body hover:bg-surface-container-high transition-colors ${
                      String(cl.id) === selectedChecklistId
                        ? "text-primary font-semibold"
                        : "text-on-surface"
                    }`}
                  >
                    {cl.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 px-4 pt-6 pb-56 flex flex-col gap-6">
        {/* Welcome */}
        {messages.length === 0 && (
          <section className="mb-2">
            <h2 className="font-headline font-extrabold text-on-surface tracking-tight text-3xl leading-tight">
              How can I help you <br />
              <span className="text-primary">stay on track?</span>
            </h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-primary-container p-4 rounded-2xl mb-4">
                <Sparkles className="w-8 h-8 text-on-primary-container" />
              </div>
              <p className="font-body text-on-surface-variant leading-relaxed max-w-xs">
                Ask me anything about your checklists. I can add items, check
                things off, edit or delete tasks, summarize progress, or help
                you plan.
              </p>
            </div>
          </section>
        )}

        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="flex flex-col items-end pl-12">
                <div className="bg-surface-container-high rounded-2xl rounded-tr-none px-5 py-4 shadow-sm">
                  <p className="text-on-surface-variant font-body leading-relaxed">
                    {msg.content}
                  </p>
                </div>
                <span className="font-label text-[10px] text-outline mt-2 tracking-widest uppercase">
                  You
                </span>
              </div>
            );
          }

          return (
            <div key={i} className="flex flex-col items-start pr-8">
              <div className="bg-white rounded-3xl rounded-tl-none p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl" />
                <div className="flex items-start gap-4 mb-3">
                  <div className="bg-primary-container p-2 rounded-xl shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-body text-on-surface leading-relaxed">
                    {msg.content}
                  </p>
                </div>

                {/* Actions taken */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.actions.map((action, j) => {
                      const Icon = ACTION_ICONS[action.type] || Check;
                      return (
                        <div
                          key={j}
                          className="bg-tertiary-container/30 p-3 rounded-xl flex items-center gap-3"
                        >
                          <div className="w-7 h-7 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-on-tertiary-container" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-label font-semibold text-on-tertiary-container uppercase tracking-wider">
                              {ACTION_LABELS[action.type] || action.type}
                            </span>
                            <p className="font-body text-sm text-on-surface truncate">
                              {action.item.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Context switch suggestion */}
                {msg.contextSwitch && (
                  <div className="mt-3 bg-primary-container/30 p-4 rounded-xl">
                    <p className="text-sm font-body text-on-surface mb-2">
                      {msg.contextSwitch.reason}
                    </p>
                    <button
                      onClick={() => handleContextSwitch(msg.contextSwitch!)}
                      className="px-4 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold"
                    >
                      Switch now
                    </button>
                  </div>
                )}

                {/* Related items */}
                {msg.items && msg.items.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <span
                            className={`font-headline font-bold text-sm ${
                              item.completed
                                ? "line-through opacity-60"
                                : "text-on-surface"
                            }`}
                          >
                            {item.text}
                          </span>
                          {item.completed && (
                            <span className="ml-2 text-[10px] font-label font-semibold text-secondary uppercase tracking-wider">
                              Done
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-wider shrink-0">
                          {item.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="font-label text-[10px] text-outline mt-2 ml-1 tracking-widest uppercase">
                Assistant
              </span>
            </div>
          );
        })}

        {/* Typing indicator */}
        {assistant.isPending && (
          <div className="flex flex-col items-start pr-8">
            <div className="bg-white rounded-3xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="font-body text-on-surface-variant">
                Thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-28 left-0 w-full px-4 z-40">
        <div className="max-w-2xl mx-auto">
          <div className="bg-surface-container/80 backdrop-blur-xl rounded-full flex items-center gap-2 px-4 py-2 shadow-2xl">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
              placeholder={
                selectedChecklistId
                  ? "Ask anything or tell me what to do..."
                  : "Select a checklist first"
              }
              disabled={!selectedChecklistId || assistant.isPending}
              className="flex-1 bg-transparent px-2 py-2 text-on-surface font-body outline-none placeholder:text-outline disabled:opacity-50"
            />

            {isSupported && (
              <button
                onClick={handleMicPress}
                disabled={!selectedChecklistId || assistant.isPending}
                className={`p-2 rounded-full transition-all disabled:opacity-50 ${
                  isListening
                    ? "bg-error text-on-error animate-pulse"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => handleSend(inputText)}
              disabled={
                !inputText.trim() ||
                !selectedChecklistId ||
                assistant.isPending
              }
              className="p-2 rounded-full bg-primary text-on-primary disabled:opacity-50 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
