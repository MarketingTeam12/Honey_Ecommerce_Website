import { useCookieConsent } from '@/app/context/CookieConsentContext';

interface ConsentYouTubeEmbedProps {
  videoId: string;
  title: string;
  className?: string;
}

export function ConsentYouTubeEmbed({ videoId, title, className = 'w-full h-full' }: ConsentYouTubeEmbedProps) {
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
