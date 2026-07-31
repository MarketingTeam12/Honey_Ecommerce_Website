import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, FileText, Tag, ChevronRight, X, Percent, DollarSign, Calendar, Users, Info } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { toast } from 'sonner';
import * as couponService from '@/app/services/couponService';

interface BillingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

const formatAddress = (address: BillingAddress | null) => {
  if (!address) return '';

  return [
    address.name,
    [address.addressLine1, address.addressLine2].filter(Boolean).join(', '),
    `${address.city}, ${address.state} - ${address.pincode}`,
    address.country,
    `Phone: ${address.phone}`,
  ].filter(Boolean).join('\n');
};

export function NewCheckoutReviewPage() {
  const { convertPrice } = useCurrency();
  const { 
    cartItems, 
    getCartTotal, 
    appliedCoupon, 
    getDiscountAmount,
    applyCoupon,
    removeCoupon
  } = useCart();
  const navigate = useNavigate();
  
  const [notes, setNotes] = useState('');
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);
  const [shippingMethod, setShippingMethod] = useState<'email' | 'physical'>('email');
  const [physicalAddressType, setPhysicalAddressType] = useState<'residential' | 'delivery'>('residential');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [deliveryWhatsappNumber, setDeliveryWhatsappNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [shippingError, setShippingError] = useState('');
  const [customerType, setCustomerType] = useState<'individual' | 'company'>('individual');
  const [gstNumber, setGstNumber] = useState('');
  const [paymentDetailsError, setPaymentDetailsError] = useState('');
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<couponService.Coupon[]>([]);
  
  // Load available coupons from admin panel
  useEffect(() => {
    loadAvailableCoupons();
  }, []);

  // Load billing address from localStorage on mount
  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem('shipping_address');
      if (savedAddress) {
        setBillingAddress(JSON.parse(savedAddress));
      } else {
        // If no address is saved, redirect back to address page
        console.warn('No billing address found, redirecting to address page');
        navigate('/checkout/address');
      }
    } catch (error) {
      console.error('Error loading billing address:', error);
      navigate('/checkout/address');
    }
  }, [navigate]);

  useEffect(() => {
    try {
      const savedPaymentDetails = localStorage.getItem('paymentCustomerDetails');
      if (savedPaymentDetails) {
        const parsed = JSON.parse(savedPaymentDetails) as {
          customerType?: 'individual' | 'company';
          gstNumber?: string;
        };
        setCustomerType(parsed.customerType === 'company' ? 'company' : 'individual');
        setGstNumber(parsed.gstNumber || '');
      }
    } catch (error) {
      console.error('Error loading payment customer details:', error);
    }
  }, []);

  const loadAvailableCoupons = async () => {
    await couponService.syncCouponsFromServer();
    const activeCoupons = couponService.getActiveCoupons();
    console.log('📦 [CheckoutReview] Loaded active coupons:', activeCoupons);
    setAvailableCoupons(activeCoupons);
  };

  // If cart is empty, redirect to cart
  useEffect(() => {
    if (cartItems.length === 0) {
      console.warn('Cart is empty, redirecting to cart page');
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const tax = (subtotal - discount) * 0.18;
  const total = subtotal - discount + tax;

  const handleApplyCoupon = (code: string) => {
    if (!code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponError('');
    const validation = couponService.validateCoupon(code, subtotal);

    if (!validation.valid) {
      setCouponError(validation.error || 'Invalid coupon');
      toast.error(validation.error || 'Invalid coupon');
      return;
    }

    if (validation.coupon) {
      const discountAmount = couponService.calculateDiscount(validation.coupon, subtotal);
      applyCoupon(code.toUpperCase(), validation.coupon.discountValue, validation.coupon.discountType);
      
      toast.success(`Coupon "${code.toUpperCase()}" applied successfully! You saved ${convertPrice(discountAmount)}`);
      setCouponCode('');
      setCouponError('');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setCouponError('');
    toast.info('Coupon removed');
  };

  const handleQuickApplyCoupon = (coupon: couponService.Coupon) => {
    const validation = couponService.validateCoupon(coupon.code, subtotal);

    if (!validation.valid) {
      toast.error(validation.error || 'This coupon cannot be applied');
      return;
    }

    const discountAmount = couponService.calculateDiscount(coupon, subtotal);
    applyCoupon(coupon.code, coupon.discountValue, coupon.discountType);
    
    toast.success(`Coupon "${coupon.code}" applied! You saved ${convertPrice(discountAmount)}`);
    setShowCouponsModal(false);
    setCouponCode('');
    setCouponError('');
  };

  const handleSaveDeliveryDetails = () => {
    setShippingError('');
    setPaymentDetailsError('');

    if (shippingMethod === 'email') {
      const email = deliveryEmail.trim();
      const whatsappNumber = deliveryWhatsappNumber.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10,15}$/;

      if (!email) {
        setShippingError('Please enter your email address for delivery.');
        return false;
      }

      if (!emailRegex.test(email)) {
        setShippingError('Please enter a valid email address.');
        return false;
      }

      if (!whatsappNumber) {
        setShippingError('Please enter your WhatsApp number for delivery updates.');
        return false;
      }

      if (!phoneRegex.test(whatsappNumber)) {
        setShippingError('Please enter a valid WhatsApp number (10-15 digits).');
        return false;
      }
    } else if (physicalAddressType === 'residential') {
      if (!billingAddress) {
        setShippingError('Please add or select your residential address in Step 1.');
        return false;
      }
    } else {
      if (!deliveryAddress.trim()) {
        setShippingError('Please enter your full delivery address for courier delivery.');
        return false;
      }
    }

    if (customerType === 'company' && !gstNumber.trim()) {
      setPaymentDetailsError('Please enter your GST Number for company billing.');
      return false;
    }

    const savedDetails = {
      email: shippingMethod === 'email' ? deliveryEmail.trim() : '',
      whatsappNumber: shippingMethod === 'email' ? deliveryWhatsappNumber.trim() : '',
      address: shippingMethod === 'physical'
        ? physicalAddressType === 'residential'
          ? formatAddress(billingAddress)
          : deliveryAddress.trim()
        : '',
      addressType: shippingMethod === 'physical' ? physicalAddressType : '',
    };
    const paymentDetails = {
      customerType,
      gstNumber: customerType === 'company' ? gstNumber.trim().toUpperCase() : '',
    };

    localStorage.setItem('shippingMethod', shippingMethod);
    localStorage.setItem('shippingDetails', JSON.stringify(savedDetails));
    localStorage.setItem('paymentCustomerDetails', JSON.stringify(paymentDetails));
    toast.success('Delivery details submitted successfully.');
    return true;
  };

  const handleDeliveryDetailsKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveDeliveryDetails();
    }
  };

  const handleMakePayment = () => {
    if (!handleSaveDeliveryDetails()) {
      return;
    }

    localStorage.setItem('orderNotes', notes);
    navigate('/checkout/payment?autopay=1');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-600">Address</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <span className="font-medium text-blue-600">Review Order & Make Payment</span>
            </div>
          </div>
          
          <h1 className="text-3xl text-center">Review Your Order</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* LEFT COLUMN - Order Review */}
          <div className="col-span-2 space-y-6">
            {/* Billing Address */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Billing Address</h2>
                <button
                  onClick={() => navigate('/checkout/address')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Change
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">{billingAddress?.name}</p>
                <p className="text-gray-700 mb-1">
                  {billingAddress?.addressLine1}
                  {billingAddress?.addressLine2 && `, ${billingAddress?.addressLine2}`}
                </p>
                <p className="text-gray-700 mb-1">
                  {billingAddress?.city}, {billingAddress?.state} - {billingAddress?.pincode}
                </p>
                <p className="text-gray-700 mb-1">{billingAddress?.country}</p>
                <p className="text-gray-600 text-sm">Phone: {billingAddress?.phone}</p>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Method</h2>
              <div className="space-y-3">
                {/* Email Delivery Option */}
                <label 
                  className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    shippingMethod === 'email' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="email"
                    checked={shippingMethod === 'email'}
                    onChange={(e) => {
                      setShippingMethod(e.target.value as 'email');
                      setShippingError('');
                    }}
                    className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">Mail/WhatsApp Delivery</span>
                      <span className="text-green-600 font-semibold">FREE</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Digital copies sent via email, no physical documents
                    </p>
                  </div>
                </label>

                {/* Physical Delivery Option */}
                <label 
                  className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    shippingMethod === 'physical' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="physical"
                    checked={shippingMethod === 'physical'}
                    onChange={(e) => {
                      setShippingMethod(e.target.value as 'physical');
                      setShippingError('');
                    }}
                    className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">Physical Delivery</span>
                      <span className="text-green-600 font-semibold">FREE</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Documents sent via standard courier service such as DTDC
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-4">
                {shippingMethod === 'email' ? (
                  <div className="space-y-3 p-4 border border-blue-200 rounded-xl bg-blue-50">
                    <label className="block text-sm font-semibold text-gray-900">Email Address</label>
                    <input
                      type="email"
                      value={deliveryEmail}
                      onChange={(e) => {
                        setDeliveryEmail(e.target.value);
                        setShippingError('');
                      }}
                      placeholder="Enter your email address"
                      onKeyDown={handleDeliveryDetailsKeyDown}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    <label className="block text-sm font-semibold text-gray-900">WhatsApp Number</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={deliveryWhatsappNumber}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        setDeliveryWhatsappNumber(digitsOnly);
                        setShippingError('');
                      }}
                      onKeyDown={handleDeliveryDetailsKeyDown}
                      placeholder="Enter your WhatsApp number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    <p className="text-sm text-gray-600">
                      Documents will be sent to your email, and updates will be shared on WhatsApp.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 border border-blue-200 rounded-xl bg-blue-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        physicalAddressType === 'residential'
                          ? 'border-blue-600 bg-white'
                          : 'border-blue-200 bg-blue-50 hover:border-blue-300'
                      }`}>
                        <input
                          type="radio"
                          name="physicalAddressType"
                          value="residential"
                          checked={physicalAddressType === 'residential'}
                          onChange={() => {
                            setPhysicalAddressType('residential');
                            setShippingError('');
                          }}
                          className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">Residential Address</p>
                          <p className="text-sm text-gray-600">Use the address saved in Step 1.</p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        physicalAddressType === 'delivery'
                          ? 'border-blue-600 bg-white'
                          : 'border-blue-200 bg-blue-50 hover:border-blue-300'
                      }`}>
                        <input
                          type="radio"
                          name="physicalAddressType"
                          value="delivery"
                          checked={physicalAddressType === 'delivery'}
                          onChange={() => {
                            setPhysicalAddressType('delivery');
                            setShippingError('');
                          }}
                          className="mt-1 w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">Delivery Address</p>
                          <p className="text-sm text-gray-600">Enter a different courier address.</p>
                        </div>
                      </label>
                    </div>

                    {physicalAddressType === 'residential' ? (
                      <div className="bg-white border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 mb-2">Selected Residential Address</p>
                            <div className="text-gray-700 space-y-1">
                              <p className="font-semibold text-gray-900">{billingAddress?.name}</p>
                              <p>
                                {billingAddress?.addressLine1}
                                {billingAddress?.addressLine2 && `, ${billingAddress.addressLine2}`}
                              </p>
                              <p>{billingAddress?.city}, {billingAddress?.state} - {billingAddress?.pincode}</p>
                              <p>{billingAddress?.country}</p>
                              <p className="text-gray-600 text-sm">Phone: {billingAddress?.phone}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate('/checkout/address')}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm shrink-0"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className="block text-sm font-semibold text-gray-900">Delivery Address</label>
                        <textarea
                          value={deliveryAddress}
                          onChange={(e) => {
                            setDeliveryAddress(e.target.value);
                            setShippingError('');
                          }}
                          placeholder="Enter your full delivery address, including house number, street, city, state, pincode, and country"
                          rows={4}
                          onKeyDown={handleDeliveryDetailsKeyDown}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                        />
                      </>
                    )}
                    <p className="text-sm text-gray-600">
                      This address will be used for courier delivery of your documents.
                    </p>
                  </div>
                )}
                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    onClick={handleSaveDeliveryDetails}
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Submit
                  </button>
                  <p className="text-sm text-gray-500">
                    Click submit to save the chosen delivery option and entered email/address before payment.
                  </p>
                </div>
                {shippingError && (
                  <p className="mt-3 text-sm text-red-600 font-medium">{shippingError}</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6">Order Details</h2>
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-5 pb-6 border-b last:border-b-0 last:pb-0">
                    {/* Product Image */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />

                    {/* Product Details */}
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-900 text-lg mb-3">{item.name}</h3>
                      
                      {/* Language Selections */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {item.sourceLanguage && (
                          <div className="text-sm">
                            <span className="text-gray-500">Source: </span>
                            <span className="text-gray-900 font-medium">{item.sourceLanguage}</span>
                          </div>
                        )}
                        {item.targetLanguage && (
                          <div className="text-sm">
                            <span className="text-gray-500">Target: </span>
                            <span className="text-gray-900 font-medium">{item.targetLanguage}</span>
                          </div>
                        )}
                      </div>

                      {/* Certificate Type */}
                      {item.certificateType && (
                        <div className="text-sm mb-3">
                          <span className="text-gray-500">Certificate: </span>
                          <span className="text-gray-900 font-medium">{item.certificateType}</span>
                        </div>
                      )}

                      {/* Uploaded Documents */}
                      {(() => {
                        const docs = item.uploadedDocuments || (item.uploadedDocument ? [item.uploadedDocument] : []);
                        if (docs.length === 0) return null;
                        
                        return (
                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-2">
                              Uploaded Document{docs.length > 1 ? 's' : ''} ({docs.length})
                            </div>
                            <div className="space-y-2">
                              {docs.map((doc, idx) => (
                                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3 inline-flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-gray-900 font-medium">
                                    {doc.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Quantity and Price */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-gray-600">
                          Quantity: {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                        </span>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">
                            {convertPrice(item.basePrice)} x {item.pageCount}
                          </p>
                          <p className="text-xl font-semibold text-gray-900">
                            {convertPrice(item.totalPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - Order Summary */}
          <div className="col-span-1">
            <div className="space-y-6 sticky top-8">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-medium">{convertPrice(subtotal)}</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-green-600">
                      <div className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        <span>Discount ({appliedCoupon.code})</span>
                      </div>
                      <span className="font-medium">- {convertPrice(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-700">
                    <span>Tax (GST 18%)</span>
                    <span className="font-medium">{convertPrice(tax)}</span>
                  </div>

                  <div className="h-px bg-gray-300"></div>

                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total Amount</span>
                    <span className="font-bold text-blue-600 text-2xl">
                      {convertPrice(total)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    (Inclusive of all taxes)
                  </p>
                </div>

                <button
                  onClick={handleMakePayment}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4 text-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Make Payment
                </button>

                {/* Security Info */}
                <div className="space-y-2 pt-4 border-t border-gray-300">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Secure Payment Gateway
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Your Data is Encrypted
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    100% Refund Guarantee
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Apply Coupon Code</h2>
                
                {appliedCoupon && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <Tag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">Coupon Applied!</p>
                          <p className="text-sm text-green-700">
                            Code: <span className="font-mono font-bold">{appliedCoupon.code}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="p-2 hover:bg-green-100 rounded-full transition-colors"
                        title="Remove coupon"
                      >
                        <X className="w-5 h-5 text-green-700" />
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm text-green-700">
                        You're saving <span className="font-bold text-lg">{convertPrice(discount)}</span> on this order!
                      </p>
                    </div>
                  </div>
                )}

                {!appliedCoupon && (
                  <>
                    <div className="flex gap-3 mb-4">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none uppercase font-mono"
                      />
                      <button
                        onClick={() => handleApplyCoupon(couponCode)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>

                    {couponError && (
                      <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{couponError}</p>
                      </div>
                    )}

                    <button
                      onClick={() => setShowCouponsModal(true)}
                      className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Tag className="w-5 h-5" />
                      View All Available Coupons ({availableCoupons.length})
                    </button>
                  </>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Additional Notes (Optional)</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special instructions or requirements for your order..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Example: Urgent delivery needed, specific formatting requirements, etc.
                </p>
                <button
                  onClick={() => {
                    toast.success('Notes saved successfully!');
                  }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Coupons Modal */}
      {showCouponsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
              <div>
                <h2 className="text-2xl font-bold text-white">Available Coupons</h2>
                <p className="text-blue-100 text-sm mt-1">
                  {availableCoupons.length} active {availableCoupons.length === 1 ? 'coupon' : 'coupons'} available
                </p>
              </div>
              <button
                onClick={() => setShowCouponsModal(false)}
                className="p-2 hover:bg-blue-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {availableCoupons.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tag className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Coupons Available</h3>
                  <p className="text-gray-600">There are no active coupons at the moment. Check back later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableCoupons.map((coupon) => {
                    const validation = couponService.validateCoupon(coupon.code, subtotal);
                    const canApply = validation.valid;
                    const discountAmount = canApply ? couponService.calculateDiscount(coupon, subtotal) : 0;

                    return (
                      <div
                        key={coupon.id}
                        className={`border-2 rounded-xl p-5 transition-all ${
                          canApply
                            ? 'border-blue-200 bg-blue-50 hover:border-blue-400 hover:shadow-md cursor-pointer'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                        onClick={() => canApply && handleQuickApplyCoupon(coupon)}
                      >
                        {/* Coupon Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="inline-block px-3 py-1 bg-white border-2 border-dashed border-blue-400 rounded-lg mb-2">
                              <code className="text-lg font-bold text-blue-600">{coupon.code}</code>
                            </div>
                            {coupon.description && (
                              <p className="text-sm text-gray-700 mt-2">{coupon.description}</p>
                            )}
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                            {coupon.discountType === 'percentage' ? (
                              <Percent className="w-6 h-6 text-white" />
                            ) : (
                              <DollarSign className="w-6 h-6 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Discount Value */}
                        <div className="bg-white rounded-lg p-3 mb-3">
                          <p className="text-2xl font-bold text-blue-600">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% OFF`
                              : `?${coupon.discountValue} OFF`}
                          </p>
                          {canApply && discountAmount > 0 && (
                            <p className="text-sm text-green-600 font-medium mt-1">
                              You'll save {convertPrice(discountAmount)}
                            </p>
                          )}
                        </div>

                        {/* Coupon Details */}
                        <div className="space-y-2 text-sm">
                          {/* Minimum Order */}
                          {coupon.minOrderValue && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Info className="w-4 h-4 flex-shrink-0" />
                              <span>Min order: ₹{coupon.minOrderValue}</span>
                              {subtotal < coupon.minOrderValue && (
                                <span className="text-red-600 text-xs ml-auto">
                                  (Need ₹{coupon.minOrderValue - subtotal} more)
                                </span>
                              )}
                            </div>
                          )}

                          {/* Max Discount */}
                          {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Tag className="w-4 h-4 flex-shrink-0" />
                              <span>Max discount: ₹{coupon.maxDiscount}</span>
                            </div>
                          )}

                          {/* Usage Limit */}
                          {coupon.usageLimit && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Users className="w-4 h-4 flex-shrink-0" />
                              <span>
                                Used {coupon.usedCount} / {coupon.usageLimit} times
                              </span>
                            </div>
                          )}

                          {/* Validity */}
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs">
                              Valid till {new Date(coupon.validUntil).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Apply Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            canApply && handleQuickApplyCoupon(coupon);
                          }}
                          disabled={!canApply}
                          className={`w-full mt-4 py-2 rounded-lg font-medium transition-colors ${
                            canApply
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {canApply ? 'Apply This Coupon' : validation.error || 'Not Applicable'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 text-center">
                💡 Tip: Coupons are automatically validated based on your cart total and eligibility
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewCheckoutReviewPage;

