import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Edit, Tag, X } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import * as couponService from '@/app/services/couponService';

export function NewCartPage() {
  const { convertPrice } = useCurrency();
  const { 
    cartItems, 
    removeFromCart, 
    updatePageCount, 
    getCartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal
  } = useCart();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<couponService.Coupon[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Calculate subtotal
  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const subtotalAfterDiscount = subtotal - discount;
  const taxAfterDiscount = subtotalAfterDiscount * 0.18;
  const total = getFinalTotal() + taxAfterDiscount;

  // Load coupons from localStorage on mount
  useEffect(() => {
    loadAvailableCoupons();
  }, []);

  const loadAvailableCoupons = async () => {
    await couponService.syncCouponsFromServer();
    const activeCoupons = couponService.getActiveCoupons();
    console.log('📦 [NewCartPage] Loaded active coupons:', activeCoupons);
    setAvailableCoupons(activeCoupons);
  };

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

  const handleQuickApplyCoupon = (code: string) => {
    handleApplyCoupon(code);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items to proceed.');
      return;
    }
    navigate('/checkout/address');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-b bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl text-center font-bold text-gray-900">
            Services you opted:
          </h1>
          <div className="text-center mt-3">
            <Link
              to="/"
              className="text-orange-500 hover:text-orange-600 font-medium border-b-2 border-orange-500 pb-1"
            >
              Continue adding more services
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {cartItems.length === 0 ? (
          // Empty Cart State
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Add translation services to your cart to get started
            </p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-2">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b text-sm font-semibold text-gray-600 uppercase tracking-wide">
                <div className="col-span-5">SERVICE</div>
                <div className="col-span-2 text-center">PRICE</div>
                <div className="col-span-2 text-center">TOTAL NO. OF PAGES</div>
                <div className="col-span-2 text-center">TOTAL</div>
                <div className="col-span-1"></div>
              </div>

              {/* Cart Items */}
              <div className="space-y-6 mt-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {/* SERVICE COLUMN */}
                      <div className="md:col-span-5">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0 w-24 h-24 bg-purple-100 rounded-lg overflow-hidden border border-purple-200">
                            {/* Debug: Log the image value */}
                            {console.log('Cart Item Image:', item.name, item.image)}
                            <ImageWithFallback
                              src={item.image || 'https://via.placeholder.com/150/9333EA/FFFFFF?text=Service'}
                              alt={item.name}
                              className="w-full h-full object-contain bg-white p-2"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-grow">
                            <h3 className="font-bold text-gray-900 mb-3 leading-tight">
                              {item.name}
                            </h3>

                            {/* Service Details */}
                            <div className="space-y-1 text-sm">
                              {item.sourceLanguage && (
                                <p className="text-gray-700">
                                  <span className="font-medium">Source Language:</span> {item.sourceLanguage}
                                </p>
                              )}
                              {item.targetLanguage && (
                                <p className="text-gray-700">
                                  <span className="font-medium">Target Language:</span> {item.targetLanguage}
                                </p>
                              )}
                              {item.certificateType && (
                                <p className="text-gray-700">
                                  <span className="font-medium">Select document type:</span> {item.certificateType}
                                </p>
                              )}
                            </div>

                            {/* Uploaded Documents */}
                            {(() => {
                              const docs = item.uploadedDocuments || (item.uploadedDocument ? [item.uploadedDocument] : []);
                              if (docs.length === 0) return null;
                              
                              return (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-700 font-medium mb-1">
                                    Uploaded Document{docs.length > 1 ? 's' : ''} ({docs.length}):
                                  </p>
                                  <div className="space-y-1">
                                    {docs.map((doc, idx) => (
                                      <p key={idx} className="text-sm text-gray-600 ml-2">
                                        {doc.name}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => navigate(item.url, { state: { editCartItem: item } })}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded hover:bg-orange-600 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                                EDIT OPTIONS
                              </button>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-red-600 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PRICE COLUMN */}
                      <div className="md:col-span-2 text-center">
                        <p className="text-sm text-gray-500 md:hidden font-semibold mb-1">PRICE</p>
                        <p className="font-bold text-gray-900">{convertPrice(item.basePrice)}</p>
                      </div>

                      {/* TOTAL NO. OF PAGES COLUMN */}
                      <div className="md:col-span-2 flex justify-center">
                        <div className="flex flex-col items-center">
                          <p className="text-sm text-gray-500 md:hidden font-semibold mb-2">TOTAL NO. OF PAGES</p>
                          <div className="flex items-center border border-gray-300 rounded">
                            <button
                              onClick={() => updatePageCount(item.id, Math.max(1, item.pageCount - 1))}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <input
                              type="number"
                              value={item.pageCount}
                              onChange={(e) => updatePageCount(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-12 text-center font-medium text-gray-900 border-x border-gray-300"
                              min="1"
                            />
                            <button
                              onClick={() => updatePageCount(item.id, item.pageCount + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* TOTAL COLUMN */}
                      <div className="md:col-span-2 text-center">
                        <p className="text-sm text-gray-500 md:hidden font-semibold mb-1">TOTAL</p>
                        <p className="text-xl font-bold text-gray-900">{convertPrice(item.totalPrice)}</p>
                      </div>

                      {/* Empty space for alignment */}
                      <div className="md:col-span-1"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                {/* Available Coupons Display */}
                {availableCoupons.length > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-5 h-5 text-blue-700" />
                      <h3 className="font-bold text-blue-900">Available Coupon Codes</h3>
                    </div>
                    <div className="space-y-2">
                      {availableCoupons.map((coupon) => (
                        <div 
                          key={coupon.id} 
                          className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200 hover:border-blue-400 transition-all hover:shadow-md"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-block px-3 py-1 bg-blue-600 text-white font-mono text-sm font-bold rounded">
                                {coupon.code}
                              </span>
                              <span className="text-xs text-green-600 font-semibold">
                                {coupon.discountType === 'percentage' 
                                  ? `${coupon.discountValue}% OFF` 
                                  : `?${coupon.discountValue} OFF`}
                              </span>
                            </div>
                            {coupon.minOrderValue > 0 && (
                              <p className="text-xs text-gray-600 ml-1">
                                Min. order: ₹{coupon.minOrderValue}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleQuickApplyCoupon(coupon.code)}
                            className="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-700 mt-3 text-center font-medium">
                      Click "Apply" or enter the code below
                    </p>
                  </div>
                )}

                {/* Coupon Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have a coupon code?
                  </label>
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon(couponCode)}
                          placeholder="Enter code"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        />
                      </div>
                      <button
                        onClick={() => handleApplyCoupon(couponCode)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-mono font-semibold text-green-800">{appliedCoupon.code}</p>
                          <p className="text-xs text-green-600">
                            {appliedCoupon.discountType === 'percentage' 
                              ? `${appliedCoupon.discountValue}% off` 
                              : `${convertPrice(appliedCoupon.discountValue)} off`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove coupon"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>{convertPrice(subtotal)}</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount</span>
                      <span>- {convertPrice(discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-700">
                    <span>GST (18%)</span>
                    <span>{convertPrice(taxAfterDiscount)}</span>
                  </div>
                  
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span>{convertPrice(total)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Proceed to Checkout
                </button>

                {/* Continue Shopping Link */}
                <Link
                  to="/"
                  className="block text-center mt-4 text-orange-500 hover:text-orange-600 font-medium"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewCartPage;
