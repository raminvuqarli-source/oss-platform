import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createApiError } from "./error-handler";

const DEMO_TOKEN_KEY = "oss_demo_token";

export function getDemoToken(): string | null {
  try { return sessionStorage.getItem(DEMO_TOKEN_KEY); } catch { return null; }
}

export function setDemoToken(token: string): void {
  try { sessionStorage.setItem(DEMO_TOKEN_KEY, token); } catch {}
}

export function clearDemoToken(): void {
  try { sessionStorage.removeItem(DEMO_TOKEN_KEY); } catch {}
}

function getDemoHeaders(): Record<string, string> {
  const token = getDemoToken();
  return token ? { "X-Demo-Token": token } : {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw createApiError(res, text);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = { ...getDemoHeaders() };
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: getDemoHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (res.status === 401) {
      // Session expired — signal global handler
      handleSessionExpired();
      throw createApiError(res, "Session expired");
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

let sessionExpiredHandled = false;

function handleSessionExpired() {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;

  // Clear cache and redirect to login after a short delay to avoid React batching issues
  setTimeout(() => {
    clearDemoToken();
    queryClient.clear();
    sessionExpiredHandled = false;
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }, 300);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
