"use client";

import { useState } from "react";
import Link from "next/link";
import { ListChecks, PlusCircle, Mic, Trash2, Pencil, X, Check } from "lucide-react";
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from "@/lib/hooks";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";

function progressColor(progress: number, status: string) {
  const s = status.toLowerCase();
  if (s === "high_priority" || s === "high priority") return "bg-tertiary";
  if (progress >= 60) return "bg-secondary";
  return "bg-primary";
}

function progressTextColor(progress: number, status: string) {
  const s = status.toLowerCase();
  if (s === "high_priority" || s === "high priority") return "text-tertiary";
  if (progress >= 60) return "text-secondary";
  return "text-primary";
}

function isHighPriority(status: string) {
  const s = status.toLowerCase();
  return s === "high_priority" || s === "high priority";
}

function ProjectCard({
  project,
  editingId,
  editName,
  setEditingId,
  setEditName,
  deleteConfirmId,
  setDeleteConfirmId,
  deleteProject,
}: {
  project: { id: number; name: string; status: string; checklists_count: number; progress_percentage: number; completed_items_count: number; items_count: number };
  editingId: number | null;
  editName: string;
  setEditingId: (id: number | null) => void;
  setEditName: (name: string) => void;
  deleteConfirmId: number | null;
  setDeleteConfirmId: (id: number | null) => void;
  deleteProject: { mutate: (id: number) => void; isPending: boolean };
}) {
  const updateProject = useUpdateProject(project.id);
  const isEditing = editingId === project.id;
  const isDeleting = deleteConfirmId === project.id;

  function handleSaveEdit() {
    if (!editName.trim()) return;
    updateProject.mutate(
      { name: editName.trim() },
      { onSuccess: () => setEditingId(null) }
    );
  }

  return (
    <Link
      key={project.id}
      href={`/projects/${project.id}`}
      className={`bg-surface-container-low rounded-xl p-6 transition-all hover:bg-surface-container-high group block relative ${
        isHighPriority(project.status) ? "border-l-4 border-tertiary" : ""
      }`}
    >
      {/* Action buttons — below progress bar */}

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 mr-4">
          {isEditing ? (
            <div
              className="flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="font-headline font-bold text-xl text-on-surface bg-surface-container-low rounded-lg px-3 py-1 border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveEdit();
                }}
                disabled={!editName.trim() || updateProject.isPending}
                className="p-1.5 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingId(null);
                }}
                className="p-1.5 rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="font-headline font-bold text-xl text-on-surface group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <ListChecks className="w-4 h-4 text-outline" />
                <span className="font-label text-xs tracking-tight text-on-surface-variant uppercase">
                  {project.checklists_count} Checklist
                  {project.checklists_count === 1 ? "" : "s"}
                </span>
              </div>
            </>
          )}
        </div>
        {!isEditing && (
          <StatusBadge
            status={project.status}
            progress={project.progress_percentage}
          />
        )}
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="font-label text-xs font-semibold text-outline">
            {project.completed_items_count}/{project.items_count} tasks
            completed
          </span>
          <span
            className={`font-headline font-bold italic ${progressTextColor(project.progress_percentage, project.status)}`}
          >
            {Math.round(project.progress_percentage)}%
          </span>
        </div>
        <ProgressBar
          value={project.progress_percentage}
          colorClass={progressColor(
            project.progress_percentage,
            project.status
          )}
        />
      </div>

      {/* Action buttons */}
      {!isEditing && !isDeleting && (
        <div className="flex justify-end items-center gap-1 mt-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditingId(project.id);
              setEditName(project.name);
            }}
            className="p-2 rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-primary cursor-pointer"
            aria-label="Edit project"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteConfirmId(project.id);
            }}
            className="p-2 rounded-lg hover:bg-error-container transition-colors text-on-surface-variant hover:text-error cursor-pointer"
            aria-label="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {isDeleting && (
        <div
          className="absolute inset-0 bg-surface-container-low/95 rounded-xl flex flex-col items-center justify-center z-20 backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <p className="font-headline font-bold text-lg text-on-surface mb-2">
            Delete this project?
          </p>
          <p className="text-on-surface-variant text-sm mb-6">
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteConfirmId(null);
              }}
              className="px-5 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteProject.mutate(project.id);
                setDeleteConfirmId(null);
              }}
              className="bg-error text-on-error px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </Link>
  );
}

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  function handleCreate() {
    if (!newName.trim()) return;
    createProject.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => {
          setNewName("");
          setShowDialog(false);
        },
      }
    );
  }

  return (
    <div className="px-6 pt-8 max-w-2xl mx-auto">
      {/* Editorial Header */}
      <section className="mb-10">
        <span className="font-label text-xs tracking-wider uppercase text-outline mb-2 block">
          Active Workspace
        </span>
        <h2 className="font-headline font-bold text-[1.75rem] leading-tight text-on-surface">
          Your Projects
        </h2>
        <p className="text-on-surface-variant mt-2 text-lg">
          {isLoading
            ? "Loading projects..."
            : error
              ? "Could not load projects."
              : `You have ${projects?.length ?? 0} active project${projects?.length === 1 ? "" : "s"} today.`}
        </p>
      </section>

      {/* Project Cards */}
      <div className="grid grid-cols-1 gap-6">
        {projects?.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            editingId={editingId}
            editName={editName}
            setEditingId={setEditingId}
            setEditName={setEditName}
            deleteConfirmId={deleteConfirmId}
            setDeleteConfirmId={setDeleteConfirmId}
            deleteProject={deleteProject}
          />
        ))}

        {/* New Project Card */}
        <button
          onClick={() => setShowDialog(true)}
          className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant rounded-xl p-8 hover:bg-surface-container-low transition-colors group"
        >
          <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-8 h-8 text-primary" />
          </div>
          <span className="font-headline font-bold text-lg text-primary">
            New Project
          </span>
          <span className="font-body text-sm text-outline mt-1">
            Start a fresh checklist journey
          </span>
        </button>
      </div>

      {/* Voice Assistant Tips */}
      <section className="mt-12 mb-8 bg-surface-bright rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="font-headline font-bold text-lg mb-2">
            Voice Assistant Tips
          </h4>
          <p className="text-on-surface-variant opacity-80 leading-relaxed">
            Try saying{" "}
            <span className="text-primary font-semibold italic">
              &quot;Add a task to Home Renovation&quot;
            </span>{" "}
            while you&apos;re on the move.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
          <Mic className="w-[120px] h-[120px] text-primary" />
        </div>
      </section>

      {/* New Project Dialog */}
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
              Create New Project
            </h3>
            <label className="font-label text-[10px] tracking-wider uppercase text-on-surface-variant mb-2 block">
              Project Name
            </label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Home Renovation"
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 font-body"
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
                disabled={!newName.trim() || createProject.isPending}
                className="bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {createProject.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
