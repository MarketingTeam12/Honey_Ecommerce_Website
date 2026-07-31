import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import googleLogo from 'figma:asset/30c364ea738ab38fa2916a630587ad5e3ff9dc67.png';

interface Review {
  id: number;
  name: string;
  date: string;
  initial: string;
  rating: number;
  text: string;
  verified: boolean;
}

interface GoogleReviewsSectionProps {
  compact?: boolean;
}

export function GoogleReviewsSection({ compact = false }: GoogleReviewsSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const reviews: Review[] = [
    {
      id: 1,
      name: 'Hatem Ashraf Rezk Arafat',
      date: '16 December 2025',
      initial: 'H',
      rating: 5,
      text: 'Excellent service for sworn translation and apostille. The team handled my documents professionally and delivered everything on time. Very reliable and an easy process.',
      verified: true,
    },
    {
      id: 2,
      name: 'Shyam',
      date: '29 November 2025',
      initial: 'S',
      rating: 5,
      text: 'I used their attestation and apostille services, and the experience was smooth from start to finish. Clear communication and quick support made the whole process stress-free.',
      verified: true,
    },
    {
      id: 3,
      name: 'Shreyansh Tiwari',
      date: '05 December 2025',
      initial: 'S',
      rating: 5,
      text: 'Great support for both Indian and foreign language translations. The translations were accurate, well-formatted, and accepted without any issues. Highly recommended.',
      verified: true,
    },
    {
      id: 4,
      name: 'Nehala Askar',
      date: '15 December 2025',
      initial: 'N',
      rating: 5,
      text: 'The package services are very convenient and save a lot of time. Everything from document submission to final delivery was handled efficiently by the team.',
      verified: true,
    },
    {
      id: 5,
      name: 'Afzal',
      date: '24 September 2025',
      initial: 'A',
      rating: 5,
      text: 'Professional and trustworthy service. Whether it\'s sworn translation or apostille, they guide you properly at every step and respond quickly to queries.',
      verified: true,
    },
    {
      id: 6,
      name: 'Samruddhi',
      date: '31 December 2025',
      initial: 'S',
      rating: 5,
      text: 'The team provided excellent support for both Indian and international language translations. The documents were precise, properly structured, and accepted without any problems. Truly dependable service.',
      verified: true,
    },
    {
      id: 7,
      name: 'Sachin',
      date: '06 December 2025',
      initial: 'S',
      rating: 5,
      text: 'Very accurate and professional translation work. The formatting was perfect, and the documents were delivered on time. I had no issues with approval. Highly satisfied.',
      verified: true,
    },
    {
      id: 8,
      name: 'Md Badre Alam',
      date: '13 September 2025',
      initial: 'M',
      rating: 5,
      text: 'Smooth experience from start to end. The translations were clear, error-free, and met all official requirements. Customer support was responsive and helpful.',
      verified: true,
    },
    {
      id: 9,
      name: 'Karthik',
      date: '10 September 2025',
      initial: 'K',
      rating: 5,
      text: 'Reliable translation services for multiple languages. The quality was impressive, and the documents were accepted without any corrections. I would definitely recommend them.',
      verified: true,
    },
    {
      id: 10,
      name: 'Naveen',
      date: '22 September 2025',
      initial: 'N',
      rating: 5,
      text: 'Good attention to detail and proper formatting. The team handled both Indian and foreign language translations efficiently. Overall, a very good experience.',
      verified: true,
    },
    {
      id: 11,
      name: 'Abhishek',
      date: '30 September 2025',
      initial: 'A',
      rating: 5,
      text: 'Professional and trustworthy service. The translations were accurate, easy to understand, and delivered within the promised timeline.',
      verified: true,
    },
    {
      id: 12,
      name: 'Jhilli',
      date: '30 November 2025',
      initial: 'J',
      rating: 5,
      text: 'Well-organized and high-quality translation service. The process was simple, and the final documents were accepted smoothly by the authorities.',
      verified: true,
    },
  ];

  const reviewsPerSlide = 3;
  const totalSlides = Math.ceil(reviews.length / reviewsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const visibleReviews = reviews.slice(
    currentSlide * reviewsPerSlide,
    (currentSlide + 1) * reviewsPerSlide
  );

  return (
    <section className={`${compact ? 'py-0' : 'py-2 md:py-3'} bg-white`}>
      <div className="max-w-7xl mx-auto px-6">
        {!compact && (
          <>
            {/* Header with Rating */}
            <div className="text-center mb-4">
              <h3 className="text-4xl font-bold text-gray-900 mb-4">EXCELLENT</h3>
              <div className="flex items-center justify-center gap-2 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-10 h-10 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.95)]" />
                ))}
              </div>
              <div className="flex justify-center">
                <svg viewBox="0 0 272 92" className="h-10">
                  <path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                  <path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                  <path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
                  <path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/>
                  <path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
                  <path fill="#4285F4" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>
                </svg>
              </div>
            </div>
          </>
        )}

        {/* Reviews Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Previous reviews"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Next reviews"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          {/* Reviews Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${compact ? 'px-0' : 'px-8'}`}>
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                      {review.initial}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-[1.05rem]">{review.name}</h4>
                      <p className="text-base text-gray-500">{review.date}</p>
                    </div>
                  </div>
                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                    <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.9)]" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-gray-700 text-base leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className={`flex justify-center gap-2 ${compact ? 'mt-5' : 'mt-8'}`}>
            {[...Array(totalSlides)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
