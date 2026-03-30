import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useProjects,
  useProject,
  useChecklists,
  useItems,
  useCreateProject,
  useDeleteProject,
  useToggleItem,
  useVoiceCheck,
  useAssistant,
} from "@/lib/hooks";
import { server, mockProject, mockChecklist, mockItems } from "../setup/msw-handlers";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";

const API = "http://localhost:3001/api/v1";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("Query hooks", () => {
  it("useProjects fetches and returns project list", async () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockProject]);
  });

  it("useProject fetches single project by id", async () => {
    const { result } = renderHook(() => useProject(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProject);
  });

  it("useChecklists fetches checklists for a project", async () => {
    const { result } = renderHook(() => useChecklists(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockChecklist]);
  });

  it("useItems fetches items for a checklist", async () => {
    const { result } = renderHook(() => useItems(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockItems);
  });
});

describe("Mutation hooks", () => {
  it("useCreateProject creates project and returns it", async () => {
    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper(),
    });

    let created: unknown;
    await waitFor(async () => {
      created = await result.current.mutateAsync({ name: "New Project" });
    });

    expect(created).toEqual(
      expect.objectContaining({ name: "New Project", id: 99 })
    );
  });

  it("useDeleteProject deletes project", async () => {
    server.use(
      http.delete(`${API}/projects/:id`, () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useDeleteProject(), {
      wrapper: createWrapper(),
    });

    await waitFor(async () => {
      await result.current.mutateAsync(1);
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it("useToggleItem toggles item completion", async () => {
    const { result } = renderHook(() => useToggleItem(1), {
      wrapper: createWrapper(),
    });

    let toggled: unknown;
    await waitFor(async () => {
      toggled = await result.current.mutateAsync({
        itemId: 1,
        completed: true,
      });
    });

    expect(toggled).toEqual(
      expect.objectContaining({ completed: true })
    );
  });

  it("useVoiceCheck sends transcript and returns checked items", async () => {
    const { result } = renderHook(() => useVoiceCheck(1), {
      wrapper: createWrapper(),
    });

    let response: unknown;
    await waitFor(async () => {
      response = await result.current.mutateAsync("buy groceries done");
    });

    expect(response).toEqual(
      expect.objectContaining({
        checked_items: expect.arrayContaining([
          expect.objectContaining({ text: "Buy groceries" }),
        ]),
        reasoning: expect.any(String),
      })
    );
  });

  it("useAssistant sends question and returns response", async () => {
    const { result } = renderHook(() => useAssistant(1), {
      wrapper: createWrapper(),
    });

    let response: unknown;
    await waitFor(async () => {
      response = await result.current.mutateAsync(
        "How many items are remaining?"
      );
    });

    expect(response).toEqual(
      expect.objectContaining({
        answer: "You have 2 items remaining.",
        related_items: expect.any(Array),
      })
    );
  });
});
