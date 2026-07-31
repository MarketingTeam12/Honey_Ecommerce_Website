import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { API_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { Save, Key, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface APIKey {
  provider: string;
  keys: Record<string, string>;
}

interface PaymentGatewayKeys {
  razorpay?: {
    key_id?: string;
    key_secret?: string;
  };
  zoho_payments?: {
    client_id?: string;
    client_secret?: string;
    test_mode?: boolean;
  };
  zoho_books?: {
    organization_id?: string;
    client_id?: string;
    client_secret?: string;
    refresh_token?: string;
  };
}

export function APIKeysPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Visibility states for sensitive fields
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  // Razorpay
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');

  // Razorpay
  const [zohoPaymentsClientId, setZohoPaymentsClientId] = useState('');
  const [zohoPaymentsClientSecret, setZohoPaymentsClientSecret] = useState('');
  const [zohoPaymentsTestMode, setZohoPaymentsTestMode] = useState(true);

  // Zoho Books
  const [zohoBooksOrgId, setZohoBooksOrgId] = useState('');
  const [zohoBooksClientId, setZohoBooksClientId] = useState('');
  const [zohoBooksClientSecret, setZohoBooksClientSecret] = useState('');
  const [zohoBooksRefreshToken, setZohoBooksRefreshToken] = useState('');

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `${API_URL}/admin/api-keys`,
        {
          headers: buildHeaders(accessToken),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        // Check if it's a backend issue
        const errorText = await response.text().catch(() => '');
        const isBackendIssue = errorText.includes('Invalid JWT') || 
                               errorText.includes('"code":401') ||
                               response.status === 401 ||
                               response.status === 404;
        
        if (isBackendIssue) {
          console.log('ℹ️ Backend not deployed - API keys unavailable');
          setError('Backend not available. API keys cannot be loaded at this time.');
          return;
        }
        
        throw new Error('Failed to load API keys');
      }

      const data: PaymentGatewayKeys = await response.json();

      // Load Razorpay
      if (data.razorpay) {
        setRazorpayKeyId(data.razorpay.key_id || '');
        setRazorpayKeySecret(data.razorpay.key_secret || '');
      }

      // Load Razorpay
      if (data.zoho_payments) {
        setZohoPaymentsClientId(data.zoho_payments.client_id || '');
        setZohoPaymentsClientSecret(data.zoho_payments.client_secret || '');
        setZohoPaymentsTestMode(data.zoho_payments.test_mode ?? true);
      }

      // Load Zoho Books
      if (data.zoho_books) {
        setZohoBooksOrgId(data.zoho_books.organization_id || '');
        setZohoBooksClientId(data.zoho_books.client_id || '');
        setZohoBooksClientSecret(data.zoho_books.client_secret || '');
        setZohoBooksRefreshToken(data.zoho_books.refresh_token || '');
      }

    } catch (err: any) {
      console.error('Error loading API keys:', err);
      
      // Handle timeout
      if (err.name === 'AbortError') {
        setError('Request timed out. Backend may not be available.');
      } else if (err.message?.includes('fetch')) {
        setError('Network error. Backend may not be available.');
      } else {
        setError('Failed to load API keys');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveAPIKeys = async (provider: string, keys: Record<string, string>) => {
    try {
      setSaving(provider);
      setSaveSuccess(null);
      setError(null);

      const response = await fetch(
        `${API_URL}/admin/api-keys`,
        {
          method: 'POST',
          headers: buildHeaders(accessToken),
          body: JSON.stringify({ provider, keys })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save API keys');
      }

      setSaveSuccess(provider);
      setTimeout(() => setSaveSuccess(null), 3000);

    } catch (err) {
      console.error('Error saving API keys:', err);
      setError(`Failed to save ${provider} API keys`);
    } finally {
      setSaving(null);
    }
  };

  const toggleVisibility = (fieldName: string) => {
    setVisibility(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const InputField = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    fieldName,
    isSecret = false 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
    placeholder: string;
    fieldName: string;
    isSecret?: boolean;
  }) => {
    const isVisible = visibility[fieldName];
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            type={isSecret && !isVisible ? 'password' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          />
          {isSecret && (
            <button
              type="button"
              onClick={() => toggleVisibility(fieldName)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading API keys...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Key className="w-8 h-8 text-blue-600" />
            API Keys Management
          </h1>
          <p className="text-gray-600 mt-2">
            Configure your payment gateway and accounting integration API keys. All keys are stored securely.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Razorpay Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  Razorpay
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure the server-side Razorpay credentials used to create checkout orders for all users
                </p>
              </div>
              {saveSuccess === 'razorpay' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Saved!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <InputField
                label="Key ID"
                value={razorpayKeyId}
                onChange={setRazorpayKeyId}
                placeholder="Enter Razorpay Key ID"
                fieldName="razorpay_key_id"
                isSecret={true}
              />
              <InputField
                label="Key Secret"
                value={razorpayKeySecret}
                onChange={setRazorpayKeySecret}
                placeholder="Enter Razorpay Key Secret"
                fieldName="razorpay_key_secret"
                isSecret={true}
              />
            </div>

            <button
              onClick={() => saveAPIKeys('razorpay', {
                key_id: razorpayKeyId,
                key_secret: razorpayKeySecret
              })}
              disabled={saving === 'razorpay'}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving === 'razorpay' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Razorpay Keys
                </>
              )}
            </button>
          </div>

          {/* Razorpay Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  Razorpay
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure Razorpay gateway for processing transactions
                </p>
              </div>
              {saveSuccess === 'zoho_payments' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Saved!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <InputField
                label="Client ID"
                value={zohoPaymentsClientId}
                onChange={setZohoPaymentsClientId}
                placeholder="Enter Razorpay Client ID"
                fieldName="zoho_payments_client_id"
                isSecret={true}
              />
              <InputField
                label="Client Secret"
                value={zohoPaymentsClientSecret}
                onChange={setZohoPaymentsClientSecret}
                placeholder="Enter Razorpay Client Secret"
                fieldName="zoho_payments_client_secret"
                isSecret={true}
              />
            </div>

            {/* Test Mode Toggle */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={zohoPaymentsTestMode}
                  onChange={(e) => setZohoPaymentsTestMode(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Enable Test Mode</p>
                  <p className="text-sm text-gray-600">
                    Use Razorpay\'s test environment for development and testing. Disable for live transactions.
                  </p>
                </div>
              </label>
            </div>

            <button
              onClick={() => saveAPIKeys('zoho_payments', {
                client_id: zohoPaymentsClientId,
                client_secret: zohoPaymentsClientSecret,
                test_mode: zohoPaymentsTestMode
              })}
              disabled={saving === 'zoho_payments'}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving === 'zoho_payments' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Razorpay Keys
                </>
              )}
            </button>
          </div>

          {/* Zoho Books Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  Zoho Books
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure Zoho Books for automatic accounting and invoicing integration
                </p>
              </div>
              {saveSuccess === 'zoho_books' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Saved!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <InputField
                label="Organization ID"
                value={zohoBooksOrgId}
                onChange={setZohoBooksOrgId}
                placeholder="Enter Zoho Books Organization ID"
                fieldName="zoho_books_org_id"
              />
              <InputField
                label="Client ID"
                value={zohoBooksClientId}
                onChange={setZohoBooksClientId}
                placeholder="Enter Zoho Books Client ID"
                fieldName="zoho_books_client_id"
              />
              <InputField
                label="Client Secret"
                value={zohoBooksClientSecret}
                onChange={setZohoBooksClientSecret}
                placeholder="Enter Zoho Books Client Secret"
                fieldName="zoho_books_client_secret"
                isSecret={true}
              />
              <InputField
                label="Refresh Token"
                value={zohoBooksRefreshToken}
                onChange={setZohoBooksRefreshToken}
                placeholder="Enter Zoho Books Refresh Token"
                fieldName="zoho_books_refresh_token"
                isSecret={true}
              />
            </div>

            <button
              onClick={() => saveAPIKeys('zoho_books', {
                organization_id: zohoBooksOrgId,
                client_id: zohoBooksClientId,
                client_secret: zohoBooksClientSecret,
                refresh_token: zohoBooksRefreshToken
              })}
              disabled={saving === 'zoho_books'}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving === 'zoho_books' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Zoho Books Keys
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Important Notes</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>All API keys are encrypted and stored securely in the database</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Once saved, payment gateways will automatically integrate with your checkout flow</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Zoho Books integration will automatically sync invoices and transactions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Use test/sandbox keys for development and live keys for production</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Never share your secret keys with anyone</span>
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
