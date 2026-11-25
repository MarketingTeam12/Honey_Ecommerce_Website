import { HeroSection } from '@/app/components/home/HeroSection';
import { CompanyLogosSlider } from '@/app/components/home/CompanyLogosSlider';
import { ISOCertificationSection } from '@/app/components/home/ISOCertificationSection';
import { TranslatorExperience } from '@/app/components/home/TranslatorExperience';
import { PickYourLanguage } from '@/app/components/home/PickYourLanguage';
import { GoogleReviewsSection } from '@/app/components/home/GoogleReviewsSection';
import { SiteReviewsSection } from '@/app/components/home/SiteReviewsSection';

function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <CompanyLogosSlider />
      <ISOCertificationSection />
      <TranslatorExperience />
      <PickYourLanguage />
      <GoogleReviewsSection />
      <SiteReviewsSection />
    </div>
  );
}

export default HomePage;
