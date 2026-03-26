"use client";

import { useState } from "react";
import Link from "next/link";
import { ListChecks, PlusCircle, Mic } from "lucide-react";
import { useProjects, useCreateProject } from "@/lib/hooks";
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

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects();
  const createProject = useCreateProject();
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState("");

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
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className={`bg-surface-container-low rounded-xl p-6 transition-all hover:bg-surface-container-high group block ${
              isHighPriority(project.status)
                ? "border-l-4 border-tertiary"
                : ""
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
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
              </div>
              <StatusBadge
                status={project.status}
                progress={project.progress_percentage}
              />
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
          </Link>
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
