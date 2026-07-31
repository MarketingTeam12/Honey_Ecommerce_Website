import image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb from 'figma:asset/ed7cdf787729d6d1793cb1a6b477c320f0fcadeb.png';
import image_b880db383a3f50e1c06c72934df4f8a177ab92f2 from 'figma:asset/b880db383a3f50e1c06c72934df4f8a177ab92f2.png';
import image_english_to_indian from 'figma:asset/5d3738f42d25760a7464ddc4a8fe45a029b7fbfb.png';
import { ProductData } from '@/app/components/product/ProductTemplate';

// Helper function to create apostille product data
function createApostilleData(country: string, price: number, originalPrice: number): ProductData {
  return {
    type: 'apostille',
    title: `${country} Apostille Services`,
    images: [],
    price,
    originalPrice,
    highlights: [],
    documentTypes: [
      { id: 'birth-certificate', label: 'Birth Certificate' },
      { id: 'marriage-certificate', label: 'Marriage Certificate' },
      { id: 'academic-certificate', label: 'Academic Certificate' },
      { id: 'academic-marksheet', label: 'Academic Marksheet' },
      { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
      { id: 'divorce-decree', label: 'Divorce Decree' },
      { id: 'ration-card', label: 'Ration Card' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'medical-certificate', label: 'Medical Certificate' },
      { id: 'driving-license', label: 'Driving License' }
    ],
    productDetails: [
      `Complete apostille service for ${country} including MEA and Embassy attestation`,
      `Required for employment, family visa, business setup, and higher education in ${country}`,
      'All personal, educational, and commercial documents accepted',
      'Hague Convention compliant attestation',
      'Government-authorized attestation agents',
      `Includes notary, home department, MEA, and ${country} Embassy attestation`,
      `Valid for use across all regions in ${country}`
    ],
    whatYouReceive: [
      'Original documents with apostille stamp',
      'MEA (Ministry of External Affairs) attestation',
      `${country} Embassy attestation certificate`,
      'Notarized and verified copies',
      'Scanned soft copy via email',
      'Physical delivery via secure courier',
      'Attestation tracking number',
      'Certificate of authenticity'
    ],
    processSteps: [
      {
        step: 1,
        title: 'Document Submission',
        description: 'Upload or courier your original documents to our office'
      },
      {
        step: 2,
        title: 'Notary & State Attestation',
        description: 'Documents are notarized and attested by Home Department/HRD'
      },
      {
        step: 3,
        title: 'MEA Attestation',
        description: 'Ministry of External Affairs attestation in New Delhi'
      },
      {
        step: 4,
        title: `${country} Embassy Attestation`,
        description: `Final attestation from ${country} Embassy in India`
      },
      {
        step: 5,
        title: 'Delivery',
        description: 'Attested documents delivered to your address via courier'
      }
    ],
    deliveryTimeline: {
      softCopy: 'Scanned copy of attested documents sent via email within 12-15 working days',
      hardCopy: 'Original attested documents dispatched via courier within 13-16 working days. Express service available in 7-10 days'
    },
    whyChoose: [
      `Trusted by 5000+ ${country} visa applicants`,
      `Direct tie-ups with MEA and ${country} Embassy`,
      'End-to-end processing, no hidden charges',
      'Real-time tracking of attestation status',
      '100% acceptance guarantee',
      'Expert assistance for visa and embassy queries',
      'Safe handling of original documents',
      'Customer support in multiple languages'
    ],
    relatedProducts: [
      {
        id: 'uae-apostille',
        title: 'UAE Apostille Services',
        imageUrl: '',
        price: 4000,
        originalPrice: 5500,
        link: '/apostille/uae'
      },
      {
        id: 'saudi-apostille',
        title: 'Apostille Services',
        imageUrl: '',
        price: 4500,
        originalPrice: 6000,
        link: '/apostille/saudi-arabia'
      },
      {
        id: 'qatar-apostille',
        title: 'Qatar Apostille Services',
        imageUrl: '',
        price: 4200,
        originalPrice: 5800,
        link: '/apostille/qatar'
      }
    ]
  };
}

// Helper function to create attestation product data
function createAttestationData(country: string, price: number, originalPrice: number): ProductData {
  return {
    type: 'attestation',
    title: `${country} Embassy Attestation Services`,
    images: [
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Official Documents'
      },
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Legal Certification'
      }
    ],
    price,
    originalPrice,
    highlights: [
      { text: `Complete MEA and ${country} Embassy attestation` },
      { text: `Required for work permit and business visa in ${country}` },
      { text: `Accepted by ${country} immigration authorities` },
      { text: 'Scanned copies emailed before dispatch' },
      { text: 'Original documents handled with care' },
      { text: 'Express processing available' },
      { text: 'End-to-end tracking facility' }
    ],
    documentTypes: [
      { id: 'birth-certificate', label: 'Birth Certificate' },
      { id: 'marriage-certificate', label: 'Marriage Certificate' },
      { id: 'academic-certificate', label: 'Academic Certificate' },
      { id: 'academic-marksheet', label: 'Academic Marksheet' },
      { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
      { id: 'divorce-decree', label: 'Divorce Decree' },
      { id: 'ration-card', label: 'Ration Card' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'medical-certificate', label: 'Medical Certificate' },
      { id: 'driving-license', label: 'Driving License' }
    ],
    productDetails: [
      `Complete attestation service for ${country} including notary, MEA, and ${country} Embassy`,
      `Required for employment visa, business setup, and immigration to ${country}`,
      'All educational, personal, and commercial documents accepted',
      `Attestation valid throughout ${country}`,
      `Authorized by ${country} Consulate and MEA India`,
      'Includes translation services if required',
      `Expert guidance on document requirements for ${country} visa`
    ],
    whatYouReceive: [
      `Original documents with ${country} Embassy attestation`,
      'MEA attestation certificate',
      `${country} Embassy seal and stamp`,
      'Notarized copies with verification',
      'Scanned soft copy sent via email',
      'Courier delivery to your address',
      'Attestation reference number',
      `Authentication certificate from ${country} authorities`
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
        title: `${country} Embassy Attestation`,
        description: `Final attestation from ${country} Embassy`
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
      `Specialized in ${country} Embassy attestation`,
      `Direct coordination with ${country} Consulate`,
      'Transparent pricing with no hidden fees',
      'Expert team with 10+ years experience',
      'Translation assistance included',
      'Real-time status updates via WhatsApp',
      'Safe custody of original documents',
      'Highest success rate in embassy approval'
    ],
    relatedProducts: [
      {
        id: 'usa-attestation',
        title: 'USA Embassy Attestation',
        imageUrl: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 5500,
        originalPrice: 7500,
        link: '/attestation/usa'
      },
      {
        id: 'uk-attestation',
        title: 'UK Embassy Attestation',
        imageUrl: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 5200,
        originalPrice: 7200,
        link: '/attestation/uk'
      },
      {
        id: 'china-attestation',
        title: 'China Embassy Attestation',
        imageUrl: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 5000,
        originalPrice: 7000,
        link: '/attestation/china'
      }
    ]
  };
}

