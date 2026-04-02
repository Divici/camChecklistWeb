import { apiFetch } from "@/lib/api";
import { server } from "../setup/msw-handlers";
import { http, HttpResponse } from "msw";

const API = "http://localhost:3001/api/v1";

describe("apiFetch", () => {
  it("sends credentials: include on requests", async () => {
    let capturedCredentials: RequestCredentials | undefined;
    server.use(
      http.get(`${API}/test`, ({ request }) => {
        capturedCredentials = request.credentials;
        return HttpResponse.json({ ok: true });
      })
    );

    await apiFetch("/test");

    expect(capturedCredentials).toBe("include");
  });

  it("sends X-CSRF-Token header when csrf_token cookie exists", async () => {
    // Set a csrf_token cookie
    Object.defineProperty(document, "cookie", {
      value: "csrf_token=test-csrf-value",
      writable: true,
      configurable: true,
    });

    let capturedCsrf: string | null = null;
    server.use(
      http.get(`${API}/test-csrf`, ({ request }) => {
        capturedCsrf = request.headers.get("X-CSRF-Token");
        return HttpResponse.json({ ok: true });
      })
    );

    await apiFetch("/test-csrf");

    expect(capturedCsrf).toBe("test-csrf-value");

    // Clean up
    Object.defineProperty(document, "cookie", {
      value: "",
      writable: true,
      configurable: true,
    });
  });

  it("retries with refresh on 401 then succeeds", async () => {
    let requestCount = 0;
    let refreshCalled = false;

    server.use(
      http.get(`${API}/protected`, () => {
        requestCount++;
        if (requestCount === 1) {
          return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return HttpResponse.json({ data: "success" });
      }),
      http.post(`${API}/auth/refresh`, () => {
        refreshCalled = true;
        return HttpResponse.json({ user: { id: 1 } });
      })
    );

    const result = await apiFetch<{ data: string }>("/protected");

    expect(refreshCalled).toBe(true);
    expect(result).toEqual({ data: "success" });
  });

  it("redirects to /login after failed refresh on 401", async () => {
    const originalLocation = window.location;
    const mockLocation = { ...originalLocation, href: originalLocation.href };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    server.use(
      http.get(`${API}/protected`, () => {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }),
      http.post(`${API}/auth/refresh`, () => {
        return HttpResponse.json({ error: "Invalid" }, { status: 401 });
      })
    );

    await expect(apiFetch("/protected")).rejects.toThrow("Unauthorized");
    expect(mockLocation.href).toBe("/login");

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("parses error message from non-ok response body", async () => {
    server.use(
      http.post(`${API}/fail`, () => {
        return HttpResponse.json(
          { error: "Validation failed" },
          { status: 422 }
        );
      })
    );

    await expect(
      apiFetch("/fail", { method: "POST" })
    ).rejects.toThrow("Validation failed");
  });

  it("falls back to status code when error body has no message", async () => {
    server.use(
      http.get(`${API}/fail-no-body`, () => {
        return new HttpResponse("not json", {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        });
      })
    );

    await expect(apiFetch("/fail-no-body")).rejects.toThrow("API error: 500");
  });

  it("returns undefined for 204 responses", async () => {
    server.use(
      http.delete(`${API}/resource/1`, () => {
        return new HttpResponse(null, { status: 204 });
      })
    );

    const result = await apiFetch("/resource/1", { method: "DELETE" });
    expect(result).toBeUndefined();
  });

  it("returns parsed JSON for successful responses", async () => {
    server.use(
      http.get(`${API}/data`, () => {
        return HttpResponse.json({ id: 1, name: "Test" });
      })
    );

    const result = await apiFetch<{ id: number; name: string }>("/data");
    expect(result).toEqual({ id: 1, name: "Test" });
  });

  it("sets Content-Type to application/json by default", async () => {
    let capturedContentType: string | null = null;
    server.use(
      http.post(`${API}/json-check`, ({ request }) => {
        capturedContentType = request.headers.get("Content-Type");
        return HttpResponse.json({ ok: true });
      })
    );

    await apiFetch("/json-check", { method: "POST", body: JSON.stringify({}) });
    expect(capturedContentType).toBe("application/json");
  });
});
