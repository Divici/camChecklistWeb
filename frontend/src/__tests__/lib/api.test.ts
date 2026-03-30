import { apiFetch } from "@/lib/api";
import { server } from "../setup/msw-handlers";
import { http, HttpResponse } from "msw";

const API = "http://localhost:3001/api/v1";

describe("apiFetch", () => {
  it("sends Authorization header when token exists in localStorage", async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${API}/test`, ({ request }) => {
        capturedAuth = request.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      })
    );

    localStorage.setItem("auth_token", "my-token");
    await apiFetch("/test");

    expect(capturedAuth).toBe("Bearer my-token");
  });

  it("omits Authorization header when no token in localStorage", async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${API}/test`, ({ request }) => {
        capturedAuth = request.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      })
    );

    await apiFetch("/test");

    expect(capturedAuth).toBeNull();
  });

  it("clears token and throws on 401 response", async () => {
    localStorage.setItem("auth_token", "expired-token");

    // Mock window.location to prevent actual navigation
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
      })
    );

    await expect(apiFetch("/protected")).rejects.toThrow("Unauthorized");
    expect(localStorage.getItem("auth_token")).toBeNull();

    // Restore original location
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
