import image_basicStartup from 'figma:asset/d4b1f2e915e9cd79f93d6af750c3e12dca7eb069.png';
import image_standardStartup from 'figma:asset/ee810d526fb09362f3adbdbf9eba4864e17e0e11.png';
import image_premiumStartup from 'figma:asset/d8c18857369797e62f24a21531a9cf10b9c0dc81.png';

export interface StartupProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  url: string;
  description: string;
  category: string;
}

export const startupProducts: StartupProduct[] = [
  {
    id: 'basic-startup',
    name: 'Basic Startup Package',
    price: 17999,
    originalPrice: 25999,
    image: image_basicStartup,
    url: '/basic-startup-package',
    description: 'Complete Branding, Digital Setup & Promotion Bundle for your startup',
    category: 'startup'
  },
  {
    id: 'standard-startup',
    name: 'Standard Startup Package',
    price: 32999,
    originalPrice: 38999,
    image: image_standardStartup,
    url: '/standard-startup-package',
    description: 'Enhanced startup package with advanced branding and digital marketing',
    category: 'startup'
  },
  {
    id: 'premium-startup',
    name: 'Premium Startup Package',
    price: 65999,
    originalPrice: 73999,
    image: image_premiumStartup,
    url: '/premium-startup-package',
    description: 'Premium complete business setup with comprehensive marketing and IT solutions',
    category: 'startup'
  }
];
