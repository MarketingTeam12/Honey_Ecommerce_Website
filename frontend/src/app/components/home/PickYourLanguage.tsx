import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useProducts } from '@/app/context/ProductContext';
import englishToForeignImg from 'figma:asset/ed7cdf787729d6d1793cb1a6b477c320f0fcadeb.png';
import englishToIndianImg from 'figma:asset/5d3738f42d25760a7464ddc4a8fe45a029b7fbfb.png';
import indianToEnglishImg from 'figma:asset/cef973a78471dbf5787d64535927f3ed4d791b1e.png';
import { getFirstValidImage } from '@/app/utils/imageUtils';

const PROMO_TAGS = ['Top Rated', 'Best Offer', 'Popular Choice', 'Exclusive Deal', 'Best Seller', 'Limited Time Offer'];

const getPromoTag = (seed: string) => {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PROMO_TAGS[hash % PROMO_TAGS.length];
};

const getOriginalPriceByRange = (offerPrice: number) => {
  if (offerPrice <= 500) return Math.round(offerPrice * 1.7);
  if (offerPrice <= 1000) return Math.round(offerPrice * 1.6);
  if (offerPrice <= 2000) return Math.round(offerPrice * 1.5);
  if (offerPrice <= 4000) return Math.round(offerPrice * 1.4);
  return Math.round(offerPrice * 1.3);
};

const getDiscountPercent = (offerPrice: number, originalPrice: number) => {
  if (originalPrice <= offerPrice || originalPrice <= 0) return null;
  return Math.max(1, Math.round(((originalPrice - offerPrice) / originalPrice) * 100));
};

const promoTextAnimation = {
  initial: { opacity: 0.82, y: 0 },
  animate: { opacity: [0.82, 1, 0.82], y: [0, -1, 0] },
  transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' as const }
};

export function PickYourLanguage() {
  const { convertPrice } = useCurrency();
  const { products: adminProducts } = useProducts();
  const sliderRef = useRef<Slider | null>(null);
  const blockedHomeProductName = 'any language to any language';

  // Get Translation category products from admin (exclude sworn translations)
  const translationProducts = adminProducts.filter(
    product => product.category === 'Translation' && 
               product.status === 'active' &&
               !product.name.toLowerCase().includes('sworn') &&
               product.name.toLowerCase() !== blockedHomeProductName
  );

  // Fallback products if no admin products
  const fallbackProducts = [
    {
      id: '1',
      title: 'English to Foreign Language',
      offerPrice: 800,
      originalPrice: 2000,
      tag: getPromoTag('fallback-1'),
      route: '/english-to-foreign-language',
      image: englishToForeignImg,
    },
    {
      id: '2',
      title: 'English to Any Indian Language',
      offerPrice: 400,
      originalPrice: 2000,
      tag: getPromoTag('fallback-2'),
      route: '/english-to-any-indian-language',
      image: englishToIndianImg,
    },
    {
      id: '3',
      title: 'Any Indian Language to English',
      offerPrice: 400,
      originalPrice: 2000,
      tag: getPromoTag('fallback-3'),
      route: '/any-indian-language-to-english',
      image: indianToEnglishImg,
    },
    {
      id: '4',
      title: 'Foreign Language to English',
      offerPrice: 800,
      originalPrice: 2000,
      tag: getPromoTag('fallback-4'),
      route: '/foreign-language-to-english',
      icon: '🔄',
    },
  ];

  // Use admin products if available, otherwise fallback
  const products = translationProducts.length > 0
    ? translationProducts.map(product => {
        const offerPrice = product.price;
        const adminOriginal = typeof product.compareAtPrice === 'number' ? product.compareAtPrice : 0;
        const originalPrice = adminOriginal > offerPrice ? adminOriginal : getOriginalPriceByRange(offerPrice);

        return {
          id: product.id,
          title: product.name,
          offerPrice,
          originalPrice,
          tag: getPromoTag(product.id),
          route: `/product/${product.id}`,
          image: getFirstValidImage(product.images),
          icon: '📄'
        };
      })
    : fallbackProducts.filter(
        product => product.title.toLowerCase() !== blockedHomeProductName
      );

  const desktopSlidesToShow = Math.min(3, products.length || 1);
  const tabletSlidesToShow = Math.min(2, products.length || 1);
  const sliderSettings = {
    arrows: false,
    dots: false,
    infinite: products.length > desktopSlidesToShow,
    speed: 650,
    slidesToShow: desktopSlidesToShow,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2200,
    pauseOnHover: true,
    initialSlide: 0,
    cssEase: 'ease-in-out',
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: tabletSlidesToShow,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.h2
          className="text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Pick Your Language
        </motion.h2>

        <div className="relative">
          <button
            type="button"
            onClick={() => sliderRef.current?.slickPrev()}
            aria-label="Previous language cards"
            className="hidden md:flex absolute -left-6 lg:-left-10 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-300 shadow-md hover:bg-gray-50"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>

          <button
            type="button"
            onClick={() => sliderRef.current?.slickNext()}
            aria-label="Next language cards"
            className="hidden md:flex absolute -right-6 lg:-right-10 top-1/2 -translate-y-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-300 shadow-md hover:bg-gray-50"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>

          <Slider ref={sliderRef} {...sliderSettings} className="max-w-6xl mx-auto">
            {products.map((product) => (
              <div key={product.id} className="px-3 h-full">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="h-full"
                >
                  <Link to={product.route} className="group block h-full">
                    <div className="h-full bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-md transition-all duration-500 ease-out hover:border-blue-500 hover:shadow-xl flex flex-col">
                      <div className="relative w-full aspect-square overflow-hidden bg-white">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="absolute inset-0 w-full h-full object-cover object-center scale-[1.06] transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-7xl">{product.icon}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 space-y-2 min-h-[130px] flex-1">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug break-words line-clamp-2">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-4xl font-bold text-red-600 leading-none">
                            {convertPrice(product.offerPrice)}
                          </p>
                          <p className="text-sm text-gray-500 line-through">
                            {convertPrice(product.originalPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {product.tag && (
                            <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 font-bold rounded-lg">
                              <motion.span
                                className="inline-block"
                                initial={promoTextAnimation.initial}
                                animate={promoTextAnimation.animate}
                                transition={promoTextAnimation.transition}
                              >
                                {product.tag}
                              </motion.span>
                            </Badge>
                          )}
                          {getDiscountPercent(product.offerPrice, product.originalPrice) && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 font-bold rounded-lg">
                              <motion.span
                                className="inline-block"
                                initial={promoTextAnimation.initial}
                                animate={promoTextAnimation.animate}
                                transition={promoTextAnimation.transition}
                              >
                                {getDiscountPercent(product.offerPrice, product.originalPrice)}% OFF
                              </motion.span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}



