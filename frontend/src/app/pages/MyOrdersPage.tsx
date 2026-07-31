import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertCircle, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Package, 
  Truck, 
  Check, 
  XCircle, 
  Download,
  Star,
  Send
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { authClient } from '@/app/utils/authClient';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { getCurrencySymbolForCountry } from '@/app/utils/currency';

interface OrderItem {
  id: string;
  name: string;
  basePrice: number;
  totalPrice: number;
  pageCount: number;
  sourceLanguage?: string;
  targetLanguage?: string;
  url?: string;
  productId?: string;
}

// The cart's `id` field is a synthetic per-add-to-cart id (e.g.
// "attestation-1690000000000"), NOT the product's id, so it can't be used to
// match reviews to a product. The one reliable link back to the product is
// the page URL that was open when the item was added to cart (saved as
// item.url, e.g. "/product/product_1781173994623_f4cc95d7") — that last path
// segment is exactly the productId ProductTemplate.tsx uses to key reviews.
// Fall back to item.productId (if a future checkout flow starts sending it),
// then to the same title-slug rule ProductTemplate.tsx uses when no explicit
// productKey is available, so a review submitted here still lines up with
// the reviews shown on that product's page.
const deriveProductIdFromItem = (item: OrderItem): string => {
  if (item.url) {
    const segments = item.url.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) return decodeURIComponent(last);
  }
  if (item.productId) return item.productId;
  return item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

interface Order {
  id: string;
  order_number: string;
  items: OrderItem[];
  total_amount: string;
  status: string;
  payment_status: string;
  payment_method: string;
  tracking_number?: string;
  shipping_carrier?: string;
  shipping_method?: string;
  estimated_delivery?: string;
  customer_file_name?: string;
  completed_file_url?: string;
  completed_file_name?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  shipping_address?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
  };
  shipping_details?: {
    email?: string;
    address?: string;
  };
}

