import { useState, useEffect } from 'react';
import { Star, ExternalLink, MessageSquarePlus } from 'lucide-react';

interface GoogleReviewsSectionProps {
  compact?: boolean;
}

interface RatingData {
  rating: number;
  totalReviews: number;
  isLive: boolean;
  businessName: string;
  location: string;
  profileUrl: string;
  writeReviewUrl: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
  }>;
}

const DEFAULT_RATING_DATA: RatingData = {
  rating: 4.6,
  totalReviews: 582,
  isLive: false,
  businessName: 'Honey Translation Services',
  location: 'Vadapalani, Chennai',
  profileUrl: 'https://www.google.com/search?q=Honey+Translation+Services+Vadapalani+Chennai+reviews',
  writeReviewUrl: 'https://www.google.com/search?q=Honey+Translation+Services+Vadapalani+Chennai+write+review',
};

export function GoogleReviewsSection({ compact = false }: GoogleReviewsSectionProps) {
  const [data, setData] = useState<RatingData>(DEFAULT_RATING_DATA);

  useEffect(() => {
    let isMounted = true;
    async function fetchGoogleRating() {
      try {
        const res = await fetch('/api/google-rating');
        if (res.ok) {
          const json = await res.json();
          if (json.success && isMounted) {
            setData((prev) => ({
              ...prev,
              rating: typeof json.rating === 'number' ? json.rating : prev.rating,
              totalReviews: typeof json.reviewCount === 'number' ? json.reviewCount : prev.totalReviews,
              isLive: Boolean(json.live),
              reviews: Array.isArray(json.reviews) ? json.reviews : undefined,
            }));
          }
        }
      } catch {
        // Fallback gracefully to default static verified rating
      }
    }
    fetchGoogleRating();
    return () => {
      isMounted = false;
    };
  }, []);

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center p-2 flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-gray-900 text-base">★ {data.rating.toFixed(1)}</span>
              <span className="text-gray-400">·</span>
              <span className="font-semibold text-gray-700 text-sm">{data.totalReviews} Google reviews</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">Honey Translation Services · Vadapalani, Chennai</p>
          </div>
        </div>
        <a
          href={data.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
        >
          <span>View on Google</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <section className="py-8 md:py-12 bg-white" aria-label="Customer Reviews on Google">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 rounded-2xl border border-gray-200 p-8 sm:p-10 shadow-sm">
          <div className="max-w-3xl mx-auto text-center">
            {/* Google Logo */}
            <div className="flex justify-center mb-4">
              <svg viewBox="0 0 272 92" className="h-10" aria-label="Google">
                <path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" />
                <path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" />
                <path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" />
                <path fill="#34A853" d="M225 3v65h-9.5V3h9.5z" />
                <path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" />
                <path fill="#4285F4" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" />
              </svg>
            </div>

            <h3 className="text-3xl font-extrabold text-gray-900 mb-2">Customer Reviews &amp; Ratings</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-6">
              Verified customer feedback for {data.businessName} · {data.location}
            </p>

            {/* Rating Badge Card */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-md p-6 sm:p-8 mb-6 inline-block w-full">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-5xl font-black text-gray-900 tracking-tight">
                    {data.rating.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.floor(data.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : i < data.rating
                            ? 'fill-yellow-400/60 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="sm:border-l sm:border-gray-200 sm:pl-6 text-center sm:text-left">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    ★ {data.rating.toFixed(1)} · {data.totalReviews} Google reviews
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Based on genuine reviews on our official Google Business profile
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 pt-6 border-t border-gray-100">
                <a
                  href={data.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1f5c] hover:bg-[#252b70] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  <span>Read Reviews on Google</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={data.writeReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  <MessageSquarePlus className="w-4 h-4 text-blue-600" />
                  <span>Write a Review</span>
                </a>
              </div>
            </div>

            {/* Live unedited reviews from Google Places API if available */}
            {data.reviews && data.reviews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left mt-6">
                {data.reviews.slice(0, 5).map((rev, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{rev.author_name}</span>
                      <span className="text-xs text-gray-400">{rev.relative_time_description}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 text-xs leading-relaxed line-clamp-4">{rev.text}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block">Google verified reviewer</span>
                  </div>
                ))}
              </div>
            )}

            {/* Transparency Note */}
            <p className="text-xs text-gray-500 mt-4">
              {data.isLive
                ? '* Rating dynamically synchronized with the Google Places API.'
                : '* Official Google Business Profile rating. Numbers updated manually until GOOGLE_PLACES_API_KEY is configured for automated sync.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
export default GoogleReviewsSection;
