import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building, Wallet, Check, Shield, Lock } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';

export function PaymentPage() {
  const { formatPrice } = useCurrency();
  const { getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [processing, setProcessing] = useState(false);

  const subtotal = getCartTotal();
  const discount = subtotal * 0.1;
  const tax = (subtotal - discount) * 0.18;
  const total = subtotal - discount + tax;

  const handlePayment = async () => {
    setProcessing(true);
    
    // Redirect to the new payment page which handles Zoho integration
    navigate('/checkout/payment');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                &#10003;
              </div>
              <span className="ml-2 text-sm">Cart</span>
            </div>
            <div className="w-16 h-0.5 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                &#10003;
              </div>
              <span className="ml-2 text-sm">Address</span>
            </div>
            <div className="w-16 h-0.5 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                &#10003;
              </div>
              <span className="ml-2 text-sm">Review</span>
            </div>
            <div className="w-16 h-0.5 bg-blue-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                4
              </div>
              <span className="ml-2 text-sm font-medium">Payment</span>
            </div>
          </div>
          <h1 className="text-3xl text-center">Complete Payment via Zoho</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl mb-6">Razorpay - Secure Checkout</h2>

              {/* Razorpayment Banner */}
              <div className="mb-6 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl p-6">
                <div className="flex items-center gap-4 mb-3">
                  <Shield className="w-10 h-10" />
                  <div>
                    <h3 className="text-xl font-bold">Razorpay</h3>
                    <p className="text-white/80 text-sm">Enterprise-grade payment processing</p>
                  </div>
                </div>
                <p className="text-white/90 text-sm">
                  You will be securely redirected to Razorpay\'s checkout page to complete your payment.
                </p>
              </div>

              {/* Supported Methods */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <CreditCard className="w-7 h-7 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Cards</p>
                  <p className="text-xs text-gray-500">Visa, MC, Amex</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Smartphone className="w-7 h-7 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">UPI</p>
                  <p className="text-xs text-gray-500">GPay, PhonePe</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Building className="w-7 h-7 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Net Banking</p>
                  <p className="text-xs text-gray-500">All Banks</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Wallet className="w-7 h-7 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">Wallets</p>
                  <p className="text-xs text-gray-500">Paytm, Amazon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl mb-6">Payment Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>- {formatPrice(discount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (GST 18%)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-lg">Amount to Pay</span>
                  <span className="text-2xl text-blue-600 font-medium">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pay {formatPrice(total)} with Razorpay
                  </>
                )}
              </button>

              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium mb-3">Powered by</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded text-xs font-semibold">Razorpay</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    256-bit SSL Encryption
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    PCI DSS Compliant
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

