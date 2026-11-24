import { useState, useEffect } from 'react';
import { Star, CheckCircle, ShieldCheck, ChevronDown, MessageSquarePlus, X, Send, AlertCircle } from 'lucide-react';
import { API_URL } from '@/app/utils/api';
import { toast } from 'sonner';

interface SiteReview {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

interface ReviewSummary {
  count: number;
  average: number;
  verifiedCount: number;
}

export function SiteReviewsSection() {
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({ count: 0, average: 0, verifiedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const PAGE_SIZE = 6;

  useEffect(() => {
    fetchReviews(0, true);
  }, []);

  const fetchReviews = async (newOffset: number, replace: boolean = false) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/site-reviews?limit=${PAGE_SIZE}&offset=${newOffset}`);
      if (res.ok) {
        const data = await res.json();
        const incomingReviews: SiteReview[] = data.reviews || [];
        setSummary(data.summary || { count: 0, average: 0, verifiedCount: 0 });
        if (replace) {
          setReviews(incomingReviews);
        } else {
          setReviews((prev) => [...prev, ...incomingReviews]);
        }
        setOffset(newOffset + incomingReviews.length);
        setHasMore(newOffset + incomingReviews.length < (data.summary?.count || 0));
      }
    } catch (err) {
      console.warn('Failed to load site reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowMore = () => {
    fetchReviews(offset, false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (comment.trim().length < 10) {
      setFormError('Please enter a comment with at least 10 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/site-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          orderNumber: orderNumber.trim() || undefined,
          website: website.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to submit review. Please try again.');
        return;
      }

      setFormSuccess(true);
      toast.success('Your review has been submitted for moderation.');
      // Reset fields
      setName('');
      setEmail('');
      setTitle('');
      setComment('');
      setOrderNumber('');
      setWebsite('');
      setRating(5);
    } catch (err: any) {
      setFormError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (score: number, max: number = 5) => {
    return (
      <div className="flex items-center text-amber-400">
        {[...Array(max)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < Math.round(score) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Reviews
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              What our customers say
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-slate-600 text-sm">
              <div className="flex items-center gap-1">
                {renderStars(summary.average || 5)}
                <span className="font-bold text-slate-900 ml-1">
                  {summary.average ? summary.average.toFixed(1) : '5.0'}
                </span>
                <span>/ 5</span>
              </div>
              <span className="text-slate-300">•</span>
              <span>
                Based on <strong className="text-slate-900">{summary.count}</strong> customer review{summary.count === 1 ? '' : 's'}
              </span>
              {summary.verifiedCount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center text-emerald-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    {summary.verifiedCount} verified customer{summary.verifiedCount === 1 ? '' : 's'}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setFormSuccess(false);
              setFormError(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
          >
            <MessageSquarePlus className="w-4 h-4" />
            {showForm ? 'Close Review Form' : 'Write a Review'}
          </button>
        </div>

        {/* Review Form Drawer / Card */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 mb-12">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Share your experience</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-emerald-900 mb-1">Thank you!</h4>
                <p className="text-emerald-800 text-sm">
                  Your review will appear after it has been approved.
                </p>
                <button
                  onClick={() => setShowForm(false)}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Rating Selector */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Your Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium text-slate-600">
                      {rating} out of 5 stars
                    </span>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email address <span className="text-slate-400 text-xs font-normal">(never shown publicly)</span> <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Optional Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Review Title <span className="text-slate-400 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fast apostille and accurate Dutch translation"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Comment with counter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-700">
                      Your Review <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">
                      {comment.length}/1000 characters (min 10)
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the quality, turnaround time, and your experience with our services..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Optional Order Number for Verification */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Order Number <span className="text-slate-400 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. ORD-2026-1042"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Enter your order number and the same email you used for the order to get a Verified customer badge
                  </p>
                </div>

                {/* Honeypot field (hidden from real users) */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <label htmlFor="hp_website">Website</label>
                  <input
                    type="text"
                    id="hp_website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Reviews Grid */}
        {loading && reviews.length === 0 ? (
          <div className="py-12 text-center text-slate-400">Loading customer reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-800 mb-1">No reviews yet</h4>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-5">
              Be the first verified customer to share feedback on our translations, attestations, and apostille services.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
            >
              Write the First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-base">{rev.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    {rev.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Verified customer
                      </span>
                    )}
                  </div>

                  <div className="mb-3">{renderStars(rev.rating)}</div>

                  {rev.title && (
                    <h4 className="font-semibold text-slate-900 text-sm mb-2">{rev.title}</h4>
                  )}

                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    "{rev.comment}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show More Button */}
        {hasMore && (
          <div className="mt-10 text-center">
            <button
              onClick={handleShowMore}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-sm font-semibold transition-all shadow-sm"
            >
              {loading ? 'Loading...' : 'Show more'}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default SiteReviewsSection;
