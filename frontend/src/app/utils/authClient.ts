import { API_URL } from '@/app/utils/api';

type AuthCallback = (event: string, session: any | null) => void;

const TOKEN_KEY = 'honey_access_token';
const USER_KEY = 'honey_auth_user';
const listeners = new Set<AuthCallback>();

function getStoredSession() {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  if (!token || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser);
    return {
      access_token: token,
      token_type: 'bearer',
      user: {
        ...user,
        user_metadata: {
          name: user.name,
          full_name: user.name,
          phone: user.phone,
          role: user.role,
        },
        app_metadata: {
          provider: user.app_metadata?.provider || 'passport',
        },
      },
    };
  } catch {
    return null;
  }
}

function storeSession(session: any | null) {
  if (typeof window === 'undefined') return;

  if (!session?.access_token || !session?.user) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return;
  }

  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

function emit(event: string, session: any | null) {
  listeners.forEach((listener) => listener(event, session));
}

async function parseResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    return {
      data: {},
      error: {
        message: data.message || data.error || response.statusText,
      },
    };
  }

  return { data, error: null };
}

export function getAuthClient() {
  return authClient;
}

export const authClient = {
  auth: {
    onAuthStateChange(callback: AuthCallback) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },

    async getSession() {
      return {
        data: { session: getStoredSession() },
        error: null,
      };
    },

    async signInWithPassword(credentials: { email: string; password: string }) {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const { data, error } = await parseResponse(response);
      if (error) return { data: {}, error };

      storeSession(data.session);
      emit('SIGNED_IN', data.session);
      return {
        data: {
          session: data.session,
          user: data.user,
        },
        error: null,
      };
    },

    async signOut() {
      storeSession(null);
      emit('SIGNED_OUT', null);
      return { error: null };
    },

    async signInWithOAuth(options?: {
      provider?: string;
      options?: {
        redirectTo?: string;
        queryParams?: Record<string, string>;
      };
    }) {
      const provider = options?.provider || 'google';

      if (provider !== 'google') {
        return {
          data: null,
          error: {
            message: `OAuth provider "${provider}" is not supported by this backend.`,
          },
        };
      }

      if (typeof window === 'undefined') {
        return {
          data: null,
          error: {
            message: 'OAuth can only start in the browser.',
          },
        };
      }

      const redirectTo = options?.options?.redirectTo || `${window.location.origin}/auth/callback`;
      const query = new URLSearchParams({
        redirectTo,
        ...(options?.options?.queryParams || {}),
      });

      window.location.assign(`${API_URL}/auth/google?${query.toString()}`);

      return {
        data: null,
        error: null,
      };
    },

    async exchangeCodeForSession(code: string) {
      if (!code) {
        return {
          data: null,
          error: {
            message: 'Missing OAuth code/token.',
          },
        };
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${code}`,
        },
      });

      const { data, error } = await parseResponse(response);
      if (error) return { data: null, error };

      const provider = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('provider') || 'google'
        : 'google';

      const session = {
        access_token: code,
        token_type: 'bearer',
        user: {
          ...data.user,
          app_metadata: {
            provider,
          },
        },
      };

      storeSession(session);
      emit('SIGNED_IN', session);

      return {
        data: {
          session,
        },
        error: null,
      };
    },
  },

  storage: {
    from() {
      return {
        async remove() {
          return { data: null, error: null };
        },
        async upload() {
          return { data: null, error: { message: 'Use backend upload endpoints instead.' } };
        },
        async createSignedUrl(path: string) {
          return { data: { signedUrl: path }, error: null };
        },
      };
    },
  },
};
