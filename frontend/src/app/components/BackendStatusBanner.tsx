import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Server, X } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL, API_BASE_URL } from '@/app/utils/api';

type BannerStatus = 'checking' | 'online' | 'partial' | 'offline' | 'dismissed';

type BackendState = {
  local: boolean;
  Backend: boolean;
};

// Was reading VITE_BACKEND_URL (never set) with a localhost:3000 fallback —
// this banner would keep "successfully" pinging localhost even when the app
// was deployed elsewhere. API_BASE_URL matches every other API call.
const LOCAL_BACKEND_BASE = API_BASE_URL;

export function BackendStatusBanner() {
  const [backendStatus, setBackendStatus] = useState<BannerStatus>('checking');
  const [backendState, setBackendState] = useState<BackendState>({
    local: false,
    Backend: false,
  });
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkLocalBackend = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${LOCAL_BACKEND_BASE}/checkout`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  };

  const checkBackendBackend = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${API_URL}/setup/status`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            apikey: publicAnonKey,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  };

  const checkBackendStatus = async () => {
    try {
      const [localOnline, BackendOnline] = await Promise.all([
        checkLocalBackend(),
        checkBackendBackend(),
      ]);

      setBackendState({
        local: localOnline,
        Backend: BackendOnline,
      });

      if (BackendOnline) {
        setBackendStatus('online');
        return;
      }

      setBackendStatus('offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  const dismissBanner = () => {
    setBackendStatus('dismissed');
    setShowBanner(false);
    localStorage.setItem('backend_banner_dismissed', Date.now().toString());
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('backend_banner_dismissed');
    if (!dismissed) return;

    const dismissedTime = parseInt(dismissed, 10);
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - dismissedTime < oneHour) {
      setShowBanner(false);
      setBackendStatus('dismissed');
    }
  }, []);

  if (backendStatus === 'online' || backendStatus === 'dismissed' || !showBanner) {
    return null;
  }

  if (backendStatus === 'checking') {
    return null;
  }

  const isPartial = backendStatus === 'partial';
  const bgClass = isPartial ? 'bg-amber-600' : 'bg-red-600';
  const hoverClass = isPartial ? 'hover:bg-amber-700' : 'hover:bg-red-700';
  const primaryButtonClass = isPartial
    ? 'bg-white text-amber-700 hover:bg-amber-50'
    : 'bg-white text-red-600 hover:bg-red-50';
  const secondaryButtonClass = isPartial
    ? 'bg-amber-700 text-white hover:bg-amber-800'
    : 'bg-red-700 text-white hover:bg-red-800';

  let title = 'Backend Not Reachable';
  let description =
    `Neither the local backend (${LOCAL_BACKEND_BASE}) nor the Backend Edge Function is reachable right now. ` +
    'Payment and admin features that depend on backend APIs will not work until at least one backend is available.';

  if (isPartial && backendState.local) {
    title = 'Backend Admin Backend Unavailable';
    description =
      `Your local backend at ${LOCAL_BACKEND_BASE} is reachable, so the Zoho widget flow can still work. ` +
      'The Backend admin backend is not reachable right now, so some admin pages may fail.';
  } else if (isPartial && backendState.Backend) {
    title = 'Local Payment Backend Unavailable';
    description =
      `Your Backend backend is reachable, but the local payment backend at ${LOCAL_BACKEND_BASE} is not reachable right now. ` +
      'Zoho widget checkout from the local flow will fail until the local backend is running.';
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${bgClass} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm mb-3">{description}</p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/admin/deployment-guide"
                className={`inline-flex items-center gap-2 px-4 py-2 ${primaryButtonClass} font-semibold rounded-lg transition-colors text-sm`}
              >
                <Server className="w-4 h-4" />
                Open Backend Guide
              </a>
              <a
                href="https://authClient.com/docs/guides/functions/deploy"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 ${secondaryButtonClass} font-semibold rounded-lg transition-colors text-sm`}
              >
                <ExternalLink className="w-4 h-4" />
                Backend Docs
              </a>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className={`flex-shrink-0 p-1 ${hoverClass} rounded transition-colors`}
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
