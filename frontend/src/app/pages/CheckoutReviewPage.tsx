import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Edit, FileText, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { validateCoupon, calculateDiscount } from '@/app/services/couponService';

export function CheckoutReviewPage() {
  const { formatPrice } = useCurrency();
  const { 
    cartItems, 
    getCartTotal, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon,
    getDiscountAmount,
    getFinalTotal 
  } = useCart();
  const navigate = useNavigate();
  
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  
  // Shipping method state
  const [shippingMethod, setShippingMethod] = useState<'email-only' | 'email-and-hard-copy'>('email-only');
  
  // Tip state management
  const [showTipSupport, setShowTipSupport] = useState(false);
  const [selectedTipPercentage, setSelectedTipPercentage] = useState<number | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0);
  
  // Sample billing address (in real app, this would come from context/state)
  const billingAddress = {
    name: 'John Doe',
    phone: '+91 98765 43210',
    addressLine1: '123, MG Road',
    addressLine2: 'Near City Mall',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    country: 'India'
  };
  
  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const tax = (subtotal - discount) * 0.18;
  const total = subtotal - discount + tax + tipAmount;

  // Handle apply coupon
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    const validation = validateCoupon(couponCode.trim(), subtotal);
    
    if (!validation.valid) {
      setCouponError(validation.error || 'Invalid coupon code');
      toast.error(validation.error || 'Invalid coupon code');
      return;
    }
    
    if (validation.coupon) {
      const discountAmount = calculateDiscount(validation.coupon, subtotal);
      applyCoupon(
        validation.coupon.code,
        validation.coupon.discountType === 'percentage' 
          ? validation.coupon.discountValue 
          : discountAmount,
        validation.coupon.discountType
      );
      setCouponCode('');
      toast.success(`Coupon "${validation.coupon.code}" applied successfully!`);
    }
  };

  // Handle remove coupon
  const handleRemoveCoupon = () => {
    removeCoupon();
    toast.success('Coupon removed');
  };
  
  // Handle tip selection
  const handleTipPercentageSelect = (percentage: number) => {
    setSelectedTipPercentage(percentage);
    setCustomTipAmount(0);
    const calculatedTip = Math.round((subtotal * percentage) / 100);
    setTipAmount(calculatedTip);
  };

  const handleNoneTip = () => {
    setSelectedTipPercentage(null);
    setCustomTipAmount(0);
    setTipAmount(0);
  };

  const handleCustomTipChange = (amount: number) => {
    setSelectedTipPercentage(null);
    setCustomTipAmount(amount);
    setTipAmount(amount);
  };

  const handleMakePayment = () => {
    // Store notes, tip, and shipping method in localStorage or pass to payment page
    localStorage.setItem('orderNotes', notes);
    localStorage.setItem('orderTip', tipAmount.toString());
    localStorage.setItem('shippingMethod', shippingMethod);
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
                OK
              </div>
              <span className="ml-2 text-sm">Cart</span>
            </div>
            <div className="w-16 h-0.5 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                OK
              </div>
              <span className="ml-2 text-sm">Address</span>
            </div>
            <div className="w-16 h-0.5 bg-blue-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                3
              </div>
              <span className="ml-2 text-sm font-medium">Review</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">
                4
              </div>
              <span className="ml-2 text-sm text-gray-500">Payment</span>
            </div>
          </div>
          <h1 className="text-3xl text-center">Review Your Order</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Review Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl">Billing Address</h2>
                <Link
                  to="/checkout/address"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Change
                </Link>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium mb-2">{billingAddress.name}</p>
                <p className="text-sm text-gray-600 mb-1">
                  {billingAddress.addressLine1}
                  {billingAddress.addressLine2 && `, ${billingAddress.addressLine2}`}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  {billingAddress.city}, {billingAddress.state} - {billingAddress.pincode}
                </p>
                <p className="text-sm text-gray-600 mb-1">{billingAddress.country}</p>
                <p className="text-sm text-gray-600">Phone: {billingAddress.phone}</p>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl mb-4">Shipping method</h2>
              <div className="space-y-3">
                {/* Email Only Option */}
                <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-blue-300 transition-colors ${
                  shippingMethod === 'email-only' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="shipping-method"
                    value="email-only"
                    checked={shippingMethod === 'email-only'}
                    onChange={(e) => setShippingMethod(e.target.value as 'email-only' | 'email-and-hard-copy')}
                    className="mt-0.5 w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      Only Soft Copies through email (no hard copies)
                    </span>
                    <span className="text-sm font-semibold text-red-600">FREE</span>
                  </div>
                </label>

                {/* Email + Hard Copy Option */}
                <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-blue-300 transition-colors ${
                  shippingMethod === 'email-and-hard-copy' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="shipping-method"
                    value="email-and-hard-copy"
                    checked={shippingMethod === 'email-and-hard-copy'}
                    onChange={(e) => setShippingMethod(e.target.value as 'email-only' | 'email-and-hard-copy')}
                    className="mt-0.5 w-4 h-4 text-blue-600 cursor-pointer"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      Soft Copies + Hard Copies (through Standard Shipping e.g. DTDC)
                    </span>
                    <span className="text-sm font-semibold text-red-600">FREE</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl mb-4">Order Details</h2>
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="pb-6 border-b last:border-b-0 last:pb-0">
                    <div className="flex gap-4">
                      {/* Image */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />

                      {/* Details */}
                      <div className="flex-grow">
                        <h3 className="font-medium mb-2">{item.name}</h3>
                        
                        {/* Selected Options */}
                        <div className="space-y-1 mb-3 text-sm">
                          {item.sourceLanguage && (
                            <div className="flex gap-2">
                              <span className="text-gray-500">Source:</span>
                              <span className="text-gray-700">{item.sourceLanguage}</span>
                            </div>
                          )}
                          {item.targetLanguage && (
                            <div className="flex gap-2">
                              <span className="text-gray-500">Target:</span>
                              <span className="text-gray-700">{item.targetLanguage}</span>
                            </div>
                          )}
                          {item.certificateType && (
                            <div className="flex gap-2">
                              <span className="text-gray-500">Certificate:</span>
                              <span className="text-gray-700">{item.certificateType}</span>
                            </div>
                          )}
                        </div>

                        {/* Uploaded Document */}
                        {(item.uploadedDocuments?.length || item.uploadedDocument) && (
                          <div className="bg-gray-50 rounded p-2 mb-3">
                            <div className="space-y-2">
                              {(item.uploadedDocuments || (item.uploadedDocument ? [item.uploadedDocument] : [])).map((doc, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm">{doc.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Page Count and Price */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} x {formatPrice(item.basePrice)}
                          </span>
                          <span className="font-medium text-blue-600">
                            {formatPrice(item.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes / Instructions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl mb-4">Additional Notes (Optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special instructions or requirements for your order..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Example: Urgent delivery, specific formatting requirements, etc.
              </p>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              {/* Coupon Section */}
              {!appliedCoupon && (
                <div className="mb-6 pb-6 border-b">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Have a coupon code?
                  </h3>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none text-sm"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Apply
                    </button>
                  </form>
                  {couponError && (
                    <p className="text-sm text-red-600 mt-2">{couponError}</p>
                  )}
                </div>
              )}

              {appliedCoupon && (
                <div className="mb-6 pb-6 border-b bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700">{appliedCoupon.code}</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-green-600">Coupon applied successfully</p>
                </div>
              )}

              {/* Add Tip Section */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="font-medium mb-3">Add tip</h3>
                
                {/* Checkbox for showing support */}
                <label className="flex items-start gap-2 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTipSupport}
                    onChange={(e) => {
                      setShowTipSupport(e.target.checked);
                      if (!e.target.checked) {
                        handleNoneTip();
                      }
                    }}
                    className="mt-1 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">
                    Show your support for the team at Honey Translation Services
                  </span>
                </label>

                {showTipSupport && (
                  <div className="space-y-4">
                    {/* Tip percentage buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTipPercentageSelect(10)}
                        className={`py-3 px-2 rounded-lg border-2 transition-all ${
                          selectedTipPercentage === 10
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">10%</div>
                        <div className="text-xs text-gray-600">{formatPrice(Math.round(subtotal * 0.10))}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTipPercentageSelect(15)}
                        className={`py-3 px-2 rounded-lg border-2 transition-all ${
                          selectedTipPercentage === 15
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">15%</div>
                        <div className="text-xs text-gray-600">{formatPrice(Math.round(subtotal * 0.15))}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTipPercentageSelect(20)}
                        className={`py-3 px-2 rounded-lg border-2 transition-all ${
                          selectedTipPercentage === 20
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">20%</div>
                        <div className="text-xs text-gray-600">{formatPrice(Math.round(subtotal * 0.20))}</div>
                      </button>
                      <button
                        type="button"
                        onClick={handleNoneTip}
                        className={`py-3 px-2 rounded-lg border-2 transition-all ${
                          selectedTipPercentage === null && customTipAmount === 0
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">None</div>
                      </button>
                    </div>

                    {/* Custom tip input */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Custom tip</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCustomTipChange(Math.max(0, customTipAmount - 10))}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={customTipAmount}
                          onChange={(e) => handleCustomTipChange(Math.max(0, parseInt(e.target.value) || 0))}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 outline-none text-center"
                          placeholder="0"
                          min="0"
                        />
                        <button
                          type="button"
                          onClick={() => handleCustomTipChange(customTipAmount + 10)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Thank you message */}
                    {tipAmount > 0 && (
                      <p className="text-sm text-gray-600 italic text-center">
                        Thank you, we appreciate it.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <h2 className="text-xl mb-6">Payment Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">
                        Discount ({appliedCoupon.code})
                      </span>
                    </div>
                    <span className="text-green-600">- {formatPrice(discount)}</span>
                  </div>
                )}

                {tipAmount > 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Tip</span>
                    <span>+ {formatPrice(tipAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (GST 18%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-lg">Total Amount</span>
                    <span className="text-2xl text-blue-600 font-medium">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    (Inclusive of all taxes{tipAmount > 0 ? ' and tip' : ''})
                  </p>
                </div>
              </div>

              <button
                onClick={handleMakePayment}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors mb-3 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Make Payment
              </button>

              {/* Security Info */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure payment gateway
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Your data is encrypted
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  100% refund guarantee
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

