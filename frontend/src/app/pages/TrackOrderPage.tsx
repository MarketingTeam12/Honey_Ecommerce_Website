import React, { useEffect, useState } from 'react';
import { Package, Mail, Phone, Search, MapPin, Clock, CheckCircle2, Truck, AlertCircle, XCircle, Download, FileText, UserCheck, Edit3, Check, Activity } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
  id: string;
  name: string;
  pageCount: number;
}

interface ShippingAddress {
  city?: string;
  state?: string;
  country?: string;
}

interface OrderDetails {
  id: string;
  order_number: string;
  tracking_number?: string;
  status: string;
  payment_status: string;
  shipping_carrier?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
  shipped_at?: string;
  delivered_at?: string;
  items: OrderItem[];
  shipping_address?: ShippingAddress;
  customer_name?: string;
  customer_email?: string;
  total_amount?: string;
  currency?: string;
  completed_files?: Array<{
    name?: string;
    type?: string;
    size?: number;
    hasFile?: boolean;
    data?: string;
  }>;
  completed_file_name?: string;
  completed_at?: string;
  completed_file?: {
    name?: string;
    type?: string;
    size?: number;
    hasFile?: boolean;
    data?: string;
  };
  tracking?: {
    stages?: Record<
      string,
      {
        completed?: boolean;
        timestamp?: string;
        details?: string;
      }
    >;
    activities?: Array<{
      id: string;
      stage: string;
      message: string;
      timestamp: string;
      type: 'status_update' | 'info' | 'alert';
    }>;
  };
}

// Order workflow stages with progress tracking
const ORDER_WORKFLOW_STAGES = [
  { id: 'pending', label: 'Order Placed', description: 'Your order has been received', icon: Package },
  { id: 'confirmed', label: 'Confirmed', description: 'Order confirmed and being prepared', icon: CheckCircle2 },
  { id: 'processing', label: 'In Progress', description: 'Your order is being processed', icon: Activity },
  { id: 'completed', label: 'Completed', description: 'Order completed successfully', icon: CheckCircle2 },
  { id: 'shipped', label: 'Shipped', description: 'Order is on the way', icon: Truck },
  { id: 'delivered', label: 'Delivered', description: 'Order has been delivered', icon: CheckCircle2 }
] as const;

