import { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Database, Server, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  error?: string;
}

export function DiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setRunning(true);
    const results: DiagnosticResult[] = [];

    // Test 1: Check if server is running
    results.push(await checkServerStatus());

    // Test 2: Check database status
    results.push(await checkDatabaseStatus());

    // Test 3: Try to fetch orders
    results.push(await checkOrdersEndpoint());

    // Test 4: Check localStorage orders
    results.push(checkLocalStorageOrders());

    // Test 5: Check environment
    results.push(checkEnvironment());

    setDiagnostics(results);
    setRunning(false);
  };

  const checkServerStatus = async (): Promise<DiagnosticResult> => {
    try {
      const response = await fetch(
        `${API_URL}/setup/status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        }
      );

      if (response.ok) {
        return {
          name: 'Server Status',
          status: 'success',
          message: 'Backend server is running',
          details: await response.json()
        };
      } else {
        const text = await response.text();
        return {
          name: 'Server Status',
          status: 'error',
          message: 'Server returned error',
          error: `HTTP ${response.status}: ${text}`
        };
      }
    } catch (error: any) {
      return {
        name: 'Server Status',
        status: 'error',
        message: 'Cannot connect to server',
        error: error.message
      };
    }
  };

  const checkDatabaseStatus = async (): Promise<DiagnosticResult> => {
    try {
      const response = await fetch(
        `${API_URL}/setup/status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.tableExists && data.accessible) {
          return {
            name: 'Database Table',
            status: 'success',
            message: 'Table kv_store_a67f0635 exists and is accessible',
            details: data
          };
        } else {
          return {
            name: 'Database Table',
            status: 'error',
            message: '❌ TABLE MISSING: kv_store_a67f0635 does not exist',
            error: data.error || 'Table not found in database',
            details: {
              solution: 'Click "Auto-Fix Database" button below to create it automatically',
              tableExists: data.tableExists,
              accessible: data.accessible
            }
          };
        }
      } else {
        return {
          name: 'Database Table',
          status: 'error',
          message: 'Cannot check database status',
          error: `HTTP ${response.status}`
        };
      }
    } catch (error: any) {
      return {
        name: 'Database Table',
        status: 'error',
        message: 'Database check failed',
        error: error.message
      };
    }
  };

  const checkOrdersEndpoint = async (): Promise<DiagnosticResult> => {
    try {
      const response = await fetch(
        `${API_URL}/orders`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.orders && data.orders.length > 0) {
          return {
            name: 'Orders Endpoint',
            status: 'success',
            message: `Found ${data.orders.length} orders in database`,
            details: data.orders
          };
        } else {
          return {
            name: 'Orders Endpoint',
            status: 'warning',
            message: 'Orders endpoint works but returned 0 orders',
            details: {
              reason: 'Either no orders exist OR table is missing',
              checkServerLogs: 'Look at the server console for detailed error messages'
            }
          };
        }
      } else {
        const text = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = text;
        }

        return {
          name: 'Orders Endpoint',
          status: 'error',
          message: 'Failed to fetch orders from database',
          error: typeof errorData === 'object' ? errorData.details || errorData.error : text,
          details: errorData
        };
      }
    } catch (error: any) {
      return {
        name: 'Orders Endpoint',
        status: 'error',
        message: 'Cannot connect to orders endpoint',
        error: error.message
      };
    }
  };

  const checkLocalStorageOrders = (): DiagnosticResult => {
    try {
      const userOrders = localStorage.getItem('user_orders');
      const adminOrders = localStorage.getItem('honey_translation_orders');
      
      const allOrders = new Set();
      
      if (userOrders) {
        const parsed = JSON.parse(userOrders);
        parsed.forEach((order: any) => allOrders.add(order.id));
      }
      
      if (adminOrders) {
        const parsed = JSON.parse(adminOrders);
        parsed.forEach((order: any) => allOrders.add(order.id));
      }

      if (allOrders.size > 0) {
        return {
          name: 'Browser Storage',
          status: 'warning',
          message: `Found ${allOrders.size} orders in browser localStorage`,
          details: {
            note: 'These orders exist in browser but NOT in database',
            orderIds: Array.from(allOrders)
          }
        };
      } else {
        return {
          name: 'Browser Storage',
          status: 'success',
          message: 'No orders in localStorage (expected)',
          details: {}
        };
      }
    } catch (error: any) {
      return {
        name: 'Browser Storage',
        status: 'error',
        message: 'Failed to check localStorage',
        error: error.message
      };
    }
  };

  const checkEnvironment = (): DiagnosticResult => {
    const hasProjectId = !!projectId && projectId !== 'your-project-id';
    const hasAnonKey = !!publicAnonKey;

    if (hasProjectId && hasAnonKey) {
      return {
        name: 'Environment Config',
        status: 'success',
        message: 'Backend configuration is valid',
        details: {
          projectId: projectId,
          anonKeyLength: publicAnonKey.length
        }
      };
    } else {
      return {
        name: 'Environment Config',
        status: 'error',
        message: 'Backend environment variables missing',
        error: 'Check @/app/utils/backendInfo.tsx',
        details: {
          projectId: hasProjectId ? 'OK' : 'MISSING',
          anonKey: hasAnonKey ? 'OK' : 'MISSING'
        }
      };
    }
  };

  const handleAutoFix = async () => {
    setAutoFixing(true);
    toast.info('Starting auto-fix... Please wait.');

    try {
      const response = await fetch(
        `${API_URL}/setup/database`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('✅ Database setup complete!');
        setTimeout(() => {
          runDiagnostics();
        }, 1000);
      } else {
        toast.error(`Auto-fix failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      toast.error(`Auto-fix failed: ${error.message}`);
    } finally {
      setAutoFixing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      default:
        return <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const hasErrors = diagnostics.some(d => d.status === 'error');
  const hasTableError = diagnostics.some(d => 
    d.name === 'Database Table' && d.status === 'error'
  );

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔍 System Diagnostics
            </h1>
            <p className="text-gray-600">
              Identifying the exact error preventing orders from appearing in the admin panel
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={runDiagnostics}
              disabled={running}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Running Tests...' : 'Re-Run Diagnostics'}
            </button>

            <button
              onClick={handleAutoFix}
              disabled={autoFixing}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className={`w-5 h-5 ${autoFixing ? 'animate-pulse' : ''}`} />
              {autoFixing ? 'Fixing Database...' : 'Auto-Fix Database'}
            </button>
          </div>

          {/* Error Summary */}
          {hasErrors && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-red-900 mb-2">
                    🚨 ROOT CAUSE IDENTIFIED
                  </h2>
                  <p className="text-red-800 text-lg font-semibold mb-4">
                    {hasTableError 
                      ? 'The database table "kv_store_a67f0635" does NOT exist in your Backend database.'
                      : 'Multiple errors detected. Check details below.'}
                  </p>
                  
                  {hasTableError && (
                    <div className="bg-white border border-red-200 rounded p-4 space-y-2 text-sm text-red-900">
                      <p><strong>What this means:</strong></p>
                      <ul className="list-disc ml-5 space-y-1">
                        <li>When customers place orders, the code tries to save to the database</li>
                        <li>The database table doesn't exist, so the save operation fails</li>
                        <li>Orders get saved to browser localStorage as a fallback</li>
                        <li>The admin panel queries the database (not localStorage)</li>
                        <li>Since the table doesn't exist, no orders appear in the admin panel</li>
                      </ul>
                      
                      <p className="mt-4"><strong>Solution:</strong></p>
                      <p>Click the <strong>"Auto-Fix Database"</strong> button above to create the missing table automatically (30 seconds).</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Diagnostic Results */}
          <div className="space-y-4">
            {diagnostics.map((diagnostic, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-6 ${getStatusColor(diagnostic.status)}`}
              >
                <div className="flex items-start gap-4">
                  {getStatusIcon(diagnostic.status)}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {diagnostic.name}
                    </h3>
                    <p className={`mb-2 ${
                      diagnostic.status === 'error' ? 'text-red-800 font-semibold' :
                      diagnostic.status === 'warning' ? 'text-yellow-800' :
                      'text-green-800'
                    }`}>
                      {diagnostic.message}
                    </p>

                    {diagnostic.error && (
                      <div className="bg-white bg-opacity-50 rounded p-3 mb-2">
                        <p className="text-sm font-semibold text-red-900 mb-1">Error Details:</p>
                        <pre className="text-xs text-red-800 whitespace-pre-wrap font-mono">
                          {diagnostic.error}
                        </pre>
                      </div>
                    )}

                    {diagnostic.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                          View Details
                        </summary>
                        <div className="mt-2 bg-white bg-opacity-50 rounded p-3">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(diagnostic.details, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Server Logs Tip */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Server className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  💡 Tip: Check Server Logs
                </h3>
                <p className="text-sm text-blue-800 mb-2">
                  For more detailed error messages, check your Backend Edge Function logs:
                </p>
                <ol className="text-sm text-blue-800 space-y-1 ml-5 list-decimal">
                  <li>Go to <a href="https://authClient.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Backend Dashboard</a></li>
                  <li>Click "Edge Functions" in the left sidebar</li>
                  <li>Click on "make-server-a67f0635"</li>
                  <li>Click the "Logs" tab</li>
                  <li>Look for error messages when fetching orders</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default DiagnosticPage;
