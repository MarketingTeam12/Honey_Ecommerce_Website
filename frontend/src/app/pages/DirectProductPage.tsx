import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { ProductTemplate } from '@/app/components/product/ProductTemplate';
import { getProductBySlug } from '@/app/data/directProductsMap';
import { useProducts } from '@/app/context/ProductContext';
import { normalizeProductImages } from '@/app/utils/imageUtils';

function buildProductHighlights(description?: string) {
  if (!description) {
    return [];
  }

  return description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      text: line,
      bold: /^[A-Z0-9\s&/().,-]+$/.test(line) || line.endsWith(':'),
    }));
}

function buildProductDetails(description?: string) {
  if (!description) {
    return [];
  }

  return description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeProductType(
  category: string | undefined,
  fallback: 'translation' | 'apostille' | 'attestation' | 'startup',
) {
  const normalizedCategory = (category || '').trim().toLowerCase();

  if (normalizedCategory.includes('startup')) {
    return 'startup';
  }

  if (normalizedCategory.includes('apostille')) {
    return 'apostille';
  }

  if (normalizedCategory.includes('attestation')) {
    return 'attestation';
  }

  if (normalizedCategory.includes('translation')) {
    return 'translation';
  }

  return fallback;
}

function getStartupTierFromSlug(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();

  if (normalizedSlug.includes('premium')) {
    return 'premium';
  }

  if (normalizedSlug.includes('standard')) {
    return 'standard';
  }

  if (normalizedSlug.includes('basic')) {
    return 'basic';
  }

  return '';
}

export function DirectProductPage() {
  const { slug: paramSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { products } = useProducts();
  
  // Extract slug from URL path if not available in params
  // For routes like /standard-startup-package, extract from pathname
  const slug = paramSlug || location.pathname.replace(/^\//, '').split('/')[0];
  
  const productData = getProductBySlug(slug);
  const resolvedProductData = useMemo(() => {
    if (!productData) return null;

    const sanitizedProductData = {
      ...productData,
      description: '',
      highlights: [],
      productDetails: [],
    };

    const normalizedSlug = slug.trim().toLowerCase();
    const startupTier = getStartupTierFromSlug(normalizedSlug);
    const startupSlugAliases = new Set([
      normalizedSlug,
      normalizedSlug.replace(/-package$/, ''),
      normalizedSlug.replace(/-packages$/, ''),
    ]);
    const matchedAdminProduct = products.find((product) => {
      const productId = (product.id || '').trim().toLowerCase();
      const productNameSlug = (product.name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const productCategory = (product.category || '').trim().toLowerCase();
      const categoryLooksStartup = productCategory.includes('startup');
      const productNameLower = (product.name || '').trim().toLowerCase();

      if (productId === normalizedSlug || productNameSlug === normalizedSlug) {
        return true;
      }

      if (categoryLooksStartup && startupTier) {
        if (
          productNameLower.includes(startupTier) ||
          productNameSlug.includes(startupTier)
        ) {
          return true;
        }
      }

      if (categoryLooksStartup && startupSlugAliases.has(productNameSlug)) {
        return true;
      }

      return false;
    });

    if (!matchedAdminProduct) {
      return sanitizedProductData;
    }

    const adminImages = normalizeProductImages(matchedAdminProduct.images, matchedAdminProduct.name);

    return {
      ...productData,
      title: matchedAdminProduct.name || productData.title,
      description: matchedAdminProduct.description?.trim() || '',
      type: normalizeProductType(matchedAdminProduct.category, productData.type),
      images: adminImages.length > 0 ? adminImages : productData.images,
      price: matchedAdminProduct.price ?? productData.price,
      originalPrice: matchedAdminProduct.compareAtPrice || (matchedAdminProduct.price ?? productData.price),
      highlights: [],
      productDetails: [],
    };
  }, [productData, products, slug]);

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!resolvedProductData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Extract product key from slug (e.g., "sworn-translation-german" -> use slug as key)
  const productKey = slug.replace(/^(product|apostille|attestation|startup)\//, '');

  // Use slug as key to force re-render when navigating between products
  return <ProductTemplate key={slug} data={resolvedProductData} productKey={productKey} />;
}

export default DirectProductPage;
