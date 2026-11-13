import {
  allProductsMap,
  apostilleCountries,
  attestationCountries,
  startupPackages,
} from '@/app/data/allProductData';
import { getProductBySlug } from '@/app/data/directProductsMap';
import { blogPosts, type BlogPost } from '@/app/data/blogPosts';
import { FAQ_CATEGORIES } from '@/app/data/faqData';
import type { Product } from '@/app/context/ProductContext';

export const SITE_ORIGIN = 'https://honeyuniversal.com';
export const SITE_NAME = 'Honey Translation Services';
export const LEGAL_NAME = 'Honey Universal Digital Private Limited';
export const ALTERNATE_NAME = 'Honey Translations';
export const CONTACT_PHONE = '+91 72990 05577';
export const CONTACT_EMAIL = 'salesteam@honeytranslations.com';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;
export const VERIFIED_SOCIAL_LINKS = [
  'https://www.facebook.com/honeytranslationservices',
  'https://www.linkedin.com/company/53401447/',
  'https://www.instagram.com/honey_translation_services_/',
];

export interface PageSeo {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: 'website' | 'article';
  ogImage: string;
  robots?: string;
  structuredData?: Record<string, unknown>[];
}

const SWORN_TRANSLATION_LABELS: Record<string, string> = {
  'english-to-spanish': 'English to Spanish Sworn Translation',
  'english-to-german': 'English to German Sworn Translation',
  'english-to-italian': 'English to Italian Sworn Translation',
  'english-to-french': 'English to French Sworn Translation',
};

/**
 * Normalizes a route pathname into a canonical URL with no query string or trailing slash.
 */
