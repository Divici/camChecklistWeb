"use client";

import { useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Check as CheckIcon,
  Pencil,
  Camera,
  Mic,
  X,
  Loader2,
  Send,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useProject,
  useChecklist,
  useItems,
  useToggleItem,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useVoiceCheck,
  usePhotoCheck,
} from "@/lib/hooks";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { resizeImage } from "@/lib/image-utils";
import { ConfirmationToast } from "@/components/confirmation-toast";
import { PageSpinner } from "@/components/page-spinner";
import type { Item } from "@/lib/types";

export default function ChecklistPage() {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const router = useRouter();
  const { data: project } = useProject(projectId);
  const { data: checklist, isLoading: checklistLoading } = useChecklist(projectId, id);
  const { data: items, isLoading: itemsLoading } = useItems(id);
  const isLoading = checklistLoading || itemsLoading;
  const toggleItem = useToggleItem(id, projectId);
  const createItem = useCreateItem(id, projectId);
  const updateItem = useUpdateItem(id);
  const deleteItem = useDeleteItem(id, projectId);
  const voiceCheck = useVoiceCheck(id, projectId);
  const photoCheck = usePhotoCheck(id, projectId);

  // UI state
  const [textFallback, setTextFallback] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Voice recognition
  const {
    isListening,
    isSupported: voiceSupported,
    startListening,
    stopListening,
  } = useVoiceRecognition({
    onResult: (transcript) => {
      voiceCheck.mutate(transcript, {
        onSuccess: (data) => {
          const checkedNames = data.checked_items.map((i) => i.text).join(", ");
          const deletedNames = (data.deleted_items || []).map((i: { text: string }) => i.text).join(", ");
          const msg = [
            checkedNames ? `Checked: ${checkedNames}` : "",
            deletedNames ? `Removed: ${deletedNames}` : "",
          ].filter(Boolean).join(". ") || data.reasoning;
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 4000);
        },
        onError: (err) => {
          setErrorMessage(err instanceof Error ? err.message : "Voice check failed. Try again.");
          setTimeout(() => setErrorMessage(null), 4000);
        },
      });
    },
    onError: (err) => {
      setErrorMessage(`Voice error: ${err}`);
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  const handleMicPress = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleTextSubmit = useCallback(() => {
    const text = textFallback.trim();
    if (!text) return;
    voiceCheck.mutate(text, {
      onSuccess: (data) => {
        const names = data.checked_items.map((i) => i.text).join(", ");
        setToastMessage(names ? `Checked: ${names}` : data.reasoning);
        setTextFallback("");
        setTimeout(() => setToastMessage(null), 4000);
      },
      onError: (err) => {
        setErrorMessage(err instanceof Error ? err.message : "AI check failed. Try again.");
        setTimeout(() => setErrorMessage(null), 4000);
      },
    });
  }, [textFallback, voiceCheck]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const resized = await resizeImage(file);
      photoCheck.mutate(resized, {
        onSuccess: (data) => {
          const names = data.checked_items.map((i) => i.text).join(", ");
          setToastMessage(names ? `Photo checked: ${names}` : data.reasoning);
          setTimeout(() => setToastMessage(null), 4000);
        },
        onError: (err) => {
          setErrorMessage(err instanceof Error ? err.message : "Photo check failed. Try again.");
          setTimeout(() => setErrorMessage(null), 4000);
        },
      });
    },
    [photoCheck]
  );

  function handleToggle(item: Item) {
    toggleItem.mutate({ itemId: item.id, completed: !item.completed });
  }

  function handleCreateItem() {
    if (!newItemText.trim()) return;
    createItem.mutate(
      { text: newItemText.trim() },
      { onSuccess: () => { setNewItemText(""); setShowAddItem(false); } }
    );
  }

  function handleSaveEdit(itemId: number) {
    if (!editText.trim()) return;
    updateItem.mutate(
      { itemId, data: { text: editText.trim() } },
      { onSuccess: () => { setEditingItemId(null); setEditText(""); } }
    );
  }

  const isAiProcessing = voiceCheck.isPending || photoCheck.isPending;

  // Track which items are mid-mutation
  const deletingItemId = deleteItem.isPending ? deleteItem.variables : null;
  const togglingItemId = toggleItem.isPending ? toggleItem.variables?.itemId : null;

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
    <div className="px-6 pt-8 pb-56 max-w-2xl mx-auto">
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
          {checklist?.name ?? "\u00A0"}
        </h2>
        {checklist?.description && (
          <p className="text-on-surface-variant font-body leading-relaxed max-w-md">
            {checklist.description}
          </p>
        )}
      </header>

      {isLoading && <PageSpinner />}

      {/* Checklist Canvas */}
      <div className="space-y-4">
        {/* Toast messages */}
        {toastMessage && <ConfirmationToast message={toastMessage} />}

        {errorMessage && (
          <div className="bg-error text-on-error px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg mb-8">
            <span className="font-headline font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* AI Processing Indicator */}
        {isAiProcessing && (
          <div className="bg-tertiary-container text-on-tertiary-container px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg mb-4 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-headline font-semibold">
              AI is processing...
            </span>
          </div>
        )}

        {/* Item List */}
        <div className="grid gap-3">
          {sortedItems.map((item) => {
            const isCompleted = item.completed;
            const isActive = item.id === activeItemId;
            const isItemBusy =
              String(deletingItemId) === String(item.id) ||
              String(togglingItemId) === String(item.id);

            if (isCompleted) {
              return (
                <div
                  key={item.id}
                  className={`group flex items-center p-5 bg-surface-container-low rounded-2xl transition-all relative ${isItemBusy ? "opacity-50 pointer-events-none" : "hover:bg-surface-container hover:translate-x-1"}`}
                >
                  {isItemBusy && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  )}
                  <div className="mr-4">
                    <button
                      onClick={() => handleToggle(item)}
                      className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-grow">
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(item.id)}
                          className="flex-1 bg-surface-container px-3 py-2 rounded-xl text-on-surface font-body outline-none ring-1 ring-primary/30 focus:ring-primary"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="p-2 rounded-full hover:bg-surface-container-high text-primary"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setEditingItemId(null); setEditText(""); }}
                          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteItem.mutate(item.id)}
                          className="p-2 rounded-full hover:bg-error-container text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-headline font-bold text-lg text-on-surface line-through decoration-secondary/40 opacity-60">
                          {item.text}
                        </h3>
                        <p className="text-xs font-label text-secondary font-semibold uppercase tracking-wider">
                          {item.completed_via === "voice"
                            ? "Completed via Voice"
                            : item.completed_via === "photo"
                              ? "Completed via Photo"
                              : "Completed"}
                        </p>
                      </>
                    )}
                  </div>
                  {editingItemId !== item.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingItemId(item.id); setEditText(item.text); }}
                        className="p-2 rounded-full hover:bg-surface-bright text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            if (isActive) {
              return (
                <div
                  key={item.id}
                  className={`group flex items-center p-5 bg-surface-container-highest rounded-2xl transition-all shadow-sm ring-2 ring-primary/10 relative ${isItemBusy ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {isItemBusy && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                  )}
                  <div className="mr-4">
                    <button
                      onClick={() => handleToggle(item)}
                      className="w-8 h-8 rounded-xl border-2 border-primary bg-surface-container-lowest flex items-center justify-center"
                    >
                      <div className="w-4 h-4 rounded-sm bg-transparent" />
                    </button>
                  </div>
                  <div className="flex-grow">
                    {editingItemId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(item.id)}
                          className="flex-1 bg-surface-container px-3 py-2 rounded-xl text-on-surface font-body outline-none ring-1 ring-primary/30 focus:ring-primary"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="p-2 rounded-full hover:bg-surface-container-high text-primary"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setEditingItemId(null); setEditText(""); }}
                          className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteItem.mutate(item.id)}
                          className="p-2 rounded-full hover:bg-error-container text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-headline font-bold text-lg text-on-surface">
                          {item.text}
                        </h3>
                        <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider">
                          Priority: {item.priority || "Normal"}
                        </p>
                      </>
                    )}
                  </div>
                  {editingItemId !== item.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingItemId(item.id); setEditText(item.text); }}
                        className="p-2 rounded-full hover:bg-surface-bright text-on-surface-variant"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // Pending item
            return (
              <div
                key={item.id}
                className={`group flex items-center p-5 bg-surface-container-low rounded-2xl transition-all relative ${isItemBusy ? "opacity-50 pointer-events-none" : "hover:bg-surface-container"}`}
              >
                {isItemBusy && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                )}
                <div className="mr-4">
                  <button
                    onClick={() => handleToggle(item)}
                    className="w-8 h-8 rounded-xl border-2 border-outline-variant bg-surface-container-lowest"
                  />
                </div>
                <div className="flex-grow">
                  {editingItemId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(item.id)}
                        className="flex-1 bg-surface-container px-3 py-2 rounded-xl text-on-surface font-body outline-none ring-1 ring-primary/30 focus:ring-primary"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="p-2 rounded-full hover:bg-surface-container-high text-primary"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => { setEditingItemId(null); setEditText(""); }}
                        className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteItem.mutate(item.id)}
                        className="p-2 rounded-full hover:bg-error-container text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-headline font-bold text-lg text-on-surface">
                        {item.text}
                      </h3>
                      <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider">
                        Priority: {item.priority || "Normal"}
                      </p>
                    </>
                  )}
                </div>
                {editingItemId !== item.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingItemId(item.id); setEditText(item.text); }}
                      className="p-2 rounded-full hover:bg-surface-bright text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem.mutate(item.id)}
                      className="p-2 rounded-full hover:bg-error-container text-error opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Item Button & Form */}
        {showAddItem ? (
          <div className="bg-surface-container-low rounded-2xl p-5 flex items-center gap-3">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateItem()}
              placeholder="New item text..."
              className="flex-1 bg-surface-container px-4 py-2.5 rounded-xl text-on-surface font-body outline-none ring-1 ring-primary/30 focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleCreateItem}
              disabled={!newItemText.trim() || createItem.isPending}
              className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-headline font-semibold text-sm disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => { setShowAddItem(false); setNewItemText(""); }}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant font-headline font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddItem(true)}
            className="w-full flex items-center justify-center gap-2 p-4 bg-surface-container-low rounded-2xl hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <Plus className="w-5 h-5" />
            <span className="font-headline font-semibold">Add Item</span>
          </button>
        )}
      </div>

      {/* Text fallback for browsers without Web Speech API */}
      {!voiceSupported && (
        <div className="fixed bottom-44 left-0 w-full px-6 flex justify-center z-30">
          <div className="bg-surface-container backdrop-blur-xl p-3 rounded-2xl w-full max-w-md flex items-center gap-2 shadow-lg">
            <input
              type="text"
              value={textFallback}
              onChange={(e) => setTextFallback(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
              placeholder="Type what you completed..."
              className="flex-1 bg-transparent px-3 py-2 text-on-surface font-body outline-none"
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textFallback.trim() || voiceCheck.isPending}
              className="p-2 rounded-full bg-primary text-on-primary disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Voice/Camera HUD */}
      <div className="fixed bottom-24 left-0 w-full px-6 flex justify-center items-end pointer-events-none z-30">
        <div className="bg-surface-variant/60 backdrop-blur-xl p-6 rounded-[2.5rem] flex items-center justify-center gap-8 pointer-events-auto shadow-2xl">
          {/* Camera / Photo Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAiProcessing}
            className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
          >
            <Camera className="w-6 h-6" />
          </button>

          {/* Mic Button */}
          <div className="relative">
            <button
              onClick={handleMicPress}
              disabled={isAiProcessing}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl z-10 relative transition-all disabled:opacity-50 ${
                isListening
                  ? "bg-gradient-to-br from-error to-error-container text-on-error animate-pulse"
                  : "bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary"
              }`}
            >
              <Mic className="w-10 h-10" />
            </button>
            {/* Decorative waveform — only when listening */}
            {isListening && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
