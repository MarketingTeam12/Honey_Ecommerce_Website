/**
 * Runs a non-critical task after the window finishes loading and the main thread is idle
 * (or after a short delay when requestIdleCallback is unavailable), returning a cleanup fn.
 */
export function scheduleAfterLoad(task: () => void, delayMs = 1500): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let cancelled = false;
  let timerId: number | undefined;
  let idleId: number | undefined;

  const triggerTask = () => {
    if (cancelled) return;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(
        () => {
          if (!cancelled) task();
        },
        { timeout: delayMs + 1000 },
      );
    } else {
      timerId = window.setTimeout(() => {
        if (!cancelled) task();
      }, delayMs);
    }
  };

  const onLoad = () => {
    timerId = window.setTimeout(triggerTask, delayMs);
  };

  if (document.readyState === 'complete') {
    onLoad();
  } else {
    window.addEventListener('load', onLoad, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener('load', onLoad);
    if (timerId !== undefined) window.clearTimeout(timerId);
    const win = window as Window & { cancelIdleCallback?: (id: number) => void };
    if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
      win.cancelIdleCallback(idleId);
    }
  };
}
