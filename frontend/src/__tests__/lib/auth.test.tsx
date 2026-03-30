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
    // Suppress console.error for the expected error
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

  it("loginAsGuest stores token and sets user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.loginAsGuest();
    });

    expect(localStorage.getItem("auth_token")).toBe("mock-guest-token");
    expect(result.current.user).toEqual(
      expect.objectContaining({ provider: "guest" })
    );
    expect(result.current.token).toBe("mock-guest-token");
  });

  it("loginWithGoogle stores token and sets user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.loginWithGoogle("mock-google-id-token");
    });

    expect(localStorage.getItem("auth_token")).toBe("mock-jwt-token");
    expect(result.current.user).toEqual(
      expect.objectContaining({ provider: "google" })
    );
    expect(result.current.token).toBe("mock-jwt-token");
  });

  it("logout clears token and user", async () => {
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
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  it("restores user from localStorage on mount", async () => {
    localStorage.setItem("auth_token", "valid-token");

    // The default /auth/me handler returns mockUser for any request
    // Override to check for our specific token
    server.use(
      http.get(`${API}/auth/me`, ({ request }) => {
        const auth = request.headers.get("Authorization");
        if (auth === "Bearer valid-token") {
          return HttpResponse.json({
            user: {
              id: 1,
              email: "restored@example.com",
              name: "Restored User",
              avatar_url: null,
              provider: "google",
            },
          });
        }
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(
      expect.objectContaining({ email: "restored@example.com" })
    );
    expect(result.current.token).toBe("valid-token");
  });

  it("clears invalid token on mount when /auth/me returns 401", async () => {
    localStorage.setItem("auth_token", "invalid-token");

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
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
  });
});
