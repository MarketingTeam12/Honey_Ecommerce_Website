export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  seoDescription: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: 'understanding-certified-translation',
    title: 'Understanding Certified Translation: What You Need to Know',
    seoDescription:
      'Learn when certified translations are needed for legal documents, immigration, and international business, and what makes a translation officially certified.',
    excerpt:
      'Certified translations are crucial for legal documents, immigration applications, and international business. Learn when you need them, how they differ from standard translations, and what makes a translation officially certified.',
    content:
      'Certified translations are essential for official documents that need to be submitted to government authorities, educational institutions, or legal entities...',
    author: 'Sarah Mitchell',
    date: 'February 18, 2026',
    category: 'Translation Services',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop',
    readTime: '5 min read',
  },
  {
    id: 2,
    slug: 'mea-apostille-services-guide',
    title: 'MEA Apostille Services: Complete Guide for Document Authentication',
    seoDescription:
      'Navigate the MEA Apostille process with this guide covering document requirements, processing times, and step-by-step procedures for international use.',
    excerpt:
      'Navigate the MEA Apostille process with confidence. This comprehensive guide covers document requirements, processing times, fees, and step-by-step procedures for getting your documents authenticated for international use.',
    content:
      'MEA Apostille is a certification provided by the Ministry of External Affairs that authenticates documents for use in foreign countries...',
    author: 'Rajesh Kumar',
    date: 'February 15, 2026',
    category: 'Apostille Services',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
    readTime: '7 min read',
  },
  {
    id: 3,
    slug: 'top-10-languages-global-business-translation-2026',
    title: 'Top 10 Languages for Global Business Translation in 2026',
    seoDescription:
      'Discover the top 10 languages driving international commerce in 2026, from Mandarin to Spanish, and how professional translation helps global business.',
    excerpt:
      'Discover which languages drive international commerce in 2026. From Mandarin to Spanish, learn why these languages are essential for global expansion and how professional translation services can help your business succeed worldwide.',
    content:
      'As businesses expand globally, the need for accurate translation services has never been greater. Here are the top 10 languages...',
    author: 'Maria Garcia',
    date: 'February 12, 2026',
    category: 'Industry Insights',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=400&fit=crop',
    readTime: '6 min read',
  },
  {
    id: 4,
    slug: 'prepare-documents-for-professional-translation',
    title: 'How to Prepare Your Documents for Professional Translation',
    seoDescription:
      'Follow practical document preparation tips on scanning quality, file formats, and organization to streamline your translation project and avoid delays.',
    excerpt:
      'Proper document preparation saves time and ensures accuracy. Follow our expert tips for scanning quality, file formats, and document organization to streamline your translation project and avoid costly delays.',
    content:
      'Proper document preparation ensures faster turnaround times and more accurate translations. Follow these essential steps...',
    author: 'David Chen',
    date: 'February 8, 2026',
    category: 'Tips & Guides',
    image:
      'https://images.unsplash.com/photo-1673515335152-f2589ba8bb7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N1bWVudHMlMjBwcmVwYXJhdGlvbiUyMHRyYW5zbGF0aW9uJTIwcGFwZXJ3b3JrfGVufDF8fHx8MTc3MjAxNDI2NXww&ixlib=rb-4.1.0&q=80&w=1080',
    readTime: '4 min read',
  },
  {
    id: 5,
    slug: 'canadian-immigration-translation-requirements-2026',
    title: 'Canadian Immigration: Translation Requirements for 2026',
    seoDescription:
      'Understand translation and notarization requirements for Canadian immigration documents, including birth, marriage, academic, and employment records.',
    excerpt:
      'Planning to immigrate to Canada? Understand the latest translation and notarization requirements for immigration documents, including birth certificates, marriage certificates, educational credentials, and employment records.',
    content:
      'Canada has specific requirements for translated documents in immigration applications. Understanding these requirements...',
    author: 'Emily Thompson',
    date: 'February 5, 2026',
    category: 'Immigration',
    image:
      'https://images.unsplash.com/photo-1545013806-8e1d077550ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDYW5hZGElMjBwYXNzcG9ydCUyMGltbWlncmF0aW9uJTIwdmlzYXxlbnwxfHx8fDE3NzIwMTQyNjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    readTime: '8 min read',
  },
  {
    id: 6,
    slug: 'certified-vs-sworn-translation-differences',
    title: 'Certified vs. Sworn Translation: Key Differences Explained',
    seoDescription:
      'Understand the key differences between certified and sworn translations, when each is required, and how to choose the right service for your documents.',
    excerpt:
      'Not all official translations are the same. Understand the critical differences between certified and sworn translations, when each is required, and how to choose the right service for your legal or business needs.',
    content:
      'Many people confuse certified and sworn translations. While both are official forms of translation, they serve different purposes...',
    author: 'James Anderson',
    date: 'February 1, 2026',
    category: 'Translation Services',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
    readTime: '5 min read',
  },
];
