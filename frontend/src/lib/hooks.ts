"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch, API_BASE } from "./api";
import type { Project, Checklist, Item } from "./types";

// ── Helpers ──

function invalidateAll(
  qc: ReturnType<typeof useQueryClient>,
  checklistId?: number | string,
  projectId?: number | string
) {
  if (checklistId) {
    qc.invalidateQueries({ queryKey: ["checklists", checklistId, "items"] });
  }
  if (projectId) {
    qc.invalidateQueries({ queryKey: ["projects", projectId, "checklists"] });
    qc.invalidateQueries({ queryKey: ["projects", projectId] });
  }
  qc.invalidateQueries({ queryKey: ["projects"], exact: true });
}

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

// ── Project Mutations ──

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; status?: string }) =>
      apiFetch<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({ project: data }),
      }),
    onSuccess: (newProject) => {
      qc.setQueryData<Project[]>(["projects"], (old) =>
        old ? [...old, newProject] : [newProject]
      );
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
    onSuccess: (updated) => {
      qc.setQueryData<Project[]>(["projects"], (old) =>
        old?.map((p) => (String(p.id) === String(id) ? updated : p))
      );
      qc.setQueryData(["projects", id], updated);
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      apiFetch<void>(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      qc.setQueryData<Project[]>(["projects"], (old) =>
        old?.filter((p) => String(p.id) !== String(id))
      );
    },
  });
}

// ── Checklist Mutations ──

export function useCreateChecklist(projectId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiFetch<Checklist>(`/projects/${projectId}/checklists`, {
        method: "POST",
        body: JSON.stringify({ checklist: data }),
      }),
    onSuccess: (newChecklist) => {
      qc.setQueryData<Checklist[]>(
        ["projects", projectId, "checklists"],
        (old) => (old ? [...old, newChecklist] : [newChecklist])
      );
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"], exact: true });
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
    onSuccess: (updated) => {
      qc.setQueryData<Checklist[]>(
        ["projects", projectId, "checklists"],
        (old) => old?.map((c) => (String(c.id) === String(id) ? updated : c))
      );
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
    onSuccess: (_data, id) => {
      qc.setQueryData<Checklist[]>(
        ["projects", projectId, "checklists"],
        (old) => old?.filter((c) => String(c.id) !== String(id))
      );
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"], exact: true });
    },
  });
}

// ── Item Mutations ──

export function useCreateItem(checklistId: number | string, projectId?: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { text: string; priority?: string }) =>
      apiFetch<Item>(`/checklists/${checklistId}/items`, {
        method: "POST",
        body: JSON.stringify({ item: data }),
      }),
    onSuccess: (newItem) => {
      qc.setQueryData<Item[]>(
        ["checklists", checklistId, "items"],
        (old) => (old ? [...old, newItem] : [newItem])
      );
      invalidateAll(qc, undefined, projectId);
    },
  });
}

export function useToggleItem(checklistId: number | string, projectId?: number | string) {
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
    onSuccess: (updated) => {
      qc.setQueryData<Item[]>(
        ["checklists", checklistId, "items"],
        (old) => old?.map((item) => (String(item.id) === String(updated.id) ? updated : item))
      );
      invalidateAll(qc, undefined, projectId);
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
    onSuccess: (updated) => {
      qc.setQueryData<Item[]>(
        ["checklists", checklistId, "items"],
        (old) => old?.map((item) => (String(item.id) === String(updated.id) ? updated : item))
      );
    },
  });
}

export function useDeleteItem(checklistId: number | string, projectId?: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number | string) =>
      apiFetch<void>(`/checklists/${checklistId}/items/${itemId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, itemId) => {
      qc.setQueryData<Item[]>(
        ["checklists", checklistId, "items"],
        (old) => old?.filter((item) => String(item.id) !== String(itemId))
      );
      invalidateAll(qc, undefined, projectId);
    },
  });
}

// ── AI Mutations ──

export function useVoiceCheck(checklistId: number | string, projectId?: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transcript: string) => {
      return apiFetch<{ checked_items: Item[]; deleted_items?: Item[]; reasoning: string }>(
        `/checklists/${checklistId}/voice`,
        { method: "POST", body: JSON.stringify({ transcript }) }
      );
    },
    onSuccess: () => {
      invalidateAll(qc, checklistId, projectId);
    },
  });
}

export function usePhotoCheck(checklistId: number | string, projectId?: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (imageFile: File) => {
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await fetch(
        `${API_BASE}/api/v1/checklists/${checklistId}/photo`,
        { method: "POST", body: formData }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `API error: ${res.status}`);
      }
      return res.json() as Promise<{ checked_items: Item[]; reasoning: string }>;
    },
    onSuccess: () => {
      invalidateAll(qc, checklistId, projectId);
    },
  });
}

export interface AssistantAction {
  type: "added" | "edited" | "deleted" | "completed" | "unchecked";
  item: Item;
}

export interface ContextSwitch {
  project_id: number;
  checklist_id: number;
  reason: string;
}

export interface AssistantResponse {
  answer: string;
  related_items: Item[];
  actions?: AssistantAction[];
  context_switch?: ContextSwitch;
}

export function useAssistant(checklistId: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (question: string) => {
      return apiFetch<AssistantResponse>(
        `/checklists/${checklistId}/assistant`,
        { method: "POST", body: JSON.stringify({ question }) }
      );
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
