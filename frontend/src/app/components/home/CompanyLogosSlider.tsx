import type { CSSProperties } from 'react';
import aachiLogo from '@/assets/aachi-logo.png';
import arcLogo from '@/assets/arc-logo.avif';
import brightLightSocietyLogo from '@/assets/bright-light-society-logo.png';
import dbsLogo from '@/assets/dbs-logo-fixed.png';
import fratelliLogo from '@/assets/fratelli-logo.jpg';
import hpLogo from '@/assets/hp-logo.jpeg';
import identityLogo from '@/assets/identity-logo.png';
import lrkLogo from '@/assets/lrk-logo.jpg';
import muthootFinanceLogo from '@/assets/muthoot-finance-logo.webp';
import newIndiaLogo from '@/assets/new-india-logo.jpg';
import saintGobainLogo from '@/assets/saint-gobain-source.jpg';
import tvsLogo from '@/assets/tvs-logo-clean.png';

export function CompanyLogosSlider() {
  type LogoItem = {
    id: number;
    name: string;
    image?: string;
    imageStyle?: CSSProperties;
    textLogo?: boolean;
  };

  // Professional company logos with different colors and styles
  const createLogoSVG = (companyName: string, color: string, bgColor: string = '#ffffff') => {
    const svg = `
      <svg width="280" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${color}" text-anchor="middle" dy=".35em">${companyName}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const createIconLogoSVG = (companyName: string, color: string, hasIcon: boolean = true) => {
    const initial = companyName.charAt(0);
    const svg = `
      <svg width="280" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        ${hasIcon ? `<circle cx="60" cy="40" r="22" fill="${color}"/>
        <text x="60" y="40" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle" dy=".35em">${initial}</text>` : ''}
        <text x="${hasIcon ? '100' : '50%'}" y="40" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="${color}" ${hasIcon ? '' : 'text-anchor="middle"'} dy=".35em">${companyName}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };
  
  const logos: LogoItem[] = [
    {
      id: 1,
      name: 'Fratelli',
      image: fratelliLogo,
      imageStyle: { width: '250px', maxWidth: '250px', maxHeight: '112px', mixBlendMode: 'darken' as const },
    },
    {
      id: 2,
      name: 'TVS',
      image: tvsLogo,
    },
    {
      id: 3,
      name: 'HP Valves',
      image: hpLogo,
    },
    {
      id: 4,
      name: 'Aachi',
      image: aachiLogo,
    },
    {
      id: 5,
      name: 'ARC International',
      image: arcLogo,
      imageStyle: { maxWidth: '245px', maxHeight: '106px', mixBlendMode: 'darken' as const },
    },
    {
      id: 6,
      name: 'Bright Light',
      image: brightLightSocietyLogo,
    },
    {
      id: 7,
      name: 'DBS',
      image: dbsLogo,
    },
    {
      id: 8,
      name: 'Identity',
      image: identityLogo,
    },
    {
      id: 9,
      name: 'LRK',
      image: lrkLogo,
    },
    {
      id: 10,
      name: 'Muthoot Finance',
      image: muthootFinanceLogo,
      imageStyle: { mixBlendMode: 'multiply' as const },
    },
    {
      id: 11,
      name: 'New India Assurance',
      image: newIndiaLogo,
      imageStyle: { width: '150px', maxWidth: '150px', maxHeight: '112px', mixBlendMode: 'darken' as const },
    },
    {
      id: 12,
      name: 'Royal Enfield',
      textLogo: true,
    },
    {
      id: 13,
      name: 'Saint-Gobain',
      image: saintGobainLogo,
      imageStyle: { width: '295px', maxWidth: '295px', maxHeight: '130px', mixBlendMode: 'darken' as const },
    },
  ];

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos];

  return (
    <section className="py-8 md:py-10 bg-gray-50 overflow-hidden">
      <div className="max-w-full mx-auto px-6">
        <h3 className="text-center text-2xl font-semibold text-gray-700 mb-6">
          Trusted by Leading Companies
        </h3>
        
        {/* Continuous scrolling container */}
        <div className="relative w-full overflow-hidden">
          <div className="flex animate-scroll-logos w-max">
            {duplicatedLogos.map((logo, index) => (
              <div 
                key={`${logo.id}-${index}`} 
                className="flex-shrink-0 mx-4"
                style={{ width: '270px' }}
              >
                <div className={`bg-white rounded-lg border border-gray-300 shadow-md hover:shadow-lg transition-shadow flex items-center justify-center h-36 overflow-hidden ${logo.textLogo ? 'px-2 py-5' : 'p-5'}`}>
                  {logo.textLogo ? (
                    <div className="royal-enfield-text-logo" aria-label={logo.name}>
                      Royal Enfield
                    </div>
                  ) : (
                    <img
                      src={logo.image ?? ''}
                      alt={logo.name}
                      className="w-auto max-w-[230px] max-h-[96px] object-contain"
                      style={logo.imageStyle}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-logos {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-270px * 13 - 13 * 32px));
          }
        }

        .animate-scroll-logos {
          animation: scroll-logos 45s linear infinite;
        }

        .animate-scroll-logos:hover {
          animation-play-state: paused;
        }

        .royal-enfield-text-logo {
          display: inline-block;
          color: #e6331a;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0;
          text-align: center;
          text-transform: uppercase;
          white-space: nowrap;
          transform: scaleX(0.78);
          transform-origin: center;
          text-shadow: 0 1px 0 rgba(160, 22, 10, 0.2);
        }
      `}</style>
    </section>
  );
}
