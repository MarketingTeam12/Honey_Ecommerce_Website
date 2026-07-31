import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useAuthGate } from '@/app/context/AuthGateContext';
import { API_URL } from '@/app/utils/api';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  url: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  getWishlistCount: () => number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Every account (including a signed-out visitor, under 'guest') gets its own
// wishlist storage slot so one person's wishlist never leaks into another's.
const getUserKey = (email?: string | null) => (email ? email.trim().toLowerCase() : 'guest');
const getWishlistStorageKey = (email?: string | null) => `honey_wishlist_${getUserKey(email)}`;

const readWishlistFromStorage = (email?: string | null): WishlistItem[] => {
  try {
    const saved = localStorage.getItem(getWishlistStorageKey(email));
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading wishlist from storage:', error);
    return [];
  }
};

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const userKeyRef = useRef<string>(getUserKey(user?.email));

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => readWishlistFromStorage(user?.email));

  // Whenever the logged-in user changes (login/logout/switch account), swap
  // in that specific user's wishlist instead of showing whoever was
  // previously signed in on this browser.
  useEffect(() => {
    if (authLoading) return; // wait until auth has resolved who's logged in
    const nextKey = getUserKey(user?.email);
    if (nextKey === userKeyRef.current) return;
    userKeyRef.current = nextKey;
    setWishlistItems(readWishlistFromStorage(user?.email));
  }, [user?.email, authLoading]);

  // Wishlist adds are already gated behind sign-in, so once a real user is
  // signed in the backend is the source of truth (survives a device change);
  // localStorage above is just the instant-paint cache while this loads.
  useEffect(() => {
    if (authLoading || !user?.id) return;
    let cancelled = false;
    fetch(`${API_URL}/wishlist`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.items)) setWishlistItems(data.items);
      })
      .catch((error) => console.error('Error loading wishlist from backend:', error));
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  // Save to localStorage (under this user's own key) whenever wishlist changes.
  // Skip while auth is still resolving, or before the swap-effect above has
  // synced userKeyRef to the current user — otherwise this can fire with the
  // previous (e.g. empty guest) state and overwrite the real saved wishlist.
  useEffect(() => {
    if (authLoading) return;
    if (getUserKey(user?.email) !== userKeyRef.current) return;
    localStorage.setItem(getWishlistStorageKey(user?.email), JSON.stringify(wishlistItems));
  }, [wishlistItems, user?.email, authLoading]);

  const addToWishlist = (item: WishlistItem) => {
    if (!requireAuth('Please sign in to add items to your wishlist.')) return;
    setWishlistItems(prev => {
      // Check if item already exists
      if (prev.some(existing => existing.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
    if (user?.id) {
      fetch(`${API_URL}/wishlist/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      }).catch((error) => console.error('Error syncing wishlist item to backend:', error));
    }
  };

  const removeFromWishlist = (id: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== id));
    if (user?.id) {
      fetch(`${API_URL}/wishlist/items/${encodeURIComponent(id)}`, { method: 'DELETE' })
        .catch((error) => console.error('Error removing wishlist item from backend:', error));
    }
  };

  const isInWishlist = (id: string): boolean => {
    return wishlistItems.some(item => item.id === id);
  };

  const getWishlistCount = (): number => {
    return wishlistItems.length;
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        getWishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
