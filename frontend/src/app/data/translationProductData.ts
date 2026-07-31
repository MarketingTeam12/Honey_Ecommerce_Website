import { ProductData } from '@/app/components/product/ProductTemplate';

// Helper to create common translation data structure
const createTranslationProductData = (config: {
  title: string;
  price: number;
  originalPrice: number;
  sourceLanguages: { value: string; label: string }[];
  targetLanguages: { value: string; label: string }[];
  relatedProducts: Array<{
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    originalPrice: number;
    link: string;
  }>;
}): ProductData => ({
  type: 'translation',
  title: config.title,
  images: [],  // Removed hardcoded Unsplash images
  price: config.price,
  originalPrice: config.originalPrice,
  highlights: [
    { text: 'Pricing calculated per page' },
    { text: 'Scanned copies emailed before dispatch' },
    { text: 'Hard copies delivered India & International' },
    { text: 'Accepted globally (Embassy / Immigration / Hague)' },
    { text: 'Issued on Honey Translations official letterhead' },
    { text: 'Certified by professional translators' },
    { text: 'Fast turnaround time' }
  ],
  sourceLanguages: config.sourceLanguages,
  targetLanguages: config.targetLanguages,
  documentTypes: [
    { id: 'birth-cert', label: 'Birth Certificate' },
    { id: 'marriage-cert', label: 'Marriage Certificate' },
    { id: 'academic-cert', label: 'Academic Certificate' },
    { id: 'police-clearance', label: 'Police Clearance Certificate' },
    { id: 'court-papers', label: 'Court Papers' },
    { id: 'driving-license', label: 'Driving License' },
    { id: 'passport', label: 'Passport' },
    { id: 'medical-records', label: 'Medical Records' },
    { id: 'business-docs', label: 'Business Documents' },
    { id: 'legal-contracts', label: 'Legal Contracts' }
  ],
  productDetails: [
    'Professional translation services with certified and notarized documents'
  ],
  whatYouReceive: [
    ''
  ],
  processSteps: [
    {
      step: 1,
      title: 'Upload Your Document',
      description: ''
    },
    {
      step: 2,
      title: 'Select Language & Document Type',
      description: ''
    },
    {
      step: 3,
      title: 'Receive Quote & Make Payment',
      description: ''
    },
    {
      step: 4,
      title: 'Professional Translation',
      description: ''
    },
    {
      step: 5,
      title: 'Quality Check & Delivery',
      description: ''
    }
  ],
  deliveryTimeline: {
    softCopy: '',
    hardCopy: ''
  },
  whyChoose: [
    'Trusted by 10,000+ customers worldwide',
    'Embassy and immigration accepted translations',
    'ISO certified translation agency',
    'Fast processing with express options',
    'Legal validity guaranteed',
    '24/7 customer support via WhatsApp',
    'Secure payment and data protection',
    'Money-back guarantee on quality'
  ],
  relatedProducts: config.relatedProducts
});

