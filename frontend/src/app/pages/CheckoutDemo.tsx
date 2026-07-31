import { Link } from 'react-router-dom';
import { ShoppingCart, MapPin, FileCheck, CreditCard, ArrowRight } from 'lucide-react';

export function CheckoutDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl mb-4">Multi-Step Checkout Flow</h1>
          <p className="text-xl text-gray-700">
            Experience our seamless 4-step checkout process for translation services
          </p>
        </div>

        {/* Flow Diagram */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <ShoppingCart className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Step 1</h3>
              <p className="text-gray-600 text-center">Cart Page</p>
            </div>
            
            <ArrowRight className="w-8 h-8 text-gray-400 flex-shrink-0 mx-4" />
            
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Step 2</h3>
              <p className="text-gray-600 text-center">Address</p>
            </div>
            
            <ArrowRight className="w-8 h-8 text-gray-400 flex-shrink-0 mx-4" />
            
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <FileCheck className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Step 3</h3>
              <p className="text-gray-600 text-center">Review Order</p>
            </div>
            
            <ArrowRight className="w-8 h-8 text-gray-400 flex-shrink-0 mx-4" />
            
            <div className="flex flex-col items-center flex-1">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Step 4</h3>
              <p className="text-gray-600 text-center">Payment</p>
            </div>
          </div>
        </div>

        {/* Screen Cards */}
        <div className="grid grid-cols-2 gap-8">
          {/* Screen 1 - Cart */}
          <Link 
            to="/cart"
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">SCREEN 1</p>
                  <h2 className="text-2xl text-white">Cart Page</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Product image & details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Selected options (Source/Target language)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Document preview</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Page quantity selector (+/-)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Order summary sidebar</span>
                </li>
              </ul>
              <div className="flex items-center justify-between text-blue-600 group-hover:text-blue-700">
                <span className="font-medium">View Screen</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Screen 2 - Address */}
          <Link 
            to="/checkout/address"
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6">
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <p className="text-indigo-100 text-sm">SCREEN 2</p>
                  <h2 className="text-2xl text-white">Address Page</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Step indicator (Address -&gt; Review)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Saved billing addresses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Add new address option</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Coupon code application</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Updated order summary</span>
                </li>
              </ul>
              <div className="flex items-center justify-between text-indigo-600 group-hover:text-indigo-700">
                <span className="font-medium">View Screen</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Screen 3 - Review */}
          <Link 
            to="/checkout/review"
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
          >
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-purple-100 text-sm">SCREEN 3</p>
                  <h2 className="text-2xl text-white">Review Order</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Billing address with edit option</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Complete order details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Language selections & documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Additional notes textbox</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Final payment summary</span>
                </li>
              </ul>
              <div className="flex items-center justify-between text-purple-600 group-hover:text-purple-700">
                <span className="font-medium">View Screen</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Screen 4 - Payment */}
          <Link 
            to="/checkout/payment"
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
          >
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-green-100 text-sm">SCREEN 4</p>
                  <h2 className="text-2xl text-white">Payment Gateway</h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Multiple payment methods</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Card / UPI / Net Banking / Wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Secure payment UI (Razorpay)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Final amount display</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">[OK]</span>
                  <span className="text-gray-700">Security badges & encryption info</span>
                </li>
              </ul>
              <div className="flex items-center justify-between text-green-600 group-hover:text-green-700">
                <span className="font-medium">View Screen</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Flow Rules */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-12">
          <h2 className="text-2xl mb-6 text-center">Checkout Flow Rules</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-lg mb-4 text-green-800">[OK] Correct Flow</h3>
              <ul className="space-y-2 text-gray-700">
                <li>Add to Cart -&gt; Cart Page</li>
                <li>Checkout -&gt; Address Page</li>
                <li>Continue -&gt; Review Order Page</li>
                <li>Make Payment -&gt; Payment Page</li>
                <li>No steps can be skipped</li>
              </ul>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="text-lg mb-4 text-red-800">[X] What NOT to Do</h3>
              <ul className="space-y-2 text-gray-700">
                <li>- Add to Cart -&gt; Direct Payment [X]</li>
                <li>- Skip Cart Page [X]</li>
                <li>- Skip Address Step [X]</li>
                <li>- Skip Review Step [X]</li>
                <li>- Direct checkout without cart [X]</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Start Demo Button */}
        <div className="text-center mt-12">
          <Link
            to="/english-to-foreign-language"
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl text-lg"
          >
            <ShoppingCart className="w-6 h-6" />
            Start Demo - Add Product to Cart
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="text-gray-600 mt-4">
            Add a product to your cart to experience the complete checkout flow
          </p>
        </div>
      </div>
    </div>
  );
}

export default CheckoutDemo;
