import { useState, useEffect } from 'react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

/**
 * Database Diagnostics Page
 * 
 * This page helps diagnose and fix database issues, particularly RLS configuration
 */
export default function DatabaseDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [setupMessage, setSetupMessage] = useState('');

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/diagnostics`,
        {
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDiagnostics(data.diagnostics);
      } else {
        console.error('Diagnostics failed:', response.status);
      }
    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const attemptFix = async () => {
    setSetupStatus('running');
    setSetupMessage('Attempting to fix database configuration...');
    
    try {
      const response = await fetch(
        `${API_URL}/setup-database`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSetupMessage(data.message || 'Database configured successfully');
        setSetupStatus('success');
        
        // Re-run diagnostics after a delay
        setTimeout(runDiagnostics, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setSetupMessage(`Setup failed: ${errorData.error || 'Unknown error'}`);
        setSetupStatus('error');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setSetupMessage(error instanceof Error ? error.message : 'Unknown error');
      setSetupStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Running diagnostics...</p>
        </div>
      </div>
    );
  }

  const hasError = diagnostics?.database?.connection === 'error';
  const rlsError = diagnostics?.database?.errorCode === 'PGRST301' || 
                   diagnostics?.database?.error?.includes('row-level security');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Database Diagnostics</h1>
          
          {/* Status Overview */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">Environment</div>
                <div className="text-2xl font-bold text-blue-900">
                  {diagnostics?.env?.hasBackendUrl && diagnostics?.env?.hasServiceRoleKey ? '✅' : '❌'}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {diagnostics?.env?.hasBackendUrl && diagnostics?.env?.hasServiceRoleKey 
                    ? 'Configured' 
                    : 'Missing keys'}
                </div>
              </div>
              
              <div className={`${hasError ? 'bg-red-50' : 'bg-green-50'} rounded-lg p-4`}>
                <div className={`text-sm ${hasError ? 'text-red-600' : 'text-green-600'} font-medium mb-1`}>
                  Database
                </div>
                <div className={`text-2xl font-bold ${hasError ? 'text-red-900' : 'text-green-900'}`}>
                  {hasError ? '❌' : '✅'}
                </div>
                <div className={`text-xs ${hasError ? 'text-red-600' : 'text-green-600'} mt-1`}>
                  {diagnostics?.database?.connection || 'Unknown'}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium mb-1">Service Role</div>
                <div className="text-2xl font-bold text-purple-900">
                  {diagnostics?.database?.canQueryWithServiceRole ? '✅' : '⚠️'}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {diagnostics?.database?.canQueryWithServiceRole ? 'Working' : 'May need fix'}
                </div>
              </div>
            </div>
          </div>

          {/* Error Details */}
          {hasError && (
            <div className="mb-8">
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
                <div className="flex items-start">
                  <div className="text-3xl mr-4">🔴</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Database Connection Error
                    </h3>
                    <p className="text-red-700 mb-4">
                      {diagnostics?.database?.error || 'Unknown error'}
                    </p>
                    
                    {rlsError && (
                      <div className="bg-white rounded p-4 mb-4">
                        <h4 className="font-semibold text-red-900 mb-2">
                          Row Level Security (RLS) Issue Detected
                        </h4>
                        <p className="text-gray-700 text-sm mb-3">
                          The kv_store_a67f0635 table has Row Level Security enabled, which is blocking access.
                          You need to disable RLS for this internal table.
                        </p>
                        
                        <div className="bg-gray-50 rounded p-3 font-mono text-sm">
                          <div className="text-gray-600 mb-2">Run this SQL in Backend SQL Editor:</div>
                          <code className="text-blue-600">
                            ALTER TABLE kv_store_a67f0635 DISABLE ROW LEVEL SECURITY;
                          </code>
                        </div>
                        
                        <div className="mt-4">
                          <h5 className="font-semibold text-gray-900 mb-2">Steps to fix:</h5>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                            <li>Go to your Backend Dashboard</li>
                            <li>Click on "SQL Editor" in the left sidebar</li>
                            <li>Create a new query</li>
                            <li>Copy and paste the SQL command above</li>
                            <li>Click "Run" to execute</li>
                            <li>Return here and click "Re-run Diagnostics"</li>
                          </ol>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={attemptFix}
                        disabled={setupStatus === 'running'}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {setupStatus === 'running' ? 'Attempting Fix...' : 'Attempt Automatic Fix'}
                      </button>
                      
                      <button
                        onClick={runDiagnostics}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                      >
                        Re-run Diagnostics
                      </button>
                    </div>
                    
                    {setupMessage && (
                      <div className={`mt-4 p-3 rounded ${
                        setupStatus === 'success' ? 'bg-green-100 text-green-800' :
                        setupStatus === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {setupMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {!hasError && diagnostics?.database?.connection === 'success' && (
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded mb-8">
              <div className="flex items-start">
                <div className="text-3xl mr-4">✅</div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Database is Working Correctly
                  </h3>
                  <p className="text-green-700">
                    All systems operational. The kv_store table is accessible and functioning properly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Diagnostics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Diagnostics</h2>
            <div className="bg-gray-50 rounded p-4 font-mono text-sm overflow-auto max-h-96">
              <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={runDiagnostics}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-medium"
            >
              🔄 Re-run Diagnostics
            </button>
            
            <a
              href="/"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded hover:bg-gray-300 font-medium inline-block"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