// Translation Product Data
export const translationProductsData: Record<string, ProductData> = {
  'english-to-foreign-language': createTranslationProductData({
    title: 'English to Foreign Language',
    price: 900,
    originalPrice: 2000,
    sourceLanguages: [
      { value: 'english', label: 'English' }
    ],
    targetLanguages: [
      { value: 'dutch', label: 'Dutch' },
      { value: 'arabic', label: 'Arabic' },
      { value: 'italian', label: 'Italian' },
      { value: 'japanese', label: 'Japanese' },
      { value: 'french', label: 'French' },
      { value: 'russian', label: 'Russian' },
      { value: 'polish', label: 'Polish' },
      { value: 'chinese', label: 'Chinese' },
      { value: 'spanish', label: 'Spanish' },
      { value: 'portuguese', label: 'Portuguese' },
      { value: 'korean', label: 'Korean' },
      { value: 'greek', label: 'Greek' },
      { value: 'indonesian', label: 'Indonesian' },
      { value: 'german', label: 'German' },
      { value: 'czech', label: 'Czech' }
    ],
    relatedProducts: [
      {
        id: 'foreign-language-to-english',
        title: 'Foreign Language to English',
        imageUrl: '',
        price: 900,
        originalPrice: 1200,
        link: '/foreign-language-to-english'
      },
      {
        id: 'any-indian-language-to-english',
        title: 'Any Indian Language to English',
        imageUrl: '',
        price: 600,
        originalPrice: 1500,
        link: '/any-indian-language-to-english'
      },
      {
        id: 'english-to-any-indian-language',
        title: 'English to Any Indian Language',
        imageUrl: '',
        price: 600,
        originalPrice: 1000,
        link: '/english-to-any-indian-language'
      }
    ]
  }),

  'foreign-language-to-english': createTranslationProductData({
    title: 'Foreign Language to English',
    price: 900,
    originalPrice: 1200,
    sourceLanguages: [
      { value: 'dutch', label: 'Dutch' },
      { value: 'arabic', label: 'Arabic' },
      { value: 'italian', label: 'Italian' },
      { value: 'japanese', label: 'Japanese' },
      { value: 'french', label: 'French' },
      { value: 'russian', label: 'Russian' },
      { value: 'polish', label: 'Polish' },
      { value: 'chinese', label: 'Chinese' },
      { value: 'spanish', label: 'Spanish' },
      { value: 'portuguese', label: 'Portuguese' },
      { value: 'korean', label: 'Korean' },
      { value: 'greek', label: 'Greek' },
      { value: 'indonesian', label: 'Indonesian' },
      { value: 'german', label: 'German' },
      { value: 'czech', label: 'Czech' }
    ],
    targetLanguages: [
      { value: 'english', label: 'English' }
    ],
    relatedProducts: [
      {
        id: 'english-to-foreign',
        title: 'English to Foreign Language',
        imageUrl: '',
        price: 900,
        originalPrice: 2000,
        link: '/english-to-foreign-language'
      },
      {
        id: 'indian-to-english',
        title: 'Any Indian Language to English',
        imageUrl: '',
        price: 400,
        originalPrice: 1500,
        link: '/any-indian-language-to-english'
      },
      {
        id: 'english-to-indian',
        title: 'English to Any Indian Language',
        imageUrl: '',
        price: 400,
        originalPrice: 1000,
        link: '/english-to-any-indian-language'
      }
    ]
  }),

  'any-indian-language-to-english': {
    type: 'translation',
    title: 'Any Indian Language to English',
    price: 600,
    originalPrice: 1500,
    images: [],
    highlights: [
      { text: 'Pricing calculated per page' },
      { text: 'Scanned copies emailed before dispatch' },
      { text: 'Hard copies delivered India & International' },
      { text: 'Accepted globally (Embassy / Immigration / Hague)' },
      { text: 'Issued on Honey Translations official letterhead' },
      { text: 'Certified by professional translators' },
      { text: 'Fast turnaround time' }
    ],
    sourceLanguages: [
      { value: 'assamese', label: 'Assamese' },
      { value: 'bengali', label: 'Bengali' },
      { value: 'konkani', label: 'Konkani' },
      { value: 'hindi', label: 'Hindi' },
      { value: 'gujarati', label: 'Gujarati' },
      { value: 'rajasthani', label: 'Rajasthani' },
      { value: 'marathi', label: 'Marathi' },
      { value: 'malayalam', label: 'Malayalam' },
      { value: 'odiya', label: 'Odiya' },
      { value: 'telugu', label: 'Telugu' },
      { value: 'punjabi', label: 'Punjabi' },
      { value: 'urdu', label: 'Urdu' },
      { value: 'kannada', label: 'Kannada' },
      { value: 'tamil', label: 'Tamil' },
      { value: 'sanskrit', label: 'Sanskrit' }
    ],
    targetLanguages: [
      { value: 'english', label: 'English' }
    ],
    documentTypes: [
      { id: 'birth-cert', label: 'Birth Certificate' },
      { id: 'marriage-cert', label: 'Marriage Certificate' },
      { id: 'academic-cert', label: 'Academic Certificate' },
      { id: 'police-clearance', label: 'Police Clearance Certificate' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'driving-license', label: 'Driving License' },
      { id: 'passport', label: 'Passport' },
      { id: 'medical-records', label: 'Medical Records' },
      { id: 'business-docs', label: 'Business Documents' },
      { id: 'legal-contracts', label: 'Legal Contracts' }
    ],
    productDetails: [
      'Professional translation services with certified and notarized documents'
    ],
    whatYouReceive: [
      ''
    ],
    processSteps: [
      {
        step: 1,
        title: 'Upload Your Document',
        description: ''
      },
      {
        step: 2,
        title: 'Select Language & Document Type',
        description: ''
      },
      {
        step: 3,
        title: 'Receive Quote & Make Payment',
        description: ''
      },
      {
        step: 4,
        title: 'Professional Translation',
        description: ''
      },
      {
        step: 5,
        title: 'Quality Check & Delivery',
        description: ''
      }
    ],
    deliveryTimeline: {
      softCopy: '',
      hardCopy: ''
    },
    whyChoose: [
      'Trusted by 10,000+ customers worldwide',
      'Embassy and immigration accepted translations',
      'ISO certified translation agency',
      'Fast processing with express options',
      'Legal validity guaranteed',
      '24/7 customer support via WhatsApp',
      'Secure payment and data protection',
      'Money-back guarantee on quality'
    ],
    relatedProducts: [
      {
        id: 'english-to-any-indian-language',
        title: 'English to Any Indian Language',
        imageUrl: '',
        price: 600,
        originalPrice: 1000,
        link: '/english-to-any-indian-language'
      },
      {
        id: 'english-to-foreign-language',
        title: 'English to Foreign Language',
        imageUrl: '',
        price: 900,
        originalPrice: 2000,
        link: '/english-to-foreign-language'
      },
      {
        id: 'foreign-language-to-english',
        title: 'Foreign Language to English',
        imageUrl: '',
        price: 900,
        originalPrice: 1200,
        link: '/foreign-language-to-english'
      }
    ]
  },

  'english-to-any-indian-language': {
    type: 'translation',
    title: 'English to Any Indian Language',
    price: 600,
    originalPrice: 1000,
    images: [],
    highlights: [
      { text: 'Pricing calculated per page' },
      { text: 'Scanned copies emailed before dispatch' },
      { text: 'Hard copies delivered India & International' },
      { text: 'Accepted globally (Embassy / Immigration / Hague)' },
      { text: 'Issued on Honey Translations official letterhead' },
      { text: 'Certified by professional translators' },
      { text: 'Fast turnaround time' }
    ],
    sourceLanguages: [
      { value: 'english', label: 'English' }
    ],
    targetLanguages: [
      { value: 'assamese', label: 'Assamese' },
      { value: 'bengali', label: 'Bengali' },
      { value: 'konkani', label: 'Konkani' },
      { value: 'hindi', label: 'Hindi' },
      { value: 'gujarati', label: 'Gujarati' },
      { value: 'rajasthani', label: 'Rajasthani' },
      { value: 'marathi', label: 'Marathi' },
      { value: 'malayalam', label: 'Malayalam' },
      { value: 'odiya', label: 'Odiya' },
      { value: 'telugu', label: 'Telugu' },
      { value: 'punjabi', label: 'Punjabi' },
      { value: 'urdu', label: 'Urdu' },
      { value: 'kannada', label: 'Kannada' },
      { value: 'tamil', label: 'Tamil' },
      { value: 'sanskrit', label: 'Sanskrit' }
    ],
    documentTypes: [
      { id: 'birth-cert', label: 'Birth Certificate' },
      { id: 'marriage-cert', label: 'Marriage Certificate' },
      { id: 'academic-cert', label: 'Academic Certificate' },
      { id: 'police-clearance', label: 'Police Clearance Certificate' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'driving-license', label: 'Driving License' },
      { id: 'passport', label: 'Passport' },
      { id: 'medical-records', label: 'Medical Records' },
      { id: 'business-docs', label: 'Business Documents' },
      { id: 'legal-contracts', label: 'Legal Contracts' }
    ],
    productDetails: [
      'Professional translation services with certified and notarized documents'
    ],
    whatYouReceive: [
      ''
    ],
    processSteps: [
      {
        step: 1,
        title: 'Upload Your Document',
        description: ''
      },
      {
        step: 2,
        title: 'Select Language & Document Type',
        description: ''
      },
      {
        step: 3,
        title: 'Receive Quote & Make Payment',
        description: ''
      },
      {
        step: 4,
        title: 'Professional Translation',
        description: ''
      },
      {
        step: 5,
        title: 'Quality Check & Delivery',
        description: ''
      }
    ],
    deliveryTimeline: {
      softCopy: '',
      hardCopy: ''
    },
    whyChoose: [
      'Trusted by 10,000+ customers worldwide',
      'Embassy and immigration accepted translations',
      'ISO certified translation agency',
      'Fast processing with express options',
      'Legal validity guaranteed',
      '24/7 customer support via WhatsApp',
      'Secure payment and data protection',
      'Money-back guarantee on quality'
    ],
    relatedProducts: [
      {
        id: 'any-indian-language-to-english',
        title: 'Any Indian Language to English',
        imageUrl: '',
        price: 600,
        originalPrice: 1500,
        link: '/any-indian-language-to-english'
      },
      {
        id: 'english-to-foreign-language',
        title: 'English to Foreign Language',
        imageUrl: '',
        price: 900,
        originalPrice: 2000,
        link: '/english-to-foreign-language'
      },
      {
        id: 'foreign-language-to-english',
        title: 'Foreign Language to English',
        imageUrl: '',
        price: 900,
        originalPrice: 1200,
        link: '/foreign-language-to-english'
      }
    ]
  }
};