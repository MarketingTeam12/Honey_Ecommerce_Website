import { ProductData } from '@/app/components/product/ProductTemplate';
import { translationProductsData } from './translationProductData';
import { attestationProductsData } from './attestationProductData';
import { startupPackagesData } from './startupPackageData';

// Combined product map with all products
export const allDirectProductsMap: Record<string, ProductData> = {
  ...translationProductsData,
  ...attestationProductsData,
  ...startupPackagesData
};

// Helper function to get product data by URL slug
export function getProductBySlug(slug: string): ProductData | null {
  return allDirectProductsMap[slug] || null;
}