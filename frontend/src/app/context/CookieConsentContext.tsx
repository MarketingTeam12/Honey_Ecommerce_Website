import { createContext, ReactNode, useContext, useState } from 'react';

export type CookieConsentStatus = 'accepted' | 'rejected' | null;

const STORAGE_KEY = 'honey_cookie_consent';

function readStoredConsent(): CookieConsentStatus {
  if (typeof window === 'undefined') return null;
  try {
    const val = window.localStorage.getItem(STORAGE_KEY);
    if (val === 'accepted' || val === 'rejected') return val;
  } catch {
    // ignore storage access errors
  }
  return null;
}

interface CookieConsentContextValue {
  consent: CookieConsentStatus;
  hasConsented: boolean;
  isBannerOpen: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  openSettings: () => void;
  closeBanner: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentStatus>(() => readStoredConsent());
  const [isBannerOpen, setIsBannerOpen] = useState<boolean>(() => readStoredConsent() === null);

  const persist = (value: 'accepted' | 'rejected') => {
    setConsent(value);
    setIsBannerOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        hasConsented: consent === 'accepted',
        isBannerOpen,
        acceptAll: () => persist('accepted'),
        rejectNonEssential: () => persist('rejected'),
        openSettings: () => setIsBannerOpen(true),
        closeBanner: () => setIsBannerOpen(false),
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    return {
      consent: null,
      hasConsented: false,
      isBannerOpen: false,
      acceptAll: () => {},
      rejectNonEssential: () => {},
      openSettings: () => {},
      closeBanner: () => {},
    };
  }
  return ctx;
}
