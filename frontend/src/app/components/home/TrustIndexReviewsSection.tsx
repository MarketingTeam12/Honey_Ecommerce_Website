import { useEffect, useRef } from 'react';

const TRUSTINDEX_SCRIPT_SRC = 'https://cdn.trustindex.io/loader.js?18cf7ab7225a255f6c86ab7c666';

export function TrustIndexReviewsSection() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const reviewLinkRef = useRef<string>('');

  useEffect(() => {
    if (!mountRef.current) return;

    const captureReviewLink = () => {
      if (!mountRef.current) return;
      const candidates = Array.from(
        mountRef.current.querySelectorAll(
          '[class*="write"][class*="review"], [class*="review"][class*="button"], a[href*="google"][href*="review"], button[class*="review"], a[href*="review"]',
        ),
      ) as HTMLElement[];

      const writeReviewElement =
        candidates.find((element) => /write\s*review/i.test(element.textContent || '')) || null;

      const targetElement =
        writeReviewElement ||
        candidates.find((element) => (element as HTMLAnchorElement).href?.includes('review')) ||
        null;

      if (!targetElement) return;

      const directHref = (targetElement as HTMLAnchorElement).href;
      const nestedAnchor = targetElement.querySelector('a[href]') as HTMLAnchorElement | null;
      const resolvedHref = directHref || nestedAnchor?.href || '';
      if (resolvedHref) {
        reviewLinkRef.current = resolvedHref;
      }
    };

    const observer = new MutationObserver(() => {
      captureReviewLink();
    });

    observer.observe(mountRef.current, { childList: true, subtree: true });

    const script = document.createElement('script');
    script.src = TRUSTINDEX_SCRIPT_SRC;
    script.defer = true;
    script.async = true;
    mountRef.current.appendChild(script);

    captureReviewLink();

    return () => {
      observer.disconnect();
      if (mountRef.current?.contains(script)) {
        mountRef.current.removeChild(script);
      }
    };
  }, []);

  const openWriteReviewPopup = () => {
    const reviewHref =
      reviewLinkRef.current ||
      'https://www.google.com/search?q=Honey+Translation+Services+Chennai+reviews';

    const popupWidth = 820;
    const popupHeight = 700;
    const left = Math.max(0, window.screenX + (window.outerWidth - popupWidth) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - popupHeight) / 2);

    window.open(
      reviewHref,
      'trustindex-write-review',
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  };

  return (
    <section className="py-2 md:py-3 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="trustindex-home-widget-wrap">
          <div className="trustindex-home-widget" ref={mountRef} />
          <button
            type="button"
            className="trustindex-custom-write-review"
            onClick={openWriteReviewPopup}
          >
            Write Review
          </button>
        </div>
      </div>
      <style>{`
        .trustindex-home-widget-wrap {
          position: relative;
        }

        .trustindex-home-widget {
          position: relative;
          padding-top: 0;
          padding-bottom: 0;
          overflow: visible;
        }

        .trustindex-home-widget [class*="write"][class*="review"],
        .trustindex-home-widget [class*="review"][class*="button"],
        .trustindex-home-widget a[href*="google"][href*="review"],
        .trustindex-home-widget button[class*="review"] {
          display: none !important;
        }

        .trustindex-custom-write-review {
          position: absolute !important;
          top: 16px !important;
          right: 228px !important;
          transform: none !important;
          z-index: 60 !important;
          margin: 0 !important;
          min-width: 138px;
          height: 38px;
          padding: 0 18px;
          border: 1px solid #6b7280;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          font-size: 16px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        .trustindex-custom-write-review:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        .trustindex-home-widget [class*="verified"][class*="trustindex"],
        .trustindex-home-widget [class*="trustindex"][class*="verified"],
        .trustindex-home-widget [class*="ti-footer"],
        .trustindex-home-widget [class*="footer"] {
          position: absolute !important;
          top: 16px !important;
          right: 12px !important;
          left: auto !important;
          transform: none !important;
          z-index: 40 !important;
          margin: 0 !important;
          text-align: right !important;
        }

        @media (max-width: 900px) {
          .trustindex-custom-write-review {
            right: 196px !important;
            min-width: 124px;
            height: 34px;
            padding: 0 12px;
            font-size: 14px;
          }
        }
      `}</style>
    </section>
  );
}
