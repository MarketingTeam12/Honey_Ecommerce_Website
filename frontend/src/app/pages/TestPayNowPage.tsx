import { ZohoPayNowButton } from '@/app/components/ZohoPayNowButton';

/**
 * Simple test page to verify Pay Now button works
 * Navigate to /test-pay-now to test
 */
export function TestPayNowPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Test Payment Button
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Click the button below to open Razorpay
        </p>
        
        <ZohoPayNowButton
          size="lg"
          fullWidth
          text="Open Razorpay"
          onBeforeOpen={() => {
            console.log('🔐 Opening Razorpay...');
          }}
          onAfterOpen={() => {
            console.log('✅ Razorpay opened successfully!');
            alert('Success! Check the new tab for Razorpay.');
          }}
        />

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900 font-semibold mb-2">
            ✓ Expected behavior:
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• New tab opens</li>
            <li>• URL: https://www.zoho.com/us/payments/</li>
            <li>• Alert shows after opening</li>
            <li>• Console logs appear</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TestPayNowPage;
