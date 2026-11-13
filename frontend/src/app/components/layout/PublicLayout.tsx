import { ReactNode } from 'react';
import { HeaderNew } from '@/app/components/layout/HeaderNew';
import { FooterNew } from '@/app/components/layout/FooterNew';
import { WhatsAppButton } from '@/app/components/layout/WhatsAppButton';
import BackToTopButton from '@/app/components/layout/BackToTopButton';
import ScrollEffects from '@/app/components/layout/ScrollEffects';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="relative isolate min-h-screen bg-white flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#1a1f5c] focus:text-white focus:rounded-md focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>
      <ScrollEffects />
      <HeaderNew />
      <main id="main-content" tabIndex={-1} className="relative z-10 flex-grow outline-none">
        {children}
      </main>
      <FooterNew />
      <WhatsAppButton />
      <BackToTopButton />
    </div>
  );
}

export default PublicLayout;
