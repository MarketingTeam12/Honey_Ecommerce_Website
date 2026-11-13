import { useParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ProductTemplate } from '@/app/components/product/ProductTemplate';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import {
  allProductsMap,
  apostilleCountries,
  attestationCountries,
  startupPackages,
} from '@/app/data/allProductData';
import { useProducts } from '@/app/context/ProductContext';
import { normalizeProductImages } from '@/app/utils/imageUtils';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/services?/g, '')
    .replace(/apostille|attestation|startup|package/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function ApostillePage() {
  const { country, id, type } = useParams<{ country?: string; id?: string; type?: string }>();
  const location = useLocation();
  const { products, isLoading: productsLoading } = useProducts();

  // Determine product type from URL path
  const isApostille = location.pathname.includes('/apostille/');
  const isAttestation = location.pathname.includes('/attestation/');
  const isStartup = location.pathname.includes('/startup/');
  const routeCountry = (country || id || type || '').trim().toLowerCase();

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [routeCountry]);

  // Look up product in the category-specific map so shared country keys (e.g. uae, qatar) don't collide
  let productData = isApostille
    ? apostilleCountries[routeCountry]
    : isAttestation
      ? attestationCountries[routeCountry]
      : isStartup
        ? startupPackages[routeCountry]
        : allProductsMap[routeCountry];

  // Match admin product by country slug and override static content with admin-managed fields
  const expectedCategory = isApostille
    ? 'apostille'
    : isAttestation
      ? 'attestation'
      : isStartup
        ? 'startup packages'
        : '';

  const adminMatch = products.find((product) => {
    if (product.status !== 'active') return false;
    if (!product.name) return false;
    if (expectedCategory && product.category.toLowerCase() !== expectedCategory) return false;
    return slugify(product.name) === routeCountry;
  });

  if (!productData && !adminMatch) {
    if (productsLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-white">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a1f5c]" />
        </div>
      );
    }
    return <NotFoundPage />;
  }

  if (adminMatch) {
    const adminImages = normalizeProductImages(adminMatch.images, adminMatch.name);
    const adminDescription = adminMatch.description?.trim() || '';
    const baseData = productData || {
      type: (isAttestation ? 'attestation' : isStartup ? 'startup' : 'apostille') as 'apostille' | 'attestation' | 'startup',
      title: adminMatch.name,
      images: [],
      price: adminMatch.price,
      originalPrice: adminMatch.compareAtPrice || adminMatch.price,
      highlights: [],
      documentTypes: [],
      productDetails: [],
      whatYouReceive: [],
      processSteps: [],
      deliveryTimeline: { softCopy: '3-5 business days', hardCopy: '7-10 business days' },
      whyChoose: [],
      relatedProducts: [],
    };

    productData = {
      ...baseData,
      title: adminMatch.name || baseData.title,
      description: adminDescription || baseData.description || '',
      price: adminMatch.price || baseData.price,
      originalPrice: adminMatch.compareAtPrice || adminMatch.price || baseData.price,
      images: adminImages.length > 0 ? adminImages : baseData.images,
    };
  }

  // Use country as key to force re-render when navigating between products.
  // productKey must stay the route slug (not adminMatch.id) because reviews,
  // orders, and everything else are keyed to this slug — switching it when an
  // admin-managed product record exists breaks review lookups for the page.
  return <ProductTemplate key={routeCountry} data={productData!} productKey={routeCountry} />;
}

export default ApostillePage;