export function normalizeCanonicalUrl(pathname: string): string {
  const cleanPath = (pathname || '/').split('?')[0].split('#')[0].replace(/\/+$/, '');
  if (!cleanPath || cleanPath === '') {
    return SITE_ORIGIN;
  }
  return `${SITE_ORIGIN}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;
}

const DANGLING_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into',
  'of', 'on', 'or', 'the', 'to', 'via', 'with', 'across', 'including',
]);

function trimDanglingEnd(text: string): string {
  const words = text.replace(/[,:;.\-\s]+$/, '').split(/\s+/).filter(Boolean);
  while (words.length > 5 && DANGLING_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }
  return words.join(' ');
}

/**
 * Fits a meta description strictly into the 150-160 character window from existing text
 * without inventing claims, prices, or offers.
 */
export function fitMetaDescription(rawText: string, paddingText?: string): string {
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
  let text = normalize(String(rawText || ''));

  if (text.length >= 150 && text.length <= 160) {
    return text;
  }

  const filler = normalize(
    paddingText ||
      'Available online across India from Honey Translation Services with soft copy and courier delivery.',
  );

  if (text.length < 150) {
    const joined = text.endsWith('.') ? `${text} ${filler}` : `${text}. ${filler}`;
    text = normalize(joined);
  }

  if (text.length > 160) {
    // Prefer ending on a complete sentence between 150 and 160 chars if one exists
    const sentences = text.match(/[^.!?]+[.!?]/g) || [];
    let built = '';
    for (const s of sentences) {
      const next = built ? `${built} ${s.trim()}` : s.trim();
      if (next.length <= 160) {
        built = next;
      } else {
        break;
      }
    }
    if (built.length >= 150 && built.length <= 160) {
      return built;
    }

    const sliced = text.slice(0, 159);
    const lastSpace = sliced.lastIndexOf(' ');
    let candidate = trimDanglingEnd(lastSpace >= 120 ? sliced.slice(0, lastSpace) : sliced);
    if (candidate.length + 1 >= 150 && candidate.length + 1 <= 160) {
      return `${candidate}.`;
    }
    // Expand with words from filler without dangling stop words
    const extraWords = filler.split(' ');
    for (const word of extraWords) {
      const next = `${candidate} ${word}`;
      if (next.length + 1 > 160) break;
      candidate = next;
    }
    candidate = trimDanglingEnd(candidate);
    if (candidate.length + 1 >= 150 && candidate.length + 1 <= 160) {
      return `${candidate}.`;
    }
    return `${text.slice(0, 159).replace(/[,:;.\-\s]+$/, '')}.`;
  }

  return text;
}

const STATIC_ROUTES: Record<string, { pageName: string; description: string }> = {
  '/': {
    pageName: 'Home',
    description:
      'Certified translations accepted for visa, immigration, legal, court, and international purposes. Pan-India online service with email soft copies and delivery.',
  },
  '/about': {
    pageName: 'About Company',
    description:
      'Learn about Honey Universal Digital Private Limited in Chennai, our mission, and our certified translation, apostille, attestation, and sworn services.',
  },
  '/services': {
    pageName: 'Services',
    description:
      'Explore certified translation, MEA apostille, embassy attestation, sworn translation, and startup registration services delivered across India online.',
  },
  '/pricing': {
    pageName: 'Pricing Plan',
    description:
      'Review Honey Translations pricing plans for Indian and foreign language translation services with multi-format delivery and dedicated support across India.',
  },
  '/pricing-plan': {
    pageName: 'Pricing Plan',
    description:
      'Review Honey Translations pricing plans for Indian and foreign language translation services with multi-format delivery and dedicated support across India.',
  },
  '/faq': {
    pageName: 'FAQ',
    description:
      'Find answers to frequently asked questions about Honey Translation Services, online ordering, delivery timelines, MEA apostille, WhatsApp, and payments.',
  },
  '/blog': {
    pageName: 'Blog',
    description:
      'Read insights, guides, and updates from Honey Translation Services on certified translation, MEA apostille, sworn translation, and immigration documents.',
  },
  '/work-sample': {
    pageName: 'Work Samples',
    description:
      'Explore anonymized samples of certified translation work across language pairs from Honey Translation Services or request tailored examples via WhatsApp.',
  },
  '/contact': {
    pageName: 'Contact Us',
    description:
      'Contact Honey Translation Services by phone, email, or online enquiry form for certified document translation, MEA apostille, and attestation support.',
  },
  '/contact-us': {
    pageName: 'Contact Us',
    description:
      'Reach Honey Translation Services for certified translation, apostille, and embassy attestation assistance via our online enquiry form, phone, or email.',
  },
  '/all-apostille-products': {
    pageName: 'Apostille Services',
    description:
      'Browse MEA apostille services for Hague Convention countries including USA, UK, Canada, Australia, Germany, France, Netherlands, UAE, and Saudi Arabia.',
  },
  '/apostille-products': {
    pageName: 'Apostille Services',
    description:
      'Browse MEA apostille services for Hague Convention countries including USA, UK, Canada, Australia, Germany, France, Netherlands, UAE, and Saudi Arabia.',
  },
  '/apostille': {
    pageName: 'Apostille Services',
    description:
      'Browse MEA apostille services for Hague Convention countries including USA, UK, Canada, Australia, Germany, France, Netherlands, UAE, and Saudi Arabia.',
  },
  '/all-attestation-products': {
    pageName: 'Attestation Services',
    description:
      'Browse embassy and HRD attestation services for UAE, China, Qatar, Kuwait, Vietnam, Thailand, Malaysia, and Singapore with courier delivery across India.',
  },
  '/attestation-products': {
    pageName: 'Attestation Services',
    description:
      'Browse embassy and HRD attestation services for UAE, China, Qatar, Kuwait, Vietnam, Thailand, Malaysia, and Singapore with courier delivery across India.',
  },
  '/attestation': {
    pageName: 'Attestation Services',
    description:
      'Browse embassy and HRD attestation services for UAE, China, Qatar, Kuwait, Vietnam, Thailand, Malaysia, and Singapore with courier delivery across India.',
  },
  '/all-startup-products': {
    pageName: 'Startup Packages',
    description:
      'Compare Basic, Standard, and Premium startup packages covering business registration, PAN, TAN, GST assistance, and legal filings for Indian founders.',
  },
  '/startup-products': {
    pageName: 'Startup Packages',
    description:
      'Compare Basic, Standard, and Premium startup packages covering business registration, PAN, TAN, GST assistance, and legal filings for Indian founders.',
  },
  '/startup': {
    pageName: 'Startup Packages',
    description:
      'Compare Basic, Standard, and Premium startup packages covering business registration, PAN, TAN, GST assistance, and legal filings for Indian founders.',
  },
  '/all-language-products': {
    pageName: 'Language Translation Services',
    description:
      'Browse Indian and foreign language document translation services for personal, academic, legal, and business documents with certified soft and hard copies.',
  },
  '/language-products': {
    pageName: 'Language Translation Services',
    description:
      'Browse Indian and foreign language document translation services for personal, academic, legal, and business documents with certified soft and hard copies.',
  },
  '/language': {
    pageName: 'Language Translation Services',
    description:
      'Browse Indian and foreign language document translation services for personal, academic, legal, and business documents with certified soft and hard copies.',
  },
  '/all-translation-products': {
    pageName: 'Translation Services',
    description:
      'Explore certified and sworn translation services across Indian and foreign language pairs for visa, immigration, academic, and official documentation needs.',
  },
  '/translation-products': {
    pageName: 'Translation Services',
    description:
      'Explore certified and sworn translation services across Indian and foreign language pairs for visa, immigration, academic, and official documentation needs.',
  },
  '/sworn-translations': {
    pageName: 'Sworn Translation Services',
    description:
      'Order certified sworn translation services for Spanish, German, Italian, and French documents accepted by courts, embassies, and immigration authorities.',
  },
  '/sworn-translations-listing': {
    pageName: 'Sworn Translation Services',
    description:
      'Order certified sworn translation services for Spanish, German, Italian, and French documents accepted by courts, embassies, and immigration authorities.',
  },
  '/privacy-policy': {
    pageName: 'Privacy Policy',
    description:
      'Read the Honey Translation Services Privacy Policy detailing how personal information is collected, used, and protected when using our online platform.',
  },
  '/terms-and-conditions': {
    pageName: 'Terms & Conditions',
    description:
      'Review the Terms and Conditions governing document translation, apostille, and attestation orders placed through Honey Translation Services online.',
  },
  '/terms-conditions': {
    pageName: 'Terms & Conditions',
    description:
      'Review the Terms and Conditions governing document translation, apostille, and attestation orders placed through Honey Translation Services online.',
  },
  '/terms-of-service': {
    pageName: 'Terms of Service',
    description:
      'Read the Honey Translation Services Terms of Service outlining user responsibilities, service descriptions, and conditions for online document orders.',
  },
  '/refund-cancellation': {
    pageName: 'Cancellation & Refund Policy',
    description:
      'Read the Honey Universal Digital Private Limited Cancellation and Refund Policy covering service confirmation, project edits, and non-refundable orders.',
  },
  '/refund-cancellation-policy': {
    pageName: 'Cancellation & Refund Policy',
    description:
      'Read the Honey Universal Digital Private Limited Cancellation and Refund Policy covering service confirmation, project edits, and non-refundable orders.',
  },
  '/track-order': {
    pageName: 'Track Order',
    description:
      'Track the live status of your Honey Translation Services translation, apostille, or attestation order using your order reference ID and email address.',
  },
  '/cart': {
    pageName: 'Shopping Cart',
    description:
      'Review selected translation, apostille, attestation, and startup services in your Honey Translation Services cart before proceeding to online checkout.',
  },
  '/wishlist': {
    pageName: 'My Wishlist',
    description:
      'View and manage your saved translation, apostille, attestation, and startup service items in your Honey Translation Services account wishlist.',
  },
  '/signin': {
    pageName: 'Sign In',
    description:
      'Sign in to your Honey Translation Services account to manage document translation orders, track delivery progress, and review saved wishlist services.',
  },
  '/login': {
    pageName: 'Sign In',
    description:
      'Sign in to your Honey Translation Services account to manage document translation orders, track delivery progress, and review saved wishlist services.',
  },
  '/signup': {
    pageName: 'Create Account',
    description:
      'Create a Honey Translation Services account to upload documents, configure certified translation or apostille orders, and track delivery status online.',
  },
  '/forgot-password': {
    pageName: 'Forgot Password',
    description:
      'Request a secure single-use password reset link for your Honey Translation Services account to recover access quickly and manage document orders.',
  },
  '/reset-password': {
    pageName: 'Reset Password',
    description:
      'Set a new password for your Honey Translation Services account using your expiring reset link and return securely to sign in and place orders.',
  },
  '/my-dashboard': {
    pageName: 'My Dashboard',
    description:
      'Access your Honey Translation Services customer dashboard to review recent translation orders, saved delivery addresses, and account profile details.',
  },
  '/my-orders': {
    pageName: 'My Orders',
    description:
      'View your Honey Translation Services order history, check document processing status, download completed soft copies, and submit verified reviews.',
  },
  '/my-profile': {
    pageName: 'My Profile',
    description:
      'Manage your Honey Translation Services account profile, contact information, and preferences for certified translation and apostille orders online.',
  },
  '/my-address': {
    pageName: 'My Address',
    description:
      'Manage your saved delivery addresses for courier dispatch of hard-copy certified translations and apostilled documents across India and abroad.',
  },
  '/checkout/address': {
    pageName: 'Checkout Address',
    description:
      'Select or add your delivery address for Honey Translation Services courier dispatch before reviewing your translation, apostille, or attestation order.',
  },
  '/checkout/review': {
    pageName: 'Checkout Review',
    description:
      'Review your selected translation, apostille, or attestation services, page counts, and delivery details before completing secure checkout payment.',
  },
  '/checkout/payment': {
    pageName: 'Checkout Payment',
    description:
      'Complete payment securely for your Honey Translation Services order via Razorpay and receive instant order confirmation by email and dashboard.',
  },
  '/checkout/bank-gateway': {
    pageName: 'Bank Payment Gateway',
    description:
      'Complete net banking payment securely for your Honey Translation Services document translation, apostille, or attestation order on our checkout flow.',
  },
  '/checkout/wallet-gateway': {
    pageName: 'Wallet Payment Gateway',
    description:
      'Complete digital wallet payment securely for your Honey Translation Services document translation, apostille, or attestation order during checkout.',
  },
  '/order-success': {
    pageName: 'Order Confirmation',
    description:
      'Your Honey Translation Services order has been confirmed. View your order reference summary and next steps for document processing and delivery.',
  },
  '/payment-summary': {
    pageName: 'Payment Summary',
    description:
      'Review the payment summary and transaction status for your Honey Translation Services document translation, apostille, or attestation order online.',
  },
  '/checkout-demo': {
    pageName: 'Checkout',
    description:
      'Review and test the Honey Translation Services checkout order configuration, delivery options, and payment workflow for document services online.',
  },
  '/zoho-payment-demo': {
    pageName: 'Zoho Payment',
    description:
      'Preview the Honey Translation Services Zoho payment checkout integration for translation, apostille, attestation, and startup service packages.',
  },
  '/quick-payment': {
    pageName: 'Quick Payment',
    description:
      'Complete a quick online payment for your Honey Translation Services translation, apostille, or attestation invoice using our secure checkout portal.',
  },
  '/test-pay-now': {
    pageName: 'Test Payment',
    description:
      'Verify the Honey Translation Services payment checkout flow in test mode for document translation, apostille, and attestation service orders.',
  },
  '/test-review': {
    pageName: 'Customer Reviews',
    description:
      'Preview and verify customer ratings and verified buyer reviews for Honey Translation Services translation, apostille, and attestation products.',
  },
  '/auth/callback': {
    pageName: 'Authentication Callback',
    description:
      'Completing account authentication for your Honey Translation Services session before returning you to your document order dashboard or cart.',
  },
  '/admin-upload': {
    pageName: 'Admin Upload',
    description:
      'Internal document upload workspace for Honey Translation Services administrators managing client files and work sample resources across services.',
  },
};

function buildProductDescription(title: string, categoryLabel: string, detailText?: unknown): string {
  const safeDetail = typeof detailText === 'string' ? detailText.trim() : '';
  const standardSummary = `${title} from ${SITE_NAME}, providing ${categoryLabel} with email soft copies and courier delivery across India.`;
  if (standardSummary.length >= 150 && standardSummary.length <= 160) {
    return standardSummary;
  }
  const base = safeDetail
    ? `${safeDetail.replace(/\.$/, '')}. Available online from ${SITE_NAME} with soft copy and courier delivery.`
    : standardSummary;
  return fitMetaDescription(
    base,
    'Pan-India online document processing with email soft copies and courier delivery.',
  );
}

function parsePublishedDate(rawDate: string): string | undefined {
  const parsed = new Date(`${rawDate} UTC`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString().slice(0, 10);
}

function buildHomeStructuredData(): Record<string, unknown>[] {
  return [
    {
      '@type': 'Organization',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: LEGAL_NAME,
      alternateName: ALTERNATE_NAME,
      url: SITE_ORIGIN,
      logo: DEFAULT_OG_IMAGE,
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE,
      sameAs: VERIFIED_SOCIAL_LINKS,
    },
    {
      '@type': 'LocalBusiness',
      '@id': `${SITE_ORIGIN}/#localbusiness`,
      name: LEGAL_NAME,
      alternateName: ALTERNATE_NAME,
      url: SITE_ORIGIN,
      image: DEFAULT_OG_IMAGE,
      telephone: CONTACT_PHONE,
      email: CONTACT_EMAIL,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Chennai',
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      },
      parentOrganization: {
        '@id': `${SITE_ORIGIN}/#organization`,
      },
    },
  ];
}

