import { useCookieConsent } from '@/app/context/CookieConsentContext';

interface ConsentYouTubeEmbedProps {
  videoId: string;
  title: string;
  className?: string;
}

export function ConsentYouTubeEmbed({ videoId, title, className = 'w-full h-full' }: ConsentYouTubeEmbedProps) {
  const { hasConsented, openSettings } = useCookieConsent();

  if (!hasConsented) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-100 text-gray-700 p-4 text-center rounded-lg border border-gray-200`}>
        <p className="text-xs sm:text-sm font-medium mb-2">
          Embedded video is disabled until optional cookies are accepted.
        </p>
        <button
          type="button"
          onClick={openSettings}
          className="min-h-[44px] rounded-lg bg-[#1a1f5c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#252b70] transition-colors"
        >
          Cookie settings
        </button>
      </div>
    );
  }

  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      title={title}
      className={className}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      loading="lazy"
    />
  );
}
