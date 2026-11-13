interface ErrorContext {
  source?: string;
  componentStack?: string;
  extra?: Record<string, unknown>;
}

let initialized = false;

function parseSentryDsn(dsn: string): { endpoint: string; sentryKey: string } | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+/, '');
    const sentryKey = url.username;
    if (!projectId || !sentryKey) return null;
    return {
      endpoint: `${url.protocol}//${url.host}/api/${projectId}/store/`,
      sentryKey,
    };
  } catch {
    return null;
  }
}

export function captureError(error: unknown, context: ErrorContext = {}): void {
  const err = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
  console.error('[ErrorTracking]', context.source || 'app', err.message, context);

  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || typeof window === 'undefined') return;

  const parsed = parseSentryDsn(dsn);
  if (!parsed) return;

  const payload = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    logger: 'honey-frontend',
    message: err.message,
    exception: {
      values: [
        {
          type: err.name || 'Error',
          value: err.message,
        },
      ],
    },
    extra: {
      url: window.location.href,
      ...context,
    },
  };

  fetch(`${parsed.endpoint}?sentry_version=7&sentry_key=${encodeURIComponent(parsed.sentryKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Never throw from error reporter
  });
}

export function initErrorTracking(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', (event) => {
    captureError(event.error || event.message, {
      source: 'window.onerror',
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason, { source: 'unhandledrejection' });
  });
}
