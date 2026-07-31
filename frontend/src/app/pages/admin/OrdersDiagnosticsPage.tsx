import { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { RefreshCw, Database, HardDrive, AlertCircle, CheckCircle, XCircle, Copy, ExternalLink } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

export function OrdersDiagnosticsPage() {
  const { accessToken } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      localStorage: {},
      backend: {},
      debugEndpoint: {},
      environment: {}
    };

    try {
      // 1. Check localStorage
      console.log('🔍 [Diagnostics] Checking localStorage...');
      const localOrdersKey = 'honey_translation_orders';
      const userOrdersKey = 'user_orders';
      
      const localOrders = localStorage.getItem(localOrdersKey);
      const userOrders = localStorage.getItem(userOrdersKey);
      
      results.localStorage = {
        honey_translation_orders: {
          exists: !!localOrders,
          count: localOrders ? JSON.parse(localOrders).length : 0,
          data: localOrders ? JSON.parse(localOrders) : null
        },
        user_orders: {
          exists: !!userOrders,
          count: userOrders ? JSON.parse(userOrders).length : 0,
          data: userOrders ? JSON.parse(userOrders) : null
        }
      };
      
      console.log('✅ [Diagnostics] localStorage check complete:', results.localStorage);

      // 2. Check backend /orders endpoint
      console.log('🔍 [Diagnostics] Checking backend /orders endpoint...');
      try {
        const backendUrl = `${API_URL}/orders`;
        const backendResponse = await fetch(backendUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        });
        
        results.backend = {
          url: backendUrl,
          status: backendResponse.status,
          ok: backendResponse.ok,
          statusText: backendResponse.statusText
        };
        
        if (backendResponse.ok) {
          const data = await backendResponse.json();
          results.backend.ordersCount = data.orders?.length || 0;
          results.backend.orders = data.orders || [];
          results.backend.success = true;
        } else {
          const errorText = await backendResponse.text();
          results.backend.error = errorText;
          results.backend.success = false;
        }
        
        console.log('✅ [Diagnostics] Backend check complete:', results.backend);
      } catch (backendError: any) {
        results.backend = {
          success: false,
          error: backendError.message,
          details: backendError.toString()
        };
        console.error('❌ [Diagnostics] Backend check failed:', backendError);
      }

      // 3. Check debug endpoint
      console.log('🔍 [Diagnostics] Checking debug /orders endpoint...');
      try {
        const debugUrl = `${API_URL}/debug/orders`;
        const debugResponse = await fetch(debugUrl, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        });
        
        results.debugEndpoint = {
          url: debugUrl,
          status: debugResponse.status,
          ok: debugResponse.ok
        };
        
        if (debugResponse.ok) {
          const data = await debugResponse.json();
          results.debugEndpoint.count = data.count || 0;
          results.debugEndpoint.orders = data.orders || [];
          results.debugEndpoint.success = true;
        } else {
          const errorText = await debugResponse.text();
          results.debugEndpoint.error = errorText;
          results.debugEndpoint.success = false;
        }
        
        console.log('✅ [Diagnostics] Debug endpoint check complete:', results.debugEndpoint);
      } catch (debugError: any) {
        results.debugEndpoint = {
          success: false,
          error: debugError.message
        };
        console.error('❌ [Diagnostics] Debug endpoint check failed:', debugError);
      }

      // 4. Environment checks
      results.environment = {
        projectId: projectId || 'MISSING',
        hasAnonKey: !!publicAnonKey,
        hasAccessToken: !!accessToken,
        currentUrl: window.location.href
      };

      setDiagnostics(results);
      console.log('🎯 [Diagnostics] All checks complete:', results);
      
    } catch (error: any) {
      console.error('❌ [Diagnostics] Fatal error:', error);
      setDiagnostics({
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const StatusIcon = ({ success }: { success: boolean }) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔧 Orders Diagnostics</h1>
              <p className="text-gray-600 mt-2">Comprehensive order system health check and troubleshooting</p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Diagnostics
            </button>
          </div>

          {loading && !diagnostics && (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600 mt-4">Running diagnostics...</p>
            </div>
          )}

          {diagnostics && (
            <div className="space-y-6">
              {/* Environment Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Environment
                </h2>
                <div className="space-y-2 font-mono text-sm">
                  <div><span className="text-gray-600">Project ID:</span> <span className="font-semibold">{diagnostics.environment.projectId}</span></div>
                  <div><span className="text-gray-600">Has Anon Key:</span> <span className={diagnostics.environment.hasAnonKey ? 'text-green-600' : 'text-red-600'}>{diagnostics.environment.hasAnonKey ? 'Yes' : 'No'}</span></div>
                  <div><span className="text-gray-600">Has Access Token:</span> <span className={diagnostics.environment.hasAccessToken ? 'text-green-600' : 'text-red-600'}>{diagnostics.environment.hasAccessToken ? 'Yes' : 'No'}</span></div>
                </div>
              </div>

              {/* localStorage Check */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  localStorage Orders
                </h2>
                
                <div className="space-y-4">
                  {/* honey_translation_orders */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon success={diagnostics.localStorage.honey_translation_orders.exists} />
                      <h3 className="font-semibold">honey_translation_orders</h3>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Status: {diagnostics.localStorage.honey_translation_orders.exists ? '✅ Found' : '❌ Not Found'}</div>
                      <div>Count: {diagnostics.localStorage.honey_translation_orders.count} orders</div>
                    </div>
                    {diagnostics.localStorage.honey_translation_orders.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600 text-sm">View Data</summary>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                          {JSON.stringify(diagnostics.localStorage.honey_translation_orders.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>

                  {/* user_orders */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon success={diagnostics.localStorage.user_orders.exists} />
                      <h3 className="font-semibold">user_orders</h3>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Status: {diagnostics.localStorage.user_orders.exists ? '✅ Found' : '❌ Not Found'}</div>
                      <div>Count: {diagnostics.localStorage.user_orders.count} orders</div>
                    </div>
                    {diagnostics.localStorage.user_orders.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600 text-sm">View Data</summary>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                          {JSON.stringify(diagnostics.localStorage.user_orders.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>

              {/* Backend /orders Endpoint */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Backend API (/orders)
                </h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <StatusIcon success={diagnostics.backend.success === true} />
                    <span className="font-semibold">Status: {diagnostics.backend.ok ? 'Connected' : 'Error'}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>HTTP Status: {diagnostics.backend.status}</div>
                    <div>Orders Count: {diagnostics.backend.ordersCount || 0}</div>
                  </div>
                </div>

                {diagnostics.backend.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-900">Backend Error</div>
                        <div className="text-sm text-red-700 mt-1">{diagnostics.backend.error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {diagnostics.backend.orders && diagnostics.backend.orders.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-blue-600 text-sm">View Orders Data ({diagnostics.backend.orders.length})</summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(diagnostics.backend.orders, null, 2)}
                    </pre>
                  </details>
                )}
              </div>

              {/* Debug Endpoint */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Debug Endpoint (/debug/orders)
                </h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <StatusIcon success={diagnostics.debugEndpoint.success === true} />
                    <span className="font-semibold">Status: {diagnostics.debugEndpoint.ok ? 'Connected' : 'Error'}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>HTTP Status: {diagnostics.debugEndpoint.status}</div>
                    <div>Orders Count: {diagnostics.debugEndpoint.count || 0}</div>
                  </div>
                </div>

                {diagnostics.debugEndpoint.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-900">Debug Endpoint Error</div>
                        <div className="text-sm text-red-700 mt-1">{diagnostics.debugEndpoint.error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {diagnostics.debugEndpoint.orders && diagnostics.debugEndpoint.orders.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-blue-600 text-sm">View Debug Data ({diagnostics.debugEndpoint.orders.length})</summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(diagnostics.debugEndpoint.orders, null, 2)}
                    </pre>
                  </details>
                )}
              </div>

              {/* Summary & Recommendations */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Summary & Recommendations</h2>
                <div className="space-y-3 text-sm">
                  {diagnostics.localStorage.honey_translation_orders.count > 0 && diagnostics.backend.ordersCount === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="font-semibold text-yellow-900">⚠️ Orders in localStorage but NOT in Backend</div>
                      <div className="text-yellow-800 mt-1">
                        You have {diagnostics.localStorage.honey_translation_orders.count} order(s) in localStorage, 
                        but 0 in the backend database. This means the KV store table might be missing or orders failed to save.
                      </div>
                      <div className="mt-2 font-semibold">Action Required:</div>
                      <div className="mt-1">Run this SQL in Backend SQL Editor:</div>
                      <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs">
CREATE TABLE IF NOT EXISTS kv_store_a67f0635 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
                      </pre>
                    </div>
                  )}

                  {diagnostics.backend.ordersCount > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="font-semibold text-green-900">✅ Backend Working Correctly</div>
                      <div className="text-green-800 mt-1">
                        Found {diagnostics.backend.ordersCount} order(s) in backend database. Orders are being saved correctly!
                      </div>
                    </div>
                  )}

                  {diagnostics.backend.ordersCount === 0 && diagnostics.localStorage.honey_translation_orders.count === 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="font-semibold text-gray-900">ℹ️ No Orders Found</div>
                      <div className="text-gray-700 mt-1">
                        No orders found in either localStorage or backend. Try placing a test order to verify the system.
                      </div>
                    </div>
                  )}

                  {diagnostics.backend.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <div className="font-semibold text-red-900">❌ Backend Connection Issue</div>
                      <div className="text-red-800 mt-1">
                        The backend is not responding correctly. Check Backend Edge Functions deployment and logs.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Diagnostics Data */}
              <details className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <summary className="cursor-pointer font-semibold text-gray-900">🔍 View Full Diagnostics JSON</summary>
                <pre className="mt-4 p-4 bg-white rounded text-xs overflow-auto max-h-96 border border-gray-200">
                  {JSON.stringify(diagnostics, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}