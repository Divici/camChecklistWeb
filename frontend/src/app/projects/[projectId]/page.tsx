"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ListPlus,
  PlusCircle,
  ClipboardList,
  Paintbrush,
  Zap,
  Package,
  Wrench,
  BookOpen,
  Trash2,
  X,
} from "lucide-react";
import { useProject, useChecklists, useCreateChecklist, useDeleteChecklist } from "@/lib/hooks";
import { ProgressRing } from "@/components/progress-ring";
import { ProgressBar } from "@/components/progress-bar";
import { PageSpinner } from "@/components/page-spinner";

const ICON_MAP: Record<string, React.ElementType> = {
  countertops: Package,
  format_paint: Paintbrush,
  electrical_services: Zap,
  clipboard: ClipboardList,
  wrench: Wrench,
  book: BookOpen,
};

const ICON_BG_COLORS = [
  "bg-primary-fixed-dim",
  "bg-secondary-container",
  "bg-tertiary-fixed",
  "bg-primary-fixed",
  "bg-secondary-fixed-dim",
  "bg-tertiary-fixed-dim",
];

const RING_COLORS = [
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "text-primary-container",
];

function getIconBg(index: number) {
  return ICON_BG_COLORS[index % ICON_BG_COLORS.length];
}

function getRingColor(index: number) {
  return RING_COLORS[index % RING_COLORS.length];
}

function getIcon(iconName: string | null, index: number) {
  if (iconName && ICON_MAP[iconName]) {
    const Icon = ICON_MAP[iconName];
    return <Icon className="w-6 h-6" />;
  }
  const fallbackIcons = [Package, Paintbrush, Zap, ClipboardList, Wrench, BookOpen];
  const FallbackIcon = fallbackIcons[index % fallbackIcons.length];
  return <FallbackIcon className="w-6 h-6" />;
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: checklists, isLoading: checklistsLoading } = useChecklists(projectId);
  const createChecklist = useCreateChecklist(projectId);
  const deleteChecklist = useDeleteChecklist(projectId);
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [deleteChecklistId, setDeleteChecklistId] = useState<number | null>(null);

  const isLoading = projectLoading || checklistsLoading;

  function handleCreate() {
    if (!newName.trim()) return;
    createChecklist.mutate(
      { name: newName.trim(), description: newDesc.trim() || undefined },
      {
        onSuccess: () => {
          setNewName("");
          setNewDesc("");
          setShowDialog(false);
        },
      }
    );
  }

  const totalItems =
    checklists?.reduce((sum, c) => sum + c.items_count, 0) ?? 0;
  const totalRemaining =
    checklists?.reduce((sum, c) => sum + c.remaining_count, 0) ?? 0;
  const completedChecklists =
    checklists?.filter((c) => c.progress_percentage >= 100).length ?? 0;
  const activeChecklists = (checklists?.length ?? 0) - completedChecklists;

  return (
    <div className="px-6 pt-8 max-w-5xl mx-auto">
      {/* Header */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button
              onClick={() => router.push("/projects")}
              className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-3"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <span className="font-label text-xs tracking-wider uppercase text-outline mb-1 block">
              Active Project
            </span>
            <h2 className="font-headline font-bold text-4xl text-on-surface tracking-tight leading-none">
              {project?.name ?? "\u00A0"}
            </h2>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="bg-primary text-on-primary rounded-xl px-6 h-[3.5rem] flex items-center gap-2 font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/10"
          >
            <ListPlus className="w-5 h-5" />
            Add Checklist
          </button>
        </div>
      </section>

      {isLoading && <PageSpinner />}

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checklists?.map((checklist, index) => (
          <Link
            key={checklist.id}
            href={`/projects/${projectId}/checklists/${checklist.id}`}
            className="bg-surface-container-low rounded-[2rem] p-6 group hover:bg-surface-container-high transition-all duration-300 block relative"
          >
            <div className="flex justify-between items-start mb-8">
              <div
                className={`w-12 h-12 rounded-2xl ${getIconBg(index)} flex items-center justify-center`}
              >
                {getIcon(checklist.icon, index)}
              </div>
              <ProgressRing
                value={checklist.progress_percentage}
                colorClass={getRingColor(index)}
              />
            </div>
            <h3 className="font-headline font-bold text-xl mb-2 text-on-surface">
              {checklist.name}
            </h3>
            {checklist.description && (
              <p className="font-body text-on-surface-variant text-sm mb-6 leading-relaxed line-clamp-2">
                {checklist.description}
              </p>
            )}
            {!checklist.description && <div className="mb-6" />}
            <div className="flex items-center justify-between">
              <span className="font-label text-[10px] tracking-wider uppercase text-outline">
                {checklist.items_count} Items &bull;{" "}
                {checklist.remaining_count} Remaining
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteChecklistId(checklist.id);
                }}
                className="p-2 rounded-lg hover:bg-error-container transition-colors text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Delete checklist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Delete Confirmation Overlay */}
            {deleteChecklistId === checklist.id && (
              <div
                className="absolute inset-0 bg-surface-container-low/95 rounded-[2rem] flex flex-col items-center justify-center z-20 backdrop-blur-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <p className="font-headline font-bold text-lg text-on-surface mb-2">
                  Delete this checklist?
                </p>
                <p className="text-on-surface-variant text-sm mb-6">
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteChecklistId(null);
                    }}
                    className="px-5 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteChecklist.mutate(checklist.id);
                      setDeleteChecklistId(null);
                    }}
                    className="bg-error text-on-error px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </Link>
        ))}

        {/* Project Overview Card */}
        {checklists && checklists.length > 0 && (
          <div className="lg:col-span-2 bg-surface-container-low rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 w-full">
              <h3 className="font-headline font-bold text-2xl mb-4">
                Project Overview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-body">
                    Overall Progress
                  </span>
                  <span className="font-bold text-primary">
                    {Math.round(project?.progress_percentage ?? 0)}%
                  </span>
                </div>
                <ProgressBar value={project?.progress_percentage ?? 0} />
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-black text-on-surface">
                      {activeChecklists}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-outline">
                      Active
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-on-surface">
                      {completedChecklists}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-outline">
                      Done
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-on-surface">
                      {totalItems}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-outline">
                      Tasks
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Checklist Card */}
        <button
          onClick={() => setShowDialog(true)}
          className="bg-surface-variant/40 rounded-[2rem] p-6 border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container transition-colors group"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-8 h-8 text-outline" />
          </div>
          <h4 className="font-headline font-bold text-lg text-on-surface-variant">
            New Checklist
          </h4>
          <p className="text-xs text-outline px-4 mt-2">
            Start a new voice-guided list for this project.
          </p>
        </button>
      </div>

      {/* New Checklist Dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline font-bold text-2xl text-on-surface mb-6">
              Create New Checklist
            </h3>
            <label className="font-label text-[10px] tracking-wider uppercase text-on-surface-variant mb-2 block">
              Checklist Name
            </label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Kitchen Prep"
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 font-body mb-4"
            />
            <label className="font-label text-[10px] tracking-wider uppercase text-on-surface-variant mb-2 block">
              Description (optional)
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What is this checklist for?"
              rows={3}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 font-body resize-none"
            />
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowDialog(false)}
                className="px-6 py-3 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || createChecklist.isPending}
                className="bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {createChecklist.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
