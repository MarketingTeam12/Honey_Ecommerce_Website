import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, FileText, Save, Tag, X } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { useState, useEffect } from 'react';

// UNIFIED STORAGE KEY - shared with admin panel
const STORAGE_KEY = 'honey_admin_coupons';

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
}

export function CartPage() {
  const { formatPrice } = useCurrency();
  const { cartItems, removeFromCart, updatePageCount, getCartTotal, appliedCoupon, applyCoupon, removeCoupon, getDiscountAmount, getFinalTotal } = useCart();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [showAllCouponsModal, setShowAllCouponsModal] = useState(false);

  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const tax = (subtotal - discount) * 0.18; // 18% GST on discounted amount
  const total = getFinalTotal() + tax;

  // Load coupons from localStorage on mount
  useEffect(() => {
    loadCouponsFromStorage();
  }, []);

  const loadCouponsFromStorage = () => {
    try {
      const storedCoupons = localStorage.getItem(STORAGE_KEY);
        console.log('[CartPage] ========== LOADING COUPONS ==========');
        console.log('[CartPage] Storage key:', STORAGE_KEY);
        console.log('[CartPage] Raw localStorage data:', storedCoupons);
        console.log('[CartPage] Data length:', storedCoupons?.length || 0);
      
      if (storedCoupons) {
        const allCoupons = JSON.parse(storedCoupons);
        console.log('[CartPage] Parsed coupons (array):', allCoupons);
        console.log('[CartPage] Is array?:', Array.isArray(allCoupons));
        console.log('[CartPage] Total coupons found:', allCoupons.length);
        
        // Filter only active and valid coupons
        const today = new Date();
        const activeCoupons = allCoupons.filter((c: Coupon) => {
          const isActive = c.isActive === true;
          const validUntil = c.validUntil ? new Date(c.validUntil) : null;
          const isNotExpired = !validUntil || validUntil >= today;
          const hasUsageLeft = !c.usageLimit || c.usedCount < c.usageLimit;
          
          console.log('[CartPage] Checking coupon:', c.code, {
            isActive,
            isNotExpired,
            hasUsageLeft,
            validUntil: c.validUntil,
            usedCount: c.usedCount,
            usageLimit: c.usageLimit
          });
          
          return isActive && isNotExpired && hasUsageLeft;
        });
        console.log('[CartPage] Active coupons after filtering:', activeCoupons);
        console.log('[CartPage] Active coupons count:', activeCoupons.length);
        
        console.log('[CartPage] Setting coupons to state...');
        setCoupons(activeCoupons);
        console.log('[CartPage] [OK] State updated!');
      } else {
        console.log('[WARN] [CartPage] No coupons found in localStorage with key:', STORAGE_KEY);
        console.log('[CartPage] All localStorage keys:', Object.keys(localStorage));
        setCoupons([]);
      }
    } catch (error) {
      console.error('[ERROR] [CartPage] Error loading coupons:', error);
      setCoupons([]);
    }
  };

  const handleApplyCoupon = (code: string) => {
    setCouponError('');
    console.log('[CartPage] Attempting to apply coupon:', code);
    console.log('[CartPage] Available coupons:', coupons);
    console.log('[CartPage] Subtotal:', subtotal);
    
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    
    if (!coupon) {
      console.error('[ERROR] [CartPage] Coupon not found in available coupons');
      console.log('[CartPage] Searched for:', code.toUpperCase());
      console.log('[CartPage] Available codes:', coupons.map(c => c.code));
      setCouponError('Invalid coupon code');
      return;
    }

    console.log('[OK] [CartPage] Coupon found:', coupon);

    if (!coupon.isActive) {
      console.error('[ERROR] [CartPage] Coupon is not active');
      setCouponError('This coupon is not active');
      return;
    }

    // Check minimum order value
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      console.error('[ERROR] [CartPage] Order value too low. Subtotal:', subtotal, 'Min:', coupon.minOrderValue);
      const minRequired = formatPrice(coupon.minOrderValue);
      const currentValue = formatPrice(subtotal);
      setCouponError(`This coupon requires a minimum order of ${minRequired}. Your current subtotal is ${currentValue}. Add ${formatPrice(coupon.minOrderValue - subtotal)} more to use this coupon.`);
      return;
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      console.error('[ERROR] [CartPage] Usage limit reached. Used:', coupon.usedCount, 'Limit:', coupon.usageLimit);
      setCouponError('This coupon has reached its usage limit');
      return;
    }

    // Check validity dates
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
    
    if (coupon.validFrom) {
      const validFrom = new Date(coupon.validFrom);
      validFrom.setHours(0, 0, 0, 0);
      if (today < validFrom) {
        console.error('[ERROR] [CartPage] Coupon not yet valid. Valid from:', validFrom);
        setCouponError(`This coupon will be valid from ${coupon.validFrom}`);
        return;
      }
    }
    
    if (coupon.validUntil) {
      const validUntil = new Date(coupon.validUntil);
      validUntil.setHours(23, 59, 59, 999); // End of day
      if (today > validUntil) {
        console.error('[ERROR] [CartPage] Coupon expired. Valid until:', validUntil);
        setCouponError('This coupon has expired');
        return;
      }
    }

    console.log('[CartPage] All validations passed! Applying coupon...');
    
    // Apply coupon with maxDiscount if applicable
    let finalDiscountValue = coupon.discountValue;
    if (coupon.discountType === 'percentage' && coupon.maxDiscount) {
      const calculatedDiscount = (subtotal * coupon.discountValue) / 100;
      if (calculatedDiscount > coupon.maxDiscount) {
        finalDiscountValue = coupon.maxDiscount;
        console.log('[CartPage] Max discount applied:', coupon.maxDiscount);
      }
    }
    
    applyCoupon(coupon.code, finalDiscountValue, coupon.discountType);
    setCouponCode('');
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError('');
  };

  const handleCheckout = () => {
    navigate('/checkout/address');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2">Shopping Cart</h1>
              <p className="text-gray-600">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <button
              onClick={() => {
                setShowDebug(!showDebug);
                loadCouponsFromStorage();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              {showDebug ? 'Hide' : 'Show'} Debug Info
            </button>
          </div>
          
          {/* Debug Panel */}
          {showDebug && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Debug Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-yellow-900">Coupons in state:</span>{' '}
                  <span className="text-yellow-700">{coupons.length}</span>
                </div>
                <div>
                  <span className="font-medium text-yellow-900">localStorage data:</span>{' '}
                  <span className="text-yellow-700 font-mono text-xs break-all">
                    {localStorage.getItem(STORAGE_KEY) || 'null'}
                  </span>
                </div>
                {coupons.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium text-yellow-900">Loaded coupons:</span>
                    <ul className="list-disc list-inside mt-1 text-yellow-700">
                      {coupons.map(c => (
                        <li key={c.id}>
                          {c.code} - {c.discountType === 'percentage' ? `${c.discountValue}%` : `?${c.discountValue}`} - {c.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={loadCouponsFromStorage}
                  className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-900 rounded hover:bg-yellow-300 transition-colors"
                >
                  Reload Coupons
                </button>
              </div>
            </div>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl mb-2">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-6">
              Add services to your cart to get started
            </p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex flex-col gap-6">
                    {/* Top Section: Image and Product Info */}
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full sm:w-40 h-40 object-contain bg-white p-2 rounded-lg border border-gray-200"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">{item.category}</p>
                            <Link to={item.url}>
                              <h3 className="text-lg hover:text-blue-600 transition-colors">
                                {item.name}
                              </h3>
                            </Link>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Remove from cart"
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </button>
                        </div>

                        {/* Selected Options */}
                        <div className="space-y-2 mb-4">
                          {item.sourceLanguage && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600">Source Language:</span>
                              <span className="font-medium">{item.sourceLanguage}</span>
                            </div>
                          )}
                          {item.targetLanguage && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600">Target Language:</span>
                              <span className="font-medium">{item.targetLanguage}</span>
                            </div>
                          )}
                          {item.certificateType && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-600">Certificate Type:</span>
                              <span className="font-medium">{item.certificateType}</span>
                            </div>
                          )}
                        </div>

                        {/* Uploaded Document Preview */}
                        {(item.uploadedDocuments?.length || item.uploadedDocument) && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="space-y-2">
                              {(item.uploadedDocuments || (item.uploadedDocument ? [item.uploadedDocument] : [])).map((doc, index) => (
                                <div key={index} className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  <div className="flex-grow">
                                    <p className="text-sm font-medium">{doc.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Page Count Controls */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">Page Count:</span>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => updatePageCount(item.id, Math.max(1, item.pageCount - 1))}
                                className="p-2 hover:bg-gray-100 transition-colors"
                                aria-label="Decrease page count"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                                {item.pageCount}
                              </span>
                              <button
                                onClick={() => updatePageCount(item.id, item.pageCount + 1)}
                                className="p-2 hover:bg-gray-100 transition-colors"
                                aria-label="Increase page count"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {formatPrice(item.basePrice)} x {item.pageCount}
                            </p>
                            <p className="text-xl text-blue-600 font-medium">
                              {formatPrice(item.totalPrice)}
                            </p>
                          </div>
                        </div>

                        {/* Save for Later */}
                        <div className="mt-4 pt-4 border-t">
                          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                            <Save className="w-4 h-4" />
                            Save for Later
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-xl mb-6">Order Summary</h2>

                {/* Coupon Section */}
                <div className="mb-6 pb-6 border-b">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Apply Coupon</h3>
                  
                  {appliedCoupon ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-green-600" />
                          <span className="font-mono font-semibold text-green-900">{appliedCoupon.code}</span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-red-600 hover:text-red-700"
                          title="Remove coupon"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        {appliedCoupon.discountType === 'percentage' 
                          ? `${appliedCoupon.discountValue}% discount applied` 
                          : `?${appliedCoupon.discountValue} discount applied`}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError('');
                          }}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                        <button
                          onClick={() => handleApplyCoupon(couponCode)}
                          disabled={!couponCode}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                        >
                          Apply
                        </button>
                      </div>
                      
                      {couponError && (
                        <p className="text-xs text-red-600 mb-3">{couponError}</p>
                      )}
                      
                      {/* Show All Coupons Button */}
                      <button
                        onClick={() => setShowAllCouponsModal(true)}
                        className="w-full mb-3 py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 font-medium"
                      >
                        <Tag className="w-4 h-4" />
                        Show All Coupons
                      </button>
                      
                      {/* Available Coupons */}
                      {coupons.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 mb-2">Available coupons ({coupons.length}):</p>
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {coupons.map((coupon) => (
                              <div
                                key={coupon.id}
                                className="border border-gray-200 rounded-lg p-2 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                                onClick={() => handleApplyCoupon(coupon.code)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-3 h-3 text-blue-600" />
                                    <span className="font-mono text-xs font-semibold text-gray-900">
                                      {coupon.code}
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold text-green-600">
                                    {coupon.discountType === 'percentage' 
                                      ? `${coupon.discountValue}% OFF` 
                                      : `?${coupon.discountValue} OFF`}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                                {coupon.minOrderValue && coupon.minOrderValue > 0 && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Min order: ₹{coupon.minOrderValue}
                                  </p>
                                )}
                                {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                                  <p className="text-xs text-purple-600 mt-1">
                                    Max discount: ₹{coupon.maxDiscount}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* No coupons message */}
                      {coupons.length === 0 && (
                        <div className="text-center py-4 bg-gray-50 rounded-lg">
                          <Tag className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">No coupons available at the moment</p>
                          <p className="text-xs text-gray-400 mt-1">Check back later for special offers!</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {appliedCoupon && discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span className="font-medium">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (GST 18%)</span>
                    <span className="font-medium">{formatPrice(tax)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-lg">Total</span>
                    <span className="text-xl text-blue-600 font-medium">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors mb-3"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/"
                  className="block text-center text-blue-600 hover:text-blue-700 underline text-sm"
                >
                  Continue Shopping
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Secure Payment
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    100% Satisfaction Guaranteed
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Fast & Reliable Service
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* All Coupons Modal */}
      {showAllCouponsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="w-6 h-6" />
                <h2 className="text-2xl font-bold">All Available Coupons</h2>
              </div>
              <button
                onClick={() => setShowAllCouponsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {coupons.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl text-gray-700 mb-2">No Coupons Available</h3>
                  <p className="text-gray-500">Check back later for special offers and discounts!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">
                    We have <span className="font-semibold text-blue-600">{coupons.length}</span> active {coupons.length === 1 ? 'coupon' : 'coupons'} available for you!
                  </p>
                  
                  {coupons.map((coupon, index) => (
                    <div
                      key={coupon.id}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50"
                      onClick={() => {
                        handleApplyCoupon(coupon.code);
                        setShowAllCouponsModal(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow">
                          {/* Coupon Code Badge */}
                          <div className="inline-flex items-center gap-2 bg-blue-100 border-2 border-blue-300 border-dashed rounded-lg px-4 py-2 mb-3">
                            <Tag className="w-5 h-5 text-blue-600" />
                            <span className="font-mono text-xl font-bold text-blue-900">
                              {coupon.code}
                            </span>
                          </div>
                          
                          {/* Discount Badge */}
                          <div className="mb-3">
                            <span className="inline-block bg-green-500 text-white px-4 py-1 rounded-full text-lg font-bold">
                              {coupon.discountType === 'percentage' 
                                ? `${coupon.discountValue}% OFF` 
                                : `?${coupon.discountValue} OFF`}
                            </span>
                          </div>
                          
                          {/* Description */}
                          <p className="text-gray-700 mb-3">{coupon.description}</p>
                          
                          {/* Details */}
                          <div className="space-y-2 text-sm">
                            {coupon.minOrderValue && coupon.minOrderValue > 0 && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                                <span>Minimum order: <strong>₹{coupon.minOrderValue}</strong></span>
                              </div>
                            )}
                            {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                                <span>Maximum discount: <strong>₹{coupon.maxDiscount}</strong></span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <span>Valid until: <strong>{new Date(coupon.validUntil).toLocaleDateString()}</strong></span>
                            </div>
                            {coupon.usageLimit && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                                <span>Used: <strong>{coupon.usedCount}/{coupon.usageLimit}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Apply Button */}
                        <div className="flex-shrink-0">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyCoupon(coupon.code);
                              setShowAllCouponsModal(false);
                            }}
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                      
                      {/* Click to apply hint */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                          Click anywhere on this card to apply the coupon
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t">
              <button
                onClick={() => setShowAllCouponsModal(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

