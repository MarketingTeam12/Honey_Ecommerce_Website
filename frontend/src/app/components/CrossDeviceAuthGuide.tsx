import { Smartphone, Monitor, Globe, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export function CrossDeviceAuthGuide() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cross-Device Authentication Guide</h2>
        
        {/* Overview */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            How It Works
          </h3>
          <p className="text-gray-700 leading-relaxed">
            Honey Translation Services uses cloud-based authentication powered by authClient. When you create an account, 
            your credentials are securely stored in the cloud, allowing you to access your account from any device, 
            anywhere in the world.
          </p>
        </div>

        {/* Key Features */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">Universal Access</h4>
                <p className="text-sm text-green-800">Sign in from any device using the same email and password</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Automatic Sync</h4>
                <p className="text-sm text-blue-800">Your profile, orders, and preferences sync across all devices</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900 mb-1">Session Persistence</h4>
                <p className="text-sm text-purple-800">Stay signed in across browser sessions and restarts</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Auto Refresh</h4>
                <p className="text-sm text-amber-800">Expired tokens are automatically refreshed to keep you logged in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Guide */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use Your Account on Multiple Devices</h3>
          
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Create Your Account (One Time)</h4>
                <p className="text-gray-700 text-sm mb-2">
                  Sign up once with your email address and password. This creates your account in our cloud database.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                  <p className="text-gray-600 mb-1">📧 Use a valid email address</p>
                  <p className="text-gray-600 mb-1">🔐 Choose a strong password (minimum 6 characters)</p>
                  <p className="text-gray-600">✅ Your account is immediately active</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Sign In from Any Device</h4>
                <p className="text-gray-700 text-sm mb-2">
                  Open the website on any device (phone, tablet, laptop, desktop) and sign in with your credentials.
                </p>
                <div className="flex gap-3 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <Monitor className="w-4 h-4" />
                    <span>Desktop</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <Globe className="w-4 h-4" />
                    <span>Any Browser</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Access Your Data</h4>
                <p className="text-gray-700 text-sm mb-2">
                  All your information is synchronized across devices:
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Profile information and preferences
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Order history and tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Saved addresses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Shopping cart (when signed in)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Notes</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Use the Same Credentials</h4>
                <p className="text-sm text-blue-800">
                  Always use the same email address and password that you used during signup. Your credentials are case-sensitive.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Demo Accounts Limitation</h4>
                <p className="text-sm text-amber-800">
                  Demo accounts (customer@example.com, admin@honeytranslations.com) use local storage and will NOT work across devices. 
                  Create a real account with your email address for cross-device access.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">Secure & Private</h4>
                <p className="text-sm text-green-800">
                  All authentication is handled by Backend with industry-standard encryption. Your password is never stored in plain text.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Can't sign in on a new device?</h4>
                <p className="text-sm text-gray-700">
                  Double-check that you're using the exact same email and password. Passwords are case-sensitive.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Session expired?</h4>
                <p className="text-sm text-gray-700">
                  Simply sign in again. Your account data is never lost - it's safely stored in the cloud.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1 text-sm">Using a demo account?</h4>
                <p className="text-sm text-gray-700">
                  Demo accounts are for testing only and don't support cross-device access. Create a real account with your email to use this feature.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
