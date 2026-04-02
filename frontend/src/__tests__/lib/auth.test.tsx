import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { server } from "../setup/msw-handlers";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";

const API = "http://localhost:3001/api/v1";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");

    consoleSpy.mockRestore();
  });

  it("isLoading becomes false after mount", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("loginAsGuest sets user from response", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.loginAsGuest();
    });

    expect(result.current.user).toEqual(
      expect.objectContaining({ provider: "guest" })
    );
  });

  it("loginAsGuest sends credentials: include", async () => {
    let capturedCredentials: RequestCredentials | undefined;
    server.use(
      http.post(`${API}/auth/guest`, ({ request }) => {
        capturedCredentials = request.credentials;
        return HttpResponse.json({
          user: { id: 2, email: null, name: "Guest", avatar_url: null, provider: "guest" },
        });
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.loginAsGuest();
    });

    expect(capturedCredentials).toBe("include");
  });

  it("loginWithGoogle sets user from response", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.loginWithGoogle("mock-google-id-token");
    });

    expect(result.current.user).toEqual(
      expect.objectContaining({ provider: "google" })
    );
  });

  it("logout clears user and calls logout endpoint", async () => {
    let logoutCalled = false;
    server.use(
      http.delete(`${API}/auth/logout`, () => {
        logoutCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Login first
    await act(async () => {
      await result.current.loginAsGuest();
    });
    expect(result.current.user).not.toBeNull();

    // Logout
    await act(async () => {
      result.current.logout();
    });

    await waitFor(() => {
      expect(logoutCalled).toBe(true);
    });
    expect(result.current.user).toBeNull();
  });

  it("restores user from cookie session on mount via /auth/me", async () => {
    server.use(
      http.get(`${API}/auth/me`, () => {
        return HttpResponse.json({
          user: {
            id: 1,
            email: "restored@example.com",
            name: "Restored User",
            avatar_url: null,
            provider: "google",
          },
        });
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(
      expect.objectContaining({ email: "restored@example.com" })
    );
  });

  it("sets user to null on mount when /auth/me returns 401", async () => {
    server.use(
      http.get(`${API}/auth/me`, () => {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });
});
