import { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { CreditCard, Save, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { API_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { toast } from 'sonner';

export function PaymentSettingsPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [testMode, setTestMode] = useState(true);

  // Razorpay credentials
  const [zohoPayments, setZohoPayments] = useState({
    client_id: '',
    client_secret: '',
    test_mode: true
  });

  // Zoho Books credentials
  const [zohoBooks, setZohoBooks] = useState({
    client_id: '',
    client_secret: '',
    refresh_token: '',
    organization_id: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `${API_URL}/admin/api-keys`,
        {
          headers: buildHeaders(accessToken),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        
        if (data.apiKeys?.zoho_payments) {
          setZohoPayments({
            client_id: data.apiKeys.zoho_payments.client_id || '',
            client_secret: data.apiKeys.zoho_payments.client_secret || '',
            test_mode: data.apiKeys.zoho_payments.test_mode !== false
          });
          setTestMode(data.apiKeys.zoho_payments.test_mode !== false);
        }

        if (data.apiKeys?.zoho_books) {
          setZohoBooks({
            client_id: data.apiKeys.zoho_books.client_id || '',
            client_secret: data.apiKeys.zoho_books.client_secret || '',
            refresh_token: data.apiKeys.zoho_books.refresh_token || '',
            organization_id: data.apiKeys.zoho_books.organization_id || ''
          });
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('ℹ️ [PaymentSettings] Request timed out - backend not responding');
      } else {
        console.log('ℹ️ Error loading settings:', error.message);
      }
      // Silently fail - user can still configure settings
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Save Razorpay
      const paymentsResponse = await fetch(
        `${API_URL}/admin/api-keys`,
        {
          method: 'POST',
          headers: buildHeaders(accessToken),
          body: JSON.stringify({
            service: 'zoho_payments',
            credentials: {
              ...zohoPayments,
              test_mode: testMode
            }
          })
        }
      );

      if (!paymentsResponse.ok) {
        throw new Error('Failed to save Razorpay credentials');
      }

      // Save Zoho Books if configured
      if (zohoBooks.client_id && zohoBooks.client_secret) {
        const booksResponse = await fetch(
          `${API_URL}/admin/api-keys`,
          {
            method: 'POST',
            headers: buildHeaders(accessToken),
            body: JSON.stringify({
              service: 'zoho_books',
              credentials: zohoBooks
            })
          }
        );

        if (!booksResponse.ok) {
          console.warn('Failed to save Zoho Books credentials');
        }
      }

      toast.success('Payment settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!zohoPayments.client_id || !zohoPayments.client_secret) {
      toast.error('Please enter Razorpay credentials first');
      return;
    }

    try {
      toast.info('Testing Razorpay connection...');
      
      // Create a test payment to verify credentials
      const response = await fetch(
        `${API_URL}/payment/zoho/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildHeaders(accessToken)
          },
          body: JSON.stringify({
            orderId: 'TEST_' + Date.now(),
            orderNumber: 'TEST_' + Date.now(),
            trackingNumber: 'TEST_TRK',
            amount: 1,
            currency: 'INR',
            userId: 'test',
            userEmail: 'test@honeytranslations.com',
            userName: 'Test User',
            items: [{ name: 'Test Service', sourceLanguage: 'English', targetLanguage: 'Spanish', pageCount: 1, price: 1 }],
            subtotal: 1,
            discount: 0,
            tax: 0
          })
        }
      );

      const data = await response.json();

      if (data.success && data.paymentUrl && !data.demo) {
        toast.success('✅ Razorpay connection successful!');
      } else if (data.demo) {
        toast.warning('⚠️ Running in demo mode - Please check credentials');
      } else {
        toast.error('❌ Failed to connect to Razorpay');
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Failed to test connection');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-600" />
            Payment Gateway Settings
          </h1>
          <p className="text-gray-600 mt-2">Configure Razorpay integration for real payment processing</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How to Get Razorpay Credentials</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://payments.zoho.in" target="_blank" rel="noopener noreferrer" className="underline font-medium">Razorpay Dashboard</a></li>
                <li>Navigate to Settings → API Keys</li>
                <li>Create a new API key or use existing credentials</li>
                <li>Copy your Client ID and Client Secret</li>
                <li>For testing, use Test Mode. For production, disable Test Mode</li>
              </ol>
              <p className="mt-3 text-sm text-blue-700 font-medium">
                📖 <a href="https://www.zoho.com/in/payments/api/" target="_blank" rel="noopener noreferrer" className="underline">View Razorpay API Documentation</a>
              </p>
            </div>
          </div>
        </div>

        {/* Razorpay Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Razorpay (Exclusive Gateway)</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="test-mode" className="text-sm font-medium text-gray-700">Test Mode</Label>
              <input
                type="checkbox"
                id="test-mode"
                checked={testMode}
                onChange={(e) => {
                  setTestMode(e.target.checked);
                  setZohoPayments({ ...zohoPayments, test_mode: e.target.checked });
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Client ID */}
            <div>
              <Label htmlFor="zoho-client-id" className="text-sm font-medium text-gray-700 mb-2 block">
                Client ID <span className="text-red-600">*</span>
              </Label>
              <input
                id="zoho-client-id"
                type={showSecrets ? 'text' : 'password'}
                value={zohoPayments.client_id}
                onChange={(e) => setZohoPayments({ ...zohoPayments, client_id: e.target.value })}
                placeholder="Enter your Razorpay Client ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Client Secret */}
            <div>
              <Label htmlFor="zoho-client-secret" className="text-sm font-medium text-gray-700 mb-2 block">
                Client Secret <span className="text-red-600">*</span>
              </Label>
              <div className="relative">
                <input
                  id="zoho-client-secret"
                  type={showSecrets ? 'text' : 'password'}
                  value={zohoPayments.client_secret}
                  onChange={(e) => setZohoPayments({ ...zohoPayments, client_secret: e.target.value })}
                  placeholder="Enter your Razorpay Client Secret"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Test Connection Button */}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                className="w-full sm:w-auto"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Test Connection
              </Button>
            </div>
          </div>
        </div>

        {/* Zoho Books Configuration (Optional) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Zoho Books (Optional)</h2>
          <p className="text-sm text-gray-600 mb-6">Configure Zoho Books for automatic invoice generation</p>

          <div className="space-y-6">
            <div>
              <Label htmlFor="books-client-id" className="text-sm font-medium text-gray-700 mb-2 block">
                Client ID
              </Label>
              <input
                id="books-client-id"
                type={showSecrets ? 'text' : 'password'}
                value={zohoBooks.client_id}
                onChange={(e) => setZohoBooks({ ...zohoBooks, client_id: e.target.value })}
                placeholder="Optional: Zoho Books Client ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <Label htmlFor="books-client-secret" className="text-sm font-medium text-gray-700 mb-2 block">
                Client Secret
              </Label>
              <input
                id="books-client-secret"
                type={showSecrets ? 'text' : 'password'}
                value={zohoBooks.client_secret}
                onChange={(e) => setZohoBooks({ ...zohoBooks, client_secret: e.target.value })}
                placeholder="Optional: Zoho Books Client Secret"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <Label htmlFor="books-refresh-token" className="text-sm font-medium text-gray-700 mb-2 block">
                Refresh Token
              </Label>
              <input
                id="books-refresh-token"
                type={showSecrets ? 'text' : 'password'}
                value={zohoBooks.refresh_token}
                onChange={(e) => setZohoBooks({ ...zohoBooks, refresh_token: e.target.value })}
                placeholder="Optional: Zoho Books Refresh Token"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <Label htmlFor="books-org-id" className="text-sm font-medium text-gray-700 mb-2 block">
                Organization ID
              </Label>
              <input
                id="books-org-id"
                type="text"
                value={zohoBooks.organization_id}
                onChange={(e) => setZohoBooks({ ...zohoBooks, organization_id: e.target.value })}
                placeholder="Optional: Zoho Books Organization ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={saveSettings}
            disabled={saving || !zohoPayments.client_id || !zohoPayments.client_secret}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Settings
              </>
            )}
          </Button>

          <p className="text-sm text-gray-600">
            {zohoPayments.client_id && zohoPayments.client_secret
              ? '✅ Credentials configured'
              : '⚠️ Credentials required for live payments'}
          </p>
        </div>

        {/* Current Status */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Current Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${zohoPayments.client_id && zohoPayments.client_secret ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-gray-700">
                Razorpay: {zohoPayments.client_id && zohoPayments.client_secret ? 'Configured' : 'Not configured (Demo mode)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${testMode ? 'bg-blue-500' : 'bg-green-500'}`} />
              <span className="text-gray-700">
                Mode: {testMode ? 'Test Mode (Sandbox)' : 'Production Mode (Live)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${zohoBooks.client_id && zohoBooks.organization_id ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-gray-700">
                Zoho Books: {zohoBooks.client_id && zohoBooks.organization_id ? 'Configured (Invoicing enabled)' : 'Optional (Not configured)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}