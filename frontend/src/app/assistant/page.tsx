"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Mic,
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  useProjects,
  useChecklists,
  useAskQuestion,
} from "@/lib/hooks";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import type { Item } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  items?: Item[];
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(
    null
  );
  const [showSelector, setShowSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch projects to find available checklists
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

  const askQuestion = useAskQuestion(selectedChecklistId ?? "");

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    (text: string) => {
      const question = text.trim();
      if (!question || !selectedChecklistId) return;

      setMessages((prev) => [...prev, { role: "user", content: question }]);
      setInputText("");

      askQuestion.mutate(question, {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.answer,
              items: data.related_items,
            },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Sorry, I had trouble processing that. Please try again.",
            },
          ]);
        },
      });
    },
    [selectedChecklistId, askQuestion]
  );

  const { isListening, isSupported, startListening, stopListening } =
    useVoiceRecognition({
      onResult: (transcript) => {
        handleSend(transcript);
      },
      onError: (err) => {
        console.error("Voice error:", err);
      },
    });

  const handleMicPress = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const selectedProject = projects?.find(
    (p) => String(p.id) === selectedProjectId
  );
  const selectedChecklist = checklists?.find(
    (c) => String(c.id) === selectedChecklistId
  );

  return (
    <div className="flex-1 px-4 pt-8 pb-48 max-w-2xl mx-auto w-full flex flex-col gap-6">
      {/* Welcome Section */}
      <section className="mb-2">
        <h2 className="font-headline font-extrabold text-on-surface tracking-tight text-3xl leading-tight">
          How can I help you <br />
          <span className="text-primary">stay on track?</span>
        </h2>
      </section>

      {/* Project Selector */}
      {projects && projects.length > 0 && (
        <div className="relative">
          <button
            onClick={() => {
              setShowProjectSelector(!showProjectSelector);
              setShowSelector(false);
            }}
            className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            <span>
              {selectedProject ? selectedProject.name : "Select project"}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showProjectSelector && (
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
      )}

      {/* Checklist Selector */}
      {checklists && checklists.length > 0 && (
        <div className="relative">
          <button
            onClick={() => {
              setShowSelector(!showSelector);
              setShowProjectSelector(false);
            }}
            className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            <span>
              {selectedChecklist
                ? selectedChecklist.name
                : "Select checklist"}
            </span>
            <ChevronDown className="w-4 h-4" />
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

      {/* Messages */}
      <div className="flex flex-col gap-6 flex-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-primary-container p-4 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-on-primary-container" />
            </div>
            <p className="font-body text-on-surface-variant leading-relaxed max-w-xs">
              Ask me anything about your checklist. I can tell you what is next,
              summarize progress, or help you plan.
            </p>
          </div>
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
                  <div className="bg-primary-container p-2 rounded-xl">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-body text-on-surface leading-relaxed">
                    {msg.content}
                  </p>
                </div>

                {/* Related items */}
                {msg.items && msg.items.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-3"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            item.completed
                              ? "bg-secondary border-secondary"
                              : "border-primary/20"
                          }`}
                        >
                          {item.completed && (
                            <svg
                              className="w-3 h-3 text-on-secondary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <span
                            className={`font-headline font-bold text-sm ${
                              item.completed
                                ? "line-through opacity-60"
                                : "text-on-surface"
                            }`}
                          >
                            {item.text}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-outline-variant" />
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
        {askQuestion.isPending && (
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
      <div className="fixed bottom-24 left-0 w-full px-4 z-40">
        <div className="max-w-2xl mx-auto">
          <div className="bg-surface-container/80 backdrop-blur-xl rounded-full flex items-center gap-2 px-4 py-2 shadow-2xl">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(inputText)}
              placeholder={
                selectedChecklistId
                  ? "Ask about your checklist..."
                  : "Select a checklist first"
              }
              disabled={!selectedChecklistId || askQuestion.isPending}
              className="flex-1 bg-transparent px-2 py-2 text-on-surface font-body outline-none placeholder:text-outline disabled:opacity-50"
            />

            {/* Mic button */}
            {isSupported && (
              <button
                onClick={handleMicPress}
                disabled={!selectedChecklistId || askQuestion.isPending}
                className={`p-2 rounded-full transition-all disabled:opacity-50 ${
                  isListening
                    ? "bg-error text-on-error animate-pulse"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}

            {/* Send button */}
            <button
              onClick={() => handleSend(inputText)}
              disabled={
                !inputText.trim() ||
                !selectedChecklistId ||
                askQuestion.isPending
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
