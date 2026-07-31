import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

type StartupVariant = 'basic' | 'standard' | 'premium';

export function StartupPackages() {
  const location = useLocation();
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedVariant, setSelectedVariant] = useState<StartupVariant>('basic');

  // Helper function to extract video ID from YouTube URL or return ID if already extracted
  const extractVideoId = (url: string): string => {
    // If it's already just an ID (no slashes or special chars), return it
    if (!url.includes('/') && !url.includes('?')) {
      return url;
    }
    
    // Extract from youtu.be format: https://youtu.be/VIDEO_ID?si=...
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0];
      return id;
    }
    
    // Extract from youtube.com format: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1].split('&')[0];
      return id;
    }
    
    return url;
  };

  const packages = useMemo(() => ([
    {
      variant: 'basic' as StartupVariant,
      title: 'Basic Startup Package',
      url: '/basic-startup-package',
      video: 'https://youtu.be/nVrSsvjJ1lg?si=xwKdwkgCbVaB2sOn',
    },
    {
      variant: 'standard' as StartupVariant,
      title: 'Standard Startup Package',
      url: '/standard-startup-package',
      video: 'https://youtu.be/48XaA1Rglu0?si=coAQXXo8Cc92V9qA',
    },
    {
      variant: 'premium' as StartupVariant,
      title: 'Premium Startup Package',
      url: '/premium-startup-package',
      video: 'https://youtu.be/KoLFSkn2UIc?si=D9k6su5sgRKlPSyb',
    },
  ]), []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startupParam = params.get('startup');
    const variant = startupParam === 'basic' || startupParam === 'standard' || startupParam === 'premium'
      ? startupParam
      : null;

    if (!variant) return;

    setSelectedVariant(variant);

    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.search, location.hash]);

  const selectedPackage = packages.find((pkg) => pkg.variant === selectedVariant) ?? packages[0];

  return (
    <section id="startup-packages" ref={sectionRef} className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Startup Packages
        </h2>
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {packages.map((pkg) => (
            <Link
              key={pkg.variant}
              to={pkg.url}
              onClick={() => setSelectedVariant(pkg.variant)}
              className={`px-4 py-2 rounded-full border transition-colors ${
                selectedVariant === pkg.variant
                  ? 'bg-[#1a1f5c] text-white border-[#1a1f5c]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#1a1f5c]'
              }`}
            >
              {pkg.title}
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => {
            const videoId = extractVideoId(pkg.video);
            const isSelected = selectedVariant === pkg.variant;
            return (
              <div key={pkg.variant} className="space-y-3">
                <div className={`aspect-video rounded-lg overflow-hidden shadow-lg border-2 transition-all ${isSelected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent'}`}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={pkg.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
                <h3 className="text-center font-semibold text-gray-900">
                  {pkg.title}
                </h3>
                <div className="text-center">
                  <Link
                    to={pkg.url}
                    className={`inline-block px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    View {pkg.variant.charAt(0).toUpperCase() + pkg.variant.slice(1)} Variant
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link
            to={selectedPackage.url}
            className="inline-block bg-[#1a1f5c] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#252b70] transition-colors"
          >
            Continue with {selectedPackage.title}
          </Link>
        </div>
      </div>
    </section>
  );
}

