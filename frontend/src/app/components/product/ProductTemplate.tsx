import { useState, useEffect, useRef, MouseEvent, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { useAuth } from '@/app/context/AuthContext';
import { useAuthGate } from '@/app/context/AuthGateContext';
import { useProductConfig } from '@/app/hooks/useProductConfig';
import { PDFDocument } from 'pdf-lib';
import { ProductReviews } from '@/app/components/product/ProductReviews';
import { GoogleReviewsSection } from '@/app/components/home/GoogleReviewsSection';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Check, Heart, ChevronLeft, ChevronRight, Upload, Minus, Plus, MessageCircle, Share2 } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { toast } from 'sonner';
import googlePayIcon from 'figma:asset/02347af70453dbcedcb242f3af1712a1a954b2f1.png';
import mastercardIcon from 'figma:asset/23e6e86ee8f55bfcbc0611bfe54a4aa7beca2f55.png';
import paypalIcon from 'figma:asset/44e11688213a30c41ad3fe8aae7def63b605380d.png';
import rupayIcon from 'figma:asset/81733917598b7aad94b96ac30b5e2f8a5f8dab91.png';
import visaIcon from 'figma:asset/6f49b2a01cfe14370d80bfa5aa6e2cb4c045e327.png';
import { Trash2 } from 'lucide-react';
import { getFirstValidImage, normalizeProductImages } from '@/app/utils/imageUtils';

const PROMO_TAGS = ['Top Rated', 'Best Offer', 'Popular Choice', 'Exclusive Deal', 'Best Seller', 'Limited Time Offer'];
const POPULAR_CHOICE_APOSTILLE_KEYS = ['poland-apostille', 'dutch-apostille', 'serbia-apostille', 'netherlands-apostille'];
const MAX_UPLOAD_SIZE_MB = 50;
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const APOSTILLE_DOCUMENT_TYPES = [
  { value: 'personal', label: 'Personal' },
  { value: 'education', label: 'Education' },
  { value: 'commercial', label: 'Commercial' },
];
const PERSONAL_DOCUMENT_OPTIONS: DocumentTypeOption[] = [
  { id: 'aadhaar-card', label: 'Aadhaar Card' },
  { id: 'birth-certificate', label: 'Birth Certificate' },
  { id: 'criminal-record', label: 'Criminal Record' },
  { id: 'drivers-license', label: "Driver's License" },
  { id: 'identification-card', label: 'Identification Card' },
  { id: 'medical-certificate', label: 'Medical Certificate' },
  { id: 'police-clearance-certificate', label: 'Police Clearance Certificate' },
  { id: 'rent-agreement', label: 'Rent Agreement' },
  { id: 'single-status-certificate', label: 'Single Status Certificate' },
  { id: 'appointment-letter', label: 'Appointment Letter' },
  { id: 'bonafide-certificate', label: 'Bonafide Certificate' },
  { id: 'death-certificate', label: 'Death Certificate' },
  { id: 'first-information-report-fir', label: 'First Information Report (FIR)' },
  { id: 'insurance-related-document', label: 'Insurance-related Document' },
  { id: 'passport', label: 'Passport' },
  { id: 'power-of-attorney', label: 'Power of Attorney' },
  { id: 'salary-statement', label: 'Salary Statement' },
  { id: 'utility-bill', label: 'Utility Bill' },
  { id: 'bank-statement', label: 'Bank Statement' },
  { id: 'caste-certificate', label: 'Caste Certificate' },
  { id: 'divorce-certificate', label: 'Divorce Certificate' },
  { id: 'gift-deed', label: 'Gift Deed' },
  { id: 'marriage-certificate', label: 'Marriage Certificate' },
  { id: 'payslip', label: 'Payslip' },
  { id: 'ration-card', label: 'Ration Card' },
  { id: 'sale-deed', label: 'Sale Deed' },
  { id: 'will-testament', label: 'Will Testament' },
  { id: 'other', label: 'Other' },
];
const PRODUCT_DRAFT_STORAGE_PREFIX = 'honey_product_draft:';
const MAX_DRAFT_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface SerializedUploadedFile {
  name: string;
  type: string;
  lastModified: number;
  dataUrl: string;
}

interface ProductFormDraft {
  version: 1;
  productId: string;
  sourceLanguages: string[];
  targetLanguages: string[];
  sourceLanguageSearch: string;
  targetLanguageSearch: string;
  destinationSearch: string;
  destination: string;
  apostilleDocumentType: string;
  needTranslation: string;
  translateFromLanguage: string;
  translateToLanguage: string;
  selectedDocTypes: string[];
  uploadedFiles: SerializedUploadedFile[];
  driveLink: string;
  pageCount: number;
  packageDuration: 'full-package' | '1-year' | '2-year';
  savedAt: string;
}

const getProductDraftStorageKey = (productId: string) => `${PRODUCT_DRAFT_STORAGE_PREFIX}${productId}`;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const serializeUploadedFiles = async (files: File[]): Promise<SerializedUploadedFile[]> => {
  const serializableFiles = files.filter((file) => file.size <= MAX_DRAFT_FILE_SIZE_BYTES);

  return Promise.all(
    serializableFiles.map(async (file) => ({
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
      dataUrl: await readFileAsDataUrl(file),
    }))
  );
};

