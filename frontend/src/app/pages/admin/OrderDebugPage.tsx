import { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';

export function OrderDebugPage() {
  const [loading, setLoading] = useState(false);
  const [backendOrders, setBackendOrders] = useState<any[]>([]);
  const [localStorageOrders, setLocalStorageOrders] = useState<any[]>([]);
  const [debugOrders, setDebugOrders] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    
    // 1. Fetch from backend /orders endpoint
    try {
      console.log('🔍 [Debug] Fetching from /orders endpoint...');
      const response = await fetch(`${API_URL}/orders`, {
        headers: buildHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackendOrders(data.orders || []);
        console.log('✅ [Debug] Backend orders:', data.orders?.length || 0);
      } else {
        console.error('❌ [Debug] Failed to fetch from /orders');
        setBackendOrders([]);
      }
    } catch (error) {
      console.error('❌ [Debug] Error fetching backend orders:', error);
      setBackendOrders([]);
    }
    
    // 2. Fetch from debug endpoint
    try {
      console.log('🔍 [Debug] Fetching from /debug/orders endpoint...');
      const response = await fetch(`${API_URL}/debug/orders`, {
        headers: buildHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebugOrders(data.orders || []);
        console.log('✅ [Debug] Debug endpoint orders:', data.orders?.length || 0);
      } else {
        console.error('❌ [Debug] Failed to fetch from /debug/orders');
        setDebugOrders([]);
      }
    } catch (error) {
      console.error('❌ [Debug] Error fetching debug orders:', error);
      setDebugOrders([]);
    }
    
    // 3. Load from localStorage
    try {
      const stored = localStorage.getItem('honey_translation_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        setLocalStorageOrders(parsed);
        console.log('✅ [Debug] LocalStorage orders:', parsed.length);
      } else {
        setLocalStorageOrders([]);
      }
    } catch (error) {
      console.error('❌ [Debug] Error reading localStorage:', error);
      setLocalStorageOrders([]);
    }
    
    setLoading(false);
  };

  const syncLocalToBackend = async () => {
    if (localStorageOrders.length === 0) {
      setSyncStatus('No orders in localStorage to sync');
      return;
    }

    setSyncStatus('Syncing...');
    let successCount = 0;
    let failCount = 0;

    for (const order of localStorageOrders) {
      try {
        console.log('📤 [Debug] Syncing order to backend:', order.order_number);
        
        const response = await fetch(`${API_URL}/payment/create-order`, {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify({
            userId: order.user_id,
            userEmail: order.customer_email,
            userName: order.customer_name,
            orderId: order.id,
            orderNumber: order.order_number,
            trackingNumber: order.tracking_number,
            amount: parseFloat(order.total_amount),
            currency: order.currency,
            paymentMethod: order.payment_method,
            items: order.items,
            subtotal: parseFloat(order.subtotal),
            discount: parseFloat(order.discount || '0'),
            tax: parseFloat(order.tax),
            shippingAddress: order.shipping_address,
            notes: order.notes || '',
            tip: parseFloat(order.tip || '0'),
            shippingMethod: order.shipping_method || 'email'
          })
        });

        if (response.ok) {
          successCount++;
          console.log('✅ [Debug] Synced:', order.order_number);
        } else {
          failCount++;
          const errorData = await response.json();
          console.error('❌ [Debug] Failed to sync:', order.order_number, errorData);
        }
      } catch (error) {
        failCount++;
        console.error('❌ [Debug] Error syncing:', order.order_number, error);
      }
    }

    setSyncStatus(`Sync complete: ${successCount} success, ${failCount} failed`);
    
    // Refresh data
    setTimeout(() => {
      loadAllData();
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Debug Panel</h1>
          <p className="text-gray-600">Diagnose order synchronization issues</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh All Data
          </button>
          
          <button
            onClick={syncLocalToBackend}
            disabled={loading || localStorageOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Sync LocalStorage → Backend
          </button>
        </div>

        {syncStatus && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">{syncStatus}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Backend Orders</h3>
              {backendOrders.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">{backendOrders.length}</p>
            <p className="text-sm text-gray-500 mt-1">Via /orders endpoint</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Debug Endpoint</h3>
              {debugOrders.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">{debugOrders.length}</p>
            <p className="text-sm text-gray-500 mt-1">Via /debug/orders endpoint</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">LocalStorage Orders</h3>
              {localStorageOrders.length > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">{localStorageOrders.length}</p>
            <p className="text-sm text-gray-500 mt-1">Browser storage only</p>
          </div>
        </div>

        {/* Backend Orders Detail */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Backend Orders ({backendOrders.length})
          </h2>
          {backendOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Order #</th>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {backendOrders.map((order, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 font-medium">{order.order_number}</td>
                      <td className="px-4 py-2">{order.customer_name || 'N/A'}</td>
                      <td className="px-4 py-2">{order.customer_email || 'N/A'}</td>
                      <td className="px-4 py-2 text-right">₹{order.total_amount}</td>
                      <td className="px-4 py-2">
                        {new Date(order.created_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No orders found in backend</p>
          )}
        </div>

        {/* LocalStorage Orders Detail */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            LocalStorage Orders ({localStorageOrders.length})
          </h2>
          {localStorageOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Order #</th>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {localStorageOrders.map((order, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 font-medium">{order.order_number}</td>
                      <td className="px-4 py-2">{order.customer_name || 'N/A'}</td>
                      <td className="px-4 py-2">{order.customer_email || 'N/A'}</td>
                      <td className="px-4 py-2 text-right">₹{order.total_amount}</td>
                      <td className="px-4 py-2">
                        {new Date(order.created_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No orders in localStorage</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}