import { useState, useEffect } from 'react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

interface Language {
  id: string;
  label: string;
  type: 'source' | 'target';
}

interface DocumentType {
  id: string;
  label: string;
  category?: string;
}

interface ProductConfig {
  productId: string;
  showSourceLanguage: boolean;
  showTargetLanguage: boolean;
  showDocumentType: boolean;
  enabledSourceLanguages: string[];
  enabledTargetLanguages: string[];
  enabledDocumentTypes: string[];
}

interface ProductConfigData {
  config: ProductConfig;
  sourceLanguages: Language[];
  targetLanguages: Language[];
  documentTypes: DocumentType[];
}

export function useProductConfig(productId: string) {
  const [configData, setConfigData] = useState<ProductConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const fetchProductConfig = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `${API_URL}/product-config/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setConfigData(data);
        } else {
          setError('Failed to fetch product configuration');
        }
      } catch (err) {
        console.error('Error fetching product config:', err);
        setError('Error loading product configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchProductConfig();
  }, [productId]);

  return {
    config: configData?.config,
    sourceLanguages: configData?.sourceLanguages || [],
    targetLanguages: configData?.targetLanguages || [],
    documentTypes: configData?.documentTypes || [],
    loading,
    error,
  };
}