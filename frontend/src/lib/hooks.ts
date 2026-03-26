"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "./api";
import type { Project, Checklist, Item } from "./types";

// ── Queries ──

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => apiFetch<Project[]>("/projects"),
  });
}

export function useProject(id: number | string) {
  return useQuery<Project>({
    queryKey: ["projects", id],
    queryFn: () => apiFetch<Project>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useChecklists(projectId: number | string) {
  return useQuery<Checklist[]>({
    queryKey: ["projects", projectId, "checklists"],
    queryFn: () =>
      apiFetch<Checklist[]>(`/projects/${projectId}/checklists`),
    enabled: !!projectId,
  });
}

export function useChecklist(projectId: number | string, id: number | string) {
  return useQuery<Checklist>({
    queryKey: ["projects", projectId, "checklists", id],
    queryFn: () =>
      apiFetch<Checklist>(`/projects/${projectId}/checklists/${id}`),
    enabled: !!projectId && !!id,
  });
}

export function useItems(checklistId: number | string) {
  return useQuery<Item[]>({
    queryKey: ["checklists", checklistId, "items"],
    queryFn: () => apiFetch<Item[]>(`/checklists/${checklistId}/items`),
    enabled: !!checklistId,
  });
}

// ── Mutations ──

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; status?: string }) =>
      apiFetch<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({ project: data }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject(id: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) =>
      apiFetch<Project>(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ project: data }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      apiFetch<void>(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCreateChecklist(projectId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiFetch<Checklist>(`/projects/${projectId}/checklists`, {
        method: "POST",
        body: JSON.stringify({ checklist: data }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["projects", projectId, "checklists"],
      });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateChecklist(
  projectId: number | string,
  id: number | string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Checklist>) =>
      apiFetch<Checklist>(`/projects/${projectId}/checklists/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ checklist: data }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["projects", projectId, "checklists"],
      });
    },
  });
}

export function useDeleteChecklist(projectId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      apiFetch<void>(`/projects/${projectId}/checklists/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["projects", projectId, "checklists"],
      });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCreateItem(checklistId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { text: string; priority?: string }) =>
      apiFetch<Item>(`/checklists/${checklistId}/items`, {
        method: "POST",
        body: JSON.stringify({ item: data }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["checklists", checklistId, "items"],
      });
    },
  });
}

export function useToggleItem(checklistId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      completed,
    }: {
      itemId: number | string;
      completed: boolean;
    }) =>
      apiFetch<Item>(`/checklists/${checklistId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ item: { completed } }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["checklists", checklistId, "items"],
      });
    },
  });
}

export function useDeleteItem(checklistId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number | string) =>
      apiFetch<void>(`/checklists/${checklistId}/items/${itemId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["checklists", checklistId, "items"],
      });
    },
  });
}
