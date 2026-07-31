import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useAuthGate } from '@/app/context/AuthGateContext';
import { API_URL } from '@/app/utils/api';

export interface CartItem {
  id: string;
  name: string;
  basePrice: number;
  category: string;
  url: string;
  image: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  certificateType?: string;
  uploadedDocument?: File | null; // Keep for backward compatibility
  uploadedDocuments?: File[]; // Support multiple documents
  driveLink?: string;
  documentPreview?: string;
  pageCount: number;
  totalPrice: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updatePageCount: (id: string, pageCount: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  appliedCoupon: { code: string; discountValue: number; discountType: 'percentage' | 'fixed' } | null;
  applyCoupon: (code: string, discountValue: number, discountType: 'percentage' | 'fixed') => void;
  removeCoupon: () => void;
  getDiscountAmount: () => number;
  getFinalTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Add display name for better debugging
CartContext.displayName = 'CartContext';

// Every account (including a signed-out visitor, under 'guest') gets its own
// cart/coupon storage slot so one person's cart never leaks into another's.
const getUserKey = (email?: string | null) => (email ? email.trim().toLowerCase() : 'guest');
const getCartStorageKey = (email?: string | null) => `honey_cart_${getUserKey(email)}`;
const getCouponStorageKey = (email?: string | null) => `honey_coupon_${getUserKey(email)}`;

const readCartFromStorage = (email?: string | null): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(getCartStorageKey(email));
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return [];
  }
};

const readCouponFromStorage = (email?: string | null) => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(getCouponStorageKey(email));
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading coupon from storage:', error);
    return null;
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth } = useAuthGate();
  const userKeyRef = useRef<string>(getUserKey(user?.email));

  // Use lazy initialization with inline functions to avoid HMR issues
  const [cartItems, setCartItems] = useState<CartItem[]>(() => readCartFromStorage(user?.email));

  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountValue: number; discountType: 'percentage' | 'fixed' } | null>(
    () => readCouponFromStorage(user?.email)
  );

  // Whenever the logged-in user changes (login/logout/switch account), swap
  // in that specific user's cart/coupon instead of showing whoever was
  // previously signed in on this browser.
  useEffect(() => {
    if (authLoading) return; // wait until auth has resolved who's logged in
    const nextKey = getUserKey(user?.email);
    if (nextKey === userKeyRef.current) return;
    userKeyRef.current = nextKey;
    setCartItems(readCartFromStorage(user?.email));
    setAppliedCoupon(readCouponFromStorage(user?.email));
  }, [user?.email, authLoading]);

  // Cart/wishlist adds are already gated behind sign-in (see requireAuth
  // calls below), so once a real user is signed in, the backend — not
  // localStorage — is the source of truth: this makes the cart survive a
  // device change instead of being trapped in one browser's localStorage.
  // localStorage above still acts as an instant-paint cache while this loads.
  useEffect(() => {
    if (authLoading || !user?.id) return;
    let cancelled = false;
    fetch(`${API_URL}/cart`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.items)) setCartItems(data.items);
        setAppliedCoupon(data.coupon || null);
      })
      .catch((error) => console.error('Error loading cart from backend:', error));
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  // Persist cart to localStorage (under this user's own key) whenever it changes.
  // Skip while auth is still resolving, or before the swap-effect above has
  // synced userKeyRef to the current user — otherwise this can fire with the
  // previous (e.g. empty guest) state and overwrite the real saved cart.
  useEffect(() => {
    if (authLoading) return;
    if (getUserKey(user?.email) !== userKeyRef.current) return;
    try {
      // File objects (uploadedDocument/uploadedDocuments) cannot be safely
      // persisted to localStorage — strip them before saving so the rest of
      // the cart item (price, language, page count, etc.) always survives.
      const serializableCart = cartItems.map(({ uploadedDocument, uploadedDocuments, ...rest }) => rest);
      localStorage.setItem(getCartStorageKey(user?.email), JSON.stringify(serializableCart));
    } catch (error) {
      console.error('❌ Error saving cart to storage:', error);
    }
  }, [cartItems, user?.email, authLoading]);

  // Persist coupon to localStorage (under this user's own key) whenever it changes
  useEffect(() => {
    if (authLoading) return;
    if (getUserKey(user?.email) !== userKeyRef.current) return;
    try {
      const key = getCouponStorageKey(user?.email);
      if (appliedCoupon) {
        localStorage.setItem(key, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error saving coupon to storage:', error);
    }
  }, [appliedCoupon, user?.email, authLoading]);

  // Persist a single item to the backend cart. Sends the same serializable
  // shape already used for localStorage (no File objects), fire-and-forget —
  // the local state update already happened, this just keeps the backend
  // (and thus other devices) in sync.
  const syncItemToBackend = (item: CartItem) => {
    if (!user?.id) return;
    const { uploadedDocument, uploadedDocuments, ...serializable } = item;
    fetch(`${API_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializable),
    }).catch((error) => console.error('Error syncing cart item to backend:', error));
  };

  const addToCart = (item: CartItem) => {
    if (!requireAuth('Please sign in to add items to your cart.')) return;
    setCartItems(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = item;
        return updated;
      }
      return [...prev, item];
    });
    syncItemToBackend(item);
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    if (user?.id) {
      fetch(`${API_URL}/cart/items/${encodeURIComponent(id)}`, { method: 'DELETE' })
        .catch((error) => console.error('Error removing cart item from backend:', error));
    }
  };

  const updatePageCount = (id: string, pageCount: number) => {
    let updatedItem: CartItem | undefined;
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const totalPrice = item.basePrice * pageCount;
          updatedItem = { ...item, pageCount, totalPrice };
          return updatedItem;
        }
        return item;
      })
    );
    if (updatedItem) syncItemToBackend(updatedItem);
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    if (user?.id) {
      fetch(`${API_URL}/cart`, { method: 'DELETE' })
        .catch((error) => console.error('Error clearing backend cart:', error));
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getCartCount = () => {
    return cartItems.length;
  };

  const applyCoupon = (code: string, discountValue: number, discountType: 'percentage' | 'fixed') => {
    setAppliedCoupon({ code, discountValue, discountType });
    if (user?.id) {
      fetch(`${API_URL}/cart/coupon`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, discountValue, discountType }),
      }).catch((error) => console.error('Error syncing coupon to backend:', error));
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    if (user?.id) {
      fetch(`${API_URL}/cart/coupon`, { method: 'DELETE' })
        .catch((error) => console.error('Error removing backend coupon:', error));
    }
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    const cartTotal = getCartTotal();
    if (appliedCoupon.discountType === 'percentage') {
      return (cartTotal * appliedCoupon.discountValue) / 100;
    } else {
      return appliedCoupon.discountValue;
    }
  };

  const getFinalTotal = () => {
    return getCartTotal() - getDiscountAmount();
  };

  const value: CartContextType = {
    cartItems,
    cart: cartItems,
    addToCart,
    removeFromCart,
    updatePageCount,
    clearCart,
    getCartTotal,
    getCartCount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Add display name for better debugging
CartProvider.displayName = 'CartProvider';

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
