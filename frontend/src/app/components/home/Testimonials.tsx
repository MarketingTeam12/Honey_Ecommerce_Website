import { motion } from 'motion/react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import fratelliTestimonialLogo from '@/assets/fratelli-testimonial.jpg';
import tvsLogoClean from '@/assets/tvs-logo-clean.png';
import hpTestimonialLogo from '@/assets/hp-testimonial.jpeg';
import aachiTestimonialLogo from '@/assets/aachi-testimonial.png';
import arcTestimonialLogo from '@/assets/arc-testimonial.png';
import royalEnfieldTestimonialLogo from '@/assets/royal-enfield-testimonial.webp';
import brightLightSocietyLogo from '@/assets/bright-light-society-logo.png';
import dbsLogo from '@/assets/dbs-logo-fixed.png';
import identityLogo from '@/assets/identity-logo.png';
import lrkLogo from '@/assets/lrk-logo.jpg';
import muthootFinanceLogo from '@/assets/muthoot-finance-logo.webp';
import newIndiaLogo from '@/assets/new-india-logo.jpg';
import saintGobainLogo from '@/assets/saint-gobain-source.jpg';

export function Testimonials() {
  const testimonials = [
    { 
      company: 'Fratelli', 
      text: 'Honey Universal Digital helped us localize product and marketing content for India with excellent cultural accuracy and stronger customer engagement.',
      logoSrc: fratelliTestimonialLogo
    },
    { 
      company: 'TVS Motor Company Ltd', 
      text: 'Their regional-language campaign localization improved our connection with rural audiences and noticeably increased market reach across India.',
      logoSrc: tvsLogoClean
    },
    { 
      company: 'HP Valves & Fittings', 
      text: 'Their precise technical translations preserved safety and engineering accuracy across languages, helping us communicate clearly in every market.',
      logoSrc: hpTestimonialLogo
    },
    { 
      company: 'Aachi Masala Foods Pvt. Ltd', 
      text: 'Their localization support strengthened our regional communication, boosted customer trust, and supported growth in sales and exports.',
      logoSrc: aachiTestimonialLogo
    },
    { 
      company: 'ARC International Fertility', 
      text: 'They translated sensitive medical content with empathy and precision, helping us reach diverse communities with clarity and confidence.',
      logoSrc: arcTestimonialLogo
    },
    { 
      company: 'Bright Light Society', 
      text: 'Their multilingual translation of our education and outreach materials expanded our impact in underserved communities.',
      logoSrc: brightLightSocietyLogo
    },
    { 
      company: 'DBS', 
      text: 'Their finance-focused localization and terminology accuracy supported a smoother India expansion and stronger local customer trust.',
      logoSrc: dbsLogo
    },
    { 
      company: 'Identity', 
      text: 'They adapted our brand messaging for regional audiences while preserving identity, helping us build a stronger nationwide presence.',
      logoSrc: identityLogo
    },
    { 
      company: 'LRK', 
      text: 'Their accurate and timely translations helped us maintain quality standards while scaling operations into new regions.',
      logoSrc: lrkLogo
    },
    { 
      company: 'Muthoot Finance', 
      text: 'Their native-language translations made our financial services more accessible and improved customer relationships across India.',
      logoSrc: muthootFinanceLogo
    },
    { 
      company: 'The New India Assurance', 
      text: 'Their translation and localization support improved customer confidence, strengthened reputation, and contributed to better sales.',
      logoSrc: newIndiaLogo
    },
    { 
      company: 'Royal Enfield', 
      text: 'Their strategic localization strengthened our market presence while preserving Royal Enfield’s brand heritage and legacy.',
      logoSrc: royalEnfieldTestimonialLogo
    },
    { 
      company: 'Saint-Gobain', 
      text: 'They localized technical building content with high accuracy, helping us clearly communicate with architects, contractors, and distributors.',
      logoSrc: saintGobainLogo
    },
  ];

  // Duplicate testimonials for seamless infinite scroll loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];
  const logoOnlyCompanies = new Set(testimonials.map((testimonial) => testimonial.company));
  const blendLogoCompanies = new Set(testimonials.map((testimonial) => testimonial.company));
  const extraLargeLogoCompanies = new Set(['Royal Enfield', 'Saint-Gobain']);

  return (
    <section className="py-8 md:py-10 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-blue-600 font-semibold text-lg mb-2">What Client Says?</h3>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
            Our Testimonials
          </h2>
        </motion.div>

        {/* Continuous scrolling container */}
        <div className="relative">
          <div className="flex w-max animate-scroll-testimonials">
            {duplicatedTestimonials.map((testimonial, index) => (
              <motion.div
                key={`${testimonial.company}-${index}`}
                className="flex-shrink-0 mx-4 testimonial-card-wrapper"
                style={{ width: '400px' }}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.5, delay: (index % testimonials.length) * 0.03 }}
                whileHover={{ scale: 0.96, y: -4 }}
              >
                <div className="testimonial-card bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 shadow-lg hover:shadow-xl hover:border-blue-200 transition-all duration-500 h-full border border-blue-100/60 relative overflow-hidden">
                  <div className="testimonial-glow" />
                  <div className="w-44 h-28 mb-2 mx-auto flex items-center justify-center">
                    <ImageWithFallback
                      src={testimonial.logoSrc}
                      alt={testimonial.company}
                      className={`${extraLargeLogoCompanies.has(testimonial.company) ? 'w-52 h-36' : 'w-36 h-20'} ${blendLogoCompanies.has(testimonial.company) ? 'mix-blend-multiply' : ''} object-contain mx-auto`}
                    />
                  </div>
                  {!logoOnlyCompanies.has(testimonial.company) && (
                    <h3 className="text-2xl font-bold text-gray-900 text-center mb-1">{testimonial.company}</h3>
                  )}
                  <p
                    className="text-gray-700 text-center italic leading-relaxed text-sm"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    "{testimonial.text}"
                  </p>
                  <div className="flex justify-center gap-2 mt-2 testimonial-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-300 text-4xl drop-shadow-[0_0_8px_rgba(253,224,71,1)]">{'\u2605'}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-testimonials {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .animate-scroll-testimonials {
          animation: scroll-testimonials 42s linear infinite;
          will-change: transform;
        }

        .animate-scroll-testimonials:hover {
          animation-play-state: paused;
        }

        .testimonial-card-wrapper {
          transform-origin: center center;
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .testimonial-card {
          backdrop-filter: blur(2px);
        }

        .testimonial-glow {
          position: absolute;
          inset: -140% -70%;
          background: radial-gradient(circle at center, rgba(37, 99, 235, 0.18), rgba(255, 255, 255, 0));
          transform: translateX(-28%);
          opacity: 0;
          transition: transform 0.9s ease, opacity 0.9s ease;
          pointer-events: none;
        }

        .testimonial-card:hover .testimonial-glow {
          opacity: 1;
          transform: translateX(28%);
        }

        .testimonial-stars span {
          animation: testimonial-star-pulse 2.1s ease-in-out infinite;
        }

        .testimonial-stars span:nth-child(2) { animation-delay: 0.15s; }
        .testimonial-stars span:nth-child(3) { animation-delay: 0.3s; }
        .testimonial-stars span:nth-child(4) { animation-delay: 0.45s; }
        .testimonial-stars span:nth-child(5) { animation-delay: 0.6s; }

        @keyframes testimonial-star-pulse {
          0%, 100% {
            transform: translateY(0) scale(1);
            filter: brightness(1);
          }
          50% {
            transform: translateY(-3px) scale(1.04);
            filter: brightness(1.08);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-testimonials,
          .testimonial-stars span {
            animation: none !important;
          }
          .testimonial-card-wrapper {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}

