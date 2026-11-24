import { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { Star, CheckCircle, Check, X, Trash2, Clock, CheckCircle2, XCircle, Search, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { toast } from 'sonner';

interface SiteReviewAdmin {
  id: string;
  name: string;
  email: string;
  rating: number;
  title: string | null;
  comment: string;
  isVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  orderId: string | null;
  orderNumber: string | null;
  moderatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function SiteReviewsPage() {
  const { accessToken } = useAuth();
  const [reviews, setReviews] = useState<SiteReviewAdmin[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews(activeTab);
  }, [activeTab]);

  const loadReviews = async (status: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/site-reviews?status=${status}`, {
        headers: buildHeaders(accessToken),
      });

      if (!res.ok) {
        toast.error('Failed to load website reviews');
        setReviews([]);
        return;
      }

      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err: any) {
      toast.error('Error fetching website reviews: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`${API_URL}/admin/site-reviews/${id}`, {
        method: 'PATCH',
        headers: {
          ...buildHeaders(accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to update review status');
        return;
      }

      toast.success(`Review ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`);
      loadReviews(activeTab);
    } catch (err: any) {
      toast.error('Failed to update review: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review permanently?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/site-reviews/${id}`, {
        method: 'DELETE',
        headers: buildHeaders(accessToken),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete review');
        return;
      }

      toast.success('Review deleted successfully');
      loadReviews(activeTab);
    } catch (err: any) {
      toast.error('Failed to delete review: ' + err.message);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      r.comment.toLowerCase().includes(q) ||
      (r.orderNumber && r.orderNumber.toLowerCase().includes(q))
    );
  });

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center text-amber-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Website Reviews Moderation</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review, approve, reject and manage customer feedback submitted on the website.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Waiting for approval
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'approved'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Published
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'rejected'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <XCircle className="w-4 h-4" />
            Rejected
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, order # or comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            No reviews found in this tab.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Header info */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-gray-900 text-base">{rev.name}</span>
                      <span className="text-sm text-gray-500">({rev.email})</span>
                      {rev.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Verified customer
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Unverified</span>
                      )}
                      {rev.orderNumber && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                          <ShoppingBag className="w-3 h-3 text-slate-500" />
                          Order #{rev.orderNumber}
                        </span>
                      )}
                    </div>

                    {/* Rating & Date */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {renderStars(rev.rating)}
                      <span>•</span>
                      <span>
                        Submitted on{' '}
                        {new Date(rev.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Title & Comment */}
                    {rev.title && (
                      <h4 className="font-semibold text-gray-900 text-sm">{rev.title}</h4>
                    )}
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                      "{rev.comment}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 shrink-0 pt-2 md:pt-0">
                    {rev.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(rev.id, 'approved')}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    {rev.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(rev.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default SiteReviewsPage;
