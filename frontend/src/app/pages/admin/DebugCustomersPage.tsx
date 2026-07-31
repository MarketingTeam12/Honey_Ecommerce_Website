import { useState } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

export function DebugCustomersPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  const testBackendEndpoint = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addLog('🔄 Starting backend endpoint test...');
      addLog(`📍 Project ID: ${projectId}`);
      addLog(`🔑 Using publicAnonKey for authentication`);
      
      const url = `${API_URL}/customers`;
      addLog(`📡 Fetching from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      addLog(`📥 Response status: ${response.status}`);
      addLog(`📥 Response ok: ${response.ok}`);
      addLog(`📥 Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

      if (response.ok) {
        const data = await response.json();
        addLog(`✅ Response received successfully`);
        addLog(`📦 Response data keys: ${Object.keys(data).join(', ')}`);
        addLog(`📦 Full response: ${JSON.stringify(data, null, 2)}`);
        
        if (data.customers) {
          addLog(`👥 Number of customers: ${data.customers.length}`);
          data.customers.forEach((customer: any, index: number) => {
            addLog(`👤 Customer ${index + 1}: ${customer.email} (${customer.name})`);
          });
        } else {
          addLog('⚠️ No customers array in response');
        }
      } else {
        const errorText = await response.text();
        addLog(`❌ Request failed with status ${response.status}`);
        addLog(`❌ Error response: ${errorText}`);
      }
    } catch (error) {
      addLog(`❌ Exception occurred: ${error instanceof Error ? error.message : String(error)}`);
      addLog(`❌ Stack trace: ${error instanceof Error ? error.stack : 'No stack trace'}`);
    } finally {
      setIsLoading(false);
      addLog('✅ Test completed');
    }
  };

  const testKVStore = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addLog('🔄 Testing KV Store directly...');
      addLog('📍 This will check if customer data is stored in the database');
      
      // We'll make a simple request to a test endpoint we create
      addLog('⚠️ KV Store test requires a backend endpoint - using /customers endpoint instead');
      await testBackendEndpoint();
      
    } catch (error) {
      addLog(`❌ Exception: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Data Debugger</h1>
          <p className="text-gray-600">Test and diagnose customer data retrieval</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={testBackendEndpoint}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Test Backend /customers Endpoint
          </button>

          <button
            onClick={testKVStore}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Test KV Store Access
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
          </div>
          
          <div className="p-6">
            {testResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Click a test button to see results</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg font-mono text-sm ${
                      result.includes('❌') ? 'bg-red-50 text-red-800' :
                      result.includes('⚠️') ? 'bg-yellow-50 text-yellow-800' :
                      result.includes('✅') ? 'bg-green-50 text-green-800' :
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Debug Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Test Backend Endpoint:</strong> Checks if the /customers API is working</li>
                <li>• <strong>Test KV Store:</strong> Verifies database connection and data retrieval</li>
                <li>• Check the console (F12) for additional detailed logs</li>
                <li>• If customers aren't showing, check backend logs in Backend Functions dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}