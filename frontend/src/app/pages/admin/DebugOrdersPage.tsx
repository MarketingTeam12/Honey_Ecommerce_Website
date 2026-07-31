import { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { RefreshCw, Database, HardDrive, AlertCircle, CheckCircle } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

interface DebugOrderInfo {
  id: string;
  order_number: string;
  customer_email?: string;
  customer_name?: string;
  total_amount: string;
  created_at: string;
  source: 'localStorage' | 'backend';
}

export function DebugOrdersPage() {
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [backendOrders, setBackendOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendSuccess, setBackendSuccess] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setBackendError(null);
    setBackendSuccess(false);

    // Load from localStorage
    try {
      const stored = localStorage.getItem('honey_translation_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        setLocalOrders(parsed);
        console.log('📦 [DEBUG] localStorage orders:', parsed.length);
      } else {
        setLocalOrders([]);
        console.log('📦 [DEBUG] No localStorage orders found');
      }
    } catch (e) {
      console.error('❌ [DEBUG] Failed to load localStorage:', e);
      setLocalOrders([]);
    }

    // Load from backend
    try {
      console.log('📡 [DEBUG] Fetching from backend...');
      const url = `${API_URL}/debug/orders`;
      console.log('📡 [DEBUG] URL:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        }
      });

      console.log('📡 [DEBUG] Response status:', response.status);
      console.log('📡 [DEBUG] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('📡 [DEBUG] Backend response:', data);
        setBackendOrders(data.orders || data.data || []);
        setBackendSuccess(true);
      } else {
        const errorText = await response.text();
        console.error('❌ [DEBUG] Backend error:', errorText);
        setBackendError(`Backend returned ${response.status}: ${errorText}`);
        setBackendOrders([]);
      }
    } catch (e) {
      console.error('❌ [DEBUG] Backend fetch failed:', e);
      setBackendError(e instanceof Error ? e.message : 'Unknown error');
      setBackendOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const renderOrderCard = (order: any, source: string) => (
    <div key={`${source}-${order.id}`} className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{order.order_number || order.id}</p>
          <p className="text-sm text-gray-600">{order.customer_email || order.customer_name || 'Unknown'}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          source === 'localStorage' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}>
          {source}
        </span>
      </div>
      <div className="text-sm text-gray-500 space-y-1">
        <p>Amount: {order.total_amount || order.amount || 'N/A'}</p>
        <p>Created: {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</p>
        <p>Status: {order.status || order.payment_status || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Debug Orders</h1>
            <p className="text-gray-600">Compare orders in localStorage vs Backend Database</p>
          </div>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <HardDrive className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-blue-900">localStorage Orders</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{localOrders.length}</p>
            <p className="text-sm text-blue-700 mt-1">Stored in browser</p>
          </div>

          <div className={`border-2 rounded-xl p-6 ${
            backendSuccess ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <Database className={`w-6 h-6 ${backendSuccess ? 'text-green-600' : 'text-gray-600'}`} />
              <h3 className={`font-semibold ${backendSuccess ? 'text-green-900' : 'text-gray-900'}`}>
                Backend Orders
              </h3>
            </div>
            <p className={`text-3xl font-bold ${backendSuccess ? 'text-green-600' : 'text-gray-600'}`}>
              {backendOrders.length}
            </p>
            <p className={`text-sm mt-1 ${backendSuccess ? 'text-green-700' : 'text-gray-500'}`}>
              {backendSuccess ? 'Connected to Backend' : 'Backend unavailable'}
            </p>
          </div>

          <div className={`border-2 rounded-xl p-6 ${
            localOrders.length === backendOrders.length && backendSuccess
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {localOrders.length === backendOrders.length && backendSuccess ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
              <h3 className={`font-semibold ${
                localOrders.length === backendOrders.length && backendSuccess
                  ? 'text-green-900'
                  : 'text-yellow-900'
              }`}>
                Sync Status
              </h3>
            </div>
            <p className={`text-3xl font-bold ${
              localOrders.length === backendOrders.length && backendSuccess
                ? 'text-green-600'
                : 'text-yellow-600'
            }`}>
              {localOrders.length === backendOrders.length && backendSuccess ? '✓ Synced' : '⚠ Mismatch'}
            </p>
            <p className={`text-sm mt-1 ${
              localOrders.length === backendOrders.length && backendSuccess
                ? 'text-green-700'
                : 'text-yellow-700'
            }`}>
              {localOrders.length === backendOrders.length && backendSuccess
                ? 'All orders in sync'
                : `${Math.abs(localOrders.length - backendOrders.length)} difference`}
            </p>
          </div>
        </div>

        {/* Backend Error Alert */}
        {backendError && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Backend Connection Error</p>
                <p className="text-sm text-red-700 mt-1">{backendError}</p>
                <p className="text-xs text-red-600 mt-2">
                  This means new orders are being saved to localStorage only and won't appear in the admin panel until the backend is fixed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Orders Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* localStorage Orders */}
          <div>
            <div className="bg-blue-100 rounded-t-xl px-4 py-3 border-2 border-blue-200 border-b-0">
              <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                localStorage Orders ({localOrders.length})
              </h2>
            </div>
            <div className="border-2 border-blue-200 rounded-b-xl p-4 bg-white max-h-[600px] overflow-y-auto">
              {localOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders in localStorage</p>
              ) : (
                <div className="space-y-3">
                  {localOrders.map((order, index) => renderOrderCard(order, 'localStorage'))}
                </div>
              )}
            </div>
          </div>

          {/* Backend Orders */}
          <div>
            <div className={`rounded-t-xl px-4 py-3 border-2 border-b-0 ${
              backendSuccess
                ? 'bg-green-100 border-green-200'
                : 'bg-gray-100 border-gray-200'
            }`}>
              <h2 className={`font-semibold flex items-center gap-2 ${
                backendSuccess ? 'text-green-900' : 'text-gray-600'
              }`}>
                <Database className="w-5 h-5" />
                Backend Orders ({backendOrders.length})
              </h2>
            </div>
            <div className={`border-2 rounded-b-xl p-4 bg-white max-h-[600px] overflow-y-auto ${
              backendSuccess ? 'border-green-200' : 'border-gray-200'
            }`}>
              {backendOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {backendSuccess ? 'No orders in backend database' : 'Backend unavailable'}
                </p>
              ) : (
                <div className="space-y-3">
                  {backendOrders.map((order, index) => renderOrderCard(order, 'backend'))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">📋 How to Use This Page</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• <strong>localStorage Orders</strong>: Orders saved in your browser (temporary, device-specific)</p>
            <p>• <strong>Backend Orders</strong>: Orders saved in Backend database (permanent, cross-device)</p>
            <p>• <strong>Sync Status</strong>: Shows if localStorage and backend are in sync</p>
            <p className="mt-4 text-blue-700">
              ✅ <strong>If synced</strong>: New orders are being saved to both locations correctly
            </p>
            <p className="text-red-700">
              ⚠ <strong>If NOT synced</strong>: New orders may only be saving to localStorage (check backend connection)
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default DebugOrdersPage;
