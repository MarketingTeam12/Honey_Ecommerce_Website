import { Link } from 'react-router-dom';
import { useCookieConsent } from '@/app/context/CookieConsentContext';

export function CookieConsentBanner() {
  const { isBannerOpen, consent, acceptAll, rejectNonEssential, closeBanner } = useCookieConsent();

  if (!isBannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-4 shadow-2xl sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
          We use essential cookies for sign-in, cart and checkout, and optional cookies for chat, reviews and embedded videos.{' '}
          <Link to="/privacy-policy" className="text-[#1a1f5c] underline font-medium hover:text-[#252b70]">
            Privacy Policy
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {consent !== null && (
            <button
              type="button"
              onClick={closeBanner}
              className="min-h-[44px] px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          )}
          <button
            type="button"
            onClick={rejectNonEssential}
            className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-gray-800 hover:bg-gray-100 transition-colors"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="min-h-[44px] rounded-lg bg-[#1a1f5c] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#252b70] transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