// All Apostille Countries
export const apostilleCountries: Record<string, ProductData> = {
  'saudi-arabia': createApostilleData('Saudi Arabia', 4500, 6000),
  'uae': createApostilleData('UAE', 4000, 5500),
  'qatar': createApostilleData('Qatar', 4200, 5800),
  'kuwait': createApostilleData('Kuwait', 4300, 6000),
  'oman': createApostilleData('Oman', 4100, 5700),
  'bahrain': createApostilleData('Bahrain', 4000, 5600),
  'usa': createApostilleData('USA', 5500, 7500),
  'uk': createApostilleData('UK', 5200, 7200),
  'canada': createApostilleData('Canada', 5300, 7300),
  'australia': createApostilleData('Australia', 5400, 7400),
  'germany': createApostilleData('Germany', 5000, 7000),
  'france': createApostilleData('France', 4900, 6900),
  'italy': createApostilleData('Italy', 4800, 6800),
  'spain': createApostilleData('Spain', 4700, 6700),
  'netherlands': createApostilleData('Netherlands', 4800, 6800),
  // New Apostille Countries
  'slovakia': createApostilleData('Slovakia', 4800, 6800),
  'iceland': createApostilleData('Iceland', 5100, 7100),
  'russia': createApostilleData('Russia', 5200, 7200),
  'serbia': createApostilleData('Serbia', 4700, 6700),
  'czech-republic': createApostilleData('Czech Republic', 4900, 6900),
  'austria': createApostilleData('Austria', 5000, 7000),
  'poland': createApostilleData('Poland', 4800, 6800),
  'luxembourg': createApostilleData('Luxembourg', 5000, 7000),
  'dutch': createApostilleData('Dutch', 4800, 6800),
};

// All Attestation Countries
export const attestationCountries: Record<string, ProductData> = {
  'uae': createAttestationData('UAE', 4500, 6500),
  'china': createAttestationData('China', 5000, 7000),
  'qatar': createAttestationData('Qatar', 4700, 6700),
  'vietnam': createAttestationData('Vietnam', 4800, 6800),
  'thailand': createAttestationData('Thailand', 4700, 6700),
  'malaysia': createAttestationData('Malaysia', 4600, 6600),
  'singapore': createAttestationData('Singapore', 4900, 6900),
};

