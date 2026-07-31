import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, CreditCard, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { useAuthGate } from '@/app/context/AuthGateContext';
import { useCurrency } from '@/app/context/CurrencyContext';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { toast } from 'sonner';

export function PaymentSummaryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const { currency } = useCurrency();
  const { getCartTotal, cart, appliedCoupon, getDiscountAmount } = useCart();
  
  const [processing, setProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const formatCurrencyAmount = (amount: unknown) => {
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
    return numericAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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

  // Get order details from location state
  useEffect(() => {
    const state = location.state as any;
    if (!state?.orderId) {
      toast.error('No order found. Please complete checkout first.');
      navigate('/cart');
      return;
    }
    
    // Fetch order details
    fetchOrderDetails(state.orderId);
  }, [location.state]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/orders/${orderId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data.order);
      } else {
        throw new Error('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
      navigate('/cart');
    }
  };

  const handlePayNow = async () => {
    if (!orderDetails) return;
    if (!requireAuth('Please sign in to place your order.')) return;

    setProcessing(true);

    try {
      // Create Razorpayment link
      const response = await fetch(
        `${API_URL}/payment/zoho/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderDetails.id,
            orderNumber: orderDetails.order_number,
            trackingNumber: orderDetails.tracking_number,
            amount: parseFloat(orderDetails.total_amount),
            currency: orderDetails.currency || 'INR',
            userId: user?.id || 'guest',
            userEmail: orderDetails.customer_email || user?.email || 'customer@example.com',
            userName: orderDetails.customer_name || user?.user_metadata?.name || 'Customer',
            items: orderDetails.items || [],
            subtotal: parseFloat(orderDetails.subtotal || orderDetails.total_amount),
            discount: parseFloat(orderDetails.discount || '0'),
            tax: parseFloat(orderDetails.tax || '0'),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create payment link');
      }

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Redirect to Razorpay\'s hosted checkout page
        console.log('🔗 Redirecting to Razorpayment URL:', data.paymentUrl);
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || 'Failed to create payment link');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  const totalAmount = parseFloat(orderDetails.total_amount);
  const currencySymbol = orderDetails.currency === 'INR' ? '?' : '$';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Summary</h1>
          <p className="text-gray-600">Review your order details before proceeding to payment</p>
        </div>

        {/* Main Payment Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          {/* Order Details Section */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Information</h2>
            
            <div className="space-y-4">
              {/* Order ID */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Order ID</span>
                <span className="text-sm font-semibold text-gray-900">{orderDetails.order_number}</span>
              </div>

              {/* Customer Email */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Customer Email</span>
                <span className="text-sm font-semibold text-gray-900">
                  {orderDetails.customer_email || user?.email || 'N/A'}
                </span>
              </div>

              {/* Services */}
              <div className="py-3">
                <span className="text-sm font-medium text-gray-600 block mb-3">Services</span>
                <div className="space-y-2">
                  {orderDetails.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-start bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        {formatOrderLanguages(item.sourceLanguage, item.targetLanguage) && (
                          <p className="text-xs text-gray-600 mt-1">
                            {formatOrderLanguages(item.sourceLanguage, item.targetLanguage)}
                            {item.pageCount ? `, ${item.pageCount} page(s)` : ''}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 ml-4">
                        {currencySymbol}{formatCurrencyAmount(resolveItemAmount(item))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal, Discount, Tax (if applicable) */}
              {orderDetails.subtotal && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm text-gray-900">
                    {currencySymbol}{parseFloat(orderDetails.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {orderDetails.discount && parseFloat(orderDetails.discount) > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-green-600">Discount</span>
                  <span className="text-sm text-green-600">
                    -{currencySymbol}{parseFloat(orderDetails.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {orderDetails.tax && parseFloat(orderDetails.tax) > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="text-sm text-gray-900">
                    {currencySymbol}{parseFloat(orderDetails.tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Total Amount Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Payable Amount</p>
                <p className="text-white text-4xl font-bold">
                  {currencySymbol}{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-600">
          <ShieldCheck className="w-5 h-5 text-green-600" />
          <span>Secured by Razorpay</span>
        </div>

        {/* Pay Now Button */}
        <button
          onClick={handlePayNow}
          disabled={processing}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 group"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Redirecting to Payment Gateway...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>Pay Now Securely</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {/* Information Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            You will be redirected to Razorpay secure checkout page to complete your payment.
            <br />
            No card details are stored on our servers.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <ShieldCheck className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">Secure Payment</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <Lock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">256-bit SSL</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <CreditCard className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700">PCI Compliant</p>
          </div>
        </div>

        {/* Back to Cart Link */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/cart')}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Back to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSummaryPage;
