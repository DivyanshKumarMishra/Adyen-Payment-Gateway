import { useState, useCallback } from "react";

export interface FetchOptions extends RequestInit {
  skipAuthCheck?: boolean; // true for pre-auth calls (login, me on load, logout)
}

// Module-level 401 handler — registered once by AuthProvider
let onUnauthorized: () => Promise<void> = async () => {};
export function setUnauthorizedHandler(fn: () => Promise<void>) {
  onUnauthorized = fn;
}

export function useFetch() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const execute = useCallback(async <T = unknown>(
    input: RequestInfo | URL,
    { skipAuthCheck = false, ...init }: FetchOptions = {},
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(input, { credentials: "include", ...init });

      if (res.status === 401 && !skipAuthCheck) {
        console.log("[useFetch] 401 received — session expired, logging out");
        await onUnauthorized();
        return null;
      }

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) return null;

      const json = await res.json() as T;
      return json;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useFetch] Error:", message);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}
