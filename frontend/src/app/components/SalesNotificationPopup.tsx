import { useEffect, useMemo, useState, MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useProducts } from '@/app/context/ProductContext';
import { getFirstValidImage } from '@/app/utils/imageUtils';
import checkMarkIcon from '@/assets/check-mark.png';

interface SaleNotification {
  id: string;
  productName: string;
  description: string;
  location: string;
  thumbnail: string;
  productUrl: string;
}

const DEMO_LOCATIONS = [
  'Hyderabad, India',
  'Mumbai, India',
  'Bangalore, India',
  'Chennai, India',
  'Delhi, India',
  'Pune, India',
];

export function SalesNotificationPopup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { products } = useProducts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const shouldShowOnRoute =
    !location.pathname.startsWith('/admin') &&
    !location.pathname.startsWith('/signin') &&
    !location.pathname.startsWith('/login') &&
    !location.pathname.startsWith('/signup') &&
    !location.pathname.startsWith('/auth') &&
    !location.pathname.startsWith('/debug') &&
    !location.pathname.startsWith('/init-demo') &&
    !location.pathname.startsWith('/storage-setup') &&
    !location.pathname.startsWith('/test-review');
  const notifications = useMemo<SaleNotification[]>(
    () =>
      products
        .filter((product) => product.status === 'active')
        .map((product, index) => {
          const thumbnail = getFirstValidImage(product.images);

          if (!thumbnail) {
            return null;
          }

          return {
            id: product.id,
            productName: product.name,
            description: product.description || product.category || 'Professional service package',
            location: DEMO_LOCATIONS[index % DEMO_LOCATIONS.length],
            thumbnail,
            productUrl: `/product/${product.id}`,
          };
        })
        .filter((notification): notification is SaleNotification => Boolean(notification)),
    [products],
  );

  useEffect(() => {
    setCurrentIndex(0);
  }, [notifications.length]);

  useEffect(() => {
    if (isDismissed || !shouldShowOnRoute || notifications.length === 0) return;

    let showInterval: NodeJS.Timeout | null = null;
    let hideTimeout: NodeJS.Timeout | null = null;

    const startCycle = () => {
      showInterval = setInterval(() => {
        if (!document.hidden) {
          setIsVisible(true);

          hideTimeout = setTimeout(() => {
            setIsVisible(false);
          }, 4000);
        }
      }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (showInterval) {
          clearInterval(showInterval);
          showInterval = null;
        }
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        setIsVisible(false);
      } else if (!showInterval) {
        startCycle();
      }
    };

    setIsVisible(true);
    const firstHideTimeout = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    startCycle();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (showInterval) {
        clearInterval(showInterval);
      }
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      clearTimeout(firstHideTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDismissed, shouldShowOnRoute, notifications.length]);

  useEffect(() => {
    if (isDismissed || !shouldShowOnRoute || notifications.length === 0) return;

    let rotateInterval: NodeJS.Timeout | null = null;

    const startRotation = () => {
      rotateInterval = setInterval(() => {
        if (!document.hidden) {
          setCurrentIndex((prev) => (prev + 1) % notifications.length);
        }
      }, 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (rotateInterval) {
          clearInterval(rotateInterval);
          rotateInterval = null;
        }
      } else if (!rotateInterval) {
        startRotation();
      }
    };

    startRotation();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (rotateInterval) {
        clearInterval(rotateInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDismissed, shouldShowOnRoute, notifications.length]);

  const handleClick = () => {
    const notification = notifications[currentIndex];
    if (!notification) return;
    setIsVisible(false);
    navigate(notification.productUrl);
  };

  const handleClose = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (isDismissed || !isVisible || !shouldShowOnRoute || notifications.length === 0) return null;

  const currentNotification = notifications[currentIndex];

  return (
    <div
      className={`fixed bottom-20 left-3 right-3 z-50 transition-all duration-500 ease-out sm:bottom-6 sm:left-6 sm:right-auto ${
        isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}
    >
      <div
        onClick={handleClick}
        className="relative w-full max-w-[17rem] cursor-pointer overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-3 shadow-[0_18px_50px_rgba(10,18,71,0.18)] backdrop-blur transition-transform duration-300 hover:scale-[1.015] hover:shadow-[0_22px_60px_rgba(10,18,71,0.24)] sm:w-auto"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2d96d8] via-[#0a1247] to-[#22c55e]" />

        <button
          onClick={handleClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1 text-gray-400 shadow-sm transition-colors hover:text-gray-700"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <img
                src={currentNotification.thumbnail}
                alt={currentNotification.productName}
                className="h-full w-full object-contain object-center"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 pr-4">
            <span className="mb-1 inline-flex items-center text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-[#0f9b63]">
              <span className="mr-2 inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden">
                <img
                  src={checkMarkIcon}
                  alt="Recent purchase"
                  className="block h-full w-full rotate-0 object-contain object-center align-middle"
                />
              </span>
              Recent Purchase
            </span>

            <h4 className="mb-0.5 line-clamp-1 text-[0.9rem] font-bold text-[#0a1247]">
              {currentNotification.productName}
            </h4>

            <p className="mb-1 line-clamp-1 text-[0.74rem] text-gray-600">
              {currentNotification.description}
            </p>

            <p className="flex items-center gap-1 text-[0.69rem] text-gray-500">
              <svg
                className="h-3 w-3 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Purchased from {currentNotification.location}
            </p>

            <p className="mt-1 text-[0.65rem] text-gray-400">Just now</p>
          </div>
        </div>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2d96d8] to-[#0a1247] animate-progress"
            style={{
              animation: 'progress 4s linear forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .animate-progress {
          width: 0%;
        }
      `}</style>
    </div>
  );
}
