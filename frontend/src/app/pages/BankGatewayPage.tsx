import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, Building, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { incrementCouponUsage } from '@/app/services/couponService';

const bankColors = {
  'State Bank of India (SBI)': 'from-blue-700 to-blue-800',
  'HDFC Bank': 'from-red-600 to-red-700',
  'ICICI Bank': 'from-orange-600 to-orange-700',
  'Axis Bank': 'from-purple-700 to-purple-800',
  'Kotak Mahindra Bank': 'from-red-500 to-red-600',
  'Punjab National Bank': 'from-blue-600 to-blue-700'
};

const bankLogos = {
  'State Bank of India (SBI)': '',
  'HDFC Bank': '',
  'ICICI Bank': '',
  'Axis Bank': '',
  'Kotak Mahindra Bank': '',
  'Punjab National Bank': ''
};

export function BankGatewayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { user, accessToken } = useAuth();
  
  const bankName = searchParams.get('bank') || 'Bank';
  const amount = searchParams.get('amount') || '0';
  const orderId = searchParams.get('orderId') || '';
  const orderNumber = searchParams.get('orderNumber') || '';
  const trackingNumber = searchParams.get('trackingNumber') || '';
  
  const [step, setStep] = useState<'login' | 'authorize' | 'processing' | 'success' | 'failed'>('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [processing, setProcessing] = useState(false);

  const bankColor = bankColors[bankName as keyof typeof bankColors] || 'from-blue-700 to-blue-800';
  const bankLogo = bankLogos[bankName as keyof typeof bankLogos] || '';

  // Auto-redirect after success/failure
  useEffect(() => {
    if (step === 'success') {
      // Save the order when payment is successful
      try {
        const pendingOrder = localStorage.getItem('pending_order');
        if (pendingOrder) {
          const order = JSON.parse(pendingOrder);
          
          // Update order with successful payment status
          order.payment_status = 'paid';
          order.status = 'pending';
          order.updated_at = new Date().toISOString();
          
          // CRITICAL: Save order to backend for cross-device sync with RETRY LOGIC
          (async () => {
            let backendSaveSuccess = false;
            const maxRetries = 3;
            
            // Always send to backend (both demo and real users) so admin can see all orders
            console.log('📡 [BankGateway] Sending order to backend for cross-device sync...');
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                console.log(`📡 [BankGateway] Attempt ${attempt}/${maxRetries} - Sending order to backend...`);
                
                // Omit Authorization header for demo mode compatibility
                const orderResponse = await fetch(`${API_URL}/payment/create-order`, {
                  method: 'POST',
                  headers: buildHeaders(accessToken),
                  body: JSON.stringify({
                    userId: order.user_id,
                    userEmail: order.customer_email,
                    userName: order.customer_name,
                    orderId: order.id,
                    orderNumber: order.order_number,
                    trackingNumber: order.tracking_number,
                    amount: parseFloat(order.total_amount),
                    currency: order.currency,
                    paymentMethod: order.payment_method,
                    items: order.items,
                    subtotal: parseFloat(order.subtotal),
                    discount: parseFloat(order.discount),
                    tax: parseFloat(order.tax),
                    shippingAddress: order.shipping_address,
                    notes: order.notes || '',
                    tip: order.tip || 0,
                    shippingMethod: order.shipping_method || 'email'
                  })
                });

                if (orderResponse.ok) {
                  console.log('✅ [BankGateway] Order saved to backend successfully!');
                  backendSaveSuccess = true;
                  break;
                } else {
                  console.error(`❌ [BankGateway] Backend save failed (Attempt ${attempt}/${maxRetries}):`, orderResponse.status);
                  if (attempt < maxRetries) {
                    console.log(`⏳ [BankGateway] Retrying in ${attempt} second(s)...`);
                    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                  }
                }
              } catch (backendError) {
                console.error(`❌ [BankGateway] Exception on attempt ${attempt}/${maxRetries}:`, backendError);
                
                // Log detailed error information
                if (backendError instanceof TypeError && backendError.message === 'Failed to fetch') {
                  console.error('🔴 [BankGateway] Network error - backend may not be deployed or CORS issue');
                  console.error('🔴 [BankGateway] This is expected in development/preview mode');
                  console.error('🔴 [BankGateway] Order is saved locally and will work for demo purposes');
                }
                
                if (attempt < maxRetries) {
                  console.log(`⏳ [BankGateway] Retrying in ${attempt} second(s)...`);
                  await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                }
              }
            }
            
            if (!backendSaveSuccess) {
              console.error('� [BankGateway] Order failed to save to backend after all retries!');
              console.warn('� Order may not sync across devices.');
            } else {
              console.log('🎉 [BankGateway] Order successfully saved to backend for cross-device sync!');
            }
          })();
          
          // Save to user_orders (localStorage fallback)
          const existingOrders = localStorage.getItem('user_orders');
          let orders = existingOrders ? JSON.parse(existingOrders) : [];
          orders.push(order);
          localStorage.setItem('user_orders', JSON.stringify(orders));
          
          // Save to admin orders (localStorage fallback)
          const existingAdminOrders = localStorage.getItem('honey_translation_orders');
          let adminOrders = existingAdminOrders ? JSON.parse(existingAdminOrders) : [];
          adminOrders.push(order);
          localStorage.setItem('honey_translation_orders', JSON.stringify(adminOrders));
          
          // Create admin notification
          const notification = {
            id: 'notif-' + Date.now(),
            type: 'new_order',
            title: 'New Order Received',
            message: `Order ${order.order_number} from ${order.customer_name || order.customer_email}`,
            orderId: order.id,
            orderNumber: order.order_number,
            amount: order.total_amount,
            currency: order.currency,
            read: false,
            created_at: new Date().toISOString()
          };
          
          const existingNotifications = localStorage.getItem('admin_notifications');
          let notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
          notifications.unshift(notification);
          localStorage.setItem('admin_notifications', JSON.stringify(notifications));
          
          // Trigger event
          window.dispatchEvent(new CustomEvent('newOrderNotification', { detail: notification }));
          
          // Increment coupon usage if a coupon was applied
          if (order.coupon_code) {
            console.log('🎫 [BankGateway] Incrementing coupon usage for:', order.coupon_code);
            incrementCouponUsage(order.coupon_code);
          }
          
          // Clear pending order and cart
          localStorage.removeItem('pending_order');
          clearCart();
          
          console.log('✅ [BankGateway] Order completed successfully:', order.order_number);
        }
      } catch (e) {
        console.error('❌ [BankGateway] Failed to save order:', e);
      }
      
      const timer = setTimeout(() => {
        navigate(`/order-success?orderId=${orderId}&orderNumber=${orderNumber}&trackingNumber=${trackingNumber}&paymentStatus=success`);
      }, 3000);
      return () => clearTimeout(timer);
    } else if (step === 'failed') {
      // Update pending order with failed status
      try {
        const pendingOrder = localStorage.getItem('pending_order');
        if (pendingOrder) {
          const order = JSON.parse(pendingOrder);
          order.payment_status = 'failed';
          order.status = 'cancelled';
          localStorage.setItem('pending_order', JSON.stringify(order));
        }
      } catch (e) {
        console.error('❌ [BankGateway] Failed to update order status:', e);
      }
      
      const timer = setTimeout(() => {
        navigate(`/checkout/payment?paymentStatus=failed&orderId=${orderId}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate, orderId, orderNumber, trackingNumber, clearCart, accessToken]);

  const handleLogin = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!userId.trim()) {
      newErrors.userId = 'User ID is required';
    } else if (userId.length < 4) {
      newErrors.userId = 'User ID must be at least 4 characters';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setProcessing(true);
      // Simulate login verification
      setTimeout(() => {
        setProcessing(false);
        setStep('authorize');
      }, 1500);
    }
  };

  const handleAuthorize = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be exactly 6 digits';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setStep('processing');
      setProcessing(true);
      
      // Simulate payment processing (90% success rate)
      setTimeout(() => {
        const isSuccess = Math.random() > 0.1; // 90% success rate
        
        if (isSuccess) {
          setStep('success');
        } else {
          setStep('failed');
        }
        setProcessing(false);
      }, 2500);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this payment?')) {
      navigate(`/checkout/payment?paymentStatus=cancelled&orderId=${orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Bank Gateway Header */}
        <div className={`bg-gradient-to-r ${bankColor} rounded-t-2xl shadow-lg p-6 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl">
                {bankLogo}
              </div>
              <div>
                <h1 className="text-xl font-bold">{bankName}</h1>
                <p className="text-sm text-white/90">Secure Net Banking</p>
              </div>
            </div>
            <Lock className="w-6 h-6 text-white/90" />
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/90">Amount to Pay</span>
              <span className="text-2xl font-bold">₹{amount}</span>
            </div>
            <div className="mt-2 text-xs text-white/80">
              Order: {orderNumber}
            </div>
          </div>
        </div>

        {/* Login Step */}
        {step === 'login' && (
          <div className="bg-white rounded-b-2xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Login to {bankName}</h2>
              <p className="text-sm text-gray-600">Enter your net banking credentials</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID / Customer ID *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter your User ID"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      if (errors.userId) setErrors(prev => ({ ...prev, userId: '' }));
                    }}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
                {errors.userId && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.userId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>For demo:</strong> Enter any User ID and Password (minimum 4 characters)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogin}
                  disabled={processing}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r ${bankColor} text-white rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-50`}
                >
                  {processing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verifying...
                    </div>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Authorize Payment Step */}
        {step === 'authorize' && (
          <div className="bg-white rounded-b-2xl shadow-lg p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Login Successful</h2>
              </div>
              <p className="text-sm text-gray-600">Authorize the payment to complete your transaction</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Merchant</span>
                  <span className="font-medium">Honey Translation Services</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-medium">{orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">Net Banking</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-900 font-semibold">Amount to Pay</span>
                  <span className="font-bold text-blue-600">₹{amount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP *
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setOtp(value);
                    if (errors.otp) setErrors(prev => ({ ...prev, otp: '' }));
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-center text-2xl tracking-widest"
                />
                {errors.otp && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.otp}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center">
                  OTP sent to your registered mobile number
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>For demo:</strong> Enter any 6-digit OTP (e.g., 123456)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAuthorize}
                  disabled={processing}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400"
                >
                  Pay ₹{amount}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="bg-white rounded-b-2xl shadow-lg p-6">
            <div className="text-center py-8">
              <div className={`w-16 h-16 bg-gradient-to-r ${bankColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
              <p className="text-gray-600">Please wait while we process your transaction...</p>
              <p className="text-sm text-gray-500 mt-4">Do not close or refresh this page</p>
              
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Debiting ₹{amount} from {bankName}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="bg-white rounded-b-2xl shadow-lg p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">Your transaction has been completed successfully</p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-medium">{orderId.slice(-10)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number</span>
                    <span className="font-medium">{orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid via</span>
                    <span className="font-medium">{bankName}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-300">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-bold text-green-600">₹{amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-green-600">Paid</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500">Redirecting to order confirmation...</p>
            </div>
          </div>
        )}

        {/* Failed Step */}
        {step === 'failed' && (
          <div className="bg-white rounded-b-2xl shadow-lg p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-4">Your transaction could not be completed</p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Reason:</strong> Transaction declined. Please check your account balance or try again.
                </p>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">Redirecting back to payment page...</p>
              
              <button
                onClick={() => navigate(`/checkout/payment?paymentStatus=failed&orderId=${orderId}`)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
            <Lock className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Secured by {bankName} Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BankGatewayPage;
