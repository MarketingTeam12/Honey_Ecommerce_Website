import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useProducts } from '@/app/context/ProductContext';
import { applyDocumentSeo, resolveRouteSeo } from '@/app/utils/seo';

/**
 * Synchronizes document title, meta description, Open Graph, Twitter Card,
 * and canonical link tags whenever the active route or product list changes.
 */
export function SeoManager() {
  const location = useLocation();
  const { products } = useProducts();

  useEffect(() => {
    const seo = resolveRouteSeo(location.pathname, products);
    applyDocumentSeo(seo);
  }, [location.pathname, products]);

  return null;
}

export default SeoManager;
