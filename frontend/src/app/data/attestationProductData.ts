import { ProductData } from '@/app/components/product/ProductTemplate';

// Helper to create attestation product data
const createAttestationData = (config: {
  country: string;
  price: number;
  originalPrice: number;
}): ProductData => ({
  type: 'attestation',
  title: `${config.country} Attestation`,
  images: [],  // Removed hardcoded Unsplash images
  price: config.price,
  originalPrice: config.originalPrice,
  highlights: [
    { text: `Complete MEA and ${config.country} Embassy attestation` },
    { text: `Required for work permit and business visa in ${config.country}` },
    { text: `Accepted by ${config.country} immigration authorities` },
    { text: 'Scanned copies emailed before dispatch' },
    { text: 'Original documents handled with care' },
    { text: 'Express processing available' },
    { text: 'End-to-end tracking facility' }
  ],
  documentTypes: [
    { id: 'birth-cert', label: 'Birth Certificate' },
    { id: 'marriage-cert', label: 'Marriage Certificate' },
    { id: 'degree-cert', label: 'Degree & Diploma Certificates' },
    { id: 'experience-cert', label: 'Experience Certificate' },
    { id: 'pcc', label: 'Police Clearance Certificate' },
    { id: 'medical-cert', label: 'Medical Fitness Certificate' },
    { id: 'commercial-docs', label: 'Commercial Documents' },
    { id: 'company-docs', label: 'Company Registration Documents' },
    { id: 'power-attorney', label: 'Power of Attorney' },
    { id: 'affidavit', label: 'Affidavits' }
  ],
  productDetails: [
    `Complete attestation service for ${config.country} including notary, MEA, and ${config.country} Embassy`,
    `Required for employment visa, business setup, and immigration to ${config.country}`,
    'All educational, personal, and commercial documents accepted',
    `Attestation valid throughout ${config.country}`,
    `Authorized by ${config.country} Consulate and MEA India`,
    'Includes translation services if required',
    `Expert guidance on document requirements for ${config.country} visa`
  ],
  whatYouReceive: [
    `Original documents with ${config.country} Embassy attestation`,
    'MEA attestation certificate',
    `${config.country} Embassy seal and stamp`,
    'Notarized copies with verification',
    'Scanned soft copy sent via email',
    'Courier delivery to your address',
    'Attestation reference number',
    `Authentication certificate from ${config.country} authorities`
  ],
  processSteps: [
    {
      step: 1,
      title: 'Document Collection',
      description: 'Submit original documents or send via courier to our office'
    },
    {
      step: 2,
      title: 'Notary & HRD/SDM Attestation',
      description: 'Notarization and state-level attestation from concerned authority'
    },
    {
      step: 3,
      title: 'MEA Attestation',
      description: 'Ministry of External Affairs attestation in New Delhi'
    },
    {
      step: 4,
      title: `${config.country} Embassy Attestation`,
      description: `Final attestation from ${config.country} Embassy`
    },
    {
      step: 5,
      title: 'Secure Delivery',
      description: 'Attested documents delivered via trusted courier service'
    }
  ],
  deliveryTimeline: {
    softCopy: 'Email delivery of scanned attested documents within 15-18 working days',
    hardCopy: 'Physical delivery of original attested documents within 16-20 working days. Express option: 10-12 days'
  },
  whyChoose: [
    `Specialized in ${config.country} Embassy attestation`,
    `Direct coordination with ${config.country} Consulate`,
    'Transparent pricing with no hidden fees',
    'Expert team with 10+ years experience',
    'Translation assistance included',
    'Real-time status updates via WhatsApp',
    'Safe custody of original documents',
    'Highest success rate in embassy approval'
  ],
  relatedProducts: [
    {
      id: 'uae-attestation',
      title: 'UAE Attestation',
      imageUrl: '',
      price: 9500,
      originalPrice: 10000,
      link: '/uae-attestation'
    },
    {
      id: 'china-attestation',
      title: 'China Attestation',
      imageUrl: '',
      price: 16000,
      originalPrice: 17000,
      link: '/china-attestation'
    },
    {
      id: 'qatar-attestation',
      title: 'Qatar Attestation',
      imageUrl: '',
      price: 9500,
      originalPrice: 10000,
      link: '/qatar-attestation'
    }
  ]
});

// Attestation Product Data
export const attestationProductsData: Record<string, ProductData> = {
  'uae-attestation': createAttestationData({
    country: 'UAE',
    price: 9500,
    originalPrice: 13000
  }),

  'china-attestation': createAttestationData({
    country: 'China',
    price: 16000,
    originalPrice: 18000
  }),

  'qatar-attestation': createAttestationData({
    country: 'Qatar',
    price: 9500,
    originalPrice: 12000
  }),

  'kuwait-attestation': createAttestationData({
    country: 'Kuwait',
    price: 16000,
    originalPrice: 19000
  }),

  'hrd-attestation-tn': {
    ...createAttestationData({
      country: 'HRD (Tamil Nadu)',
      price: 2500,
      originalPrice: 5000
    }),
    title: 'HRD Attestation (Tamil Nadu)',
    relatedProducts: [
      {
        id: 'uae-attestation',
        title: 'UAE Attestation',
        imageUrl: '',
        price: 9500,
        originalPrice: 13000,
        link: '/uae-attestation'
      },
      {
        id: 'china-attestation',
        title: 'China Attestation',
        imageUrl: '',
        price: 16000,
        originalPrice: 18000,
        link: '/china-attestation'
      },
      {
        id: 'qatar-attestation',
        title: 'Qatar Attestation',
        imageUrl: '',
        price: 9500,
        originalPrice: 12000,
        link: '/qatar-attestation'
      }
    ]
  }
};