const deserializeUploadedFiles = async (files: SerializedUploadedFile[]): Promise<File[]> => {
  const restoredFiles = await Promise.all(
    files.map(async (file) => {
      try {
        const response = await fetch(file.dataUrl);
        const blob = await response.blob();
        return new File([blob], file.name, {
          type: file.type || blob.type,
          lastModified: file.lastModified,
        });
      } catch (error) {
        console.warn('Failed to restore uploaded file from draft:', file.name, error);
        return null;
      }
    })
  );

  return restoredFiles.filter((file): file is File => file !== null);
};
const EDUCATION_DOCUMENT_OPTIONS: DocumentTypeOption[] = [
  { id: 'college-leaving-certificate', label: 'College Leaving Certificate' },
  { id: 'diploma-certificate', label: 'Diploma Certificate' },
  { id: 'hsc-certificate', label: 'HSC Certificate' },
  { id: 'inter-marksheet', label: 'Inter Marksheet' },
  { id: 'post-graduation-degree-certificate', label: 'Post-Graduation Degree Certificate' },
  { id: 'ssc-certificate', label: 'SSC Certificate' },
  { id: 'transfer-certificate', label: 'Transfer Certificate' },
  { id: 'college-marksheet', label: 'College Marksheet' },
  { id: 'diploma-marksheet', label: 'Diploma Marksheet' },
  { id: 'hsc-marksheet', label: 'HSC Marksheet' },
  { id: 'mbbs-certificate', label: 'MBBS Certificate' },
  { id: 'school-leaving-certificate', label: 'School Leaving Certificate' },
  { id: 'ssc-marksheet', label: 'SSC Marksheet' },
  { id: 'other', label: 'Other' },
  { id: 'dentists-certificate', label: 'Dentists Certificate' },
  { id: 'graduation-degree-certificate', label: 'Graduation Degree Certificate' },
  { id: 'inter-certificate', label: 'Inter Certificate' },
  { id: 'nursing-certificate', label: 'Nursing Certificate' },
  { id: 'school-marksheet', label: 'School Marksheet' },
  { id: 'transcript-certificate', label: 'Transcript Certificate' },
];
const COMMERCIAL_DOCUMENT_OPTIONS: DocumentTypeOption[] = [
  { id: 'business-license', label: 'Business License' },
  { id: 'gumasta', label: 'Gumasta' },
  { id: 'memorandum-of-association', label: 'Memorandum of Association' },
  { id: 'physical-or-chemical-analysis-report', label: 'Physical or chemical analysis report' },
  { id: 'shop-and-establishment-certificate', label: 'Shop and Establishment Certificate' },
  { id: 'certificate-of-incorporation', label: 'Certificate of incorporation' },
  { id: 'insurance-related-document', label: 'Insurance-related document' },
  { id: 'packaging-list', label: 'Packaging List' },
  { id: 'power-of-attorney', label: 'Power of attorney' },
  { id: 'trade-certificate', label: 'Trade Certificate' },
  { id: 'certificate-of-origin', label: 'Certificate of origin' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'partnership-deed', label: 'Partnership Deed' },
  { id: 'product-certificate', label: 'Product certificate' },
  { id: 'other', label: 'Other' },
];
const FALLBACK_DESTINATIONS = ['Australia', 'Canada', 'France', 'Germany', 'India', 'Netherlands', 'Saudi Arabia', 'Singapore', 'United Arab Emirates', 'United Kingdom', 'United States'];
const ALL_LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'italian', label: 'Italian' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'dutch', label: 'Dutch' },
  { value: 'russian', label: 'Russian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'urdu', label: 'Urdu' },
];
const DEFAULT_PRODUCT_DETAILS = [
  'Professional translation and attestation services for all document types',
  'Accurate and certified translations accepted by government authorities',
  'Experienced translators for legal, educational, personal, and business documents',
  'Fast processing with secure document handling',
  'Reliable support for apostille, embassy attestation, and notarization',
  'Affordable pricing with transparent service charges',
  'Timely delivery without compromising quality',
  'Multilingual translation support for Indian and foreign languages',
  'Trusted by clients for quick and hassle-free documentation services',
  'Dedicated customer assistance throughout the process',
  'High-quality formatting and professionally structured documents',
  'Safe and confidential handling of sensitive information',
  'End-to-end support from submission to final delivery',
  'Quick response and smooth communication for every request',
  'Customized solutions based on customer requirements',
  'Trusted service provider with a strong focus on accuracy and reliability',
  'Easy online document submission and support',
  'Professional standards maintained for every project',
  'Secure verification and quality checks before delivery',
  'Customer satisfaction focused service with reliable turnaround times',
];

const getPromoTag = (seed: string) => {
  const normalizedSeed = seed.toLowerCase().replace(/\s+/g, '-');
  if (POPULAR_CHOICE_APOSTILLE_KEYS.some((key) => normalizedSeed.includes(key))) {
    return 'Popular Choice';
  }
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PROMO_TAGS[hash % PROMO_TAGS.length];
};

