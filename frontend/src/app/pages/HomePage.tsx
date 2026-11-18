import { HeroSection } from '@/app/components/home/HeroSection';
import { CompanyLogosSlider } from '@/app/components/home/CompanyLogosSlider';
import { ISOCertificationSection } from '@/app/components/home/ISOCertificationSection';
import { TranslatorExperience } from '@/app/components/home/TranslatorExperience';
import { PickYourLanguage } from '@/app/components/home/PickYourLanguage';
import { Testimonials } from '@/app/components/home/Testimonials';
import { GoogleReviewsSection } from '@/app/components/home/GoogleReviewsSection';

function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <CompanyLogosSlider />
      <ISOCertificationSection />
      <TranslatorExperience />
      <PickYourLanguage />
      <Testimonials />
      <GoogleReviewsSection />
    </div>
  );
}

export default HomePage;
