import { useEffect, useRef } from 'react';
import Slider from 'react-slick';
import { Star } from 'lucide-react';
import { CarouselPauseButton, useAutoplayControl } from '@/app/components/home/CarouselPlaybackControls';

export function ReviewsSlider() {
  const sliderRef = useRef<Slider | null>(null);
  const { isPlaying, isPaused, togglePlayback } = useAutoplayControl(true);

  useEffect(() => {
    if (!sliderRef.current) return;
    if (isPlaying) {
      sliderRef.current.slickPlay();
    } else {
      sliderRef.current.slickPause();
    }
  }, [isPlaying]);

  const reviews = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Customer ${i + 1}`,
    rating: 5,
    text: 'Amazing service! Fast, accurate, and professional translation.',
  }));

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: isPlaying,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    pauseOnFocus: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
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
    <section className="py-20 bg-gradient-to-br from-yellow-50 to-orange-50" aria-roledescription="carousel" aria-label="Customer Reviews Slider">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <h2 className="text-4xl font-bold text-gray-900">
            Reviews &amp; Ratings
          </h2>
          <CarouselPauseButton
            isPaused={isPaused}
            onToggle={togglePlayback}
            carouselName="reviews slider"
          />
        </div>
        <Slider ref={sliderRef} {...settings}>
          {reviews.map((review) => (
            <div key={review.id} className="px-4">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{review.text}"</p>
                <p className="text-gray-900 font-bold">- {review.name}</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
