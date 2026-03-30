import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const API = "http://localhost:3001/api/v1";

export const mockUser = {
  id: 1,
  email: "test@example.com",
  name: "Test User",
  avatar_url: null,
  provider: "google" as const,
};

export const mockGuestUser = {
  id: 2,
  email: null,
  name: "Guest",
  avatar_url: null,
  provider: "guest" as const,
};

export const mockProject = {
  id: 1,
  name: "Test Project",
  status: "in_progress",
  checklists_count: 1,
  items_count: 3,
  completed_items_count: 1,
  progress_percentage: 33.3,
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
};

export const mockChecklist = {
  id: 1,
  project_id: 1,
  name: "Test Checklist",
  description: "A test checklist",
  icon: "countertops",
  position: 0,
  items_count: 3,
  remaining_count: 2,
  progress_percentage: 33.3,
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
};

export const mockItems = [
  {
    id: 1,
    checklist_id: 1,
    text: "Buy groceries",
    completed: false,
    completed_via: null,
    completed_at: null,
    position: 0,
    priority: "normal",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: 2,
    checklist_id: 1,
    text: "Clean house",
    completed: true,
    completed_via: "manual",
    completed_at: "2026-03-02T00:00:00Z",
    position: 1,
    priority: "high",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-02T00:00:00Z",
  },
  {
    id: 3,
    checklist_id: 1,
    text: "Walk the dog",
    completed: false,
    completed_via: null,
    completed_at: null,
    position: 2,
    priority: "low",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
];

export const handlers = [
  // Auth
  http.get(`${API}/auth/me`, () => {
    return HttpResponse.json({ user: mockUser });
  }),
  http.post(`${API}/auth/google`, () => {
    return HttpResponse.json({ token: "mock-jwt-token", user: mockUser });
  }),
  http.post(`${API}/auth/guest`, () => {
    return HttpResponse.json({ token: "mock-guest-token", user: mockGuestUser });
  }),

  // Projects
  http.get(`${API}/projects`, () => {
    return HttpResponse.json([mockProject]);
  }),
  http.get(`${API}/projects/:id`, () => {
    return HttpResponse.json(mockProject);
  }),
  http.post(`${API}/projects`, async ({ request }) => {
    const body = (await request.json()) as Record<string, Record<string, string>>;
    return HttpResponse.json(
      { ...mockProject, id: 99, name: body.project.name },
      { status: 201 }
    );
  }),
  http.patch(`${API}/projects/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, Record<string, string>>;
    return HttpResponse.json({ ...mockProject, ...body.project });
  }),
  http.delete(`${API}/projects/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Checklists
  http.get(`${API}/projects/:projectId/checklists`, () => {
    return HttpResponse.json([mockChecklist]);
  }),
  http.get(`${API}/projects/:projectId/checklists/:id`, () => {
    return HttpResponse.json(mockChecklist);
  }),
  http.post(`${API}/projects/:projectId/checklists`, async ({ request }) => {
    const body = (await request.json()) as Record<string, Record<string, string>>;
    return HttpResponse.json(
      { ...mockChecklist, id: 99, name: body.checklist.name },
      { status: 201 }
    );
  }),
  http.delete(`${API}/projects/:projectId/checklists/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Items
  http.get(`${API}/checklists/:checklistId/items`, () => {
    return HttpResponse.json(mockItems);
  }),
  http.post(`${API}/checklists/:checklistId/items`, async ({ request }) => {
    const body = (await request.json()) as Record<string, Record<string, string>>;
    return HttpResponse.json(
      { ...mockItems[0], id: 99, text: body.item.text },
      { status: 201 }
    );
  }),
  http.patch(`${API}/checklists/:checklistId/items/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, Record<string, string>>;
    return HttpResponse.json({ ...mockItems[0], ...body.item });
  }),
  http.delete(`${API}/checklists/:checklistId/items/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // AI
  http.post(`${API}/checklists/:checklistId/voice`, () => {
    return HttpResponse.json({
      checked_items: [mockItems[0]],
      reasoning: "Matched 'Buy groceries'",
    });
  }),
  http.post(`${API}/checklists/:checklistId/photo`, () => {
    return HttpResponse.json({
      checked_items: [mockItems[0]],
      reasoning: "Detected groceries in photo",
    });
  }),
  http.post(`${API}/checklists/:checklistId/assistant`, () => {
    return HttpResponse.json({
      answer: "You have 2 items remaining.",
      related_items: mockItems,
    });
  }),
];

export const server = setupServer(...handlers);
