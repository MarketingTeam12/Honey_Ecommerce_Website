import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Download, MessageCircle, Package, ShoppingBag, FileText, Loader2, Receipt, Calendar, CreditCard, Mail, User } from 'lucide-react';
import { API_URL, API_BASE_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/app/utils/generateInvoicePDF';

// Was reading VITE_BACKEND_URL (never set) with a localhost:3000 fallback —
// broke invoice generation on any deployment other than local dev.
const LOCAL_BACKEND_BASE = API_BASE_URL;

interface Order {
  id: string;
  order_number: string;
  tracking_number?: string;
  total_amount: string;
  currency: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  transaction_id?: string;
  customer_email?: string;
  customer_name?: string;
  created_at: string;
  items: any[];
  zoho_invoice_id?: string;
  zoho_invoice_number?: string;
  invoicePath?: string;
  invoice_path?: string;
  subtotal?: string;
  discount?: string;
  tax?: string;
  updated_at?: string;
  user_id?: string;
}

export function OrderSuccessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const trackingNumber = searchParams.get('trackingNumber');
  const hostedpageId = searchParams.get('hostedpage_id');
  const paymentId = searchParams.get('payment_id');
  const gateway = searchParams.get('gateway');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoicePath, setInvoicePath] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      // If redirected from Razorpay, verify the payment
      if (hostedpageId || searchParams.get('gateway') === 'zoho') {
        verifyZohoPayment();
      }
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const verifyZohoPayment = async () => {
    try {
      console.log('🔍 Verifying Razorpayment...');
      const response = await fetch(
        `${API_URL}/payment/zoho/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostedpage_id: hostedpageId,
            payment_id: paymentId,
            orderId
          })
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Razorpayment verified:', data);
        if (data.verified) {
          // Refresh order details to get updated payment status
          fetchOrderDetails();
        }
      }
    } catch (error) {
      console.error('Razorpayment verification error:', error);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        const storedInvoicePath = orderId ? localStorage.getItem(`invoicePath_${orderId}`) : null;
        setInvoicePath(data.order?.invoicePath || data.order?.invoice_path || storedInvoicePath || null);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeInvoiceUrl = (rawPath: string) => {
    if (/^https?:\/\//i.test(rawPath)) {
      return rawPath;
    }
    const trimmed = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    return `${API_URL}${trimmed}`;
  };

  const downloadFromUrl = async (rawPath: string) => {
    const response = await fetch(normalizeInvoiceUrl(rawPath));
    if (!response.ok) {
      throw new Error('Invoice file download failed');
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `invoice-${order?.order_number || 'receipt'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  };

  const generateTemplateInvoice = async () => {
    if (!order) return null;

    const response = await fetch(`${LOCAL_BACKEND_BASE}/api/generate-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order }),
    });

    if (!response.ok) {
      throw new Error('Template invoice generation failed');
    }

    const data = await response.json();
    if (!data?.invoicePath) {
      throw new Error('Template invoice path not returned');
    }

    if (orderId) {
      localStorage.setItem(`invoicePath_${orderId}`, data.invoicePath);
    }
    setInvoicePath(data.invoicePath);
    return data.invoicePath as string;
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);

    try {
      if (!order) {
        throw new Error('Invoice not available');
      }
      // Prefer backend HTML template for exact matching output.
      try {
        const activeInvoicePath = await generateTemplateInvoice();
        if (!activeInvoicePath) throw new Error('Invoice path not available');
        await downloadFromUrl(activeInvoicePath);
      } catch (templateError) {
        console.warn('Template invoice generation failed, falling back to client PDF:', templateError);
        await generateInvoicePDF({
          ...order,
          user_id: order.user_id || 'guest',
          subtotal: String(order.subtotal ?? order.total_amount ?? '0'),
          discount: String(order.discount ?? '0'),
          tax: String(order.tax ?? '0'),
          updated_at: order.updated_at || order.created_at,
        } as Parameters<typeof generateInvoicePDF>[0]);
      }

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to generate invoice. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const displayOrderId = order?.order_number || orderNumber || orderId || `HT${Date.now().toString().slice(-8)}`;
  const displayTrackingId = order?.tracking_number || trackingNumber;
  const orderDate = order?.created_at 
    ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const orderTime = order?.created_at 
    ? new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const orderTotal = order?.total_amount 
    ? parseFloat(order.total_amount)
    : 0;
  const currencySymbol = order?.currency && order.currency.toUpperCase() === 'USD' ? '$' : '₹';
  const paymentMethodLabel =
    gateway === 'razorpay' || order?.payment_method === 'razorpay'
      ? 'Razorpay'
      : gateway === 'zoho' || order?.payment_method === 'zoho_payments'
        ? 'Razorpay'
        : order?.payment_method || 'Online Payment';

  const formatCurrencyAmount = (amount: unknown) => {
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
    return `${currencySymbol}${numericAmount.toLocaleString('en-IN', {
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

  const resolveItemRate = (item: any) => {
    const directRate = parseFloat(String(item.basePrice ?? item.price ?? item.rate ?? 0));
    if (directRate > 0) return directRate;

    const quantity = parseInt(String(item.pageCount ?? item.quantity ?? 1), 10) || 1;
    const directAmount = parseFloat(String(item.totalPrice ?? item.amount ?? item.total ?? 0));
    if (directAmount > 0 && quantity > 0) {
      return directAmount / quantity;
    }

    return 0;
  };

  const resolveItemAmount = (item: any) => {
    const directAmount = parseFloat(String(item.totalPrice ?? item.amount ?? item.total ?? 0));
    if (directAmount > 0) return directAmount;

    const quantity = parseInt(String(item.pageCount ?? item.quantity ?? 1), 10) || 1;
    return resolveItemRate(item) * quantity;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6 text-center">
          {/* Animated Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
          <p className="text-lg text-gray-600 mb-2">
            Thank you for your order. Your payment has been confirmed.
          </p>
          <p className="text-sm text-gray-500">
            A confirmation email has been sent to <span className="font-semibold">{order?.customer_email || user?.email}</span>
          </p>
        </div>

        {/* Transaction Details */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Transaction Details
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading transaction details...</p>
            </div>
          ) : (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Order Number */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Order Number</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 font-mono">{displayOrderId}</p>
                </div>

                {/* Tracking Number */}
                {displayTrackingId && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Tracking ID</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900 font-mono">{displayTrackingId}</p>
                  </div>
                )}

                {/* Date & Time */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Date & Time</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{orderDate}</p>
                  <p className="text-sm text-gray-600">{orderTime}</p>
                </div>

                {/* Payment Method */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Payment Method</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{paymentMethodLabel}</p>
                  <p className="text-sm text-green-600">Verified</p>
                </div>

                {/* Transaction ID */}
                {(order?.transaction_id || paymentId || hostedpageId) && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-600">Transaction ID</span>
                    </div>
                    <p className="text-sm font-mono text-gray-900 break-all">
                      {order?.transaction_id || paymentId || hostedpageId}
                    </p>
                  </div>
                )}

                {/* Customer Details */}
                {(order?.customer_name || order?.customer_email) && (
                  <>
                    {order?.customer_name && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm font-medium text-gray-600">Customer Name</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{order.customer_name}</p>
                      </div>
                    )}

                    {order?.customer_email && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="w-5 h-5 text-pink-600" />
                          <span className="text-sm font-medium text-gray-600">Email Address</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 break-all">{order.customer_email}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Order Items */}
              {order?.items && order.items.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {formatOrderLanguages(item.sourceLanguage, item.targetLanguage) && (
                            <p className="text-sm text-gray-600 mt-1">
                              {formatOrderLanguages(item.sourceLanguage, item.targetLanguage)}
                              {item.pageCount && `, ${item.pageCount} page(s)`}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900 ml-4">
                          {formatCurrencyAmount(resolveItemAmount(item))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Amount */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border-2 border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Amount Paid</span>
                  <span className="text-3xl font-bold text-green-600">
                    {currencySymbol}{orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Download Invoice */}
          <button
            onClick={handleDownloadInvoice}
            disabled={downloadingInvoice}
            className="bg-white hover:bg-gray-50 border-2 border-blue-600 text-blue-600 font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingInvoice ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download Invoice</span>
              </>
            )}
          </button>

          {/* Track Order */}
          {displayTrackingId && (
            <button
              onClick={() => navigate(`/live-order-tracking/${order?.id || orderId}`)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
            >
              <Package className="w-5 h-5" />
              <span>Track Order</span>
            </button>
          )}

          {/* Continue Shopping */}
          <Link
            to="/"
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Support Info */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
          </div>
          <p className="text-gray-600 mb-4">
            If you have any questions about your order, please contact our support team.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
