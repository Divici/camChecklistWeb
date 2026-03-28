"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch, API_BASE } from "./api";
import type { Project, Checklist, Item } from "./types";

// ── Helpers ──

/** Invalidate all queries that derive from item/checklist/project state */
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
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["projects"], exact: true });
      const previous = qc.getQueryData<Project[]>(["projects"]);
      if (previous) {
        qc.setQueryData<Project[]>(["projects"], previous.map((p) =>
          String(p.id) === String(id) ? { ...p, ...data } : p
        ));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["projects"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["projects", id] });
      qc.invalidateQueries({ queryKey: ["projects"], exact: true });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      apiFetch<void>(`/projects/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["projects"], exact: true });
      const previous = qc.getQueryData<Project[]>(["projects"]);
      if (previous) {
        qc.setQueryData<Project[]>(["projects"], previous.filter((p) =>
          String(p.id) !== String(id)
        ));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(["projects"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["projects"], exact: true });
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
    onMutate: async (data) => {
      const key = ["projects", projectId, "checklists"];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Checklist[]>(key);
      if (previous) {
        qc.setQueryData<Checklist[]>(key, previous.map((c) =>
          String(c.id) === String(id) ? { ...c, ...data } : c
        ));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["projects", projectId, "checklists"], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "checklists"] });
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
    onMutate: async (id) => {
      const key = ["projects", projectId, "checklists"];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Checklist[]>(key);
      if (previous) {
        qc.setQueryData<Checklist[]>(key, previous.filter((c) =>
          String(c.id) !== String(id)
        ));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["projects", projectId, "checklists"], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "checklists"] });
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
      invalidateAll(qc, checklistId, projectId);
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
    onMutate: async ({ itemId, completed }) => {
      const key = ["checklists", checklistId, "items"];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Item[]>(key);
      if (previous) {
        qc.setQueryData<Item[]>(key, previous.map((item) =>
          String(item.id) === String(itemId)
            ? { ...item, completed, completed_at: completed ? new Date().toISOString() : null }
            : item
        ));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["checklists", checklistId, "items"], context.previous);
      }
    },
    onSettled: () => {
      invalidateAll(qc, checklistId, projectId);
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
    onMutate: async ({ itemId, data }) => {
      const key = ["checklists", checklistId, "items"];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Item[]>(key);
      if (previous) {
        qc.setQueryData<Item[]>(key, previous.map((item) =>
          String(item.id) === String(itemId) ? { ...item, ...data } : item
        ));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["checklists", checklistId, "items"], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["checklists", checklistId, "items"] });
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
    onMutate: async (itemId) => {
      const key = ["checklists", checklistId, "items"];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Item[]>(key);
      if (previous) {
        qc.setQueryData<Item[]>(key, previous.filter((item) =>
          String(item.id) !== String(itemId)
        ));
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["checklists", checklistId, "items"], context.previous);
      }
    },
    onSettled: () => {
      invalidateAll(qc, checklistId, projectId);
    },
  });
}

// ── AI Mutations ──

export function useVoiceCheck(checklistId: number | string, projectId?: number | string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transcript: string) => {
      return apiFetch<{ checked_items: Item[]; reasoning: string }>(
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
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json() as Promise<{ checked_items: Item[]; reasoning: string }>;
    },
    onSuccess: () => {
      invalidateAll(qc, checklistId, projectId);
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
