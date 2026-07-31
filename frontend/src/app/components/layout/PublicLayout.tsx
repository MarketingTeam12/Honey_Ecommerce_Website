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
      <ScrollEffects />
      <HeaderNew />
      <main className="relative z-10 flex-grow">
        {children}
      </main>
      <FooterNew />
      <WhatsAppButton />
      <BackToTopButton />
    </div>
  );
}

export default PublicLayout;
