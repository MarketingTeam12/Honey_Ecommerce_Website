import { motion } from 'motion/react';
import centerCertificate from '@/assets/center-certificate-v2.png';
import honeyFavicon from '@/assets/honey-favicon-transparent.png';
import bannerBefore from '@/assets/banner-before.png';
import bannerAfter from '@/assets/banner-after.png';
import checkMarkIcon from '@/assets/check-mark.png';

export function HeroSection() {
  const flags = [
    { code: 'fr', label: 'France' },
    { code: 'de', label: 'Germany' },
    { code: 'in', label: 'India' },
    { code: 'us', label: 'United States' },
    { code: 'gb', label: 'United Kingdom' },
    { code: 'it', label: 'Italy' },
    { code: 'es', label: 'Spain' },
    { code: 'ca', label: 'Canada' },
    { code: 'au', label: 'Australia' },
    { code: 'ae', label: 'United Arab Emirates' },
    { code: 'jp', label: 'Japan' },
    { code: 'kr', label: 'South Korea' },
    { code: 'sg', label: 'Singapore' },
  ];
  const scrollingFlags = [...flags, ...flags];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#c7dbea] via-[#bdd4e6] to-[#b4cde0] border-t-4 border-[#2d96d8] rounded-t-[22px] pt-3 pb-6 lg:pb-7 min-h-[calc(100vh-150px)] sm:min-h-[calc(100vh-120px)] flex items-start">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-20 -left-14 sm:-top-28 sm:-left-20 h-56 w-56 sm:h-80 sm:w-80 rounded-full bg-[#0a1247]/10 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-14 -right-8 sm:-bottom-24 sm:-right-12 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-[#2f77b7]/12 blur-3xl"
          animate={{ x: [0, -45, 0], y: [0, -25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 left-1/2 h-48 w-48 sm:h-72 sm:w-72 -translate-x-1/2 rounded-full border border-[#0a1247]/15"
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="absolute inset-0 overflow-hidden opacity-[0.035]">
          <motion.div
            className="absolute top-[14%] left-0 whitespace-nowrap text-[56px] sm:text-[100px] font-black tracking-[0.14em] sm:tracking-[0.2em] text-[#0a1247]"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 42, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
          >
            TRANSLATION * APOSTILLE * ATTESTATION * CERTIFIED *
          </motion.div>
          <motion.div
            className="absolute top-[62%] right-0 whitespace-nowrap text-[48px] sm:text-[90px] font-black tracking-[0.12em] sm:tracking-[0.18em] text-[#0a1247]"
            animate={{ x: ['100%', '-100%'] }}
            transition={{ duration: 46, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
          >
            GLOBAL * TRUSTED * LEGAL * PROFESSIONAL *
          </motion.div>
        </div>

        <motion.div
          className="absolute top-[24%] right-[5%] text-[28px] sm:text-[44px] lg:text-[64px] font-extrabold text-[#0a1247]/[0.04] leading-none"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          CERTIFIED
        </motion.div>
        <motion.div
          className="absolute bottom-[18%] left-[5%] text-[20px] sm:text-[28px] lg:text-[40px] font-extrabold text-[#0a1247]/[0.04] leading-none"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        >
          LEGAL TRANSLATION
        </motion.div>
      </div>

      <div className="max-w-[1500px] mx-auto px-3 sm:px-4 lg:px-6 relative z-10 w-full">
        <div className="mx-auto max-w-[1160px] flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="font-sans text-gray-900 space-y-2 lg:space-y-3 mb-2 sm:mb-3 lg:mb-4"
          >
            <motion.h1
              className="text-[1.35rem] sm:text-[1.95rem] lg:text-[2.6rem] font-bold text-[#0a1247] tracking-[0.01em] leading-[1.1] sm:leading-[1.05]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              CERTIFIED TRANSLATIONS
            </motion.h1>

            <motion.h2
              className="text-[0.98rem] sm:text-[1.25rem] lg:text-[1.85rem] leading-[1.2] sm:leading-[1.12] text-[#0a1247] font-medium tracking-[0.002em] px-1 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              Accepted for Visa, Immigration, Legal,
              Court & International Purposes
            </motion.h2>

            <div className="w-[125px] sm:w-[175px] h-[3px] bg-[#0a1247] mx-auto rounded-full mt-1 mb-1" />

            <motion.p
              className="text-[0.82rem] sm:text-[1.02rem] lg:text-[1.25rem] text-[#065F46] max-w-4xl leading-[1.35] font-medium mx-auto px-1 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Pan-India Online Service | Email Soft Copies | Free Hard Copy Delivery Across India.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
            className="relative w-full mt-1 sm:mt-2 lg:mt-2.5"
          >
            <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-r from-white/50 via-[#cce2f2]/30 to-white/50 blur-xl" />
            <div className="relative flex justify-between gap-2.5 lg:gap-3.5 max-w-[96vw] sm:max-w-[90vw] lg:max-w-[90vw] mx-auto items-stretch">
              <div className="relative aspect-[3/4] overflow-visible">
                <div className="relative h-full bg-white rounded-2xl border-[2.5px] border-[#6f88a3] shadow-lg overflow-hidden">
                  <img
                    src={bannerBefore}
                    alt="Certificate sample left"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-[0.8%] left-[0.8%] w-[20%] h-[9.5%] bg-white rounded-md z-10" />
                  <img
                    src={honeyFavicon}
                    alt="Certificate icon left"
                    className="absolute top-[1.4%] left-[1.5%] w-[7.2%] h-auto object-contain z-20"
                  />
                </div>
              </div>
              <div className="relative bg-white rounded-2xl border-[2.5px] border-[#6f88a3] shadow-xl overflow-hidden aspect-[3/4]">
                <img
                  src={centerCertificate}
                  alt="Certificate sample center"
                  className="w-full h-full object-contain object-top bg-white"
                />
                <div className="absolute top-[1%] left-[0.8%] w-[9.8%] h-[8.8%] bg-white rounded-md z-10" />
                <img
                  src={honeyFavicon}
                  alt="Certificate icon center"
                  className="absolute top-[1.8%] left-[1.75%] w-[6.2%] h-auto object-contain z-20"
                />
              </div>
              <div className="relative aspect-[3/4] overflow-visible">
                <div className="relative h-full bg-white rounded-2xl border-[2.5px] border-[#6f88a3] shadow-lg overflow-hidden">
                  <img
                    src={bannerAfter}
                    alt="Certificate sample right"
                    className="w-full h-full object-contain object-top bg-white"
                  />
                  <div className="absolute top-[0.8%] left-[0.6%] w-[19%] h-[10.5%] bg-white rounded-md z-10" />
                  <img
                    src={honeyFavicon}
                    alt="Certificate icon right"
                    className="absolute top-[1.6%] left-[1.6%] w-[7.8%] h-auto object-contain z-20"
                  />
                </div>
                <div className="absolute -right-[9%] top-[10%] z-30 pointer-events-none">
                  <img
                    src={checkMarkIcon}
                    alt="Verified check mark"
                    className="h-20 w-20 object-contain rotate-0"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-5 w-full border-t border-[#2d96d8]/40 pt-3 overflow-hidden">
              <div className="flags-track flex w-max gap-6 sm:gap-8 pr-6 sm:pr-8">
                {scrollingFlags.map((flag, index) => (
                  <img
                    key={`${flag.code}-${index}`}
                    src={`https://flagcdn.com/w40/${flag.code}.png`}
                    alt={flag.label}
                    className="h-6 sm:h-7 w-auto select-none shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-white/85 to-transparent" />

      <style>{`
        @keyframes scroll-flags {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .flags-track {
          animation: scroll-flags 40s linear infinite;
        }

        .flags-track:hover {
          animation-play-state: paused;
        }

      `}</style>
    </section>
  );
}
