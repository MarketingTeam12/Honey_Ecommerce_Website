const isLoopbackUrl = (url: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url);

const isLoopbackBrowser = () =>
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const API_BASE_URL = (() => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

  if (envUrl) {
    if (isLoopbackUrl(envUrl)) {
      if (import.meta.env.DEV && typeof window !== "undefined") {
        // In Vite dev server, use same-origin so vite.config.ts proxy handles cookies/CORS cleanly.
        return window.location.origin;
      }
      if (isLoopbackBrowser()) {
        // In local `vite preview`, there is no Vite proxy, so target the configured local API server.
        return envUrl;
      }
      console.warn(
        "[api] VITE_API_BASE_URL points to localhost in a non-localhost browser build; falling back to same origin.",
      );
    } else {
      return envUrl;
    }
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
})();

export const API_PREFIX = "/make-server-a67f0635";
export const API_URL = `${API_BASE_URL}${API_PREFIX}`;
const TOKEN_KEY = "honey_access_token";

export function toApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path.replace(
      /^https:\/\/[^/]+\/functions\/v1\/make-server-a67f0635/,
      API_URL,
    );
  }

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function installApiFetchRewrite() {
  if (typeof window === "undefined") return;

  const currentFetch = window.fetch.bind(window);
  if ((currentFetch as any).__honeyApiRewriteInstalled) return;

  const withBackendAuth = (targetUrl: string, init?: RequestInit): RequestInit | undefined => {
    if (!targetUrl.startsWith(API_URL)) return init;

    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem("demo_access_token");
    if (!token?.includes(".")) return init;

    const headers = new Headers(init?.headers);
    const currentAuth = headers.get("Authorization");

    if (!currentAuth || currentAuth === "Bearer " || currentAuth.startsWith("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return {
      ...init,
      headers,
    };
  };

  const rewrittenFetch: typeof window.fetch = (input, init) => {
    if (typeof input === "string") {
      const rewritten = toApiUrl(input);
      return currentFetch(rewritten, withBackendAuth(rewritten, init));
    }

    if (input instanceof URL) {
      const rewritten = toApiUrl(input.toString());
      return currentFetch(rewritten, withBackendAuth(rewritten, init));
    }

    if (input instanceof Request) {
      const rewritten = toApiUrl(input.url);
      if (rewritten !== input.url) {
        return currentFetch(new Request(rewritten, input), withBackendAuth(rewritten, init));
      }
    }

    return currentFetch(input, init);
  };

  (rewrittenFetch as any).__honeyApiRewriteInstalled = true;
  window.fetch = rewrittenFetch;
}
