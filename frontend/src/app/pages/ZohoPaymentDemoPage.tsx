import { useState } from 'react';
import { 
  ZohoPayNowButton, 
  ZohoPayNowButtonMinimal, 
  ZohoPayNowIconButton 
} from '@/app/components/ZohoPayNowButton';
import { ShoppingCart, CheckCircle, Info, Shield, Sparkles } from 'lucide-react';

export function ZohoPaymentDemoPage() {
  const [lastAction, setLastAction] = useState<string>('');

  const handleBeforeOpen = async () => {
    setLastAction('Preparing payment...');
    // Simulate any pre-payment logic
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const handleAfterOpen = () => {
    setLastAction('Payment page opened successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Razorpayment Integration
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Secure, production-ready payment buttons with modern UI design
          </p>
        </div>

        {/* Status Display */}
        {lastAction && (
          <div className="max-w-2xl mx-auto mb-8 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800 font-medium">{lastAction}</p>
            </div>
          </div>
        )}

        {/* Demo Sections */}
        <div className="space-y-8">
          {/* Primary Button Variants */}
          <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Premium Button Variants</h2>
            </div>
            
            <div className="space-y-6">
              {/* Large */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Large Size - Perfect for checkout pages
                </label>
                <ZohoPayNowButton
                  size="lg"
                  text="Complete Payment"
                  onBeforeOpen={handleBeforeOpen}
                  onAfterOpen={handleAfterOpen}
                />
              </div>

              {/* Medium */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Medium Size - Default variant
                </label>
                <ZohoPayNowButton
                  size="md"
                  onBeforeOpen={handleBeforeOpen}
                  onAfterOpen={handleAfterOpen}
                />
              </div>

              {/* Small */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Small Size - Compact areas
                </label>
                <ZohoPayNowButton
                  size="sm"
                  text="Pay"
                  onBeforeOpen={handleBeforeOpen}
                  onAfterOpen={handleAfterOpen}
                />
              </div>

              {/* Full Width */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Full Width - Mobile optimized
                </label>
                <ZohoPayNowButton
                  size="lg"
                  fullWidth
                  text="Proceed to Secure Payment"
                  onBeforeOpen={handleBeforeOpen}
                  onAfterOpen={handleAfterOpen}
                />
              </div>

              {/* Without Icon */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Without Icon - Clean design
                </label>
                <ZohoPayNowButton
                  showIcon={false}
                  text="Pay Now"
                  onBeforeOpen={handleBeforeOpen}
                  onAfterOpen={handleAfterOpen}
                />
              </div>
            </div>
          </section>

          {/* Minimal Variant */}
          <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Minimal Variant</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Outlined Style - Secondary action
                </label>
                <ZohoPayNowButtonMinimal
                  text="Proceed to Payment"
                  onBeforeOpen={handleBeforeOpen}
                  onAfterOpen={handleAfterOpen}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Full Width Minimal
                </label>
                <ZohoPayNowButtonMinimal
                  className="w-full"
                  text="Continue to Razorpay"
                  onBeforeOpen={handleBeforeOpen}
                  onAfterOpen={handleAfterOpen}
                />
              </div>
            </div>
          </section>

          {/* Icon Button */}
          <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Icon Button</h2>
            
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Compact floating action button
              </label>
              <ZohoPayNowIconButton
                onBeforeOpen={handleBeforeOpen}
                onAfterOpen={handleAfterOpen}
              />
            </div>
          </section>

          {/* Disabled State */}
          <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Disabled States</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Disabled Primary Button
                </label>
                <ZohoPayNowButton
                  disabled
                  text="Payment Unavailable"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Disabled Minimal Button
                </label>
                <ZohoPayNowButtonMinimal
                  disabled
                  text="Payment Processing..."
                />
              </div>
            </div>
          </section>

          {/* Real-world Examples */}
          <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Real-World Checkout Example</h2>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
              {/* Cart Summary */}
              <div className="flex items-center justify-between text-white/90">
                <span>Translation Service</span>
                <span className="font-semibold">₹2,000</span>
              </div>
              <div className="flex items-center justify-between text-white/90">
                <span>Tax (18%)</span>
                <span className="font-semibold">₹360</span>
              </div>
              <div className="border-t border-white/20 pt-4 flex items-center justify-between text-white text-lg font-bold">
                <span>Total</span>
                <span>₹2,360</span>
              </div>

              {/* Payment Button */}
              <div className="pt-4">
                <ZohoPayNowButton
                  size="lg"
                  fullWidth
                  text="Pay ₹2,360 Now"
                  onBeforeOpen={async () => {
                    setLastAction('Validating order details...');
                    await new Promise(resolve => setTimeout(resolve, 800));
                  }}
                  onAfterOpen={() => {
                    setLastAction('Redirected to secure Razorpayment gateway');
                  }}
                />
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-4 pt-4 text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>Secure Payment</span>
                </div>
                <span>•</span>
                <span>256-bit SSL Encryption</span>
                <span>•</span>
                <span>PCI Compliant</span>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Secure Redirect</h3>
                  <p className="text-sm text-gray-600">
                    Opens in new tab with noopener, noreferrer for maximum security
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Production Ready</h3>
                  <p className="text-sm text-gray-600">
                    Fully tested and optimized for desktop & mobile devices
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Premium UI</h3>
                  <p className="text-sm text-gray-600">
                    Modern animations, hover effects, and smooth transitions
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Info className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Accessible</h3>
                  <p className="text-sm text-gray-600">
                    WCAG compliant with proper ARIA labels and keyboard support
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Code Example */}
          <section className="bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6">Usage Example</h2>
            
            <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300 font-mono">
{`import { ZohoPayNowButton } from '@/app/components/ZohoPayNowButton';

function CheckoutPage() {
  return (
    <ZohoPayNowButton
      size="lg"
      fullWidth
      text="Complete Payment"
      onBeforeOpen={async () => {
        // Validate order, save data, etc.
        console.log('Preparing payment...');
      }}
      onAfterOpen={() => {
        // Track analytics, show confirmation, etc.
        console.log('Payment window opened');
      }}
    />
  );
}`}
              </pre>
            </div>
          </section>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-full border border-blue-200">
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">
              All buttons redirect to: https://www.zoho.com/us/payments/
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ZohoPaymentDemoPage;