// Startup Packages (Basic, Standard, Premium)
export const startupPackages: Record<string, ProductData> = {
  'basic': {
    type: 'startup',
    title: 'Basic Startup Package',
    images: [
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Business Documents'
      },
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Legal Paperwork'
      }
    ],
    price: 15000,
    originalPrice: 20000,
    highlights: [
      { text: 'Complete business registration package' },
      { text: 'PAN and TAN registration included' },
      { text: 'GST registration assistance' },
      { text: 'Business bank account opening support' },
      { text: 'Digital signature certificate (DSC)' },
      { text: 'All government filings handled' },
      { text: 'Expert CA and legal consultation' }
    ],
    documentTypes: [
      { id: 'pan-card', label: 'PAN Card of Directors' },
      { id: 'aadhaar', label: 'Aadhaar Card' },
      { id: 'address-proof', label: 'Address Proof (Utility Bill/Lease)' },
      { id: 'passport-photo', label: 'Passport Size Photographs' },
      { id: 'business-plan', label: 'Business Plan (Optional)' },
      { id: 'bank-statement', label: 'Bank Statement (Last 3 Months)' },
      { id: 'noc', label: 'NOC from Property Owner' },
      { id: 'board-resolution', label: 'Board Resolution Draft' }
    ],
    productDetails: [
      'Complete startup package for new entrepreneurs and small businesses',
      'Includes company name reservation and approval',
      'Preparation and filing of incorporation documents',
      'Certificate of Incorporation from MCA',
      'PAN and TAN registration for the company',
      'GST registration assistance',
      'Digital Signature Certificate for directors',
      'Bank account opening support',
      'MOA and AOA drafting',
      'DIN for up to 2 directors',
      'Share certificates issuance'
    ],
    whatYouReceive: [
      'Certificate of Incorporation from MCA',
      'Company PAN Card',
      'Company TAN',
      'Digital Signature Certificate (DSC) for 2 directors',
      'Memorandum of Association (MOA)',
      'Articles of Association (AOA)',
      'Share Certificates',
      'Director Identification Number (DIN)',
      'Company Master Data',
      'Bank account opening recommendation letter',
      'GST registration certificate (if opted)',
      'Lifetime email support for compliance queries'
    ],
    processSteps: [
      {
        step: 1,
        title: 'Document Collection & Verification',
        description: 'Submit required documents - PAN, Aadhaar, address proofs'
      },
      {
        step: 2,
        title: 'Name Approval & DSC',
        description: 'Company name reservation with MCA and DSC issuance'
      },
      {
        step: 3,
        title: 'Incorporation Filing',
        description: 'MOA, AOA preparation and incorporation filing with ROC'
      },
      {
        step: 4,
        title: 'PAN, TAN & GST',
        description: 'Application for Company PAN, TAN, and GST registration'
      },
      {
        step: 5,
        title: 'Certificate & Bank Account',
        description: 'Receive incorporation certificate and bank account support'
      }
    ],
    deliveryTimeline: {
      softCopy: 'Digital copies of all certificates sent via email within 10-12 working days',
      hardCopy: 'Physical copies of incorporation certificate, PAN, TAN delivered within 15-18 working days'
    },
    whyChoose: [
      'Experienced CAs and Company Secretaries',
      '1000+ startups successfully registered',
      'Government-approved filing agents',
      'Transparent all-inclusive pricing',
      'Fast processing with MCA',
      'Post-incorporation compliance support',
      'Free consultation on business structure',
      'Help with annual filings and returns'
    ],
    relatedProducts: [
      {
        id: 'standard-startup',
        title: 'Standard Startup Package',
        imageUrl: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 25000,
        originalPrice: 32000,
        link: '/startup/standard'
      },
      {
        id: 'premium-startup',
        title: 'Premium Startup Package',
        imageUrl: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 40000,
        originalPrice: 50000,
        link: '/startup/premium'
      },
      {
        id: 'gst-only',
        title: 'GST Registration Only',
        imageUrl: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 5000,
        originalPrice: 7000,
        link: '/startup/gst'
      }
    ]
  },
  'standard': {
    type: 'startup',
    title: 'Standard Startup Package',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Standard Startup'
      },
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Business Growth'
      },
      {
        url: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Corporate Documents'
      },
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Professional Service'
      }
    ],
    price: 25000,
    originalPrice: 32000,
    highlights: [
      { text: 'Everything in Basic Package PLUS' },
      { text: 'Trademark registration (1 class)' },
      { text: 'Company website domain & hosting (1 year)' },
      { text: 'Business email setup (5 accounts)' },
      { text: 'Accounting software subscription' },
      { text: 'Compliance calendar and reminders' },
      { text: 'Priority customer support' }
    ],
    documentTypes: [
      { id: 'pan-card', label: 'PAN Card of Directors' },
      { id: 'aadhaar', label: 'Aadhaar Card' },
      { id: 'address-proof', label: 'Address Proof' },
      { id: 'passport-photo', label: 'Passport Size Photographs' },
      { id: 'business-plan', label: 'Business Plan' },
      { id: 'trademark-logo', label: 'Trademark Logo/Name' },
      { id: 'bank-statement', label: 'Bank Statement' },
      { id: 'noc', label: 'NOC from Property Owner' }
    ],
    productDetails: [
      'Complete package with all features of Basic Package',
      'Trademark registration for brand protection',
      'Professional business website with domain and hosting',
      'Custom business email addresses (@yourcompany.com)',
      'Cloud-based accounting software subscription for 1 year',
      'Monthly compliance reminders and due date alerts',
      'Priority support via dedicated relationship manager',
      'Assistance with first year statutory compliance',
      'Business plan review and consultation',
      'Investor pitch deck template'
    ],
    whatYouReceive: [
      'All items from Basic Package',
      'Trademark registration certificate',
      'Domain name (yourcompany.com)',
      'Website hosting for 1 year',
      'Professional business email accounts (5)',
      'Accounting software license (1 year)',
      'Compliance calendar',
      'Business cards design template',
      'Letterhead and invoice templates',
      'Dedicated relationship manager support'
    ],
    processSteps: [
      {
        step: 1,
        title: 'Complete Documentation',
        description: 'Submit all required documents and trademark details'
      },
      {
        step: 2,
        title: 'Company Incorporation',
        description: 'Complete incorporation process including name approval, DSC, filing'
      },
      {
        step: 3,
        title: 'Trademark Filing',
        description: 'Trademark search and application filing with IPO'
      },
      {
        step: 4,
        title: 'Digital Setup',
        description: 'Domain registration, hosting, email, and software setup'
      },
      {
        step: 5,
        title: 'Handover & Training',
        description: 'Receive all documents, credentials, and onboarding support'
      }
    ],
    deliveryTimeline: {
      softCopy: 'All digital copies including incorporation, trademark acknowledgment within 12-15 working days',
      hardCopy: 'Physical documents with website and email credentials delivered within 18-20 working days'
    },
    whyChoose: [
      'All-in-one startup solution',
      'Brand protection with trademark',
      'Professional online presence',
      'Streamlined accounting from day one',
      'Never miss compliance deadlines',
      'Dedicated support for peace of mind',
      'Investor-ready documentation',
      'Cost-effective bundled pricing'
    ],
    relatedProducts: [
      {
        id: 'basic-startup',
        title: 'Basic Startup Package',
        imageUrl: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 15000,
        originalPrice: 20000,
        link: '/startup/basic'
      },
      {
        id: 'premium-startup',
        title: 'Premium Startup Package',
        imageUrl: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 40000,
        originalPrice: 50000,
        link: '/startup/premium'
      },
      {
        id: 'trademark-only',
        title: 'Trademark Registration Only',
        imageUrl: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 7000,
        originalPrice: 10000,
        link: '/startup/trademark'
      }
    ]
  },
  'premium': {
    type: 'startup',
    title: 'Premium Startup Package',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Premium Startup'
      },
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Elite Business'
      },
      {
        url: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Executive Package'
      },
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Premium Service'
      }
    ],
    price: 40000,
    originalPrice: 50000,
    highlights: [
      { text: 'Everything in Standard Package PLUS' },
      { text: 'Virtual office with business address' },
      { text: 'Professional logo design' },
      { text: 'Business plan preparation by experts' },
      { text: 'Investor pitch deck creation' },
      { text: 'First year bookkeeping support' },
      { text: 'Legal contract templates' },
      { text: '24/7 VIP support' }
    ],
    documentTypes: [
      { id: 'pan-card', label: 'PAN Card of Directors' },
      { id: 'aadhaar', label: 'Aadhaar Card' },
      { id: 'address-proof', label: 'Address Proof' },
      { id: 'passport-photo', label: 'Passport Size Photographs' },
      { id: 'business-concept', label: 'Business Concept/Idea' },
      { id: 'market-research', label: 'Market Research (if available)' },
      { id: 'logo-preferences', label: 'Logo Design Preferences' },
      { id: 'bank-statement', label: 'Bank Statement' }
    ],
    productDetails: [
      'Complete premium package with all Standard Package features',
      'Virtual office with prestigious business address for 1 year',
      'Professional logo design with 3 concepts and unlimited revisions',
      'Comprehensive business plan prepared by MBA experts',
      'Investor-ready pitch deck with financial projections',
      'Monthly bookkeeping and accounting support for 1st year',
      'Library of legal contract templates (NDA, employment, vendor)',
      'Funding assistance and investor introductions',
      'Quarterly compliance audit and filing support',
      'Priority processing for all government applications'
    ],
    whatYouReceive: [
      'All items from Standard Package',
      'Virtual office address with mail handling',
      'Professional logo (AI, PNG, JPG, SVG formats)',
      'Detailed business plan (30-40 pages)',
      'Investor pitch deck (15-20 slides)',
      'Brand style guide',
      'Monthly bookkeeping for 12 months',
      'Legal contract template library',
      'Business stationery design (cards, letterhead, envelope)',
      'Dedicated CA and legal advisor',
      '24/7 VIP customer support'
    ],
    processSteps: [
      {
        step: 1,
        title: 'Strategy Session',
        description: 'Detailed consultation on business concept, branding, and requirements'
      },
      {
        step: 2,
        title: 'Incorporation & Registrations',
        description: 'Complete company setup, trademark, GST, and all registrations'
      },
      {
        step: 3,
        title: 'Brand Development',
        description: 'Logo design, business plan, pitch deck, and brand identity'
      },
      {
        step: 4,
        title: 'Digital & Legal Setup',
        description: 'Virtual office, website, email, software, legal templates'
      },
      {
        step: 5,
        title: 'Ongoing Support',
        description: 'Monthly bookkeeping, compliance, and dedicated advisory'
      }
    ],
    deliveryTimeline: {
      softCopy: 'All digital assets including logo, business plan, pitch deck within 15-18 working days',
      hardCopy: 'Complete physical package with all documents and branded stationery within 20-25 working days'
    },
    whyChoose: [
      'Complete turnkey startup solution',
      'Professional brand identity',
      'Investor-ready documentation',
      'Prestigious business address',
      'Expert financial management',
      'Legal protection with templates',
      'Funding support and introductions',
      'White-glove VIP service'
    ],
    relatedProducts: [
      {
        id: 'basic-startup',
        title: 'Basic Startup Package',
        imageUrl: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 15000,
        originalPrice: 20000,
        link: '/startup/basic'
      },
      {
        id: 'standard-startup',
        title: 'Standard Startup Package',
        imageUrl: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 25000,
        originalPrice: 32000,
        link: '/startup/standard'
      },
      {
        id: 'virtual-office',
        title: 'Virtual Office Only',
        imageUrl: 'https://images.unsplash.com/photo-1590102426319-c7526718cd70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 8000,
        originalPrice: 12000,
        link: '/startup/virtual-office'
      }
    ]
  }
};

