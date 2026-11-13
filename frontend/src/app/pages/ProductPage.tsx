import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ProductTemplate } from '@/app/components/product/ProductTemplate';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { ProductScreenSkeleton } from '@/app/components/layout/PageSkeleton';
import { productDataMap } from '@/app/data/productData';
import { useProducts } from '@/app/context/ProductContext';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { useAuth } from '@/app/context/AuthContext';
import { normalizeProductImages } from '@/app/utils/imageUtils';
import legacyFallbackImage from '@/assets/hero-banner-documents.webp';

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
  category: string,
): 'translation' | 'apostille' | 'attestation' | 'startup' {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory.includes('startup')) {
    return 'startup';
  }

  if (normalizedCategory.includes('apostille')) {
    return 'apostille';
  }

  if (normalizedCategory.includes('attestation')) {
    return 'attestation';
  }

  return 'translation';
}

interface ProductConfig {
  showSourceLanguage: boolean;
  showTargetLanguage: boolean;
  showDocumentType: boolean;
  enabledSourceLanguages: string[];
  enabledTargetLanguages: string[];
  enabledDocumentTypes: string[];
}

interface Language {
  id: string;
  label: string;
  type: 'source' | 'target';
}

interface DocumentType {
  id: string;
  label: string;
}

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { getProduct, isLoading: productsLoading } = useProducts();
  const { user } = useAuth();
  const [productConfig, setProductConfig] = useState<ProductConfig | null>(null);
  const [liveProduct, setLiveProduct] = useState<any | null>(null);
  const [liveFetchDone, setLiveFetchDone] = useState(false);
  const [allSourceLanguages, setAllSourceLanguages] = useState<Language[]>([]);
  const [allTargetLanguages, setAllTargetLanguages] = useState<Language[]>([]);
  const [allDocumentTypes, setAllDocumentTypes] = useState<DocumentType[]>([]);
  
  // Prefer the live backend product, then fall back to the in-memory cache.
  const cachedProduct = getProduct(id || '');
  
  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLiveProduct(null);
      setLiveFetchDone(true);
      return;
    }

    setLiveProduct(null);
    setLiveFetchDone(false);
    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        const response = await fetch(
          `${API_URL}/products/${encodeURIComponent(id)}?t=${Date.now()}`,
          {
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setLiveProduct(data.product || data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn('Failed to fetch live product data:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLiveFetchDone(true);
        }
      }
    };

    void fetchProduct();

    return () => controller.abort();
  }, [id]);

  const adminProduct = liveProduct || cachedProduct;
  
  // Fetch product configuration in the background (non-blocking)
  useEffect(() => {
    if (!id || !adminProduct) return;
    
    const fetchData = async () => {
      try {
        // Build headers with auth token (or anon key for unauthenticated requests)
        const headers = buildHeaders(user?.access_token);
        
        // Fetch all data in parallel for faster loading
        const [configResponse, languagesResponse, docTypesResponse] = await Promise.all([
          fetch(
            `${API_URL}/admin/product-config/${id}`,
            { headers }
          ),
          fetch(
            `${API_URL}/admin/languages`,
            { headers }
          ),
          fetch(
            `${API_URL}/admin/document-types`,
            { headers }
          )
        ]);
        
        // Process config response
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData.config) {
            setProductConfig(configData.config);
          }
        }
        
        // Process languages response
        if (languagesResponse.ok) {
          const languagesData = await languagesResponse.json();
          setAllSourceLanguages(languagesData.sourceLanguages || []);
          setAllTargetLanguages(languagesData.targetLanguages || []);
        }
        
        // Process document types response
        if (docTypesResponse.ok) {
          const docTypesData = await docTypesResponse.json();
          setAllDocumentTypes(docTypesData.documentTypes || []);
        }
      } catch (error) {
        console.error('Error fetching product configuration:', error);
      }
    };
    
    fetchData();
  }, [id, adminProduct, user?.access_token]);
  
  // Build product data with useMemo to avoid unnecessary recalculations
  const productData = useMemo(() => {
    const staticFallbackProduct = id ? productDataMap[id] : undefined;

    if (!adminProduct) {
      if (!staticFallbackProduct) {
        return null;
      }
      // Fallback to matching static product data
      return {
        ...staticFallbackProduct,
        description: '',
        highlights: [],
        productDetails: [],
      };
    }
    
    // Helper functions
    const convertLanguages = (languages: Language[], enabledIds: string[]) => {
      return languages
        .filter(lang => enabledIds.includes(lang.id))
        .map(lang => ({
          value: lang.id,
          label: lang.label
        }));
    };
    
    const convertDocumentTypes = (docTypes: DocumentType[], enabledIds: string[]) => {
      return docTypes
        .filter(doc => enabledIds.includes(doc.id))
        .map(doc => ({
          id: doc.id,
          label: doc.label
        }));
    };
    
    // Determine which fields to show based on product configuration
    const showSourceLanguage = productConfig?.showSourceLanguage ?? true;
    const showTargetLanguage = productConfig?.showTargetLanguage ?? true;
    // Hide document type for startup packages
    const isStartupPackage = adminProduct.category.toLowerCase() === 'startup';
    const showDocumentType = isStartupPackage ? false : (productConfig?.showDocumentType ?? true);
    
    console.log(' ProductPage Debug:', {
      productName: adminProduct.name,
      category: adminProduct.category,
      isStartupPackage,
      showDocumentType
    });
    
    const adminDescription = adminProduct.description?.trim();
    const resolvedDescription = adminDescription || '';
    const resolvedHighlights: { text: string; bold?: boolean }[] = [];
    
    // Build source languages array
    let sourceLanguages = undefined;
    if (showSourceLanguage && productConfig?.enabledSourceLanguages?.length && allSourceLanguages.length > 0) {
      sourceLanguages = convertLanguages(allSourceLanguages, productConfig.enabledSourceLanguages);
    }
    
    // Build target languages array
    let targetLanguages = undefined;
    if (showTargetLanguage && productConfig?.enabledTargetLanguages?.length && allTargetLanguages.length > 0) {
      targetLanguages = convertLanguages(allTargetLanguages, productConfig.enabledTargetLanguages);
    }
    
    // Build document types array
    let documentTypes = [];
    if (showDocumentType) {
      if (productConfig?.enabledDocumentTypes?.length && allDocumentTypes.length > 0) {
        documentTypes = convertDocumentTypes(allDocumentTypes, productConfig.enabledDocumentTypes);
      } else {
        // Fallback to default document types if none configured
        documentTypes = [
          { id: 'birth-certificate', label: 'Birth Certificate' },
          { id: 'marriage-certificate', label: 'Marriage Certificate' },
          { id: 'academic-certificate', label: 'Academic Certificate' },
          { id: 'academic-marksheet', label: 'Academic Marksheet' },
          { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
          { id: 'divorce-decree', label: 'Divorce Decree' },
          { id: 'ration-card', label: 'Ration Card' },
          { id: 'court-papers', label: 'Court Papers' },
          { id: 'medical-certificate', label: 'Medical Certificate' },
          { id: 'driving-license', label: 'Driving License' },
        ];
      }
    }
    
    const normalizedAdminImages = normalizeProductImages(adminProduct.images, adminProduct.name);
    const fallbackStaticImages = staticFallbackProduct
      ? normalizeProductImages(staticFallbackProduct.images, adminProduct.name)
      : [];
    const resolvedImages =
      normalizedAdminImages.length > 0
        ? normalizedAdminImages
        : fallbackStaticImages.length > 0
          ? fallbackStaticImages
          : [{ url: legacyFallbackImage, alt: adminProduct.name }];

    return {
      type: normalizeProductType(adminProduct.category),
      title: adminProduct.name,
      description: resolvedDescription,
      images: resolvedImages,
      price: adminProduct.price,
      originalPrice: adminProduct.compareAtPrice || adminProduct.price,
      highlights: resolvedHighlights,
      sourceLanguages,
      targetLanguages,
      documentTypes,
      productDetails: [],
      whatYouReceive: [
        'Professionally completed service',
        'Digital copy via email',
        'Hard copy if requested',
        'Certificate of completion'
      ],
      processSteps: [
        { step: 1, title: 'Submit Request', description: 'Upload your documents and fill in the required details' },
        { step: 2, title: 'Processing', description: 'Our team processes your request professionally' },
        { step: 3, title: 'Quality Check', description: 'Thorough quality assurance and verification' },
        { step: 4, title: 'Delivery', description: 'Receive your completed service' }
      ],
      deliveryTimeline: {
        softCopy: '3-5 business days',
        hardCopy: '7-10 business days'
      },
      whyChoose: [
        'Professional and certified service providers',
        'Fast and reliable service',
        'Competitive pricing',
        'Quality guaranteed',
        'Excellent customer support'
      ],
      relatedProducts: [],
      sku: adminProduct.sku
    };
  }, [adminProduct, id, productConfig, allSourceLanguages, allTargetLanguages, allDocumentTypes]);

  if (!productData) {
    if (!liveFetchDone || productsLoading) {
      return <ProductScreenSkeleton />;
    }
    return <NotFoundPage />;
  }

  // Render immediately - no loading states!
  return <ProductTemplate data={productData} productKey={id || ''} />;
}

export default ProductPage;