export function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [errors, setErrors] = useState<{
    orderNumber?: string;
    emailOrPhone?: string;
    trackingNumber?: string;
  }>({});
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [downloadingFinalFile, setDownloadingFinalFile] = useState(false);
  const navigate = useNavigate();

  const getCompletedFiles = (details: OrderDetails | null) => {
    if (!details) return [];
    if (details.completed_files?.length) return details.completed_files;
    if (details.completed_file) return [details.completed_file];
    return [];
  };

  const getLocalOrderByIdentity = (incomingOrder: any) => {
    const storageKeys = ['user_orders', 'honey_translation_orders'];
    for (const key of storageKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const orders = JSON.parse(raw);
        if (!Array.isArray(orders)) continue;
        const matched = orders.find((order: any) =>
          (incomingOrder?.id && order.id === incomingOrder.id) ||
          (incomingOrder?.order_number &&
            String(order.order_number).toLowerCase() ===
              String(incomingOrder.order_number).toLowerCase())
        );
        if (matched) return matched;
      } catch {
        // ignore invalid local data
      }
    }
    return null;
  };

  useEffect(() => {
    if (!orderDetails?.id) return;

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(
          `${API_URL}/orders/${orderDetails.id}/tracking`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
              'apikey': publicAnonKey
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data?.order?.id === orderDetails.id) {
            const localMatch = getLocalOrderByIdentity(data.order);
            setOrderDetails(localMatch ? { ...data.order, ...localMatch } : data.order);
          }
        }
      } catch {
        // Ignore silent refresh errors
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [orderDetails?.id]);

  const handleTrackByOrder = async () => {
    // Clear previous state
    setNotFound(false);
    setOrderDetails(null);
    const newErrors: typeof errors = {};

    // Validate inputs
    if (!orderNumber.trim()) {
      newErrors.orderNumber = 'Order Number is required';
    }
    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email or Phone Number is required';
    }

    setErrors(newErrors);

    // If there are errors, don't proceed
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Call backend API with localStorage fallback
    setIsLoading(true);
    try {
      console.log('📦 [TrackOrder] Tracking by order number:', orderNumber);
      
      // Determine if input is email or phone
      const isEmail = emailOrPhone.includes('@');
      let foundOrder: OrderDetails | null = null;
      
      // PRIORITY 1: Try backend first
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
          `${API_URL}/orders/track`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderNumber: orderNumber.trim(),
              email: isEmail ? emailOrPhone.trim() : undefined,
              phone: !isEmail ? emailOrPhone.trim() : undefined
            }),
            signal: controller.signal
          }
        );

        clearTimeout(timeout);

        const data = await response.json();
        
        if (data.success && data.order) {
          console.log('✅ [TrackOrder] Order found in backend:', data.order);
          {
            const localMatch = getLocalOrderByIdentity(data.order);
            foundOrder = localMatch ? { ...data.order, ...localMatch } : data.order;
          }
        } else {
          console.log('[TrackOrder] Order not found in backend, trying localStorage...');
        }
      } catch (backendError: any) {
        if (backendError.name === 'AbortError') {
          console.log(' [TrackOrder] Backend timed out, trying localStorage...');
        } else {
          console.log(' [TrackOrder] Backend error, trying localStorage:', backendError);
        }
      }
      
      // FALLBACK: Search in localStorage if not found in backend
      if (!foundOrder) {
        console.log('🔍 [TrackOrder] Searching localStorage...');
        
        // Search in both user_orders and honey_translation_orders
        const storageKeys = ['user_orders', 'honey_translation_orders'];
        
        for (const key of storageKeys) {
          const localOrders = localStorage.getItem(key);
          if (localOrders) {
            try {
              const orders = JSON.parse(localOrders);
              console.log(`📦 [TrackOrder] Checking ${orders.length} orders in ${key}`);
              
              // Find matching order
              const matchedOrder = orders.find((order: any) => {
                const orderNumMatch = order.order_number?.toLowerCase() === orderNumber.trim().toLowerCase();
                const emailMatch = isEmail && (
                  order.customer_email?.toLowerCase() === emailOrPhone.trim().toLowerCase() ||
                  order.user_email?.toLowerCase() === emailOrPhone.trim().toLowerCase()
                );
                const phoneMatch = !isEmail && (
                  order.shipping_address?.phone === emailOrPhone.trim() ||
                  order.customer_phone === emailOrPhone.trim()
                );
                
                return orderNumMatch && (emailMatch || phoneMatch);
              });
              
              if (matchedOrder) {
                console.log(`✅ [TrackOrder] Order found in ${key}:`, matchedOrder);
                foundOrder = matchedOrder;
                break;
              }
            } catch (e) {
              console.log(`� [TrackOrder] Error parsing ${key}:`, e);
            }
          }
        }
      }
      
      if (foundOrder) {
        setOrderDetails(foundOrder);
        toast.success('Order found successfully!');
      } else {
        console.log('❌ [TrackOrder] Order not found in backend or localStorage');
        setNotFound(true);
        toast.error('Order not found. Please check your details.');
      }
    } catch (error) {
      console.error('❌ [TrackOrder] Error:', error);
      toast.error('Failed to track order. Please try again.');
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackByTracking = async () => {
    // Clear previous state
    setNotFound(false);
    setOrderDetails(null);
    const newErrors: typeof errors = {};

    // Validate input
    if (!trackingNumber.trim()) {
      newErrors.trackingNumber = 'Tracking Number is required';
    }

    setErrors(newErrors);

    // If there are errors, don't proceed
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Call backend API with localStorage fallback
    setIsLoading(true);
    try {
      console.log('📦 [TrackOrder] Tracking by tracking number:', trackingNumber);
      let foundOrder: OrderDetails | null = null;
      
      // PRIORITY 1: Try backend first
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
          `${API_URL}/orders/track`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trackingNumber: trackingNumber.trim()
            }),
            signal: controller.signal
          }
        );

        clearTimeout(timeout);

        const data = await response.json();
        
        if (data.success && data.order) {
          console.log(' [TrackOrder] Order found in backend:', data.order);
          {
            const localMatch = getLocalOrderByIdentity(data.order);
            foundOrder = localMatch ? { ...data.order, ...localMatch } : data.order;
          }
        } else {
          console.log(' [TrackOrder] Order not found in backend, trying localStorage...');
        }
      } catch (backendError: any) {
        if (backendError.name === 'AbortError') {
          console.log('[TrackOrder] Backend timed out, trying localStorage...');
        } else {
          console.log(' [TrackOrder] Backend error, trying localStorage:', backendError);
        }
      }
      
      // FALLBACK: Search in localStorage if not found in backend
      if (!foundOrder) {
        console.log('[TrackOrder] Searching localStorage...');
        
        // Search in both user_orders and honey_translation_orders
        const storageKeys = ['user_orders', 'honey_translation_orders'];
        
        for (const key of storageKeys) {
          const localOrders = localStorage.getItem(key);
          if (localOrders) {
            try {
              const orders = JSON.parse(localOrders);
              console.log(`📦 [TrackOrder] Checking ${orders.length} orders in ${key}`);
              
              // Find matching order by tracking number
              const matchedOrder = orders.find((order: any) => 
                order.tracking_number?.toLowerCase() === trackingNumber.trim().toLowerCase()
              );
              
              if (matchedOrder) {
                console.log(`[TrackOrder] Order found in ${key}:`, matchedOrder);
                foundOrder = matchedOrder;
                break;
              }
            } catch (e) {
              console.log(`� [TrackOrder] Error parsing ${key}:`, e);
            }
          }
        }
      }
      
      if (foundOrder) {
        setOrderDetails(foundOrder);
        toast.success('Order found successfully!');
      } else {
        console.log('❌ [TrackOrder] Order not found in backend or localStorage');
        setNotFound(true);
        toast.error('Order not found. Please check your tracking number.');
      }
    } catch (error) {
      console.error('❌ [TrackOrder] Error:', error);
      toast.error('Failed to track order. Please try again.');
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      'pending': { label: 'Pending', color: 'yellow', icon: Clock },
      'received': { label: 'Order Received', color: 'blue', icon: Package },
      'payment-received': { label: 'Payment Received', color: 'green', icon: CheckCircle2 },
      'confirmed': { label: 'Order Confirmed', color: 'green', icon: CheckCircle2 },
      'document-analysis': { label: 'Document Analysis', color: 'blue', icon: FileText },
      'translator-assigned': { label: 'Translator Assigned', color: 'blue', icon: UserCheck },
      'translator-working': { label: 'Translation in Progress', color: 'blue', icon: Edit3 },
      'formatting': { label: 'Document Formatting', color: 'blue', icon: Edit3 },
      'proof-checking': { label: 'Quality Check', color: 'blue', icon: Check },
      'draft': { label: 'Draft Ready', color: 'purple', icon: FileText },
      'soft': { label: 'Soft Copy Ready', color: 'green', icon: Mail },
      'courier': { label: 'Ready for Shipment', color: 'orange', icon: Package },
      'shipped': { label: 'Shipped', color: 'blue', icon: Truck },
      'delivered': { label: 'Delivered', color: 'green', icon: CheckCircle2 },
      'cancelled': { label: 'Cancelled', color: 'red', icon: XCircle },
      'processing': { label: 'Processing', color: 'blue', icon: Package }
    };

    return statusMap[status.toLowerCase()] || { label: status, color: 'gray', icon: Package };
  };

  const getStatusColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'yellow': 'bg-yellow-50 border-yellow-200 text-yellow-700',
      'blue': 'bg-blue-50 border-blue-200 text-blue-700',
      'green': 'bg-green-50 border-green-200 text-green-700',
      'purple': 'bg-purple-50 border-purple-200 text-purple-700',
      'orange': 'bg-orange-50 border-orange-200 text-orange-700',
      'red': 'bg-red-50 border-red-200 text-red-700',
      'gray': 'bg-gray-50 border-gray-200 text-gray-700'
    };

    return colorMap[color] || colorMap['gray'];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get work progress stages from the same tracking data used in admin
  const getWorkStages = (details: OrderDetails) => {
    const stages = [
      { id: 'received', label: 'Order Received', icon: Package, trackingKey: 'received' },
      { id: 'payment-received', label: 'Payment Received', icon: CheckCircle2, trackingKey: 'payment_received' },
      { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2, trackingKey: 'confirmed' },
      { id: 'document-analysis', label: 'Document Analysis', icon: FileText, trackingKey: 'document_analysis' },
      { id: 'translator-assigned', label: 'Translator Assigned', icon: UserCheck, trackingKey: 'translator_assigned' },
      { id: 'translator-working', label: 'Translation In Progress', icon: Edit3, trackingKey: 'translator_working' },
      { id: 'formatting', label: 'Formatting', icon: Edit3, trackingKey: 'formatting' },
      { id: 'proof-checking', label: 'Proof Checking', icon: Check, trackingKey: 'proof_checking' },
      { id: 'draft', label: 'Draft Ready', icon: FileText, trackingKey: 'draft_ready' },
      { id: 'soft', label: 'Soft Copy Sent', icon: Mail, trackingKey: 'soft_copy_ready' },
      { id: 'courier', label: 'Hard Copy Dispatched', icon: Package, trackingKey: 'courier' },
      { id: 'shipped', label: 'Shipped', icon: Truck, trackingKey: 'shipped' },
      { id: 'delivered', label: 'Delivered', icon: CheckCircle2, trackingKey: 'delivered' },
    ];

    const statusOrder = [
      'pending',
      'received',
      'payment-received',
      'confirmed',
      'document-analysis',
      'translator-assigned',
      'translator-working',
      'formatting',
      'proof-checking',
      'draft',
      'soft',
      'courier',
      'shipped',
      'delivered'
    ];

    const currentIndex = statusOrder.indexOf((details.status || 'pending').toLowerCase());

    return stages.map((stage) => {
      const trackingStage = details.tracking?.stages?.[stage.trackingKey];
      const stageIndex = statusOrder.indexOf(stage.id);
      let status: 'completed' | 'active' | 'pending' = 'pending';

      if (trackingStage?.completed) {
        status = 'completed';
      } else if (stageIndex === currentIndex && currentIndex > 0) {
        status = 'active';
      } else if (stageIndex < currentIndex) {
        status = 'completed';
      }

      const timestamp =
        trackingStage?.timestamp ||
        (stage.id === 'delivered' ? details.delivered_at : undefined) ||
        (stage.id === 'shipped' ? details.shipped_at : undefined) ||
        (stage.id === 'received' ? details.created_at : undefined);

      return { ...stage, status, timestamp };
    });
  };

  // Calculate payment progress
  const getPaymentProgress = (paymentStatus: string) => {
    const statusMap: Record<string, number> = {
      'pending': 0,
      'partial': 50,
      'paid': 100,
      'completed': 100,
    };
    return statusMap[(paymentStatus || '').toLowerCase()] || 0;
  };

  // Calculate overall progress
  const getOverallProgress = (currentStatus: string) => {
    const statusProgress: Record<string, number> = {
      'pending': 5,
      'received': 10,
      'document-analysis': 20,
      'translator-assigned': 30,
      'translator-working': 50,
      'formatting': 65,
      'proof-checking': 75,
      'draft': 85,
      'soft': 90,
      'courier': 95,
      'shipped': 95,
      'delivered': 100,
    };
    return statusProgress[(currentStatus || '').toLowerCase()] || 0;
  };

  const handleDownloadFinalCopy = async (file?: OrderDetails['completed_file']) => {
    if (!orderDetails?.id) return;

    if (file?.data) {
      const mimeType = file.type || 'application/octet-stream';
      const dataUrl = file.data.startsWith('data:')
        ? file.data
        : `data:${mimeType};base64,${file.data}`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = file.name || 'translated-document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
      return;
    }

    try {
      setDownloadingFinalFile(true);
      const response = await fetch(
        `${API_URL}/orders/${orderDetails.id}/download-completed-file`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Translated file is not available yet');
      }

      const data = await response.json();
      const link = document.createElement('a');
      link.href = data.dataUrl || data.downloadUrl;
      link.download = data.fileName || orderDetails.completed_file_name || 'translated-document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error: any) {
      const localData = orderDetails.completed_file?.data;
      if (localData) {
        const mimeType = orderDetails.completed_file?.type || 'application/octet-stream';
        const dataUrl = localData.startsWith('data:')
          ? localData
          : `data:${mimeType};base64,${localData}`;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download =
          orderDetails.completed_file_name ||
          orderDetails.completed_file?.name ||
          'translated-document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
      } else {
        toast.error(error.message || 'Unable to download translated file');
      }
    } finally {
      setDownloadingFinalFile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900 text-center">Track Your Order</h1>
          <p className="text-gray-600 text-center mt-2">
            Enter your order details or tracking number to view order status
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Demo Order Note */}
        <div className="max-w-2xl mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Demo Mode</h3>
              <p className="text-sm text-blue-800 mb-3">
                To test order tracking, you need to create an order first. Follow these steps:
              </p>
              <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                <li>Add products to your cart from the homepage</li>
                <li>Complete the checkout process</li>
                <li>After successful payment, you'll receive an order number</li>
                <li>Use that order number to track your order here</li>
              </ol>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Go to Homepage
                </button>
                <button
                  onClick={() => navigate('/translation-products')}
                  className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Browse Products
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Order Number and Email/Phone Section */}
            <div className="space-y-6">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Number
                </label>
                <input
                  id="orderNumber"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    setErrors({ ...errors, orderNumber: undefined });
                    setNotFound(false);
                  }}
                  placeholder="e.g., HT-M8ZK3KQ-7B2"
                  className={`w-full px-4 py-3 border ${
                    errors.orderNumber ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.orderNumber && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.orderNumber}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="emailOrPhone"
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => {
                      setEmailOrPhone(e.target.value);
                      setErrors({ ...errors, emailOrPhone: undefined });
                      setNotFound(false);
                    }}
                    placeholder="Enter email or phone number"
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.emailOrPhone ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                {errors.emailOrPhone && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.emailOrPhone}
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleTrackByOrder}
                  disabled={isLoading}
                  className="w-full max-w-xs bg-[#0a1247] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#1a2457] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      TRACK ORDER
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
              </div>
            </div>

            {/* Tracking Number Section */}
            <div className="space-y-6">
              <div>
                <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number
                </label>
                <input
                  id="trackingNumber"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => {
                    setTrackingNumber(e.target.value);
                    setErrors({ ...errors, trackingNumber: undefined });
                    setNotFound(false);
                  }}
                  placeholder="e.g., TRK-1738779449582-XYZ789"
                  className={`w-full px-4 py-3 border ${
                    errors.trackingNumber ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                {errors.trackingNumber && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.trackingNumber}
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleTrackByTracking}
                  disabled={isLoading}
                  className="w-full max-w-xs bg-[#0a1247] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#1a2457] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      TRACK SHIPMENT
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Not Found Message */}
        {notFound && !orderDetails && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Order Not Found</h3>
                  <p className="text-sm text-red-700">
                    We couldn't find an order matching the information you provided. Please check:
                  </p>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                    <li>Order number is correct and complete</li>
                    <li>Email or phone number matches the one used during order placement</li>
                    <li>Tracking number is entered correctly</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Order Details */}
        {orderDetails && (
          <div className="mt-12 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-900">Order Status</h3>
              <button
                onClick={() => navigate(`/live-order-tracking/${orderDetails.id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#3B82F6] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Activity className="w-5 h-5" />
                View Live Tracking
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Order Info & Progress */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Package className="w-5 h-5 text-[#0a1247]" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Order Number</span>
                    </div>
                    <p className="font-semibold text-gray-900 ml-11">{orderDetails.order_number}</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Estimated Delivery</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm ml-11">
                      {orderDetails.estimated_delivery ? formatDate(orderDetails.estimated_delivery).split(',')[0] : 'TBD'}
                    </p>
                  </div>
                </div>

                {/* Overall Progress */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">Overall Work Progress</h4>
                    <span className="text-2xl font-bold text-[#0a1247]">{getOverallProgress(orderDetails.status)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#0a1247] to-blue-600 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${getOverallProgress(orderDetails.status)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {getOverallProgress(orderDetails.status) === 100 ? 'Order completed!' : 'Work in progress...'}
                  </p>
                </div>

                {/* Payment Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h4>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {getPaymentProgress(orderDetails.payment_status) === 100 ? 'Fully Paid' : 
                       getPaymentProgress(orderDetails.payment_status) === 50 ? 'Partially Paid' : 'Payment Pending'}
                    </span>
                    <span className="text-xl font-bold text-green-600">{getPaymentProgress(orderDetails.payment_status)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${getPaymentProgress(orderDetails.payment_status)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Order Items */}
                {orderDetails.items && orderDetails.items.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                    <div className="space-y-3">
                      {orderDetails.items.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-b-0">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-[#0a1247]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.pageCount > 0 && (
                              <p className="text-sm text-gray-600">{item.pageCount} pages</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final translated files from admin upload */}
                {getCompletedFiles(orderDetails).length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-900 mb-3">Translated Document Ready</p>
                    <div className="space-y-2">
                      {getCompletedFiles(orderDetails).map((file, index) => (
                        <div key={`${file.name || 'translated-document'}-${index}`} className="rounded-lg border border-green-200 bg-white px-3 py-3">
                          <p className="text-xs text-green-700 mb-2">{file.name || `Translated Document ${index + 1}`}</p>
                          <button
                            onClick={() => handleDownloadFinalCopy(file)}
                            disabled={downloadingFinalFile}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                          >
                            {downloadingFinalFile ? 'Preparing Download...' : `Download ${getCompletedFiles(orderDetails).length > 1 ? `File ${index + 1}` : 'Translated Document'}`}
                          </button>
                        </div>
                      ))}
                    </div>
                    {orderDetails.completed_at && (
                      <p className="text-xs text-green-700 mt-2">
                        Uploaded on {formatDate(orderDetails.completed_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Vertical Progress Tracker */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Order Status</h4>
                  <div className="text-xs text-gray-500 mb-1">Order Placed: {formatDate(orderDetails.created_at)}</div>
                  <div className="text-xs text-gray-500 mb-6">Last Updated: {formatDate(orderDetails.updated_at)}</div>
                  
                  {/* Vertical Progress Stages */}
                  <div className="space-y-1">
                    {getWorkStages(orderDetails).map((stage, index) => {
                      const Icon = stage.icon;
                      const isCompleted = stage.status === 'completed';
                      const isActive = stage.status === 'active';
                      const isPending = stage.status === 'pending';

                      return (
                        <div key={stage.id} className="relative">
                          <div className="flex items-start gap-3">
                            {/* Icon Container */}
                            <div className="flex flex-col items-center">
                              <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                  isCompleted ? 'bg-green-100 border-2 border-green-500 scale-100' :
                                  isActive ? 'bg-blue-100 border-2 border-[#0a1247] scale-110 shadow-md' :
                                  'bg-gray-100 border-2 border-gray-300'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                                ) : (
                                  <Icon className={`w-5 h-5 ${
                                    isActive ? 'text-[#0a1247]' : 'text-gray-400'
                                  }`} />
                                )}
                              </div>
                              {/* Connector Line */}
                              {index < getWorkStages(orderDetails).length - 1 && (
                                <div 
                                  className={`w-0.5 h-8 transition-all duration-300 ${
                                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                  }`}
                                ></div>
                              )}
                            </div>

                            {/* Stage Info */}
                            <div className="flex-1 pb-2">
                              <p className={`font-semibold text-sm transition-colors ${
                                isCompleted ? 'text-green-700' :
                                isActive ? 'text-[#0a1247]' :
                                'text-gray-500'
                              }`}>
                                {stage.label}
                              </p>
                              {stage.timestamp && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(stage.timestamp)}
                                </p>
                              )}
                              {isActive && (
                                <p className="text-xs text-blue-600 mt-1 animate-pulse">In Progress</p>
                              )}
                              {isCompleted && (
                                <p className="text-xs text-green-600 mt-1">✓ Completed</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {orderDetails.tracking?.activities?.length ? (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-900 mb-3">Recent Updates</h5>
                      <div className="space-y-3">
                        {[...orderDetails.tracking.activities]
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .slice(0, 6)
                          .map((activity) => (
                            <div key={activity.id} className="rounded-lg bg-gray-50 px-3 py-2">
                              <p className="text-xs font-medium text-gray-800">{activity.message}</p>
                              <p className="text-[11px] text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {orderDetails.tracking?.activities &&
              orderDetails.tracking.activities.length > 0 && (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Latest Admin Updates</h4>
                  <div className="space-y-3">
                    {orderDetails.tracking.activities
                      .slice()
                      .reverse()
                      .slice(0, 8)
                      .map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="w-2 h-2 bg-[#0a1247] rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackOrderPage;

