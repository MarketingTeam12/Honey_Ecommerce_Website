import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { uploadImage } from '@/app/utils/backendStorage';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  stock: number;
  weight?: string;
  status: 'active' | 'draft' | 'archived';
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  images: string[]; // Stores Backend Storage URLs
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  createdAt: string;
}

interface ProductContextType {
  products: Product[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  uploadImages: (files: (File | string)[]) => Promise<string[]>;
  isLoading: boolean;
  refreshProducts: () => Promise<void>;
}

// Create and export the context with a default value
const defaultContextValue: ProductContextType = {
  products: [],
  categories: [],
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => {},
  getProduct: () => undefined,
  addCategory: () => {},
  updateCategory: () => {},
  deleteCategory: () => {},
  uploadImages: async () => [],
  isLoading: true,
  refreshProducts: async () => {},
};

export const ProductContext = createContext<ProductContextType>(defaultContextValue);

const PRODUCTS_STORAGE_KEY = 'admin_products';
const CATEGORIES_STORAGE_KEY = 'admin_categories';

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) {
      return fallback;
    }

    return JSON.parse(storedValue) as T;
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage:`, error);
    return fallback;
  }
}

function writeStoredJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write ${key} to localStorage:`, error);
  }
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || '').trim()).filter(Boolean);
      }
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  }

  return [];
}

function normalizeProduct(product: any): Product {
  const imagesFromMetadata = toStringArray(product?.metadata?.images);
  const images = toStringArray(product?.images);
  return {
    ...product,
    id: String(product?.id || '').trim() || `product-${Date.now()}`,
    name: String(product?.name || '').trim() || 'Unnamed Product',
    category: String(product?.category || '').trim() || 'Uncategorized',
    description: String(product?.description || ''),
    status: ['active', 'draft', 'archived'].includes(String(product?.status || '').trim())
      ? String(product.status).trim() as Product['status']
      : 'draft',
    price: toNumber(product?.price),
    compareAtPrice: product?.compareAtPrice !== undefined && product?.compareAtPrice !== null
      ? toNumber(product.compareAtPrice)
      : undefined,
    cost: product?.cost !== undefined && product?.cost !== null
      ? toNumber(product.cost)
      : undefined,
    stock: Math.max(0, Math.trunc(toNumber(product?.stock))),
    weight: product?.weight ? String(product.weight) : undefined,
    sku: product?.sku ? String(product.sku) : undefined,
    barcode: product?.barcode ? String(product.barcode) : undefined,
    tags: Array.isArray(product?.tags) ? product.tags : [],
    images: images.length > 0 ? images : imagesFromMetadata,
    metaTitle: product?.metaTitle ? String(product.metaTitle) : undefined,
    metaDescription: product?.metaDescription ? String(product.metaDescription) : undefined,
    createdAt: product?.createdAt || new Date().toISOString(),
    updatedAt: product?.updatedAt || new Date().toISOString(),
  };
}

function normalizeProductList(products: any[]): Product[] {
  return (products || []).map(normalizeProduct);
}

function createLocalProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string): Product {
  const now = new Date().toISOString();

  return {
    ...productData,
    price: toNumber(productData.price),
    compareAtPrice: productData.compareAtPrice !== undefined ? toNumber(productData.compareAtPrice) : undefined,
    cost: productData.cost !== undefined ? toNumber(productData.cost) : undefined,
    stock: Math.max(0, Math.trunc(toNumber(productData.stock))),
    tags: Array.isArray(productData.tags) ? productData.tags : [],
    images: Array.isArray(productData.images) ? productData.images : [],
    id: existingId || `local-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
}

function isFetchUnavailable(error: unknown): boolean {
  return error instanceof TypeError && error.message === 'Failed to fetch';
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() =>
    typeof window === 'undefined'
      ? []
      : normalizeProductList(readStoredJson<Product[]>(PRODUCTS_STORAGE_KEY, [])),
  );
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'Translation',
      slug: 'translation',
      description: 'Translation services',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Attestation',
      slug: 'attestation',
      description: 'Document attestation services',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Apostille',
      slug: 'apostille',
      description: 'Apostille services',
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Startup Packages',
      slug: 'startup',
      description: 'Startup package services',
      createdAt: new Date().toISOString()
    }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fetch products from server on mount
  const fetchProducts = async () => {
    try {
      console.log('📦 Fetching products from server...');
      console.log('API URL:', API_URL);
      setIsLoading(true);
      setHasError(false);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.log('⏱️ Request timed out after 10s - Edge Function server not deployed or not responding');
        controller.abort();
      }, 10000); // 10 second timeout
      
      const response = await fetch(`${API_URL}/products`, {
        method: 'GET',
        headers: buildHeaders(),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's a backend deployment issue (401 with Missing authorization header or Invalid JWT)
        const isBackendIssue = errorText.includes('Missing authorization header') || 
                               errorText.includes('Invalid JWT') || 
                               errorText.includes('"code":401');
        
        if (isBackendIssue) {
          console.log('ℹ️ [ProductContext] Backend not deployed - using local demo mode');
          console.log('   → To enable backend features, deploy Edge Functions');
          // Throw to trigger fallback mode
          throw new Error('Backend not available');
        }
        
        console.error('Response error:', errorText);
        console.error('❌ [ProductContext] Failed to fetch products');
        console.error('   Status:', response.status, response.statusText);
        console.error('   Error:', errorText);
        
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${data.products?.length || 0} products from server`);
      console.log('Products data:', data.products);
      
      // If no products exist, initialize with defaults
      if (!data.products || data.products.length === 0) {
        console.log('📭 No products found on server. App will use default categories.');
        setProducts([]);
        writeStoredJson(PRODUCTS_STORAGE_KEY, []);
      } else {
        const normalizedProducts = normalizeProductList(data.products || []);
        setProducts(normalizedProducts);
        writeStoredJson(PRODUCTS_STORAGE_KEY, normalizedProducts);
      }
      
      setIsLoading(false);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⚠️ Server request timed out - Edge Function not deployed. App will work with limited functionality.');
      } else {
        console.log('⚠️ Server not reachable:', error.message, '- Edge Function not deployed. App will work with limited functionality.');
      }
      // Don't set error state - just use defaults silently
      const storedProducts = normalizeProductList(readStoredJson<Product[]>(PRODUCTS_STORAGE_KEY, []));
      setProducts(storedProducts);
      setIsLoading(false);
      setHasError(false); // Don't show error to user, just use defaults
    }
  };

  // Initialize default products
  const initializeDefaultProducts = async () => {
    try {
      console.log('🌱 Calling initialize-default-products endpoint...');
      
      const response = await fetch(`${API_URL}/initialize-default-products`, {
        method: 'POST',
        headers: buildHeaders(),
      });
      
      if (!response.ok) {
        console.error('Failed to initialize default products');
        return;
      }
      
      const data = await response.json();
      console.log(`✅ Initialized ${data.count} default products`);
    } catch (error) {
      console.error('❌ Error initializing default products:', error);
    }
  };

  // Fetch categories from server
  const fetchCategories = async () => {
    try {
      console.log('📂 Fetching categories from server...');
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // Reduced to 5 second timeout
      
      const response = await fetch(`${API_URL}/categories-list`, {
        method: 'GET',
        headers: buildHeaders(),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      console.log('Categories response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's a backend deployment issue
        const isBackendIssue = errorText.includes('Missing authorization header') || 
                               errorText.includes('Invalid JWT') || 
                               errorText.includes('\"code\":401');
        
        if (isBackendIssue) {
          console.log('ℹ️ Backend not deployed - using default categories');
          // Throw to trigger fallback mode
          throw new Error('Backend not available');
        }
        
        console.error('Categories response error:', errorText);
        console.error('❌ [ProductContext] Failed to fetch categories');
        console.error('   Status:', response.status, response.statusText);
        console.error('   Error:', errorText);
        
        throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${data.categories?.length || 0} categories from server`);
      
      if (data.categories && data.categories.length > 0) {
        // Add createdAt to categories if missing
        const categoriesWithDates = data.categories.map(cat => ({
          ...cat,
          createdAt: cat.createdAt || new Date().toISOString()
        }));
        setCategories(categoriesWithDates);
        writeStoredJson(CATEGORIES_STORAGE_KEY, categoriesWithDates);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('ℹ️ Using default categories (backend not responding)');
      } else {
        console.log('ℹ️ Using default categories:', error.message);
      }
      // Keep default categories - already set in state initialization
    }
  };

  // Load data on mount
  useEffect(() => {
    console.log('🚀 ProductProvider initializing...');
    fetchProducts();
    
    // Fetch categories in the background (non-blocking)
    fetchCategories().catch(err => {
      console.log('ℹ️ Categories fetch failed, using defaults:', err.message);
    });
  }, []);

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('🆕 Creating new product on server...');
      
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }
      
      const data = await response.json();
      console.log('✅ Product created on server:', data.product);
      const normalizedProduct = normalizeProduct(data.product);
      
      // Add to local state
      setProducts(prev => {
        const nextProducts = [...prev, normalizedProduct];
        writeStoredJson(PRODUCTS_STORAGE_KEY, nextProducts);
        return nextProducts;
      });
      
      return normalizedProduct;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      if (isFetchUnavailable(error)) {
        const localProduct = createLocalProduct(productData);
        setProducts(prev => {
          const nextProducts = [...prev, localProduct];
          writeStoredJson(PRODUCTS_STORAGE_KEY, nextProducts);
          return nextProducts;
        });
        console.warn('⚠️ Backend unavailable, saved product locally instead.');
        return localProduct;
      }
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      console.log(`📝 Updating product on server: ${id}`);
      
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to update product';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ Product updated on server:', data.product);
      const normalizedProduct = normalizeProduct(data.product);
      
      // Update local state
      setProducts(prev => {
        const nextProducts = prev.map(product => product.id === id ? normalizedProduct : product);
        writeStoredJson(PRODUCTS_STORAGE_KEY, nextProducts);
        return nextProducts;
      });
    } catch (error) {
      console.error('❌ Error updating product:', error);
      if (isFetchUnavailable(error)) {
        const existingProduct = products.find(product => product.id === id);
        if (!existingProduct) {
          throw error;
        }

        const localProduct: Product = {
          ...existingProduct,
          ...productData,
          id,
          price: toNumber(productData.price ?? existingProduct.price),
          compareAtPrice: productData.compareAtPrice !== undefined
            ? toNumber(productData.compareAtPrice)
            : existingProduct.compareAtPrice,
          cost: productData.cost !== undefined
            ? toNumber(productData.cost)
            : existingProduct.cost,
          stock: productData.stock !== undefined
            ? Math.max(0, Math.trunc(toNumber(productData.stock)))
            : existingProduct.stock,
          updatedAt: new Date().toISOString(),
        };

        setProducts(prev => {
          const nextProducts = prev.map(product => product.id === id ? localProduct : product);
          writeStoredJson(PRODUCTS_STORAGE_KEY, nextProducts);
          return nextProducts;
        });
        console.warn('⚠️ Backend unavailable, updated product locally instead.');
        return;
      }
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      console.log(`🗑️ Deleting product from server: ${id}`);
      console.log(`📍 Product exists in local state: ${products.find(p => p.id === id) ? 'YES' : 'NO'}`);
      
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: buildHeaders(),
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete product';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error(`❌ Server error response:`, errorData);
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      console.log('✅ Product deleted from server');
      
      // Remove from local state
      setProducts(prev => {
        const nextProducts = prev.filter(product => product.id !== id);
        writeStoredJson(PRODUCTS_STORAGE_KEY, nextProducts);
        return nextProducts;
      });
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      if (isFetchUnavailable(error)) {
        setProducts(prev => {
          const nextProducts = prev.filter(product => product.id !== id);
          writeStoredJson(PRODUCTS_STORAGE_KEY, nextProducts);
          return nextProducts;
        });
        console.warn('⚠️ Backend unavailable, deleted product locally instead.');
        return;
      }
      throw error;
    }
  };

  const getProduct = (id: string) => {
    const normalizedId = id.trim().toLowerCase();
    const requestTier = normalizedId.includes('premium')
      ? 'premium'
      : normalizedId.includes('standard')
        ? 'standard'
        : normalizedId.includes('basic')
          ? 'basic'
          : '';
    const requestAliases = new Set([
      normalizedId,
      normalizedId.replace(/-package$/, ''),
      normalizedId.replace(/-packages$/, ''),
    ]);

    const product = products.find((product) => {
      const productId = (product.id || '').trim().toLowerCase();
      const productNameSlug = (product.name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const productCategory = (product.category || '').trim().toLowerCase();
      const categoryLooksStartup = productCategory.includes('startup');

      if (productId === normalizedId || productNameSlug === normalizedId) {
        return true;
      }

      if (categoryLooksStartup && requestAliases.has(productNameSlug)) {
        return true;
      }

      if (categoryLooksStartup && requestTier) {
        return (
          productNameSlug.includes(requestTier) ||
          (product.name || '').trim().toLowerCase().includes(requestTier)
        );
      }

      return false;
    });
    console.log('🔎 getProduct called:', {
      requestedId: id,
      found: !!product,
      productName: product?.name,
      imageCount: product?.images?.length,
      totalProducts: products.length
    });
    return product;
  };

  const addCategory = (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setCategories(prev => {
      const nextCategories = [...prev, newCategory];
      writeStoredJson(CATEGORIES_STORAGE_KEY, nextCategories);
      return nextCategories;
    });
  };

  const updateCategory = (id: string, categoryData: Partial<Category>) => {
    setCategories(prev => {
      const nextCategories = prev.map(category =>
        category.id === id ? { ...category, ...categoryData } : category
      );
      writeStoredJson(CATEGORIES_STORAGE_KEY, nextCategories);
      return nextCategories;
    });
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => {
      const nextCategories = prev.filter(category => category.id !== id);
      writeStoredJson(CATEGORIES_STORAGE_KEY, nextCategories);
      return nextCategories;
    });
  };

  const uploadImages = async (files: (File | string)[]) => {
    const imageUrls: string[] = [];
    for (const file of files) {
      if (typeof file === 'string') {
        // Check if it's a base64 data URL or an already-uploaded URL
        if (file.startsWith('data:')) {
          // It's base64, need to upload it
          console.log('🔄 Converting base64 to Backend Storage URL...');
          try {
            const url = await uploadImage(file);
            if (url) {
              imageUrls.push(url);
            }
          } catch (error) {
            console.warn('⚠️ Image upload failed, keeping base64 data URL locally:', error);
            imageUrls.push(file);
          }
        } else if (file.startsWith('http://') || file.startsWith('https://')) {
          // Already a valid URL, keep it
          console.log('✅ Using existing URL:', file);
          imageUrls.push(file);
        } else {
          console.warn('⚠️ Skipping invalid image string:', file.substring(0, 50));
        }
      } else {
        // Upload the file
        console.log('📤 Uploading file to Backend Storage...');
        try {
          const url = await uploadImage(file);
          if (url) {
            imageUrls.push(url);
          }
        } catch (error) {
          console.warn('⚠️ Image upload failed, falling back to local data URL:', error);
          const localUrl = await fileToDataUrl(file);
          imageUrls.push(localUrl);
        }
      }
    }
    return imageUrls;
  };

  const refreshProducts = async () => {
    await fetchProducts();
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        uploadImages,
        isLoading,
        refreshProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  return context;
}
