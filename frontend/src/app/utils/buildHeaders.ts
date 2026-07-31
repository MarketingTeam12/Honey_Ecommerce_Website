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

  const isMockToken = accessToken?.startsWith('mock-token-');
  const looksLikeJWT = accessToken && !isMockToken && accessToken.includes('.');

  if (looksLikeJWT) {
    headers.Authorization = `Bearer ${accessToken}`;
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
