import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';

/**
 * Tracks OS reduced-motion preference and user pause/play state for auto-scrolling carousels.
 */
export function useAutoplayControl(defaultPlaying = true) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [isUserPaused, setIsUserPaused] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    setPrefersReducedMotion(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const isPlaying = defaultPlaying && !prefersReducedMotion && !isUserPaused;

  const togglePlayback = () => {
    setIsUserPaused((prev) => !prev);
  };

  return { isPlaying, isPaused: !isPlaying, prefersReducedMotion, togglePlayback };
}

interface CarouselPauseButtonProps {
  isPaused: boolean;
  onToggle: () => void;
  carouselName: string;
  compact?: boolean;
}

/**
 * Visible >=44x44 keyboard-accessible pause/play button with label toggling between Pause and Play.
 */
export function CarouselPauseButton({
  isPaused,
  onToggle,
  carouselName,
  compact = false,
}: CarouselPauseButtonProps) {
  const actionLabel = isPaused ? `Play ${carouselName}` : `Pause ${carouselName}`;
  const shortText = isPaused ? 'Play' : 'Pause';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={actionLabel}
      className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] rounded-full border border-gray-300 bg-white text-gray-900 font-medium shadow-sm hover:bg-gray-50 transition-colors ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      }`}
    >
      {isPaused ? (
        <Play className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Pause className="w-4 h-4" aria-hidden="true" />
      )}
      <span>{shortText}</span>
    </button>
  );
}