function renderFormattedInlineText(text: string) {
  const parts: any[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const isBold = token.startsWith('**') || token.startsWith('__');
    const innerText = token.slice(isBold ? 2 : 1, isBold ? -2 : -1);

    parts.push(
      isBold ? <strong key={`${match.index}-${token}`}>{innerText}</strong> : <em key={`${match.index}-${token}`}>{innerText}</em>,
    );

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderFormattedDescription(description: string) {
  const lines = description.split(/\r?\n/);

  return (
    <div className="space-y-2 text-left whitespace-pre-wrap break-words">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={`blank-${index}`} className="h-2" />;
        }

        // Support tick/checkmark bullets (✓, ✔, √) and regular bullets (-, •, *)
        const bulletMatch = trimmed.match(/^[-•*]\s+(.*)$/);
        const tickMarkMatch = trimmed.match(/^[✓✔√]\s+(.*)$/) || trimmed.match(/^(✓|✔|√)\s+(.*)$/);
        const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
        const isHeading =
          /^[A-Z0-9\s&/().,-]+$/.test(trimmed) &&
          trimmed.length > 3 &&
          trimmed.length <= 60 &&
          !trimmed.includes('?');

        // Handle tick/checkmark bullets
        if (tickMarkMatch) {
          return (
            <div key={`tick-${index}`} className="flex items-start gap-2">
              <Check className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
              <span className="flex-1">{renderFormattedInlineText(tickMarkMatch[tickMarkMatch.length - 1])}</span>
            </div>
          );
        }

        // Handle regular bullets
        if (bulletMatch) {
          return (
            <div key={`bullet-${index}`} className="flex items-start gap-2">
              <span className="mt-1.5 text-gray-500">•</span>
              <span className="flex-1">{renderFormattedInlineText(bulletMatch[1])}</span>
            </div>
          );
        }

        if (numberedMatch) {
          return (
            <div key={`numbered-${index}`} className="flex items-start gap-2">
              <span className="min-w-[1.5rem] font-medium text-gray-600">{`${numberedMatch[1]}.`}</span>
              <span className="flex-1">{renderFormattedInlineText(numberedMatch[2])}</span>
            </div>
          );
        }

        if (isHeading) {
          return (
            <div
              key={`line-${index}`}
              className="leading-relaxed font-bold text-[#0a1247]"
            >
              {renderFormattedInlineText(trimmed)}
            </div>
          );
        }

        // Plain feature lines (no explicit bullet/tick/number prefix) still get a tick,
        // matching the highlights list style so descriptions like
        // "Professional and certified service" show a checkmark.
        return (
          <div key={`line-${index}`} className="flex items-start gap-2">
            <Check className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
            <span className="flex-1 leading-relaxed text-gray-700">
              {renderFormattedInlineText(trimmed)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ==================== PRICING DATA STRUCTURES ====================

// 1. STANDARD TRANSLATION PRICING (Original: ?2,000)
const STANDARD_TRANSLATION_ORIGINAL = 2000;

// English → Foreign Language
const ENGLISH_TO_FOREIGN: { [key: string]: number } = {
  'dutch': 900,
  'arabic': 900,
  'italian': 800,
  'japanese': 1400,
  'french': 800,
  'russian': 800,
  'polish': 800,
  'chinese': 1000,
  'spanish': 800,
  'portuguese': 800,
  'korean': 1800,
  'greek': 1050,
  'indonesian': 800,
};

// Foreign Language → English
const FOREIGN_TO_ENGLISH: { [key: string]: number } = {
  'dutch': 900,
  'arabic': 900,
  'italian': 800,
  'japanese': 1050,
  'french': 800,
  'russian': 800,
  'polish': 900,
  'chinese': 1000,
  'spanish': 800,
  'czech': 900,
  'portuguese': 800,
  'korean': 1050,
  'greek': 900,
  'indonesian': 900,
};

// English � Indian Language (Most are ?600, with exceptions)
const ENGLISH_TO_INDIAN: { [key: string]: number } = {
  'assamese': 600,
  'bengali': 600,
  'konkani': 600,
  'hindi': 600,
  'gujarati': 600,
  'rajasthani': 600,
  'marathi': 600,
  'malayalam': 600,
  'odia': 700,
  'telugu': 600,
  'punjabi': 600,
  'urdu': 1100,
  'kannada': 600,
  'tamil': 600,
  'sanskrit': 600,
};

// Indian Language → English (Same prices as above)
const INDIAN_TO_ENGLISH: { [key: string]: number } = {
  'assamese': 600,
  'bengali': 600,
  'konkani': 600,
  'hindi': 600,
  'gujarati': 600,
  'rajasthani': 600,
  'marathi': 600,
  'malayalam': 600,
  'odia': 700,
  'telugu': 600,
  'punjabi': 600,
  'urdu': 1100,
  'kannada': 600,
  'tamil': 600,
  'sanskrit': 600,
};

// 2. SWORN TRANSLATION PRICING (Original: ?5,000)
const SWORN_TRANSLATION_ORIGINAL = 5000;
const SWORN_TRANSLATION_PRICING: { [key: string]: number } = {
  'english-spanish': 3299,
  'english-italian': 1499,
  'english-german': 4299,
  'english-french': 3300,
};

// 3. APOSTILLE SERVICES PRICING (Original: ?3,500, Offer: ?2,500 for all)
const APOSTILLE_ORIGINAL = 3500;
const APOSTILLE_OFFER = 2500;

// 4. ATTESTATION SERVICES PRICING (Varies by country)
const ATTESTATION_PRICING: { [key: string]: { original: number; offer: number } } = {
  'china': { original: 18000, offer: 16000 },
  'qatar': { original: 12000, offer: 9500 },
  'kuwait': { original: 19000, offer: 16000 },
  'uae': { original: 13000, offer: 9500 },
  'hrd': { original: 5000, offer: 2500 },
};

// 5. STARTUP PACKAGE PRICING (Varies by package type)
const STARTUP_PACKAGE_PRICING: { 
  [key: string]: { 
    'full-package': { original: number; offer: number };
    '1-year': { original: number; offer: number };
    '2-year': { original: number; offer: number };
  }
} = {
  'basic': {
    'full-package': { original: 25999, offer: 17999 },
    '1-year': { original: 25999, offer: 12999 },
    '2-year': { original: 25999, offer: 22999 },
  },
  'standard': {
    'full-package': { original: 38999, offer: 32999 },
    '1-year': { original: 38999, offer: 18999 },
    '2-year': { original: 38999, offer: 36999 },
  },
  'premium': {
    'full-package': { original: 73999, offer: 65999 },
    '1-year': { original: 73999, offer: 38999 },
    '2-year': { original: 73999, offer: 73999 },
  },
};

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductHighlight {
  text: string;
  bold?: boolean;
  large?: boolean;
  medium?: boolean;
}

export interface DocumentTypeOption {
  id: string;
  label: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface RelatedProduct {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice: number;
  link: string;
}

export interface ProductData {
  type: 'translation' | 'apostille' | 'attestation' | 'startup';
  title: string;
  description?: string;
  images: ProductImage[];
  price: number;
  originalPrice: number;
  highlights: ProductHighlight[];
  documentTypes: DocumentTypeOption[];
  // Translation specific
  sourceLanguages?: { value: string; label: string }[]  ;
  targetLanguages?: { value: string; label: string }[];
  // Product details sections - can be string[] or styled objects
  productDetails: (string | { text: string; style?: string })[];
  whatYouReceive: string[];
  processSteps: ProcessStep[];
  deliveryTimeline: {
    softCopy: string;
    hardCopy: string;
  };
  whyChoose: string[];
  relatedProducts: RelatedProduct[];
  sku?: string; // Optional SKU field for consistent product identification
}

interface ProductTemplateProps {
  data: ProductData;
  productKey?: string; // Optional product key from route params
}

export function ProductTemplate({ data, productKey }: ProductTemplateProps) {
  const { convertPrice, currency } = useCurrency();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for dynamic images from database
  const [productImages, setProductImages] = useState<ProductImage[]>(normalizeProductImages(data.images, data.title));
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Filter out empty image URLs
  const validImages = normalizeProductImages(productImages, data.title);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Use productKey if provided, otherwise generate from title (for backward compatibility)
  const productId = productKey || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  console.log('🔑 ProductTemplate - productKey:', productKey, 'productId:', productId);
  
  // Check if product is in wishlist
  const inWishlist = isInWishlist(productId);

  // Form state for product configuration
  const [sourceLanguages, setSourceLanguages] = useState<string[]>([]);
  const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
  const [sourceLanguageSearch, setSourceLanguageSearch] = useState('');
  const [targetLanguageSearch, setTargetLanguageSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [sourceLanguageOpen, setSourceLanguageOpen] = useState(false);
  const [targetLanguageOpen, setTargetLanguageOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [apostilleDocumentType, setApostilleDocumentType] = useState('');
  const [needTranslation, setNeedTranslation] = useState('');
  const [translateFromLanguage, setTranslateFromLanguage] = useState('');
  const [translateToLanguage, setTranslateToLanguage] = useState('');
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [driveLink, setDriveLink] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const [packageDuration, setPackageDuration] = useState<'full-package' | '1-year' | '2-year'>('full-package');
  const startupVideosByPath: Record<string, { title: string; videoId: string }> = {
    '/basic-startup-package': { title: 'Basic Startup Package', videoId: 'nVrSsvjJ1lg' },
    '/standard-startup-package': { title: 'Standard Startup Package', videoId: '48XaA1Rglu0' },
    '/premium-startup-package': { title: 'Premium Startup Package', videoId: 'KoLFSkn2UIc' },
  };

  // Check if we're in edit mode (editing an existing cart item)
  const editCartItem = location.state?.editCartItem;
  const isEditMode = !!editCartItem;

  const sourceLanguageOptions = useMemo(
    () =>
      (data.sourceLanguages && data.sourceLanguages.length > 0 ? data.sourceLanguages : ALL_LANGUAGE_OPTIONS).filter(
        (lang) => lang && lang.value && lang.label
      ),
    [data.sourceLanguages]
  );

  const targetLanguageOptions = useMemo(
    () =>
      (data.targetLanguages && data.targetLanguages.length > 0 ? data.targetLanguages : ALL_LANGUAGE_OPTIONS).filter(
        (lang) => lang && lang.value && lang.label
      ),
    [data.targetLanguages]
  );

  const filteredSourceLanguageOptions = useMemo(() => {
    const query = sourceLanguageSearch.trim().toLowerCase();
    if (!query) return sourceLanguageOptions;
    return sourceLanguageOptions.filter((lang) => lang.label.toLowerCase().includes(query));
  }, [sourceLanguageOptions, sourceLanguageSearch]);

  const isEnglishOnlySource = useMemo(() => {
    if (data.type !== 'translation') return false;
    const normalizedTitle = data.title.trim().toLowerCase();
    const normalizedKey = (productKey || '').trim().toLowerCase();
    const isEnglishToFlow =
      normalizedTitle.startsWith('english to ') ||
      normalizedKey.startsWith('english-to-') ||
      normalizedKey === 'english-to-foreign-language' ||
      normalizedKey === 'english-to-any-indian-language';
    if (!isEnglishToFlow) return false;
    if (sourceLanguageOptions.length !== 1) return false;
    return sourceLanguageOptions[0].label.trim().toLowerCase() === 'english';
  }, [data.type, data.title, productKey, sourceLanguageOptions]);

  const filteredTargetLanguageOptions = useMemo(() => {
    const query = targetLanguageSearch.trim().toLowerCase();
    if (!query) return targetLanguageOptions;
    return targetLanguageOptions.filter((lang) => lang.label.toLowerCase().includes(query));
  }, [targetLanguageOptions, targetLanguageSearch]);

  const isEnglishOnlyTarget = useMemo(() => {
    if (data.type !== 'translation') return false;
    if (targetLanguageOptions.length !== 1) return false;
    return targetLanguageOptions[0].label.trim().toLowerCase() === 'english';
  }, [data.type, targetLanguageOptions]);

  // Pre-fill form if in edit mode
  useEffect(() => {
    if (isEditMode && editCartItem) {
      console.log('📝 Edit mode detected, pre-filling form with:', editCartItem);
      
      if (editCartItem.sourceLanguage) {
        setSourceLanguages(
          editCartItem.sourceLanguage
            .split(',')
            .map((lang: string) => lang.trim())
            .filter(Boolean)
        );
      }
      if (editCartItem.targetLanguage) {
        setTargetLanguages(
          editCartItem.targetLanguage
            .split(',')
            .map((lang: string) => lang.trim())
            .filter(Boolean)
        );
      }
      if (editCartItem.certificateType) {
        const docTypes = editCartItem.certificateType.split(', ');
        setSelectedDocTypes(docTypes);
      }
      if (editCartItem.uploadedDocuments?.length) {
        setUploadedFiles(editCartItem.uploadedDocuments);
      } else if (editCartItem.uploadedDocument) {
        setUploadedFiles([editCartItem.uploadedDocument]);
      }
      if (editCartItem.driveLink) setDriveLink(editCartItem.driveLink);
      if (editCartItem.pageCount) setPageCount(editCartItem.pageCount);
    }
  }, [isEditMode]);

  // Reset images to default when productId or data.images changes
  useEffect(() => {
    console.log('🔄 Product changed, resetting images to default:', productId);
    setProductImages(normalizeProductImages(data.images, data.title));
    setSelectedImage(0);
    setImagesLoaded(false);
  }, [productId, data.images, data.title]);

  // Reset all form fields when product changes
  useEffect(() => {
    console.log('🔄 Product changed, resetting all form fields:', productId);
    setSourceLanguages([]);
    setTargetLanguages([]);
    setSourceLanguageSearch('');
    setTargetLanguageSearch('');
    setDestinationSearch('');
    setDestination('');
    setApostilleDocumentType('');
    setNeedTranslation('');
    setTranslateFromLanguage('');
    setTranslateToLanguage('');
    setSelectedDocTypes([]);
    setUploadedFiles([]);
    setDriveLink('');
    setPageCount(1);
    setPackageDuration('full-package');
    setIsZoomed(false);
  }, [productId]);

  // Auto-fix target language to English when product allows only English target.
  useEffect(() => {
    if (!isEnglishOnlyTarget) return;
    setTargetLanguages(['English']);
    setTargetLanguageSearch('');
  }, [isEnglishOnlyTarget, productId]);

  useEffect(() => {
    if (!isEnglishOnlySource) return;
    setSourceLanguages(['English']);
    setSourceLanguageSearch('');
  }, [isEnglishOnlySource, productId]);

  useEffect(() => {
    if (isEditMode) return;

    let cancelled = false;

    const restoreDraft = async () => {
      try {
        const storageKey = getProductDraftStorageKey(productId);
        const rawDraft = sessionStorage.getItem(storageKey);
        if (!rawDraft) return;

        const draft = JSON.parse(rawDraft) as Partial<ProductFormDraft> | null;
        if (!draft || draft.productId !== productId) return;

        setSourceLanguages(Array.isArray(draft.sourceLanguages) ? draft.sourceLanguages : []);
        setTargetLanguages(Array.isArray(draft.targetLanguages) ? draft.targetLanguages : []);
        setSourceLanguageSearch(draft.sourceLanguageSearch || '');
        setTargetLanguageSearch(draft.targetLanguageSearch || '');
        setDestinationSearch(draft.destinationSearch || '');
        setDestination(draft.destination || '');
        setApostilleDocumentType(draft.apostilleDocumentType || '');
        setNeedTranslation(draft.needTranslation || '');
        setTranslateFromLanguage(draft.translateFromLanguage || '');
        setTranslateToLanguage(draft.translateToLanguage || '');
        setSelectedDocTypes(Array.isArray(draft.selectedDocTypes) ? draft.selectedDocTypes : []);
        setDriveLink(draft.driveLink || '');
        setPageCount(draft.pageCount || 1);
        setPackageDuration(draft.packageDuration || 'full-package');

        if (Array.isArray(draft.uploadedFiles) && draft.uploadedFiles.length > 0) {
          const restoredFiles = await deserializeUploadedFiles(draft.uploadedFiles);
          if (!cancelled) {
            setUploadedFiles(restoredFiles);
            if (restoredFiles.length !== draft.uploadedFiles.length) {
              toast.info('Some uploaded files could not be restored automatically. Please verify them before checkout.');
            }
          }
        }
      } catch (error) {
        console.warn('Failed to restore pending product draft:', error);
      }
    };

    void restoreDraft();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, productId]);

  // Fetch product images from database on component mount
  useEffect(() => {
    const fetchProductImages = async () => {
      try {
        // Normalize productId to lowercase for consistency
        const normalizedProductId = productId.toLowerCase();
        
        console.log('📸 Fetching images for product:', normalizedProductId);
        
        // Add cache-busting parameter to force fresh data
        const cacheBuster = Date.now();
        const response = await fetch(
          `${API_URL}/products/${normalizedProductId}/images?t=${cacheBuster}`,
          {
            headers: {
              'Cache-Control': 'no-cache'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('📦 Received images data:', data);
          
          if (data.images && Array.isArray(data.images)) {
            const validDbImages = normalizeProductImages(data.images, data.title);
            console.log('✅ Valid images found:', validDbImages.length);
            
            if (validDbImages.length > 0) {
              console.log('🔄 Updating product images from database');
              setProductImages(validDbImages);
            } else {
              console.log('� No valid images in database, using default images');
            }
          }
        } else {
          console.error('❌ Failed to fetch images, status:', response.status);
        }
      } catch (error) {
        console.log(' Using default product images:', error);
        // Keep using the default images from data.images
      } finally {
        setImagesLoaded(true);
      }
    };

    fetchProductImages();
  }, [productId]);

  // Handle wishlist toggle
  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(productId);
    } else {
      addToWishlist({
        id: productId,
        name: data.title,
        price: currentPrice,
        originalPrice: currentOriginalPrice,
        image: getFirstValidImage(productImages, getFirstValidImage(data.images)),
        category: data.type,
        url: window.location.pathname,
      });
    }
  };

  const handleShareProduct = async () => {
    const shareData = {
      title: data.title,
      text: `Check out this product: ${data.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled or browser blocked share; fallback to copy link
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied. You can share it now.');
    } catch {
      toast.error('Unable to share right now. Please copy the URL manually.');
    }
  };

  const currentPrice = data.price;
  const currentOriginalPrice = data.originalPrice;
  const isApostilleService = data.type === 'apostille';
  const destinationOptions = useMemo(() => {
    try {
      const intlAny = Intl as unknown as { supportedValuesOf?: (type: string) => string[] };
      const regionCodes = intlAny.supportedValuesOf?.('region') || [];
      if (regionCodes.length === 0) {
        return FALLBACK_DESTINATIONS;
      }
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return regionCodes
        .map((code) => displayNames.of(code))
        .filter((name): name is string => !!name && name.length > 0)
        .sort((a, b) => a.localeCompare(b));
    } catch {
      return FALLBACK_DESTINATIONS;
    }
  }, []);

  const filteredDestinationOptions = useMemo(() => {
    const query = destinationSearch.trim().toLowerCase();
    if (!query) return destinationOptions;
    return destinationOptions.filter((country) => country.toLowerCase().includes(query));
  }, [destinationOptions, destinationSearch]);

  // Don't set default language values automatically - let user select them
  // This ensures validation works properly
  // useEffect(() => {
  //   if (data.type === 'translation' && data.sourceLanguages && data.targetLanguages) {
  //     if (data.sourceLanguages.length > 0 && !sourceLanguage) {
  //       setSourceLanguage(data.sourceLanguages[0].value);
  //     }
  //     if (data.targetLanguages.length > 0 && !targetLanguage) {
  //       setTargetLanguage(data.targetLanguages[0].value);
  //     }
  //   }
  // }, [data, sourceLanguage, targetLanguage]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.size <= MAX_UPLOAD_SIZE_BYTES);
    const oversizedFiles = files.filter(file => file.size > MAX_UPLOAD_SIZE_BYTES);

    if (oversizedFiles.length > 0) {
      toast.error(`File size should be ${MAX_UPLOAD_SIZE_MB} MB or less. Please use the Drive Link field for larger files.`);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    setUploadedFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      updatePageCountFromFiles(newFiles);
      return newFiles;
    });
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => file.size <= MAX_UPLOAD_SIZE_BYTES);
    const oversizedFiles = files.filter(file => file.size > MAX_UPLOAD_SIZE_BYTES);

    if (oversizedFiles.length > 0) {
      toast.error(`File size should be ${MAX_UPLOAD_SIZE_MB} MB or less. Please use the Drive Link field for larger files.`);
    }

    if (validFiles.length === 0) {
      return;
    }

    setUploadedFiles(prev => {
      const newFiles = [...prev, ...validFiles];
      updatePageCountFromFiles(newFiles);
      return newFiles;
    });
  };

  const handleDocTypeToggle = (docTypeId: string) => {
    setSelectedDocTypes(prev =>
      prev.includes(docTypeId)
        ? prev.filter(id => id !== docTypeId)
        : [...prev, docTypeId]
    );
  };

  const toggleSourceLanguage = (language: string) => {
    if (isEnglishOnlySource) {
      setSourceLanguages(['English']);
      return;
    }

    setSourceLanguages((prev) =>
      prev.includes(language) ? prev.filter((item) => item !== language) : [...prev, language]
    );
  };

  const toggleTargetLanguage = (language: string) => {
    if (isEnglishOnlyTarget) {
      setTargetLanguages(['English']);
      return;
    }

    setTargetLanguages((prev) =>
      prev.includes(language) ? prev.filter((item) => item !== language) : [...prev, language]
    );
  };

  const sourceLanguageDisplay = sourceLanguages.length > 0 ? sourceLanguages.join(', ') : '';
  const targetLanguageDisplay = targetLanguages.length > 0 ? targetLanguages.join(', ') : '';

  const incrementPages = () => setPageCount(prev => prev + 1);
  const decrementPages = () => setPageCount(prev => Math.max(1, prev - 1));

  const saveProductDraft = async () => {
    try {
      const storageKey = getProductDraftStorageKey(productId);
      const uploadedFilesDraft = await serializeUploadedFiles(uploadedFiles);
      const draft: ProductFormDraft = {
        version: 1,
        productId,
        sourceLanguages,
        targetLanguages,
        sourceLanguageSearch,
        targetLanguageSearch,
        destinationSearch,
        destination,
        apostilleDocumentType,
        needTranslation,
        translateFromLanguage,
        translateToLanguage,
        selectedDocTypes,
        uploadedFiles: uploadedFilesDraft,
        driveLink,
        pageCount,
        packageDuration,
        savedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to save product draft:', error);

      try {
        const fallbackDraft: ProductFormDraft = {
          version: 1,
          productId,
          sourceLanguages,
          targetLanguages,
          sourceLanguageSearch,
          targetLanguageSearch,
          destinationSearch,
          destination,
          apostilleDocumentType,
          needTranslation,
          translateFromLanguage,
          translateToLanguage,
          selectedDocTypes,
          uploadedFiles: [],
          driveLink,
          pageCount,
          packageDuration,
          savedAt: new Date().toISOString(),
        };
        sessionStorage.setItem(getProductDraftStorageKey(productId), JSON.stringify(fallbackDraft));
      } catch (fallbackError) {
        console.warn('Fallback draft save also failed:', fallbackError);
      }
    }
  };

  const clearProductDraft = () => {
    try {
      sessionStorage.removeItem(getProductDraftStorageKey(productId));
    } catch (error) {
      console.warn('Failed to clear product draft:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      await saveProductDraft();
      requireAuth('Please sign in to add items to your cart.');
      return;
    }

    const errors: string[] = [];

    if (data.type === 'translation') {
      if (sourceLanguages.length === 0) {
        errors.push('Please select a source language');
      }
      if (targetLanguages.length === 0) {
        errors.push('Please select a target language');
      }
    }
    if (isApostilleService && !destination) {
      errors.push('Please select a destination');
    }
    if (isApostilleService && !apostilleDocumentType) {
      errors.push('Please select a document type');
    }

    if (!isApostilleService && data.type !== 'startup' && selectedDocTypes.length === 0) {
      errors.push('Please select at least one document type');
    }
    if (isApostilleService && apostilleDocumentType && selectedDocTypes.length === 0) {
      errors.push('Please select at least one document');
    }

    if (data.type !== 'startup' && uploadedFiles.length === 0 && !driveLink.trim()) {
      errors.push('Please upload at least one document or provide a Drive link');
    }

    if (errors.length > 0) {
      const errorMessage = 'Please complete the following:\n\n' + errors.join('\n');
      toast.error(errorMessage);
      return;
    }

    const cartItemId = isEditMode && editCartItem ? editCartItem.id : `${data.type}-${Date.now()}`;

    addToCart({
      id: cartItemId,
      name: data.title,
      basePrice: currentPrice,
      category: data.type,
      url: window.location.pathname,
      image: getFirstValidImage(productImages, getFirstValidImage(data.images)),
      sourceLanguage: sourceLanguageDisplay || undefined,
      targetLanguage: targetLanguageDisplay || undefined,
      certificateType: selectedDocTypes.join(', ') || undefined,
      uploadedDocument: uploadedFiles[0] || null,
      uploadedDocuments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      driveLink: driveLink.trim() || undefined,
      documentPreview: undefined,
      pageCount: pageCount,
      totalPrice: currentPrice * pageCount,
    });
    clearProductDraft();
    toast.success('Item added to cart!');
    navigate('/cart');
  };

  const calculatePageCountFromFiles = async (files: File[]) => {
    let totalPages = 0;
    for (const file of files) {
      if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          totalPages += pdfDoc.getPageCount();
        } catch (error) {
          console.error('Error reading PDF:', error);
          // If can't read PDF, assume 1 page
          totalPages += 1;
        }
      } else {
        // For non-PDF files, assume 1 page
        totalPages += 1;
      }
    }
    return totalPages;
  };

  const updatePageCountFromFiles = async (files: File[]) => {
    const totalPages = await calculatePageCountFromFiles(files);
    setPageCount(totalPages);
  };

  // Debug logging for startup packages
  console.log('📦 ProductTemplate Debug:', {
    title: data.title,
    type: data.type,
    isStartup: data.type === 'startup',
    documentTypes: data.documentTypes,
    documentTypesLength: data.documentTypes?.length,
    shouldShowDocTypes: data.type !== 'startup' && data.documentTypes && data.documentTypes.length > 0
  });

  // CRITICAL: Force hide document types for startup packages, but always show for others
  const shouldShowDocumentTypes = data.type !== 'startup' && !isApostilleService;
  const currentStartupVideo = startupVideosByPath[location.pathname];
  
  // Provide fallback document types if none are provided
  const documentTypesToShow = (data.documentTypes && data.documentTypes.length > 0) 
    ? data.documentTypes 
    : [
        { id: 'birth-certificate', label: 'Birth Certificate' },
        { id: 'marriage-certificate', label: 'Marriage Certificate' },
        { id: 'academic-certificate', label: 'Academic Certificate' },
        { id: 'academic-marksheet', label: 'Academic Marksheet' },
        { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
        { id: 'divorce-decree', label: 'Divorce Decree' },
        { id: 'passport', label: 'Passport' },
        { id: 'ration-card', label: 'Ration Card' },
        { id: 'court-papers', label: 'Court Papers' },
        { id: 'medical-certificate', label: 'Medical Certificate' },
        { id: 'driving-license', label: 'Driving License' },
      ];
  const apostilleDocumentOptionsToShow: DocumentTypeOption[] =
    apostilleDocumentType === 'personal'
      ? PERSONAL_DOCUMENT_OPTIONS
      : apostilleDocumentType === 'education'
        ? EDUCATION_DOCUMENT_OPTIONS
        : apostilleDocumentType === 'commercial'
          ? COMMERCIAL_DOCUMENT_OPTIONS
          : [];
  
  console.log('🔍 Document Type Visibility Check:', {
    productType: data.type,
    isNotStartup: data.type !== 'startup',
    hasDocTypes: !!data.documentTypes,
    docTypesLength: data.documentTypes?.length,
    finalDecision: shouldShowDocumentTypes,
    usingFallback: !data.documentTypes || data.documentTypes.length === 0
  });

  const isNetherlandsApostille =
    isApostilleService &&
    (productId.includes('netherlands-apostille') || data.title.toLowerCase().includes('netherlands apostille'));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
        {/* Main 2-Column Layout */}
        <div className="lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,520px)_minmax(0,1fr)] gap-8 lg:gap-12 lg:items-start">
          
          {/* LEFT COLUMN - Product Images */}
          <div className="space-y-4 lg:self-start lg:pr-1">
            {/* Main Product Image with Zoom */}
            <div
              ref={imageRef}
              className="relative w-full max-w-[520px] mx-auto aspect-square bg-white rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              {validImages.length > 0 ? (
                <>
                  <img
                    src={validImages[selectedImage].url}
                    alt={validImages[selectedImage].alt}
                    className="w-full h-full object-contain object-center bg-white p-3 cursor-pointer"
                    width="600"
                    height="600"
                    loading="eager"
                    style={{ aspectRatio: '1/1' }}
                  />
                  
                  {/* Zoom Lens */}
                  {isZoomed && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `url(${validImages[selectedImage].url})`,
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        backgroundSize: '250%',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-center p-8">
                    <svg className="w-32 h-32 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <p className="text-lg text-gray-400 font-medium">No Image Available</p>
                    <p className="text-sm text-gray-400 mt-2">Service details available below</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2 md:gap-3">
              {validImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImage === index
                      ? 'border-blue-600 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-contain object-center bg-white p-1.5 cursor-pointer"
                    width="120"
                    height="120"
                    loading="lazy"
                    style={{ aspectRatio: '1/1' }}
                  />
                </button>
              ))}
            </div>

            {/* Mobile Image Slider */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))}
                disabled={selectedImage === 0}
                className="p-2 rounded-full bg-gray-200 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center text-sm text-gray-600">
                {selectedImage + 1} / {validImages.length}
              </div>
              <button
                onClick={() => setSelectedImage(prev => Math.min(validImages.length - 1, prev + 1))}
                disabled={selectedImage === validImages.length - 1}
                className="p-2 rounded-full bg-gray-200 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {data.type === 'startup' && currentStartupVideo && (
              <div className="space-y-2 pt-2">
                <h4 className="text-base font-semibold text-[#0a1247]">Startup Package Video</h4>
                <div className="aspect-video rounded-lg overflow-hidden shadow-lg border bg-white">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${currentStartupVideo.videoId}`}
                    title={currentStartupVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <p className="text-center font-medium text-gray-900">{currentStartupVideo.title}</p>
              </div>
            )}

            {isNetherlandsApostille && (
              <div className="space-y-3 pt-2">
                <h4 className="text-base md:text-lg font-semibold text-[#0a1247]">
                  Netherlands Apostille Sample Documents
                </h4>
                <div className="w-full max-w-[520px] mx-auto rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
                  <div className="w-full min-h-[320px] flex items-center justify-center rounded-md border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center p-8">
                      <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <p className="text-lg text-gray-400 font-medium">No Image Available</p>
                      <p className="text-sm text-gray-400 mt-2">Service details available below</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Product Details Panel */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2 lg:pb-6 lg:overscroll-contain">
            {/* Product Title with Wishlist Button */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex-1">
                  {data.title}
                </h1>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareProduct}
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg bg-white text-gray-600 border-2 border-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                    aria-label="Share product"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>

                  {/* Wishlist Heart Button */}
                  <button
                    onClick={handleWishlistToggle}
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg ${
                      inWishlist
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white text-gray-600 border-2 border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500'
                    }`}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart
                      className="w-6 h-6"
                      fill={inWishlist ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>
              </div>
              
              {/* Non-Returnable Badge */}
              <Badge variant="destructive" className="mb-4">
                NON-RETURNABLE
              </Badge>
            </div>

            {/* Price Section */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-red-600">
                  {convertPrice(currentPrice)}
                </span>
                {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {convertPrice(currentOriginalPrice)}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                <p className="text-sm text-green-700 font-medium">
                  You save {convertPrice(currentOriginalPrice - currentPrice)}
                </p>
              )}
              <Badge className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 font-bold">
                {getPromoTag(data.id || data.title || 'product')}
              </Badge>
            </div>

            {data.description && (
              <div className="text-base md:text-lg text-gray-700">
                {renderFormattedDescription(data.description)}
              </div>
            )}

            {/* Product Highlights */}
            {(data.highlights || []).length > 0 && (
              <div className="space-y-2 border-t pt-4">
                {(data.highlights || []).map((highlight, index) => {
                  // Skip rendering green check for startup packages
                  const showCheck = data.type !== 'startup';
                  
                  // Determine text size class
                  let sizeClass = '';
                  if (highlight.large) {
                    sizeClass = 'text-xl';
                  } else if (highlight.medium) {
                    sizeClass = 'text-lg';
                  }
                  
                  // Determine font weight
                  const fontWeight = highlight.bold ? 'font-bold' : '';
                  
                  return (
                    <div key={index} className="flex items-start gap-2">
                      {showCheck && <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                      {!showCheck && highlight.text && <div className="w-5" />}
                      <span className={`text-gray-700 ${fontWeight} ${sizeClass}`}>
                        {highlight.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Support */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-gray-700 mb-2">
                For quick assistance or queries, feel free to contact us on WhatsApp anytime.
              </p>
              <a
                href="https://wa.me/919842696601"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </a>
            </div>

                        {/* Total No. of Pages - Above Configure Your Order */}
            {data.type !== 'startup' && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <Label htmlFor="page-count-top" className="mb-2 block">
                  Total No. of Pages
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decrementPages}
                    disabled={pageCount <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <input
                    id="page-count-top"
                    type="number"
                    min="1"
                    value={pageCount}
                    onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={incrementPages}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">pages</span>
                </div>
              </div>
            )}
            {isApostilleService && (
              <>
                <div>
                  <Label htmlFor="destination" className="text-base md:text-lg font-semibold">
                    Destination <span className="text-red-600">*</span>
                  </Label>
                  <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
                    <PopoverTrigger asChild>
                      <button
                        id="destination"
                        type="button"
                        className="w-full mt-1 h-11 px-3 rounded-md border border-gray-200 bg-white text-left text-base md:text-lg flex items-center justify-between"
                      >
                        <span className={`truncate ${destination ? 'text-gray-900' : 'text-gray-500'}`}>
                          {destination || 'Select destination country'}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${destinationOpen ? 'rotate-90' : ''}`} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                      <input
                        type="text"
                        value={destinationSearch}
                        onChange={(e) => setDestinationSearch(e.target.value)}
                        placeholder="Type to search country..."
                        className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      />
                      <div className="space-y-1">
                        {filteredDestinationOptions.length > 0 ? (
                          filteredDestinationOptions.map((country) => (
                            <button
                              key={country}
                              type="button"
                              onClick={() => {
                                setDestination(country);
                                setDestinationSearch('');
                                setDestinationOpen(false);
                              }}
                              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-left text-sm hover:bg-gray-50"
                            >
                              <span>{country}</span>
                              {destination === country && <Check className="w-4 h-4 text-blue-600" />}
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-sm text-gray-500">No matching country found.</div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="apostille-document-type" className="text-base md:text-lg font-semibold">
                    Document Type <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={apostilleDocumentType}
                    onValueChange={(value) => {
                      setApostilleDocumentType(value);
                      setSelectedDocTypes([]);
                    }}
                  >
                    <SelectTrigger id="apostille-document-type" className="w-full mt-1 h-11 text-base md:text-lg">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {APOSTILLE_DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {apostilleDocumentType && (
                  <div>
                    <Label className="mb-3 block text-base md:text-lg font-semibold">
                      {apostilleDocumentType === 'personal'
                        ? 'Personal Documents'
                        : apostilleDocumentType === 'education'
                          ? 'Education Documents'
                          : 'Commercial Documents'} <span className="text-red-600">*</span>
                    </Label>
                    <div className="space-y-2">
                      {apostilleDocumentOptionsToShow.map((docType) => (
                        <div key={docType.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={docType.id}
                            checked={selectedDocTypes.includes(docType.id)}
                            onCheckedChange={() => handleDocTypeToggle(docType.id)}
                          />
                          <label htmlFor={docType.id} className="text-base md:text-lg font-medium leading-none cursor-pointer">
                            {docType.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            {isApostilleService && (
              <div className="border-t pt-2 space-y-4">
                <div>
                  <Label htmlFor="need-translation" className="text-base md:text-lg font-semibold">
                    If Translation Need
                  </Label>
                  <div id="need-translation" className="mt-2 flex items-center gap-3">
                    <Button
                      type="button"
                      variant={needTranslation === 'yes' ? 'default' : 'outline'}
                      className="h-11 px-6 text-base md:text-lg"
                      onClick={() => setNeedTranslation('yes')}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={needTranslation === 'no' ? 'default' : 'outline'}
                      className="h-11 px-6 text-base md:text-lg"
                      onClick={() => {
                        setNeedTranslation('no');
                        setTranslateFromLanguage('');
                        setTranslateToLanguage('');
                      }}
                    >
                      No
                    </Button>
                  </div>
                </div>

                {needTranslation === 'yes' && (
                  <>
                    <div>
                      <Label htmlFor="translate-from" className="text-base md:text-lg font-semibold">
                        Translate Document From:
                      </Label>
                      <Select value={translateFromLanguage} onValueChange={setTranslateFromLanguage}>
                        <SelectTrigger id="translate-from" className="w-full mt-1 h-11 text-base md:text-lg">
                          <SelectValue placeholder="Select source language" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_LANGUAGE_OPTIONS.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="translate-into" className="text-base md:text-lg font-semibold">
                        Translate Document Into:
                      </Label>
                      <Select value={translateToLanguage} onValueChange={setTranslateToLanguage}>
                        <SelectTrigger id="translate-into" className="w-full mt-1 h-11 text-base md:text-lg">
                          <SelectValue placeholder="Select target language" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_LANGUAGE_OPTIONS.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Configurable Options */}
            <div className="border-t pt-2 space-y-4">
              <h3 className="font-bold text-xl md:text-2xl text-gray-900">Configure Your Order</h3>

              {/* Source & Target Language (ALWAYS shown for Translation, but NOT for Sworn Translation) */}
              {data.type === 'translation' && (
                <>
                  <div>
                    <Label htmlFor="source-lang" className="text-base md:text-lg font-semibold">
                      Source Language <span className="text-red-600">*</span>
                    </Label>
                    <Popover open={sourceLanguageOpen} onOpenChange={setSourceLanguageOpen}>
                      <PopoverTrigger asChild>
                        <button
                          id="source-lang"
                          type="button"
                          className="w-full mt-1 h-11 px-3 rounded-md border border-gray-200 bg-white text-left text-base md:text-lg flex items-center justify-between"
                        >
                          <span className={sourceLanguages.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                            {sourceLanguages.length > 0
                              ? sourceLanguageDisplay
                              : 'Select source language(s)'}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${sourceLanguageOpen ? 'rotate-90' : ''}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                        <input
                          type="text"
                          value={sourceLanguageSearch}
                          onChange={(e) => setSourceLanguageSearch(e.target.value)}
                          placeholder="Type to search language..."
                          className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                        />
                        <div className="space-y-1">
                          {filteredSourceLanguageOptions.length > 0 ? (
                            filteredSourceLanguageOptions.map((lang) => (
                              <label key={lang.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                                <Checkbox
                                  checked={sourceLanguages.includes(lang.label)}
                                  onCheckedChange={() => toggleSourceLanguage(lang.label)}
                                />
                                <span className="text-sm">{lang.label}</span>
                              </label>
                            ))
                          ) : (
                            <div className="px-2 py-2 text-sm text-gray-500">No matching language found.</div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="target-lang" className="text-base md:text-lg font-semibold">
                      Target Language <span className="text-red-600">*</span>
                    </Label>
                    <Popover open={targetLanguageOpen} onOpenChange={setTargetLanguageOpen}>
                      <PopoverTrigger asChild>
                        <button
                          id="target-lang"
                          type="button"
                          className="w-full mt-1 h-11 px-3 rounded-md border border-gray-200 bg-white text-left text-base md:text-lg flex items-center justify-between"
                        >
                          <span className={targetLanguages.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                            {targetLanguages.length > 0
                              ? targetLanguageDisplay
                              : 'Select target language(s)'}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${targetLanguageOpen ? 'rotate-90' : ''}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                        <input
                          type="text"
                          value={targetLanguageSearch}
                          onChange={(e) => setTargetLanguageSearch(e.target.value)}
                          placeholder="Type to search language..."
                          className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                        />
                        <div className="space-y-1">
                          {filteredTargetLanguageOptions.length > 0 ? (
                            filteredTargetLanguageOptions.map((lang) => (
                              <label key={lang.value} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                                <Checkbox
                                  checked={targetLanguages.includes(lang.label)}
                                  onCheckedChange={() => toggleTargetLanguage(lang.label)}
                                />
                                <span className="text-sm">{lang.label}</span>
                              </label>
                            ))
                          ) : (
                            <div className="px-2 py-2 text-sm text-gray-500">No matching language found.</div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                </>
              )}

              {/* Package Duration Selector (Only for Startup Packages) */}
              {data.type === 'startup' && (
                <div>
                  <Label htmlFor="package-duration" className="text-base md:text-lg font-semibold">
                    Package <span className="text-red-600">*</span>
                  </Label>
                  <Select value={packageDuration} onValueChange={(value: 'full-package' | '1-year' | '2-year') => setPackageDuration(value)}>
                    <SelectTrigger id="package-duration" className="w-full mt-1 h-11 text-base md:text-lg">
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-package">Full Premium Corporate Package</SelectItem>
                      <SelectItem value="1-year">1 Year Renewal Package</SelectItem>
                      <SelectItem value="2-year">2 Year Renewal Package</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Document Type Checkboxes - Now shown for ALL product types EXCEPT Startup packages */}
              {shouldShowDocumentTypes && (
                <div>
                  <Label className="mb-3 block text-base md:text-lg font-semibold">
                    Document Type <span className="text-red-600">*</span>
                  </Label>
                  <div className="space-y-2">
                    {documentTypesToShow.map(docType => (
                      <div key={docType.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={docType.id}
                          checked={selectedDocTypes.includes(docType.id)}
                          onCheckedChange={() => handleDocTypeToggle(docType.id)}
                        />
                        <label
                          htmlFor={docType.id}
                          className="text-base md:text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {docType.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Document - Hide for startup packages */}
              {data.type !== 'startup' && (
                <div>
                <Label htmlFor="file-upload" className="mb-2 block text-base md:text-lg font-semibold">
                    Upload Document (Max {MAX_UPLOAD_SIZE_MB} MB, Multiple Files Allowed) <span className="text-red-600">*</span>
                  </Label>
                  <div 
                    className="relative"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-400 focus:outline-none"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-base md:text-lg text-gray-500"> or drag and drop <span className="font-semibold">Click to upload</span></p>
                        <p className="text-sm md:text-base text-gray-500">PDF, DOC, DOCX, JPG, PNG (MAX. {MAX_UPLOAD_SIZE_MB}MB)</p>
                      </div>
                    </label>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedFiles.map((file, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex items-center justify-between gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = uploadedFiles.filter((_, i) => i !== idx);
                              setUploadedFiles(newFiles);
                              updatePageCountFromFiles(newFiles);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <Label htmlFor="drive-link" className="mb-2 block text-sm md:text-base font-medium text-gray-700">
                      Drive Link (for files larger than {MAX_UPLOAD_SIZE_MB} MB)
                    </Label>
                    <input
                      id="drive-link"
                      type="url"
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      placeholder="Paste Google Drive / OneDrive / Dropbox link"
                      className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      If file size is too large, share a public download link here.
                    </p>
                  </div>
                </div>
              )}
            {/* Add to Cart Button */}
              <Button
                className="w-full bg-black hover:bg-gray-800 text-white h-12 text-lg lg:sticky lg:bottom-4 z-10 shadow-lg"
                size="lg"
                onClick={() => {
                  void handleAddToCart();
                }}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                                Add to Cart
              </Button>

              {/* Secure Checkout Info - Below Add to Cart */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Secure checkout with your preferred payment option.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-3 py-1.5 rounded text-xs font-bold">Razorpay</span>
                  
                  <img src={googlePayIcon} alt="Google Pay" className="h-10" />
                  
                  <img src={mastercardIcon} alt="Mastercard" className="h-10" />
                  
                  <img src={paypalIcon} alt="PayPal" className="h-10" />
                  
                  <img src={rupayIcon} alt="RuPay" className="h-10" />
                  
                  <img src={visaIcon} alt="Visa" className="h-10" />
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* BELOW SECTION - Tabs/Accordion Style */}
        <div className="mt-12">
          {data.type !== 'startup' && (
            <Tabs defaultValue="receive" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="receive">What You'll Receive</TabsTrigger>
                <TabsTrigger value="process">Process</TabsTrigger>
                <TabsTrigger value="timeline">Delivery Timeline</TabsTrigger>
                <TabsTrigger value="why">Why Choose Us</TabsTrigger>
              </TabsList>

              <TabsContent value="receive" className="mt-6">
                <div className="prose max-w-none">
                  <h3 className="text-2xl font-bold mb-4 text-[#0a1247]">What You Will Receive</h3>
                  <ol className="space-y-2 list-decimal list-inside">
                    {(data.whatYouReceive || []).map((item, idx) => (
                      <li key={idx} className="text-gray-700">{item}</li>
                    ))}
                  </ol>
                </div>
              </TabsContent>

              <TabsContent value="process" className="mt-6">
                <div className="prose max-w-none">
                  <h3 className="text-2xl font-bold mb-4 text-[#0a1247]">How the Process Works</h3>
                  <div className="space-y-4">
                    {(data.processSteps || []).map((step) => (
                      <div key={step.step} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {step.step}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{step.title}</h4>
                          <p className="text-gray-600">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <div className="prose max-w-none">
                  <h3 className="text-2xl font-bold mb-4 text-[#0a1247]">Delivery Timeline</h3>
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">Soft Copy (Email)</h4>
                      <p className="text-gray-700">{data.deliveryTimeline?.softCopy || '3-5 business days'}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">Hard Copy (Physical Delivery)</h4>
                      <p className="text-gray-700">{data.deliveryTimeline?.hardCopy || '7-10 business days'}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="why" className="mt-6">
                <div className="prose max-w-none">
                  <h3 className="text-2xl font-bold mb-4 text-[#0a1247]">Why Choose Honey Translations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(data.whyChoose || []).map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded-lg p-4">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Ratings & Reviews Section */}
        <ProductReviews productId={productId} productName={data.title} />
        <div className="mt-8">
          <GoogleReviewsSection compact />
        </div>
      </div>
    </div>
  );
}





