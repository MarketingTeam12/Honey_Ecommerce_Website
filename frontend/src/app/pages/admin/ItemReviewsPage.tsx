import { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { Star, Check, X, Eye, EyeOff, Search, Filter, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';

interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  reviewText: string;
  date: string;
  status: 'approved' | 'pending' | 'hidden';
  verifiedBuyer?: boolean;
}

export function ItemReviewsPage() {
  const { accessToken } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);


  // Load reviews from the backend
  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      console.log('📥 [ItemReviewsPage] Loading reviews from backend...');

      const response = await fetch(`${API_URL}/admin/reviews`, {
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        console.error('❌ [ItemReviewsPage] Backend fetch failed, status:', response.status);
        setReviews([]);
        return;
      }

      const data = await response.json();
      const backendReviews = data.reviews || [];

      // Transform backend reviews to admin format
      const formattedReviews = backendReviews.map((review: any) => ({
        id: review.id,
        productId: review.productId,
        productName: review.productName || review.product_name || 'Unknown Product',
        customerName: review.customerName || review.customer_name || review.name || 'Anonymous',
        rating: review.rating || 0,
        reviewText: review.reviewText || review.review_text || review.comment || '',
        date: review.createdAt || review.updatedAt || new Date().toISOString(),
        status: review.status || 'pending',
        verifiedBuyer: review.verifiedBuyer || false
      }));

      setReviews(formattedReviews);
      console.log('✅ [ItemReviewsPage] Loaded', formattedReviews.length, 'reviews from backend');
    } catch (error) {
      console.error('❌ [ItemReviewsPage] Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatusOnBackend = async (reviewId: string, status: 'approved' | 'pending' | 'hidden') => {
    const response = await fetch(`${API_URL}/admin/reviews/${reviewId}`, {
      method: 'PUT',
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    return response.json();
  };

  const handleApprove = async (reviewId: string) => {
    try {
      await updateStatusOnBackend(reviewId, 'approved');
      console.log('✅ [ItemReviewsPage] Review approved on backend');
      setReviews(prev => prev.map(review =>
        review.id === reviewId ? { ...review, status: 'approved' as const } : review
      ));
    } catch (error) {
      console.error('❌ [ItemReviewsPage] Error approving review:', error);
      alert('Could not approve this review on the server. It has NOT been marked approved. Please check your login/session and try again.');
    }
  };

  const handleHide = async (reviewId: string) => {
    try {
      await updateStatusOnBackend(reviewId, 'hidden');
      console.log('✅ [ItemReviewsPage] Review hidden on backend');
      setReviews(prev => prev.map(review =>
        review.id === reviewId ? { ...review, status: 'hidden' as const } : review
      ));
    } catch (error) {
      console.error('❌ [ItemReviewsPage] Error hiding review:', error);
      alert('Could not hide this review on the server. It has NOT been updated. Please try again.');
    }
  };

  const handleShow = async (reviewId: string) => {
    try {
      await updateStatusOnBackend(reviewId, 'approved');
      console.log('✅ [ItemReviewsPage] Review shown on backend');
      setReviews(prev => prev.map(review =>
        review.id === reviewId ? { ...review, status: 'approved' as const } : review
      ));
    } catch (error) {
      console.error('❌ [ItemReviewsPage] Error showing review:', error);
      alert('Could not update this review on the server. Please try again.');
    }
  };

  const handleDelete = async (reviewId: string, customerName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the review by ${customerName}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    console.log('🗑️ [ItemReviewsPage] Deleting review:', reviewId);

    try {
      const response = await fetch(`${API_URL}/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: buildHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      console.log('✅ [ItemReviewsPage] Review deleted from backend');
      setReviews(prev => prev.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error('❌ [ItemReviewsPage] Error deleting review:', error);
      alert('Could not delete this review on the server. Please try again.');
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch = (review.customerName || '').toLowerCase().includes(query) ||
                         (review.productName || '').toLowerCase().includes(query) ||
                         (review.reviewText || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.status === 'approved').length,
    pending: reviews.filter(r => r.status === 'pending').length,
    hidden: reviews.filter(r => r.status === 'hidden').length,
    averageRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
      : '0.0'
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      hidden: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Item Reviews</h1>
          <p className="text-gray-600 mt-1">Manage customer feedback and ratings for your services</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Reviews</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Approved</h3>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Hidden</h3>
            <p className="text-3xl font-bold text-red-600">{stats.hidden}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Rating</h3>
            <p className="text-3xl font-bold text-amber-500">{stats.averageRating}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, product, or review text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Filter className="w-5 h-5 text-gray-400 my-auto" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">Loading reviews...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No reviews found matching your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{review.customerName}</h3>
                        {getStatusBadge(review.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{review.productName}</p>
                      <div className="flex items-center gap-3">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {new Date(review.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {review.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="Approve Review"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      {review.status === 'hidden' ? (
                        <button
                          onClick={() => handleShow(review.id)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Show Review"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHide(review.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Hide Review"
                        >
                          <EyeOff className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id, review.customerName)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 italic">"{review.reviewText}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