export function MyOrdersPage() {
  const { user, accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Write a Review modal state
  const [reviewingItem, setReviewingItem] = useState<{ order: Order; item: OrderItem } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewedItemIds, setReviewedItemIds] = useState<Set<string>>(new Set());

  const formatCurrencyAmount = (amount: unknown, country?: string | null) => {
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
    const symbol = getCurrencySymbolForCountry(country);
    return `${symbol}${numericAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatOrderLanguages = (...languages: Array<string | undefined | null>) => {
    return languages
      .map((language) => String(language || '').trim())
      .filter(Boolean)
      .join(', ');
  };

  const resolveItemRate = (item: OrderItem) => {
    const directRate = parseFloat(String(item.basePrice ?? 0));
    if (directRate > 0) return directRate;

    const quantity = parseInt(String(item.pageCount ?? 1), 10) || 1;
    const directAmount = parseFloat(String(item.totalPrice ?? 0));
    if (directAmount > 0 && quantity > 0) {
      return directAmount / quantity;
    }

    return 0;
  };

  const resolveItemAmount = (item: OrderItem) => {
    const directAmount = parseFloat(String(item.totalPrice ?? 0));
    if (directAmount > 0) return directAmount;

    const quantity = parseInt(String(item.pageCount ?? 1), 10) || 1;
    return resolveItemRate(item) * quantity;
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      
      // 🔄 Silent background polling every 3 seconds for faster real-time updates
      const interval = setInterval(() => {
        console.log('🔄 [MyOrdersPage] Background polling for status updates...');
        fetchOrders(true); // Pass true to indicate this is a background fetch
      }, 3000); // Poll every 3 seconds for faster updates (reduced from 5 seconds)
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [user]);

  const fetchOrders = async (isBackgroundFetch: boolean = false) => {
    try {
      // Only show loading spinner on initial page load, not on background updates
      if (!isBackgroundFetch) {
        setLoading(true);
      }
      
      if (isBackgroundFetch) {
        console.log('🔄 [MyOrdersPage] Silent background fetch - no loading spinner');
      } else {
        console.log('📦 [MyOrdersPage] Initial fetch - showing loading spinner');
      }
      
      console.log('📦 [MyOrdersPage] Fetching orders for user:', user?.email);
      console.log('📦 [MyOrdersPage] User ID:', user?.id);
      console.log('📦 [MyOrdersPage] Access Token:', accessToken ? 'Present' : 'Missing');
      
      let token = accessToken;
      
      // 🔐 For real Backend users (not mock users), refresh the session to get a fresh token
      if (token && !token.startsWith('mock-token-')) {
        try {
          console.log('�� [MyOrdersPage] Refreshing Backend session for fresh token...');
          const { data: { session }, error: sessionError } = await authClient.auth.getSession();
          
          if (session?.access_token) {
            token = session.access_token;
            console.log('� [MyOrdersPage] Got fresh token from session');
          } else {
            console.log('� [MyOrdersPage] No session found, using existing token');
          }
        } catch (sessionError) {
          console.log(' [MyOrdersPage] Session refresh error:', sessionError);
        }
      }
      
      let backendOrders: Order[] = [];
      let backendFailed = false;
      
      // PRIORITY 1: Try to fetch from backend first for cross-device sync
      if (token) {
        try {
          if (!isBackgroundFetch) {
            console.log('📡 [MyOrdersPage] Fetching from backend...');
            console.log('📡 [MyOrdersPage] Backend URL:', `${API_URL}/orders/my-orders`);
            console.log('📡 [MyOrdersPage] User token type:', token.startsWith('mock-token-') ? 'DEMO USER (mock-token)' : 'REAL USER (Backend token)');
          }
          
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          // 🔥 Add cache-busting timestamp to prevent browser from returning stale cached data
          const cacheBuster = `?t=${Date.now()}`;
          
          const response = await fetch(
            `${API_URL}/orders/my-orders${cacheBuster}`,
            {
              headers: buildHeaders(token),
              signal: controller.signal
            }
          );

          clearTimeout(timeout);

          if (response.ok) {
            const data = await response.json();
            backendOrders = data.orders || [];
            
            if (isBackgroundFetch) {
              console.log(`🔄 [Background] Loaded ${backendOrders.length} orders - updating silently`);
            } else {
              console.log(`✅ [MyOrdersPage] Loaded ${backendOrders.length} orders from backend`);
            }
            
            // Log status changes
            backendOrders.forEach((order, idx) => {
              const existingOrder = orders.find(o => o.id === order.id);
              if (existingOrder && existingOrder.status !== order.status) {
                console.log(`[Status Change Detected] Order ${order.order_number}: ${existingOrder.status} ${order.status}`);
              }
              
              // ALWAYS log each order's status for debugging
              console.log(`�� [Order ${idx + 1}/${backendOrders.length}] ID:`, order.id);
              console.log(`   �� Order Number:`, order.order_number);
              console.log(`   � Status:`, order.status);
              console.log(`   �� Tracking:`, order.tracking_number || 'NOT SET');
              console.log(`    Carrier:`, order.shipping_carrier || 'NOT SET');
              console.log(`    Updated:`, order.updated_at);
              console.log(`   ---`);
            });
          } else {
            const errorText = await response.text();
            console.log('� [MyOrdersPage] Backend fetch failed, status:', response.status);
            console.log('� [MyOrdersPage] Error response:', errorText);
            backendFailed = true;
          }
        } catch (backendError: any) {
          if (backendError.name === 'AbortError') {
            console.log('� [MyOrdersPage] Backend request timed out');
          } else {
            console.log('� [MyOrdersPage] Backend error:', backendError);
          }
          backendFailed = true;
        }
      } else {
        console.log('� [MyOrdersPage] No token available - this should not happen for logged in users');
        console.log('� [MyOrdersPage] User object:', user);
        backendFailed = true;
      }
      
      // Get localStorage orders for merging/fallback
      console.log('� [MyOrdersPage] Checking localStorage...');
      const localOrders = localStorage.getItem('user_orders');
      let parsedLocalOrders: Order[] = [];
      
      if (localOrders) {
        try {
          const allLocalOrders = JSON.parse(localOrders);
          console.log('� [MyOrdersPage] Total orders in localStorage:', allLocalOrders.length);
          
          // Filter orders for the current user
          parsedLocalOrders = allLocalOrders.filter((order: any) => 
            order.user_email === user?.email || 
            order.customer_email === user?.email ||
            order.user_id === user?.id
          );
          
          console.log('� [MyOrdersPage] User orders in localStorage:', parsedLocalOrders.length);
        } catch (e) {
          console.log('� [MyOrdersPage] Error parsing localStorage:', e);
        }
      } else {
        console.log('� [MyOrdersPage] No localStorage data found');
      }
      
      // MERGE backend and localStorage orders (backend takes priority, but include localStorage-only orders)
      const mergedOrders = [...backendOrders];
      const backendOrderIds = new Set(backendOrders.map(o => o.id));
      
      // Add localStorage orders that are NOT in backend
      for (const localOrder of parsedLocalOrders) {
        if (!backendOrderIds.has(localOrder.id)) {
          console.log(`📋 [MyOrdersPage] Adding localStorage-only order: ${localOrder.order_number}`);
          mergedOrders.push(localOrder);
        }
      }
      
      // Sort by created_at descending (newest first)
      mergedOrders.sort((a: Order, b: Order) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      console.log(`[MyOrdersPage] Final order count: ${mergedOrders.length} (${backendOrders.length} from backend, ${mergedOrders.length - backendOrders.length} from localStorage only)`);
      
      if (mergedOrders.length > 0) {
        console.log('[MyOrdersPage] Order IDs:', mergedOrders.map(o => o.order_number).join(', '));
      }
      
      setOrders(mergedOrders);
      setLoading(false);
      setIsInitialLoad(false);
      
      if (isBackgroundFetch) {
        console.log('[Background] Orders updated silently - no page reload');
      } else {
        console.log('� [MyOrdersPage] Orders loaded and merged from backend + localStorage');
      }
    } catch (error) {
      console.error(' [MyOrdersPage] Error fetching orders:', error);
      
      // Final fallback: try localStorage one more time
      try {
        const localOrders = localStorage.getItem('user_orders');
        if (localOrders) {
          const allLocalOrders = JSON.parse(localOrders);
          const userOrders = allLocalOrders.filter((order: any) => 
            order.user_email === user?.email || 
            order.customer_email === user?.email ||
            order.user_id === user?.id
          );
          const sortedOrders = userOrders.sort((a: Order, b: Order) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          setOrders(sortedOrders);
          console.log(` [MyOrdersPage] Loaded ${sortedOrders.length} orders from localStorage (final fallback)`);
        } else {
          setOrders([]);
        }
      } catch (e) {
        console.error('[MyOrdersPage] Final fallback failed:', e);
        setOrders([]);
      }
      
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const downloadCompletedFile = async (orderId: string) => {
    try {
      setDownloadingOrderId(orderId);
      const token = accessToken;
      
      const response = await fetch(
        `${API_URL}/orders/${orderId}/download-completed-file`,
        {
          headers: buildHeaders(token)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get download link');
      }

      const data = await response.json();
      
      // Open download link in new tab
      window.open(data.downloadUrl, '_blank');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      alert(error.message || 'Failed to download file. Please try again later.');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  const isMockAuth = () => accessToken?.startsWith('mock-token-');

  const openReviewForm = (order: Order, item: OrderItem) => {
    setReviewingItem({ order, item });
    setReviewRating(0);
    setReviewHoverRating(0);
    setReviewText('');
    setReviewError('');
    setReviewSuccess('');
  };

  const closeReviewForm = () => {
    setReviewingItem(null);
    setReviewRating(0);
    setReviewText('');
    setReviewError('');
  };

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewingItem || !user) return;

    setReviewError('');
    setReviewSuccess('');

    if (reviewRating === 0) {
      setReviewError('Please select a rating');
      return;
    }
    if (reviewText.trim().length < 10) {
      setReviewError('Review must be at least 10 characters long');
      return;
    }

    const { order, item } = reviewingItem;
    const productId = deriveProductIdFromItem(item);
    const itemKey = `${order.id}:${item.id}`;

    if (!accessToken) {
      setReviewError('Please sign in again to submit a review.');
      return;
    }

    try {
      setReviewSubmitting(true);

      const response = await fetch(
        `${API_URL}/reviews`,
        {
          method: 'POST',
          headers: buildHeaders(accessToken),
          body: JSON.stringify({
            productId,
            productName: item.name,
            rating: reviewRating,
            reviewText: reviewText.trim(),
            orderId: order.id,
            verifiedBuyer: true
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setReviewError(data?.error || data?.message || 'Failed to submit review. Please try again.');
        return;
      }

      setReviewSuccess('Review submitted! It will show on the product page once approved.');
      setReviewedItemIds(prev => new Set(prev).add(itemKey));
      setTimeout(() => {
        closeReviewForm();
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError('Failed to submit review. Please check your connection and try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const hasReviewed = (order: Order, item: OrderItem) => {
    const itemKey = `${order.id}:${item.id}`;
    return reviewedItemIds.has(itemKey);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Order Placed', icon: Clock },
      received: { color: 'bg-blue-100 text-blue-800', label: 'Received', icon: CheckCircle2 },
      'payment-received': { color: 'bg-green-100 text-green-800', label: 'Payment Received', icon: CheckCircle2 },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed', icon: CheckCircle2 },
      'document-analysis': { color: 'bg-indigo-100 text-indigo-800', label: 'Document Analysis', icon: FileText },
      'translator-working': { color: 'bg-purple-100 text-purple-800', label: 'Translator Working', icon: Package },
      formatting: { color: 'bg-violet-100 text-violet-800', label: 'Formatting', icon: Package },
      'proof-checking': { color: 'bg-blue-100 text-blue-800', label: 'Proof Checking', icon: Package },
      draft: { color: 'bg-cyan-100 text-cyan-800', label: 'Draft Ready', icon: FileText },
      soft: { color: 'bg-teal-100 text-teal-800', label: 'Soft Copy Ready', icon: FileText },
      courier: { color: 'bg-orange-100 text-orange-800', label: 'Courier', icon: Truck },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing', icon: Package },
      shipped: { color: 'bg-purple-100 text-purple-800', label: 'Shipped', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered', icon: Check },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} px-3 py-1 flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getOrderTrackingSteps = (order: Order) => {
    // Log current order status for debugging
    console.log(' [Tracking Steps] Order:', order.order_number, 'Status:', order.status);
    
    // Define status progression levels for translation workflow
    const statusLevels: Record<string, number> = {
      'pending': 0,
      'received': 1,
      'payment-received': 1,
      'confirmed': 2,
      'document-analysis': 3,
      'translator-working': 3,
      'formatting': 3,
      'proof-checking': 3,
      'draft': 3,
      'soft': 3,
      'processing': 3,
      'courier': 4,
      'shipped': 4,
      'delivered': 5
    };
    
    const currentLevel = statusLevels[order.status.toLowerCase()] || 0;
    
    const steps = [
      {
        status: 'Order Placed',
        date: new Date(order.created_at).toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'short',
          year: 'numeric'
        }),
        completed: true,
        icon: ShoppingBag
      },
      {
        status: 'Confirmed',
        date: currentLevel >= 2
          ? new Date(order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : null,
        completed: currentLevel >= 2,
        icon: CheckCircle2
      },
      {
        status: 'Processing',
        date: currentLevel >= 3
          ? new Date(order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : null,
        completed: currentLevel >= 3,
        icon: Package
      },
      {
        status: 'Shipped',
        date: order.shipped_at 
          ? new Date(order.shipped_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : currentLevel >= 4
          ? new Date(order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : null,
        completed: currentLevel >= 4,
        icon: Truck
      },
      {
        status: 'Delivered',
        date: order.delivered_at 
          ? new Date(order.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : currentLevel >= 5
          ? new Date(order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : order.estimated_delivery
          ? `Est. ${new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
          : null,
        completed: currentLevel >= 5,
        icon: Check
      }
    ];

    // Handle cancelled orders
    if (order.status.toLowerCase() === 'cancelled') {
      console.log('🔴 [Tracking Steps] Order is cancelled');
      return [
        steps[0], // Order Placed
        {
          status: 'Cancelled',
          date: new Date(order.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          completed: true,
          icon: XCircle,
          isCancelled: true
        }
      ];
    }

    // Log which steps are completed
    steps.forEach((step, idx) => {
      console.log(`  Step ${idx + 1}: ${step.status} - ${step.completed ? '✅ Completed' : '⏳ Pending'}`);
    });

    return steps;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your orders.</p>
          <Link to="/signin" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ShoppingBag className="w-10 h-10 text-blue-600" />
            My Orders
          </h1>
          <p className="text-gray-600">
            Track your orders and download completed files
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
            <Link to="/">
              <Button>Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-mono font-semibold text-gray-900">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Placed</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold text-gray-900">{formatCurrencyAmount(order.total_amount, order.shipping_address?.country)}</p>
                    </div>
                    <div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 py-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {formatOrderLanguages(item.sourceLanguage, item.targetLanguage) && (
                          <p className="text-sm text-gray-600">
                            Languages: {formatOrderLanguages(item.sourceLanguage, item.targetLanguage)}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">Pages: {item.pageCount}</p>
                        <p className="text-sm text-gray-600">
                          Price: {formatCurrencyAmount(resolveItemRate(item), order.shipping_address?.country)} x {item.pageCount} = {formatCurrencyAmount(resolveItemAmount(item), order.shipping_address?.country)}
                        </p>
                        {order.status.toLowerCase() === 'delivered' && (
                          hasReviewed(order, item) ? (
                            <p className="text-sm text-green-700 flex items-center gap-1 mt-1">
                              <Check className="w-4 h-4" /> Review submitted
                            </p>
                          ) : (
                            <button
                              onClick={() => openReviewForm(order, item)}
                              className="mt-1 text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Star className="w-4 h-4" /> Write a Review
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracking Information */}
                {order.tracking_number && (
                  <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                    <div className="flex items-center gap-2 text-blue-900">
                      <Truck className="w-5 h-5" />
                      <div>
                        <p className="font-semibold">Tracking Number: {order.tracking_number}</p>
                        {/*
{order.shipping_carrier && (
   <p className="text-sm">
      Carrier: {order.shipping_carrier}
   </p>
)}
*/}
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Tracking Timeline */}
                <div className="px-6 py-4 border-t border-gray-200">
                  {/* Horizontal Progress Bar */}
                  <div className="flex items-center justify-between relative">
                    {getOrderTrackingSteps(order).map((step, index, array) => {
                      const Icon = step.icon;
                      const isCancelled = 'isCancelled' in step && step.isCancelled;
                      const isLast = index === array.length - 1;
                      
                      return (
                        <div key={index} className="flex items-center flex-1">
                          {/* Step Container */}
                          <div className="flex flex-col items-center relative z-10">
                            {/* Icon Circle */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              step.completed
                                ? isCancelled
                                  ? 'bg-red-500 border-red-500 text-white'
                                  : 'bg-green-500 border-green-500 text-white'
                                : 'bg-white border-gray-300 text-gray-400'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            
                            {/* Status Label */}
                            <div className="mt-2 text-center">
                              <p className={`text-xs font-semibold whitespace-nowrap ${
                                step.completed 
                                  ? isCancelled ? 'text-red-600' : 'text-gray-900'
                                  : 'text-gray-500'
                              }`}>
                                {step.status}
                              </p>
                              {step.date && (
                                <p className="text-xs text-gray-500 mt-0.5">{step.date}</p>
                              )}
                              {!step.completed && !isCancelled && (
                                <p className="text-xs text-gray-400 mt-0.5">Pending</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Connecting Line */}
                          {!isLast && (
                            <div className={`flex-1 h-0.5 mx-2 ${
                              step.completed && array[index + 1].completed
                                ? isCancelled
                                  ? 'bg-red-500'
                                  : 'bg-green-500'
                                : 'bg-gray-300'
                            }`}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Details
                  </Button>
                  
                  {order.completed_file_url && (
                    <Button
                      onClick={() => downloadCompletedFile(order.id)}
                      disabled={downloadingOrderId === order.id}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {downloadingOrderId === order.id ? 'Downloading...' : 'Download Completed File'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                    <p className="text-gray-600 mt-1">Order ID: {selectedOrder.order_number}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XCircle className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Order Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Order Status</p>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                      <Badge className={`${
                        selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedOrder.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      } px-3 py-1`}>
                        {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Order Status Timeline - Step-by-Step Flow */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Order Status</h3>
                  <div className="relative">
                    {/* Vertical connecting line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    {/* Status steps */}
                    <div className="space-y-4">
                      {(() => {
                        const allStatuses = [
                          { key: 'received', label: 'Received', icon: Package },
                          { key: 'payment-received', label: 'Payment Received', icon: CheckCircle2 },
                          { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
                          { key: 'document-analysis', label: 'Document Analysis', icon: FileText },
                          { key: 'translator-working', label: 'Translator Working', icon: Package },
                          { key: 'formatting', label: 'Formatting', icon: Package },
                          { key: 'proof-checking', label: 'Proof Checking', icon: Package },
                          { key: 'draft', label: 'Draft Ready', icon: FileText },
                          { key: 'soft', label: 'Soft Copy Ready', icon: FileText },
                          { key: 'courier', label: 'Courier', icon: Truck },
                          { key: 'shipped', label: 'Shipped', icon: Truck },
                          { key: 'delivered', label: 'Delivered', icon: Check }
                        ];

                        // Map legacy statuses to new ones
                        const statusKey = selectedOrder.status === 'pending' ? 'received' : 
                                         selectedOrder.status === 'processing' ? 'confirmed' : 
                                         selectedOrder.status;
                        
                        const currentStatusIndex = allStatuses.findIndex(s => s.key === statusKey);
                        const isCancelled = selectedOrder.status === 'cancelled';

                        if (isCancelled) {
                          return (
                            <>
                              <div className="relative flex gap-4 pl-0">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center z-10">
                                  <Package className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 pt-1">
                                  <p className="font-semibold text-gray-900">Received</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', { 
                                      day: 'numeric', 
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="relative flex gap-4 pl-0">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center z-10">
                                  <XCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 pt-1">
                                  <p className="font-semibold text-red-600">Cancelled</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(selectedOrder.updated_at).toLocaleDateString('en-IN', { 
                                      day: 'numeric', 
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </>
                          );
                        }

                        return allStatuses.map((statusItem, index) => {
                          const Icon = statusItem.icon;
                          const isCompleted = index <= currentStatusIndex;
                          const isCurrent = index === currentStatusIndex;
                          
                          return (
                            <div key={statusItem.key} className="relative flex gap-4 pl-0">
                              {/* Status icon */}
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                                isCompleted 
                                  ? 'bg-green-500 text-white shadow-md' 
                                  : 'bg-gray-200 text-gray-400'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-5 h-5" />
                                ) : (
                                  <Icon className="w-5 h-5" />
                                )}
                              </div>
                              
                              {/* Status details */}
                              <div className="flex-1 pt-1">
                                <p className={`font-semibold ${
                                  isCompleted ? 'text-gray-900' : 'text-gray-400'
                                }`}>
                                  {statusItem.label}
                                </p>
                                {isCompleted && (
                                  <p className="text-sm text-gray-500">
                                    {index === 0 
                                      ? new Date(selectedOrder.created_at).toLocaleDateString('en-IN', { 
                                          day: 'numeric', 
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })
                                      : new Date(selectedOrder.updated_at).toLocaleDateString('en-IN', { 
                                          day: 'numeric', 
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })
                                    }
                                  </p>
                                )}
                                {!isCompleted && (
                                  <p className="text-sm text-gray-400">Pending</p>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shipping_address && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-900">{selectedOrder.shipping_address.name}</p>
                      <p className="text-gray-700 mt-1">{selectedOrder.shipping_address.addressLine1}</p>
                      {selectedOrder.shipping_address.addressLine2 && (
                        <p className="text-gray-700">{selectedOrder.shipping_address.addressLine2}</p>
                      )}
                      <p className="text-gray-700">
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.pincode}
                      </p>
                      <p className="text-gray-700">{selectedOrder.shipping_address.country}</p>
                      <p className="text-gray-700 mt-2">
                        <span className="font-medium">Phone:</span> {selectedOrder.shipping_address.phone}
                      </p>
                    </div>
                  </div>
                )}
                
                {!selectedOrder.shipping_address && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        Shipping address not available for this order. This information is available for orders placed after the latest update.
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {formatOrderLanguages(item.sourceLanguage, item.targetLanguage) && (
                          <p className="text-sm text-gray-600">
                            Languages: {formatOrderLanguages(item.sourceLanguage, item.targetLanguage)}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Pages: {item.pageCount} x {formatCurrencyAmount(resolveItemRate(item), selectedOrder.shipping_address?.country)}
                        </p>
                      </div>
                        <p className="font-semibold text-gray-900">{formatCurrencyAmount(resolveItemAmount(item), selectedOrder.shipping_address?.country)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>{formatCurrencyAmount(selectedOrder.total_amount, selectedOrder.shipping_address?.country)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <Button onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Write a Review Modal */}
        {reviewingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Write a Review</h2>
                  <p className="text-gray-600 text-sm mt-1">{reviewingItem.item.name}</p>
                </div>
                <button
                  onClick={closeReviewForm}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form onSubmit={submitReview} className="p-6 space-y-4">
                {reviewError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {reviewError}
                  </div>
                )}
                {reviewSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                    {reviewSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-7 h-7 cursor-pointer transition-colors ${
                          star <= (reviewHoverRating || reviewRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="orderReviewText" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review * (minimum 10 characters)
                  </label>
                  <textarea
                    id="orderReviewText"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share your experience with this service..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={reviewSubmitting} className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeReviewForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrdersPage;

