import { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useLocation } from 'react-router-dom';

const REVEAL_SELECTOR = [
  'main > *',
  'main [data-scroll-reveal]',
].join(', ');

export function ScrollEffects() {
  const { pathname } = useLocation();
  const { scrollYProgress } = useScroll();
  const topBlobY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const middleBlobY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const bottomBlobY = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR),
    ).filter((element) => !element.hasAttribute('data-scroll-reveal-ready'));

    if (!targets.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px',
      },
    );

    targets.forEach((element, index) => {
      element.classList.add('scroll-reveal');
      element.setAttribute('data-scroll-reveal-ready', 'true');
      element.style.setProperty(
        '--scroll-reveal-delay',
        `${Math.min(index * 70, 700)}ms`,
      );
      observer.observe(element);
    });

    requestAnimationFrame(() => {
      targets.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isInView =
          rect.top < window.innerHeight * 0.92 && rect.bottom > 0;

        if (isInView) {
          element.classList.add('is-visible');
        }
      });
    });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[80] h-1 w-full origin-left bg-gradient-to-r from-[#1a1f5c] via-[#2d96d8] to-[#67e8f9]"
        style={{ scaleX: scrollYProgress }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <motion.div
          className="scroll-ambient scroll-ambient-one"
          style={{ y: topBlobY }}
        />
        <motion.div
          className="scroll-ambient scroll-ambient-two"
          style={{ y: middleBlobY }}
        />
        <motion.div
          className="scroll-ambient scroll-ambient-three"
          style={{ y: bottomBlobY }}
        />
        <motion.div
          className="scroll-ambient scroll-grid"
          style={{ y: gridY }}
        />
      </div>
    </>
  );
}

export default ScrollEffects;
