import { useState, useEffect } from 'react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function InitDemo() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    // Auto-initialize on mount
    initializeDemoUsers();
  }, []);

  const initializeDemoUsers = async () => {
    setStatus('loading');
    setMessage('Initializing demo users...');

    try {
      const response = await fetch(
        `${API_URL}/init-demo-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`, // Required by Backend Edge Functions
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage('Demo users initialized successfully!');
        setResults(data.results || []);
        
        // Redirect to admin login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to initialize demo users');
      }
    } catch (error) {
      console.error('Initialization error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Demo Initialization
        </h1>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-center space-x-3">
            {status === 'loading' && (
              <>
                <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                <span className="text-gray-700">{message}</span>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <span className="text-green-700 font-medium">{message}</span>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-6 h-6 text-red-500" />
                <span className="text-red-700">{message}</span>
              </>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Results:</h3>
              <div className="space-y-1">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <span className="text-gray-700">{result.email}</span>
                    <span
                      className={`font-medium ${
                        result.status === 'success' || result.status === 'already_exists'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demo Credentials */}
          {status === 'success' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Demo Credentials:
              </h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-600">Admin:</span>
                  <span className="ml-2 font-mono text-gray-900">
                    admin@honeytranslations.com
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Password:</span>
                  <span className="ml-2 font-mono text-gray-900">admin123</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Redirecting to login page...
              </p>
            </div>
          )}

          {/* Retry Button */}
          {status === 'error' && (
            <button
              onClick={initializeDemoUsers}
              className="w-full mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              Retry Initialization
            </button>
          )}
        </div>
      </div>
    </div>
  );
}