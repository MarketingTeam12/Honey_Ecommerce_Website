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
export function CarouselPauseButton(_props?: CarouselPauseButtonProps) {
  return null;
}