function buildFaqStructuredData(): Record<string, unknown>[] {
  const mainEntity = FAQ_CATEGORIES.flatMap((category) =>
    category.faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: Array.isArray(item.answer) ? item.answer.join(' ') : item.answer,
      },
    })),
  );

  return [
    {
      '@type': 'FAQPage',
      mainEntity,
    },
  ];
}

function buildBlogPostStructuredData(post: BlogPost, canonicalUrl: string): Record<string, unknown>[] {
  const published = parsePublishedDate(post.date);
  return [
    {
      '@type': 'BlogPosting',
      headline: post.title,
      description: fitMetaDescription(post.seoDescription || post.excerpt),
      image: post.image ? [post.image] : [DEFAULT_OG_IMAGE],
      articleSection: post.category,
      ...(published ? { datePublished: published } : {}),
      author: {
        '@type': 'Person',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: LEGAL_NAME,
        logo: {
          '@type': 'ImageObject',
          url: DEFAULT_OG_IMAGE,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
    },
  ];
}

function buildBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown>[] {
  return [
    {
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
  ];
}

/**
 * Resolves SEO metadata for the current pathname and available product records.
 */
export function resolveRouteSeo(pathname: string, products: Product[] = []): PageSeo {
  const cleanPath = (pathname || '/').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const canonicalUrl = normalizeCanonicalUrl(cleanPath);

  if (STATIC_ROUTES[cleanPath]) {
    const entry = STATIC_ROUTES[cleanPath];
    let structuredData: Record<string, unknown>[] | undefined;
    if (cleanPath === '/') {
      structuredData = buildHomeStructuredData();
    } else if (cleanPath === '/faq' || cleanPath === '/faqs') {
      structuredData = buildFaqStructuredData();
    }
    return {
      title: `${entry.pageName} | ${SITE_NAME}`,
      description: fitMetaDescription(entry.description),
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      ...(structuredData ? { structuredData } : {}),
    };
  }

  // Blog post route: /blog/:slug
  if (cleanPath.startsWith('/blog/')) {
    const slug = cleanPath.slice('/blog/'.length).toLowerCase();
    const post = blogPosts.find((p) => p.slug === slug);
    if (post) {
      return {
        title: `${post.title} | ${SITE_NAME}`,
        description: fitMetaDescription(post.seoDescription || post.excerpt),
        canonicalUrl,
        ogType: 'article',
        ogImage: DEFAULT_OG_IMAGE,
        structuredData: buildBlogPostStructuredData(post, canonicalUrl),
      };
    }
  }

  // Apostille route: /apostille/:country
  if (cleanPath.startsWith('/apostille/')) {
    const slug = cleanPath.slice('/apostille/'.length).toLowerCase();
    const product = apostilleCountries[slug];
    if (product) {
      return {
        title: `${product.title} | ${SITE_NAME}`,
        description: buildProductDescription(
          product.title,
          'MEA and embassy apostille authentication',
          product.productDetails?.[0],
        ),
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        structuredData: buildBreadcrumbStructuredData([
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'Apostille Services', url: `${SITE_ORIGIN}/all-apostille-products` },
          { name: product.title, url: canonicalUrl },
        ]),
      };
    }
  }

  // Attestation route: /attestation/:country
  if (cleanPath.startsWith('/attestation/')) {
    const slug = cleanPath.slice('/attestation/'.length).toLowerCase();
    const product = attestationCountries[slug];
    if (product) {
      return {
        title: `${product.title} | ${SITE_NAME}`,
        description: buildProductDescription(
          product.title,
          'embassy and MEA document attestation',
          product.productDetails?.[0],
        ),
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        structuredData: buildBreadcrumbStructuredData([
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'Attestation Services', url: `${SITE_ORIGIN}/all-attestation-products` },
          { name: product.title, url: canonicalUrl },
        ]),
      };
    }
  }

  // Startup route: /startup/:type
  if (cleanPath.startsWith('/startup/')) {
    const slug = cleanPath.slice('/startup/'.length).toLowerCase();
    const product = startupPackages[slug];
    if (product) {
      return {
        title: `${product.title} | ${SITE_NAME}`,
        description: buildProductDescription(
          product.title,
          'business registration and compliance',
          product.highlights?.[0]?.text,
        ),
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        structuredData: buildBreadcrumbStructuredData([
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'Startup Packages', url: `${SITE_ORIGIN}/all-startup-products` },
          { name: product.title, url: canonicalUrl },
        ]),
      };
    }
  }

  // Sworn translation route: /sworn-translation/:language
  if (cleanPath.startsWith('/sworn-translation/')) {
    const slug = cleanPath.slice('/sworn-translation/'.length).toLowerCase();
    const label = SWORN_TRANSLATION_LABELS[slug];
    if (label) {
      return {
        title: `${label} | ${SITE_NAME}`,
        description: buildProductDescription(
          label,
          'sworn translation with translator oath and notarization',
        ),
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        structuredData: buildBreadcrumbStructuredData([
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'Sworn Translations', url: `${SITE_ORIGIN}/sworn-translations` },
          { name: label, url: canonicalUrl },
        ]),
      };
    }
  }

  // Dynamic /product/:id route
  if (cleanPath.startsWith('/product/')) {
    const id = decodeURIComponent(cleanPath.slice('/product/'.length));
    const adminProduct = products.find((p) => p.id === id);
    const staticProduct = allProductsMap[id];
    const resolvedTitle = adminProduct?.name || staticProduct?.title;
    if (resolvedTitle) {
      const detail =
        adminProduct?.metaDescription?.trim() ||
        adminProduct?.description?.trim() ||
        staticProduct?.productDetails?.[0] ||
        staticProduct?.highlights?.[0]?.text;
      return {
        title: `${resolvedTitle} | ${SITE_NAME}`,
        description: buildProductDescription(resolvedTitle, 'certified document services', detail),
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        structuredData: buildBreadcrumbStructuredData([
          { name: 'Home', url: SITE_ORIGIN },
          { name: 'Services', url: `${SITE_ORIGIN}/all-language-products` },
          { name: resolvedTitle, url: canonicalUrl },
        ]),
      };
    }
  }

  // Direct product routes (/english-to-foreign-language, /direct-product/:id, etc.)
  const directSlug = cleanPath.startsWith('/direct-product/')
    ? cleanPath.slice('/direct-product/'.length).toLowerCase()
    : cleanPath.slice(1).toLowerCase();
  const directProduct = getProductBySlug(directSlug);
  if (directProduct) {
    return {
      title: `${directProduct.title} | ${SITE_NAME}`,
      description: buildProductDescription(
        directProduct.title,
        'translation, attestation, and startup services',
        directProduct.productDetails?.[0] || directProduct.highlights?.[0]?.text,
      ),
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
      structuredData: buildBreadcrumbStructuredData([
        { name: 'Home', url: SITE_ORIGIN },
        { name: 'Services', url: `${SITE_ORIGIN}/all-translation-products` },
        { name: directProduct.title, url: canonicalUrl },
      ]),
    };
  }

  // Live order tracking route
  if (cleanPath.startsWith('/live-order-tracking/')) {
    return {
      title: `Live Order Tracking | ${SITE_NAME}`,
      description: fitMetaDescription(
        'Track real-time processing and courier delivery updates for your Honey Translation Services order using your unique order tracking link.',
      ),
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // Content routes (/content/:id)
  if (cleanPath.startsWith('/content/')) {
    const contentTitles: Record<string, string> = {
      'terms-conditions': 'Terms & Conditions',
      'privacy-policy': 'Privacy Policy',
      'refund-policy': 'Refund & Cancellation Policy',
      'faq': 'Frequently Asked Questions',
      'pricing-plan': 'Pricing Plan',
      'about': 'About Company',
    };
    const cid = cleanPath.slice('/content/'.length).toLowerCase();
    const pageName = contentTitles[cid] || 'Information';
    return {
      title: `${pageName} | ${SITE_NAME}`,
      description: fitMetaDescription(
        `Read ${pageName} details published by Honey Universal Digital Private Limited for Honey Translation Services customers across India.`,
      ),
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // Admin routes
  if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) {
    return {
      title: `Admin Portal | ${SITE_NAME}`,
      description: fitMetaDescription(
        'Honey Translation Services administrative portal for managing service listings, customer orders, pricing, work samples, and reviews.',
      ),
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // Unknown / 404 fallback
  return {
    title: `Page Not Found | ${SITE_NAME}`,
    description: fitMetaDescription(
      'The requested page or service could not be found on Honey Translation Services. Return to the home page to browse our document services.',
    ),
    canonicalUrl,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'noindex',
  };
}

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(attrName: 'name' | 'property', attrValue: string) {
  const el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (el) el.remove();
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertStructuredData(graph?: Record<string, unknown>[]) {
  const existing = document.head.querySelector('script[type="application/ld+json"][data-seo-jsonld="true"]');
  if (!graph || graph.length === 0) {
    existing?.remove();
    return;
  }

  const el =
    (existing as HTMLScriptElement | null) ||
    (() => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      document.head.appendChild(script);
      return script;
    })();

  const payload =
    graph.length === 1
      ? { '@context': 'https://schema.org', ...graph[0] }
      : { '@context': 'https://schema.org', '@graph': graph };
  el.textContent = JSON.stringify(payload);
}

/**
 * Applies title, meta description, Open Graph, Twitter Card, robots, canonical, and JSON-LD structured data.
 */
export function applyDocumentSeo(seo: PageSeo) {
  document.title = seo.title;
  upsertMeta('name', 'description', seo.description);
  upsertMeta('property', 'og:title', seo.title);
  upsertMeta('property', 'og:description', seo.description);
  upsertMeta('property', 'og:url', seo.canonicalUrl);
  upsertMeta('property', 'og:image', seo.ogImage);
  upsertMeta('property', 'og:type', seo.ogType);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', seo.title);
  upsertMeta('name', 'twitter:description', seo.description);
  upsertMeta('name', 'twitter:image', seo.ogImage);
  if (seo.robots) {
    upsertMeta('name', 'robots', seo.robots);
  } else {
    removeMeta('name', 'robots');
  }
  upsertCanonical(seo.canonicalUrl);
  upsertStructuredData(seo.structuredData);
}
