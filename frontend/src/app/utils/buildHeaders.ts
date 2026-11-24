// Supabase/edge-function demo token initialization removed.
// This file remains only to avoid breaking existing imports.

let demoToken: string | null = null;

export async function initializeDemoToken(): Promise<void> {
  return Promise.resolve();
}



export function buildHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const storedToken =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('honey_access_token') || localStorage.getItem('token')
      : null;

  const rawToken = (accessToken && accessToken.trim()) || storedToken;

  const isMockToken = rawToken?.startsWith('mock-token-');
  const looksLikeJWT = rawToken && !isMockToken && rawToken.includes('.');

  if (looksLikeJWT) {
    headers.Authorization = `Bearer ${rawToken}`;
  } else if (isMockToken && demoToken?.includes('.')) {
    headers.Authorization = `Bearer ${demoToken}`;
  }

  return headers;
}

export async function buildHeadersAsync(accessToken?: string | null): Promise<Record<string, string>> {
  return buildHeaders(accessToken);
}

export function getBearerToken(accessToken?: string | null): string | null {
  const isMockToken = accessToken?.startsWith('mock-token-');
  const looksLikeJWT = accessToken && !isMockToken && accessToken.includes('.');
  return looksLikeJWT ? accessToken : null;
}
