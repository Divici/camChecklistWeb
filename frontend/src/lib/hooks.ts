"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch, API_BASE } from "./api";
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
      qc.invalidateQueries({ queryKey: ["checklists", checklistId, "items"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
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
      qc.invalidateQueries({ queryKey: ["checklists", checklistId, "items"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateItem(checklistId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number | string; data: { text?: string; priority?: string } }) =>
      apiFetch<Item>(`/checklists/${checklistId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ item: data }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklists", checklistId, "items"] });
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
      qc.invalidateQueries({ queryKey: ["checklists", checklistId, "items"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// ── AI Mutations ──

export function useVoiceCheck(checklistId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transcript: string) => {
      return apiFetch<{ checked_items: Item[]; reasoning: string }>(
        `/checklists/${checklistId}/voice`,
        { method: "POST", body: JSON.stringify({ transcript }) }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklists", checklistId, "items"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function usePhotoCheck(checklistId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (imageFile: File) => {
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await fetch(
        `${API_BASE}/api/v1/checklists/${checklistId}/photo`,
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json() as Promise<{ checked_items: Item[]; reasoning: string }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklists", checklistId, "items"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useAskQuestion(checklistId: number | string) {
  return useMutation({
    mutationFn: async (question: string) => {
      return apiFetch<{ answer: string; related_items: Item[] }>(
        `/checklists/${checklistId}/ask`,
        { method: "POST", body: JSON.stringify({ question }) }
      );
    },
  });
}
