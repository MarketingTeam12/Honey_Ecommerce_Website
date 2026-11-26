import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart, type CartItem } from '@/app/context/CartContext';
import { useProducts, type Product } from '@/app/context/ProductContext';

const normalize = (value: string | undefined | null) => String(value || '').trim().toLowerCase();

const isCartOrCheckoutPath = (pathname: string) =>
  pathname === '/cart' || pathname.startsWith('/checkout');

/**
 * Keeps cart prices in line with the current catalog.
 *
 * Cart items snapshot the price when they're added, so if an admin changes a
 * product's price afterwards the cart (and the amount charged at checkout) would
 * keep the old one. This re-prices cart items whenever the product list loads
 * or changes, and re-fetches products whenever the shopper opens the cart or a
 * checkout step so a price change made in another session is picked up.
 *
 * Must be rendered inside both CartProvider and ProductProvider.
 */
export function CartPriceSync() {
  const { cartItems, updateItemPrices } = useCart();
  const { products, getProduct, isLoading, refreshProducts } = useProducts();
  const location = useLocation();

  // Pull fresh prices when entering the cart / checkout.
  useEffect(() => {
    if (isCartOrCheckoutPath(location.pathname)) {
      void refreshProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (isLoading || products.length === 0 || cartItems.length === 0) return;

    const findProduct = (item: CartItem): Product | undefined => {
      // Product pages live at /product/<id-or-slug>; resolve the same way ProductPage does.
      const match = String(item.url || '').match(/^\/product\/([^/?#]+)/);
      const fromUrl = match ? getProduct(decodeURIComponent(match[1])) : undefined;
      if (fromUrl) return fromUrl;

      // Fallback: the cart stores the product name it was added under.
      const name = normalize(item.name);
      return name ? products.find((product) => normalize(product.name) === name) : undefined;
    };

    const prices: Record<string, number> = {};
    cartItems.forEach((item) => {
      const product = findProduct(item);
      if (product && Number.isFinite(product.price) && product.price > 0) {
        prices[item.id] = product.price;
      }
    });

    const changed = updateItemPrices(prices);
    if (changed.length > 0) {
      toast.info(
        changed.length === 1
          ? `The price of "${changed[0].name}" has changed. Your cart has been updated.`
          : `Prices of ${changed.length} items in your cart have changed. Your cart has been updated.`,
      );
    }
    // updateItemPrices/getProduct are recreated each render; products + cartItems drive this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, cartItems, isLoading]);

  return null;
}

export default CartPriceSync;