// Translation Products
export const translationProducts: Record<string, ProductData> = {
  'english-to-foreign': {
    type: 'translation',
    title: 'English to Foreign Language Translation',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1727971009177-3ef36181cca9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Foreign Language Documents'
      },
      {
        url: 'https://images.unsplash.com/photo-1604218118561-4bc4427d1e7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Official Government Documents'
      },
      {
        url: 'https://images.unsplash.com/photo-1762427907123-c7ab022a5de7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Business Documents Folder'
      },
      {
        url: 'https://images.unsplash.com/photo-1742630834461-cc6b59a9e3d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Certificate Diploma Education'
      },
      {
        url: '',
        alt: 'Image 5'
      },
      {
        url: '',
        alt: 'Image 6'
      },
      {
        url: '',
        alt: 'Image 7'
      },
      {
        url: '',
        alt: 'Image 8'
      },
      {
        url: '',
        alt: 'Image 9'
      },
      {
        url: '',
        alt: 'Image 10'
      }
    ],
    price: 2500,
    originalPrice: 3000,
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
      { value: 'dutch', label: 'Dutch' },
      { value: 'german', label: 'German' },
      { value: 'czech', label: 'Czech' },
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
      { value: 'indonesian', label: 'Indonesian' }
    ],
    documentTypes: [
      { id: 'birth-certificate', label: 'Birth Certificate' },
      { id: 'marriage-certificate', label: 'Marriage Certificate' },
      { id: 'academic-certificate', label: 'Academic Certificate' },
      { id: 'academic-marksheet', label: 'Academic Marksheet' },
      { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
      { id: 'divorce-decree', label: 'Divorce Decree' },
      { id: 'ration-card', label: 'Ration Card' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'medical-certificate', label: 'Medical Certificate' },
      { id: 'driving-license', label: 'Driving License' }
    ],
    productDetails: [
      'Professional translation services from English to any foreign language',
      'All translations are certified and notarized',
      'Accepted by embassies, universities, and government institutions worldwide',
      'Translations done by native speakers with expertise in legal and official documents',
      'Includes official seal and signature of certified translator',
      'Available for all types of personal, academic, and business documents',
      'Express and urgent services available on request'
    ],
    whatYouReceive: [
      'Original translated document with certification',
      'Notarized copy with official seal and stamp',
      'Certificate of accuracy signed by certified translator',
      'Scanned soft copy via email before dispatch',
      'Hard copy delivered via courier (India & International)',
      'Translation certificate on Honey Translations letterhead',
      'Digital backup for future reference'
    ],
    processSteps: [
      {
        step: 1,
        title: 'Upload Your Document',
        description: 'Upload clear scanned copies or photos of your documents'
      },
      {
        step: 2,
        title: 'Select Language & Document Type',
        description: 'Choose source and target languages, and specify document type'
      },
      {
        step: 3,
        title: 'Receive Quote & Make Payment',
        description: 'Get instant pricing based on page count and make secure payment'
      },
      {
        step: 4,
        title: 'Professional Translation',
        description: 'Our certified translators work on your document with accuracy'
      },
      {
        step: 5,
        title: 'Quality Check & Delivery',
        description: 'Documents are verified, certified, and delivered via email and courier'
      }
    ],
    deliveryTimeline: {
      softCopy: 'Scanned copy delivered via email within 2-3 business days (Express: 24 hours, Urgent: 12 hours)',
      hardCopy: 'Physical hard copy dispatched via courier within 3-4 business days. International delivery: 7-10 business days'
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
        id: 'indian-to-english',
        title: 'Indian Language to English Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2000,
        originalPrice: 2500,
        link: '/product/indian-to-english'
      },
      {
        id: 'foreign-to-english',
        title: 'Foreign to English Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2800,
        originalPrice: 3500,
        link: '/product/foreign-to-english'
      },
      {
        id: 'sworn-translation',
        title: 'Sworn Translation Services',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 3500,
        originalPrice: 4000,
        link: '/product/sworn-translation'
      }
    ]
  },
  'sworn-translation': {
    type: 'translation',
    title: 'Sworn Translation Services',
    images: [
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Sworn Translation'
      },
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Certified Documents'
      },
      {
        url: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Legal Translation'
      },
      {
        url: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Official Stamp'
      }
    ],
    price: 3500,
    originalPrice: 4500,
    highlights: [
      { text: 'Legally valid sworn translation by certified translators' },
      { text: 'Accepted by courts, embassies, and government bodies' },
      { text: 'Translator\'s oath and signature included' },
      { text: 'Official seal and notarization' },
      { text: 'Fast turnaround with express options' },
      { text: 'Confidential handling of sensitive documents' },
      { text: 'Quality assurance and proofreading' }
    ],
    sourceLanguages: [
      { value: 'english', label: 'English' },
      { value: 'hindi', label: 'Hindi' },
      { value: 'tamil', label: 'Tamil' },
      { value: 'telugu', label: 'Telugu' },
      { value: 'marathi', label: 'Marathi' }
    ],
    targetLanguages: [
      { value: 'spanish', label: 'Spanish' },
      { value: 'french', label: 'French' },
      { value: 'german', label: 'German' },
      { value: 'arabic', label: 'Arabic' },
      { value: 'chinese', label: 'Chinese' },
      { value: 'russian', label: 'Russian' }
    ],
    documentTypes: [
      { id: 'court-docs', label: 'Court Documents & Judgments' },
      { id: 'contracts', label: 'Legal Contracts & Agreements' },
      { id: 'powers-attorney', label: 'Power of Attorney' },
      { id: 'wills', label: 'Wills & Testaments' },
      { id: 'affidavits', label: 'Affidavits' },
      { id: 'certificates', label: 'Birth/Marriage/Death Certificates' },
      { id: 'academic', label: 'Degree & Academic Certificates' },
      { id: 'police', label: 'Police Clearance Certificates' },
      { id: 'medical', label: 'Medical Reports & Prescriptions' },
      { id: 'business', label: 'Business & Financial Documents' }
    ],
    productDetails: [
      'Sworn translation by certified and licensed translators',
      'Legal oath taken by translator before notary or competent authority',
      'Includes translator\'s signature, seal, and official declaration',
      'Accepted by courts, immigration offices, embassies, and government departments',
      'Suitable for legal proceedings, visa applications, immigration, and official submissions',
      'Strict confidentiality and data protection compliance',
      'Translation with legal equivalence to original document'
    ],
    whatYouReceive: [
      'Sworn translation with translator\'s oath',
      'Official seal and signature of certified translator',
      'Notarized copy of translation',
      'Certificate of accuracy and authenticity',
      'Declaration of translator\'s qualification and license',
      'Scanned soft copy via email',
      'Hard copy via secure courier',
      'Lifetime authenticity verification support'
    ],
    processSteps: [
      {
        step: 1,
        title: 'Document Upload & Analysis',
        description: 'Upload your documents and our team reviews them for sworn translation requirements'
      },
      {
        step: 2,
        title: 'Assignment to Certified Translator',
        description: 'Document assigned to a qualified and licensed sworn translator'
      },
      {
        step: 3,
        title: 'Translation & Oath',
        description: 'Translator completes translation and takes official oath before authority'
      },
      {
        step: 4,
        title: 'Notarization & Certification',
        description: 'Translation is notarized and certified with official seals'
      },
      {
        step: 5,
        title: 'Quality Check & Delivery',
        description: 'Final review for accuracy and delivery via email and courier'
      }
    ],
    deliveryTimeline: {
      softCopy: 'Scanned sworn translation sent via email within 3-4 business days (Express: 48 hours)',
      hardCopy: 'Original sworn translation with notarization delivered via courier within 5-7 business days'
    },
    whyChoose: [
      'Licensed and certified sworn translators',
      'Accepted by courts and legal authorities worldwide',
      'Over 15 years of experience in legal translations',
      'Strict confidentiality and non-disclosure',
      'Fast and reliable service',
      'Quality assurance with multiple reviews',
      'Expert support for legal and immigration matters',
      'Competitive pricing with transparent quotes'
    ],
    relatedProducts: [
      {
        id: 'certified-translation',
        title: 'Certified Translation Services',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2800,
        originalPrice: 3500,
        link: '/product/certified-translation'
      },
      {
        id: 'legal-translation',
        title: 'Legal Document Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 3200,
        originalPrice: 4000,
        link: '/product/legal-translation'
      },
      {
        id: 'notarized-translation',
        title: 'Notarized Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 3000,
        originalPrice: 3800,
        link: '/product/notarized-translation'
      }
    ]
  },
  'certified-translation': {
    type: 'translation',
    title: 'Certified Translation Services',
    images: [
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Certified Translation'
      },
      {
        url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb,
        alt: 'Official Documents'
      },
      {
        url: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Translation Certificate'
      },
      {
        url: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Certified Stamp'
      }
    ],
    price: 2800,
    originalPrice: 3500,
    highlights: [
      { text: 'Certified translation with official certificate' },
      { text: 'Accepted by universities, embassies, and employers' },
      { text: 'Translator certification and signature included' },
      { text: 'Fast delivery - soft and hard copies' },
      { text: 'Notarization available on request' },
      { text: 'Accurate and professionally formatted' },
      { text: 'Quality reviewed by senior translators' }
    ],
    sourceLanguages: [
      { value: 'english', label: 'English' },
      { value: 'hindi', label: 'Hindi' },
      { value: 'tamil', label: 'Tamil' }
    ],
    targetLanguages: [
      { value: 'spanish', label: 'Spanish' },
      { value: 'french', label: 'French' },
      { value: 'german', label: 'German' },
      { value: 'arabic', label: 'Arabic' }
    ],
    documentTypes: [
      { id: 'academic', label: 'Academic Certificates & Transcripts' },
      { id: 'birth', label: 'Birth Certificates' },
      { id: 'marriage', label: 'Marriage Certificates' },
      { id: 'police', label: 'Police Clearance Certificates' },
      { id: 'employment', label: 'Employment Letters' },
      { id: 'medical', label: 'Medical Reports' }
    ],
    productDetails: [
      'Certified translation by qualified professional translators',
      'Official certificate of translation accuracy',
      'Accepted by immigration authorities, universities, and employers',
      'Formatted exactly like the original document',
      'Includes translator\'s credentials and signature',
      'Suitable for visa applications, university admissions, job applications'
    ],
    whatYouReceive: [
      'Translated document with certification',
      'Certificate of translation accuracy',
      'Translator\'s signature and seal',
      'Scanned soft copy via email',
      'Hard copy via courier',
      'Digital archive copy'
    ],
    processSteps: [
      {
        step: 1,
        title: 'Upload Document',
        description: 'Submit your document for translation'
      },
      {
        step: 2,
        title: 'Translation',
        description: 'Expert translator works on your document'
      },
      {
        step: 3,
        title: 'Quality Review',
        description: 'Senior translator reviews for accuracy'
      },
      {
        step: 4,
        title: 'Certification',
        description: 'Translation is certified with official seal'
      },
      {
        step: 5,
        title: 'Delivery',
        description: 'Soft and hard copies delivered to you'
      }
    ],
    deliveryTimeline: {
      softCopy: 'Email delivery within 2-3 business days',
      hardCopy: 'Courier delivery within 4-5 business days'
    },
    whyChoose: [
      'Certified professional translators',
      'Globally accepted certifications',
      'Fast and reliable service',
      'Accurate formatting',
      'Quality guaranteed',
      'Affordable pricing',
      '24/7 customer support',
      'Secure document handling'
    ],
    relatedProducts: [
      {
        id: 'sworn-translation',
        title: 'Sworn Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 3500,
        originalPrice: 4500,
        link: '/product/sworn-translation'
      },
      {
        id: 'english-to-foreign',
        title: 'English to Foreign Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2500,
        originalPrice: 3000,
        link: '/product/english-to-foreign'
      },
      {
        id: 'notarized-translation',
        title: 'Notarized Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 3000,
        originalPrice: 3800,
        link: '/product/notarized-translation'
      }
    ]
  },
  'foreign-to-english': {
    type: 'translation',
    title: 'Any Foreign Language to English Translation',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1758928807847-ed94f9ed3cad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Passport Visa Documents'
      },
      {
        url: 'https://images.unsplash.com/photo-1641748182997-f9745e9a0348?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'International Documents Notary'
      },
      {
        url: 'https://images.unsplash.com/photo-1766802106922-f9bbec6ba516?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Office Desk Documents'
      },
      {
        url: 'https://images.unsplash.com/photo-1763729805496-b5dbf7f00c79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Legal Paperwork Contract'
      },
      {
        url: '',
        alt: 'Image 5'
      },
      {
        url: '',
        alt: 'Image 6'
      },
      {
        url: '',
        alt: 'Image 7'
      },
      {
        url: '',
        alt: 'Image 8'
      },
      {
        url: '',
        alt: 'Image 9'
      },
      {
        url: '',
        alt: 'Image 10'
      }
    ],
    price: 2800,
    originalPrice: 3500,
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
      { value: 'dutch', label: 'Dutch' },
      { value: 'german', label: 'German' },
      { value: 'czech', label: 'Czech' },
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
      { value: 'indonesian', label: 'Indonesian' }
    ],
    targetLanguages: [
      { value: 'english', label: 'English' }
    ],
    documentTypes: [
      { id: 'birth-certificate', label: 'Birth Certificate' },
      { id: 'marriage-certificate', label: 'Marriage Certificate' },
      { id: 'academic-certificate', label: 'Academic Certificate' },
      { id: 'academic-marksheet', label: 'Academic Marksheet' },
      { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
      { id: 'divorce-decree', label: 'Divorce Decree' },
      { id: 'ration-card', label: 'Ration Card' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'medical-certificate', label: 'Medical Certificate' },
      { id: 'driving-license', label: 'Driving License' }
    ],
    productDetails: [
      'Professional translation services from any foreign language to English',
      'All translations are certified and notarized',
      'Accepted by embassies, universities, and government institutions worldwide',
      'Translations done by native English speakers with expertise in legal and official documents',
      'Includes official seal and signature of certified translator',
      'Available for all types of personal, academic, and business documents',
      'Express and urgent services available on request'
    ],
    whatYouReceive: [
      'Original translated document with certification',
      'Notarized copy with official seal and stamp',
      'Certificate of accuracy signed by certified translator',
      'Scanned soft copy via email before dispatch',
      'Hard copy delivered via courier (India & International)',
      'Translation certificate on Honey Translations letterhead',
      'Digital backup for future reference'
    ],
    processSteps: [
      {
        step: 1,
        title: 'Upload Your Document',
        description: 'Upload clear scanned copies or photos of your foreign language documents'
      },
      {
        step: 2,
        title: 'Select Language & Document Type',
        description: 'Choose source language and English as target, and specify document type'
      },
      {
        step: 3,
        title: 'Receive Quote & Make Payment',
        description: 'Get instant pricing based on page count and make secure payment'
      },
      {
        step: 4,
        title: 'Professional Translation',
        description: 'Our certified translators work on your document with accuracy'
      },
      {
        step: 5,
        title: 'Quality Check & Delivery',
        description: 'Documents are verified, certified, and delivered via email and courier'
      }
    ],
    deliveryTimeline: {
      softCopy: 'Scanned copy delivered via email within 2-3 business days (Express: 24 hours, Urgent: 12 hours)',
      hardCopy: 'Physical hard copy dispatched via courier within 3-4 business days. International delivery: 7-10 business days'
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
        id: 'english-to-foreign',
        title: 'English to Foreign Language Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2500,
        originalPrice: 3000,
        link: '/product/english-to-foreign'
      },
      {
        id: 'indian-to-english',
        title: 'Indian Language to English Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2000,
        originalPrice: 2500,
        link: '/product/indian-to-english'
      },
      {
        id: 'sworn-translation',
        title: 'Sworn Translation Services',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 3500,
        originalPrice: 4000,
        link: '/product/sworn-translation'
      }
    ]
  },
  'indian-to-english': {
    type: 'translation',
    title: 'Any Indian Language to English Translation',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1639291508075-785e1ece773a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Birth Certificate Marriage Documents'
      },
      {
        url: 'https://images.unsplash.com/photo-1621972600542-4cc56f0c72c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Academic Degree Certificate'
      },
      {
        url: 'https://images.unsplash.com/photo-1673515335152-f2589ba8bb7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Professional Translation Service'
      },
      {
        url: 'https://images.unsplash.com/photo-1613826488523-b537c0cab318?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Notarized Document Seal'
      },
      {
        url: '',
        alt: 'Image 5'
      },
      {
        url: '',
        alt: 'Image 6'
      },
      {
        url: '',
        alt: 'Image 7'
      },
      {
        url: '',
        alt: 'Image 8'
      },
      {
        url: '',
        alt: 'Image 9'
      },
      {
        url: '',
        alt: 'Image 10'
      }
    ],
    price: 2000,
    originalPrice: 2500,
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
      { id: 'birth-certificate', label: 'Birth Certificate' },
      { id: 'marriage-certificate', label: 'Marriage Certificate' },
      { id: 'academic-certificate', label: 'Academic Certificate' },
      { id: 'academic-marksheet', label: 'Academic Marksheet' },
      { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
      { id: 'divorce-decree', label: 'Divorce Decree' },
      { id: 'ration-card', label: 'Ration Card' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'medical-certificate', label: 'Medical Certificate' },
      { id: 'driving-license', label: 'Driving License' }
    ],
    productDetails: [
      'Professional translation services from any Indian language to English',
      'All translations are certified and notarized',
      'Accepted by embassies, universities, and government institutions worldwide',
      'Translations done by native English speakers with expertise in Indian languages',
      'Includes official seal and signature of certified translator',
      'Available for all types of personal, academic, and business documents',
      'Express and urgent services available on request'
    ],
    whatYouReceive: [
      'Original translated document with certification',
      'Notarized copy with official seal and stamp',
      'Certificate of accuracy signed by certified translator',
      'Scanned soft copy via email before dispatch',
      'Hard copy delivered via courier (India & International)',
      'Translation certificate on Honey Translations letterhead',
      'Digital backup for future reference'
    ],
    processSteps: [
      {
        step: 1,
        title: 'Upload Your Document',
        description: 'Upload clear scanned copies or photos of your Indian language documents'
      },
      {
        step: 2,
        title: 'Select Language & Document Type',
        description: 'Choose source Indian language and English as target, and specify document type'
      },
      {
        step: 3,
        title: 'Receive Quote & Make Payment',
        description: 'Get instant pricing based on page count and make secure payment'
      },
      {
        step: 4,
        title: 'Professional Translation',
        description: 'Our certified translators work on your document with accuracy'
      },
      {
        step: 5,
        title: 'Quality Check & Delivery',
        description: 'Documents are verified, certified, and delivered via email and courier'
      }
    ],
    deliveryTimeline: {
      softCopy: 'Scanned copy delivered via email within 1-2 business days (Express: 24 hours, Urgent: 6 hours)',
      hardCopy: 'Physical hard copy dispatched via courier within 2-3 business days. International delivery: 7-10 business days'
    },
    whyChoose: [
      'Trusted by 10,000+ customers worldwide',
      'Embassy and immigration accepted translations',
      'ISO certified translation agency',
      'Expert in all major Indian languages',
      'Legal validity guaranteed',
      '24/7 customer support via WhatsApp',
      'Secure payment and data protection',
      'Money-back guarantee on quality'
    ],
    relatedProducts: [
      {
        id: 'english-to-indian',
        title: 'English to Indian Language Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2000,
        originalPrice: 2500,
        link: '/product/english-to-indian'
      },
      {
        id: 'foreign-to-english',
        title: 'Foreign to English Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2800,
        originalPrice: 3500,
        link: '/product/foreign-to-english'
      },
      {
        id: 'certified-translation',
        title: 'Certified Translation Services',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2800,
        originalPrice: 3500,
        link: '/product/certified-translation'
      }
    ]
  },
  'english-to-indian': {
    type: 'translation',
    title: 'English to Any Indian Language Translation',
    images: [
      {
        url: image_english_to_indian,
        alt: 'English to Indian Language Translation'
      },
      {
        url: 'https://images.unsplash.com/photo-1657302155425-611b7aba5b33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Indian Language Scripts'
      },
      {
        url: 'https://images.unsplash.com/photo-1628332208889-bbb5af6b91b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Multilingual Dictionary'
      },
      {
        url: 'https://images.unsplash.com/photo-1606033329692-748cf5d103f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        alt: 'Certified Translation Service'
      },
      {
        url: '',
        alt: 'Image 5'
      },
      {
        url: '',
        alt: 'Image 6'
      },
      {
        url: '',
        alt: 'Image 7'
      },
      {
        url: '',
        alt: 'Image 8'
      },
      {
        url: '',
        alt: 'Image 9'
      },
      {
        url: '',
        alt: 'Image 10'
      }
    ],
    price: 2000,
    originalPrice: 2500,
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
      { id: 'birth-certificate', label: 'Birth Certificate' },
      { id: 'marriage-certificate', label: 'Marriage Certificate' },
      { id: 'academic-certificate', label: 'Academic Certificate' },
      { id: 'academic-marksheet', label: 'Academic Marksheet' },
      { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
      { id: 'divorce-decree', label: 'Divorce Decree' },
      { id: 'ration-card', label: 'Ration Card' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'medical-certificate', label: 'Medical Certificate' },
      { id: 'driving-license', label: 'Driving License' }
    ],
    productDetails: [
      'Professional translation services from English to any Indian language',
      'All translations are certified and notarized',
      'Accepted by Indian government institutions and authorities',
      'Translations done by native speakers with expertise in legal and official documents',
      'Includes official seal and signature of certified translator',
      'Available for all types of personal, academic, and business documents',
      'Express and urgent services available on request'
    ],
    whatYouReceive: [
      'Original translated document with certification',
      'Notarized copy with official seal and stamp',
      'Certificate of accuracy signed by certified translator',
      'Scanned soft copy via email before dispatch',
      'Hard copy delivered via courier (India & International)',
      'Translation certificate on Honey Translations letterhead',
      'Digital backup for future reference'
    ],
    processSteps: [
      {
        step: 1,
        title: 'Upload Your Document',
        description: 'Upload clear scanned copies or photos of your English documents'
      },
      {
        step: 2,
        title: 'Select Language & Document Type',
        description: 'Choose English as source and target Indian language, and specify document type'
      },
      {
        step: 3,
        title: 'Receive Quote & Make Payment',
        description: 'Get instant pricing based on page count and make secure payment'
      },
      {
        step: 4,
        title: 'Professional Translation',
        description: 'Our certified translators work on your document with accuracy'
      },
      {
        step: 5,
        title: 'Quality Check & Delivery',
        description: 'Documents are verified, certified, and delivered via email and courier'
      }
    ],
    deliveryTimeline: {
      softCopy: 'Scanned copy delivered via email within 1-2 business days (Express: 24 hours, Urgent: 6 hours)',
      hardCopy: 'Physical hard copy dispatched via courier within 2-3 business days. International delivery: 7-10 business days'
    },
    whyChoose: [
      'Trusted by 10,000+ customers worldwide',
      'Accepted by Indian government and legal institutions',
      'ISO certified translation agency',
      'Expert in all major Indian languages',
      'Legal validity guaranteed',
      '24/7 customer support via WhatsApp',
      'Secure payment and data protection',
      'Money-back guarantee on quality'
    ],
    relatedProducts: [
      {
        id: 'indian-to-english',
        title: 'Indian Language to English Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2000,
        originalPrice: 2500,
        link: '/product/indian-to-english'
      },
      {
        id: 'english-to-foreign',
        title: 'English to Foreign Language Translation',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2500,
        originalPrice: 3000,
        link: '/product/english-to-foreign'
      },
      {
        id: 'certified-translation',
        title: 'Certified Translation Services',
        imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
        price: 2800,
        originalPrice: 3500,
        link: '/product/certified-translation'
      }
    ]
  },
  'english-to-spanish-sworn': {
    type: 'translation',
    title: 'English to Spanish Sworn Translation',
    images: [
      { url: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'English to Spanish Sworn Translation' },
      { url: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'Certified Translation Documents' },
      { url: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'Legal Sworn Translation' },
      { url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb, alt: 'Official Translation Services' }
    ],
    price: 3299,
    originalPrice: 5000,
    highlights: [
      { text: 'Pricing applicable per page' },
      { text: 'Scanned copies emailed before dispatch' },
      { text: 'Hard copies delivered in India & internationally' },
      { text: 'Accepted globally for visa, immigration, legal, academic & official use' },
      { text: 'Includes signed & stamped sworn translation + affidavit' }
    ],
    documentTypes: [
      { id: 'birth-certificate', label: 'Birth Certificate' },
      { id: 'marriage-certificate', label: 'Marriage Certificate' },
      { id: 'academic-certificate', label: 'Academic Certificate' },
      { id: 'academic-marksheet', label: 'Academic Marksheet' },
      { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
      { id: 'divorce-decree', label: 'Divorce Decree' },
      { id: 'ration-card', label: 'Ration Card' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'medical-certificate', label: 'Medical Certificate' },
      { id: 'driving-license', label: 'Driving License' }
    ],
    productDetails: [
      'Sworn translation from English to Spanish by certified translators',
      'Legal oath taken by translator before notary or competent authority',
      'Includes translator\'s signature, seal, and official declaration',
      'Accepted by courts, immigration offices, embassies, and government departments',
      'Suitable for legal proceedings, visa applications, immigration, and official submissions'
    ],
    whatYouReceive: [
      'Sworn translation with translator\'s oath',
      'Official seal and signature of certified translator',
      'Notarized copy of translation',
      'Certificate of accuracy and authenticity',
      'Scanned soft copy via email',
      'Hard copy via secure courier'
    ],
    processSteps: [
      { step: 1, title: 'Document Upload & Analysis', description: 'Upload your documents and our team reviews them for sworn translation requirements' },
      { step: 2, title: 'Assignment to Certified Translator', description: 'Document assigned to a qualified and licensed sworn translator' },
      { step: 3, title: 'Translation & Oath', description: 'Translator completes translation and takes official oath before authority' },
      { step: 4, title: 'Notarization & Certification', description: 'Translation is notarized and certified with official seals' },
      { step: 5, title: 'Quality Check & Delivery', description: 'Final review for accuracy and delivery via email and courier' }
    ],
    deliveryTimeline: {
      softCopy: 'Scanned sworn translation sent via email within 3-4 business days',
      hardCopy: 'Original sworn translation with notarization delivered via courier within 5-7 business days'
    },
    whyChoose: [
      'Licensed and certified sworn translators',
      'Accepted by courts and legal authorities worldwide',
      'Over 15 years of experience in legal translations',
      'Fast and reliable service',
      'Quality assurance with multiple reviews'
    ],
    relatedProducts: [
      { id: 'english-to-french-sworn', title: 'English to French Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 3300, originalPrice: 5000, link: '/product/english-to-french-sworn' },
      { id: 'english-to-german-sworn', title: 'English to German Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 4299, originalPrice: 6000, link: '/product/english-to-german-sworn' },
      { id: 'english-to-italian-sworn', title: 'English to Italian Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 1499, originalPrice: 5000, link: '/product/english-to-italian-sworn' }
    ]
  },
  'english-to-german-sworn': {
    type: 'translation',
    title: 'English to German Sworn Translation',
    images: [
      { url: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'English to German Sworn Translation' },
      { url: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'Certified Translation Documents' },
      { url: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'Legal Sworn Translation' },
      { url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb, alt: 'Official Translation Services' }
    ],
    price: 4299,
    originalPrice: 6000,
    highlights: [
      { text: 'Pricing applicable per page' },
      { text: 'Scanned copies emailed before dispatch' },
      { text: 'Hard copies delivered in India & internationally' },
      { text: 'Accepted globally for visa, immigration, legal, academic & official use' },
      { text: 'Includes signed & stamped sworn translation + affidavit' }
    ],
    documentTypes: [
      { id: 'birth-certificate', label: 'Birth Certificate' },
      { id: 'marriage-certificate', label: 'Marriage Certificate' },
      { id: 'academic-certificate', label: 'Academic Certificate' },
      { id: 'academic-marksheet', label: 'Academic Marksheet' },
      { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
      { id: 'divorce-decree', label: 'Divorce Decree' },
      { id: 'ration-card', label: 'Ration Card' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'medical-certificate', label: 'Medical Certificate' },
      { id: 'driving-license', label: 'Driving License' }
    ],
    productDetails: [
      'Sworn translation from English to German by certified translators',
      'Legal oath taken by translator before notary or competent authority',
      'Includes translator\'s signature, seal, and official declaration',
      'Accepted by courts, immigration offices, embassies, and government departments',
      'Suitable for legal proceedings, visa applications, immigration, and official submissions'
    ],
    whatYouReceive: [
      'Sworn translation with translator\'s oath',
      'Official seal and signature of certified translator',
      'Notarized copy of translation',
      'Certificate of accuracy and authenticity',
      'Scanned soft copy via email',
      'Hard copy via secure courier'
    ],
    processSteps: [
      { step: 1, title: 'Document Upload & Analysis', description: 'Upload your documents and our team reviews them for sworn translation requirements' },
      { step: 2, title: 'Assignment to Certified Translator', description: 'Document assigned to a qualified and licensed sworn translator' },
      { step: 3, title: 'Translation & Oath', description: 'Translator completes translation and takes official oath before authority' },
      { step: 4, title: 'Notarization & Certification', description: 'Translation is notarized and certified with official seals' },
      { step: 5, title: 'Quality Check & Delivery', description: 'Final review for accuracy and delivery via email and courier' }
    ],
    deliveryTimeline: {
      softCopy: 'Scanned sworn translation sent via email within 3-4 business days',
      hardCopy: 'Original sworn translation with notarization delivered via courier within 5-7 business days'
    },
    whyChoose: [
      'Licensed and certified sworn translators',
      'Accepted by courts and legal authorities worldwide',
      'Over 15 years of experience in legal translations',
      'Fast and reliable service',
      'Quality assurance with multiple reviews'
    ],
    relatedProducts: [
      { id: 'english-to-spanish-sworn', title: 'English to Spanish Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 3299, originalPrice: 5000, link: '/product/english-to-spanish-sworn' },
      { id: 'english-to-french-sworn', title: 'English to French Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 3300, originalPrice: 5000, link: '/product/english-to-french-sworn' },
      { id: 'english-to-italian-sworn', title: 'English to Italian Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 1499, originalPrice: 5000, link: '/product/english-to-italian-sworn' }
    ]
  },
  'english-to-italian-sworn': {
    type: 'translation',
    title: 'English to Italian Sworn Translation',
    images: [
      { url: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'English to Italian Sworn Translation' },
      { url: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'Certified Translation Documents' },
      { url: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'Legal Sworn Translation' },
      { url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb, alt: 'Official Translation Services' }
    ],
    price: 1499,
    originalPrice: 5000,
    highlights: [
      { text: 'Pricing applicable per page' },
      { text: 'Scanned copies emailed before dispatch' },
      { text: 'Hard copies delivered in India & internationally' },
      { text: 'Accepted globally for visa, immigration, legal, academic & official use' },
      { text: 'Includes signed & stamped sworn translation + affidavit' }
    ],
    documentTypes: [
      { id: 'birth-certificate', label: 'Birth Certificate' },
      { id: 'marriage-certificate', label: 'Marriage Certificate' },
      { id: 'academic-certificate', label: 'Academic Certificate' },
      { id: 'academic-marksheet', label: 'Academic Marksheet' },
      { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
      { id: 'divorce-decree', label: 'Divorce Decree' },
      { id: 'ration-card', label: 'Ration Card' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'medical-certificate', label: 'Medical Certificate' },
      { id: 'driving-license', label: 'Driving License' }
    ],
    productDetails: [
      'Sworn translation from English to Italian by certified translators',
      'Legal oath taken by translator before notary or competent authority',
      'Includes translator\'s signature, seal, and official declaration',
      'Accepted by courts, immigration offices, embassies, and government departments',
      'Suitable for legal proceedings, visa applications, immigration, and official submissions'
    ],
    whatYouReceive: [
      'Sworn translation with translator\'s oath',
      'Official seal and signature of certified translator',
      'Notarized copy of translation',
      'Certificate of accuracy and authenticity',
      'Scanned soft copy via email',
      'Hard copy via secure courier'
    ],
    processSteps: [
      { step: 1, title: 'Document Upload & Analysis', description: 'Upload your documents and our team reviews them for sworn translation requirements' },
      { step: 2, title: 'Assignment to Certified Translator', description: 'Document assigned to a qualified and licensed sworn translator' },
      { step: 3, title: 'Translation & Oath', description: 'Translator completes translation and takes official oath before authority' },
      { step: 4, title: 'Notarization & Certification', description: 'Translation is notarized and certified with official seals' },
      { step: 5, title: 'Quality Check & Delivery', description: 'Final review for accuracy and delivery via email and courier' }
    ],
    deliveryTimeline: {
      softCopy: 'Scanned sworn translation sent via email within 3-4 business days',
      hardCopy: 'Original sworn translation with notarization delivered via courier within 5-7 business days'
    },
    whyChoose: [
      'Licensed and certified sworn translators',
      'Accepted by courts and legal authorities worldwide',
      'Over 15 years of experience in legal translations',
      'Fast and reliable service',
      'Quality assurance with multiple reviews'
    ],
    relatedProducts: [
      { id: 'english-to-spanish-sworn', title: 'English to Spanish Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 3299, originalPrice: 5000, link: '/product/english-to-spanish-sworn' },
      { id: 'english-to-german-sworn', title: 'English to German Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 4299, originalPrice: 6000, link: '/product/english-to-german-sworn' },
      { id: 'english-to-french-sworn', title: 'English to French Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 3300, originalPrice: 5000, link: '/product/english-to-french-sworn' }
    ]
  },
  'english-to-french-sworn': {
    type: 'translation',
    title: 'English to French Sworn Translation',
    images: [
      { url: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'English to French Sworn Translation' },
      { url: 'https://images.unsplash.com/photo-1577345848762-8b7cab61de4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'Certified Translation Documents' },
      { url: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080', alt: 'Legal Sworn Translation' },
      { url: image_ed7cdf787729d6d1793cb1a6b477c320f0fcadeb, alt: 'Official Translation Services' }
    ],
    price: 3300,
    originalPrice: 5000,
    highlights: [
      { text: 'Pricing applicable per page' },
      { text: 'Scanned copies emailed before dispatch' },
      { text: 'Hard copies delivered in India & internationally' },
      { text: 'Accepted globally for visa, immigration, legal, academic & official use' },
      { text: 'Includes signed & stamped sworn translation + affidavit' }
    ],
    documentTypes: [
      { id: 'birth-certificate', label: 'Birth Certificate' },
      { id: 'marriage-certificate', label: 'Marriage Certificate' },
      { id: 'academic-certificate', label: 'Academic Certificate' },
      { id: 'academic-marksheet', label: 'Academic Marksheet' },
      { id: 'pcc', label: 'Police Clearance Certificate (PCC)' },
      { id: 'divorce-decree', label: 'Divorce Decree' },
      { id: 'ration-card', label: 'Ration Card' },
      { id: 'court-papers', label: 'Court Papers' },
      { id: 'medical-certificate', label: 'Medical Certificate' },
      { id: 'driving-license', label: 'Driving License' }
    ],
    productDetails: [
      'Sworn translation from English to French by certified translators',
      'Legal oath taken by translator before notary or competent authority',
      'Includes translator\'s signature, seal, and official declaration',
      'Accepted by courts, immigration offices, embassies, and government departments',
      'Suitable for legal proceedings, visa applications, immigration, and official submissions'
    ],
    whatYouReceive: [
      'Sworn translation with translator\'s oath',
      'Official seal and signature of certified translator',
      'Notarized copy of translation',
      'Certificate of accuracy and authenticity',
      'Scanned soft copy via email',
      'Hard copy via secure courier'
    ],
    processSteps: [
      { step: 1, title: 'Document Upload & Analysis', description: 'Upload your documents and our team reviews them for sworn translation requirements' },
      { step: 2, title: 'Assignment to Certified Translator', description: 'Document assigned to a qualified and licensed sworn translator' },
      { step: 3, title: 'Translation & Oath', description: 'Translator completes translation and takes official oath before authority' },
      { step: 4, title: 'Notarization & Certification', description: 'Translation is notarized and certified with official seals' },
      { step: 5, title: 'Quality Check & Delivery', description: 'Final review for accuracy and delivery via email and courier' }
    ],
    deliveryTimeline: {
      softCopy: 'Scanned sworn translation sent via email within 3-4 business days',
      hardCopy: 'Original sworn translation with notarization delivered via courier within 5-7 business days'
    },
    whyChoose: [
      'Licensed and certified sworn translators',
      'Accepted by courts and legal authorities worldwide',
      'Over 15 years of experience in legal translations',
      'Fast and reliable service',
      'Quality assurance with multiple reviews'
    ],
    relatedProducts: [
      { id: 'english-to-spanish-sworn', title: 'English to Spanish Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 3299, originalPrice: 5000, link: '/product/english-to-spanish-sworn' },
      { id: 'english-to-german-sworn', title: 'English to German Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 4299, originalPrice: 6000, link: '/product/english-to-german-sworn' },
      { id: 'english-to-italian-sworn', title: 'English to Italian Sworn Translation', imageUrl: 'https://images.unsplash.com/photo-1563509769909-174be967b5df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400', price: 1499, originalPrice: 5000, link: '/product/english-to-italian-sworn' }
    ]
  }
};

// Combined product map
export const allProductsMap: Record<string, ProductData> = {
  // Translation products
  ...translationProducts,
  // Apostille countries
  ...apostilleCountries,
  // Attestation countries
  ...attestationCountries,
  // Startup packages
  ...startupPackages,
};
