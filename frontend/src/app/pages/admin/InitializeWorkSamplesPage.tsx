import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { useAuth } from '@/app/context/AuthContext';
import { BackendStatusBanner } from '@/app/components/BackendStatusBanner';

interface InitResult {
  id: string;
  status: 'created' | 'already_exists' | 'error';
  title?: string;
  error?: string;
}

interface InitResponse {
  success: boolean;
  message: string;
  results: InitResult[];
  summary: {
    total: number;
    created: number;
    existing: number;
    errors: number;
  };
}

export function InitializeWorkSamplesPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInitialize = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      console.log('🎬 Initializing work samples...');

      const response = await fetch(
        `${API_URL}/admin/init-work-samples-inline`,
        {
          method: 'POST',
          headers: buildHeaders(accessToken),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's a backend deployment issue
        const isBackendIssue = errorText.includes('Invalid JWT') || 
                               errorText.includes('"code":401') ||
                               response.status === 401;
        
        if (isBackendIssue) {
          throw new Error('Backend not available. Please ensure Backend Edge Functions are deployed and configured correctly.');
        }
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error('Failed to initialize work samples: ' + errorText.substring(0, 100));
        }
        throw new Error(errorData.error || 'Failed to initialize work samples');
      }

      const data: InitResponse = await response.json();
      console.log('✅ Initialization complete:', data);
      setResult(data);
    } catch (err) {
      console.error('❌ Initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize work samples';
      setError(errorMessage);
      
      // Also log helpful information
      if (errorMessage.includes('Backend not available')) {
        console.error('💡 [Initialization] To fix this:');
        console.error('   1. Ensure Backend Edge Functions are deployed');
        console.error('   2. Check that environment variables are set correctly');
        console.error('   3. Verify the project ID and anon key are correct');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to="/admin/work-samples" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Initialize Work Samples</h1>
            <p className="text-sm text-gray-600">Restore demo work sample data</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Backend Status Banner */}
        <BackendStatusBanner />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Restore Demo Work Samples</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-blue-900 mb-4">
              This will create 8 demo work samples across different categories:
            </p>
            <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
              <li>Indian Languages (Hindi, Tamil, Bengali, Marathi)</li>
              <li>Foreign Languages (Spanish, French, German, Mandarin)</li>
              <li>Document Types (Birth/Marriage Certificates, Passports, Degrees, Medical Reports)</li>
            </ul>
            <p className="text-blue-900 mt-4 text-sm">
              <strong>Note:</strong> This will not overwrite existing samples.
            </p>
          </div>

          <Button
            onClick={handleInitialize}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full mb-6"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 mr-2" />
                Initialize Work Samples
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Initialization Failed</h3>
                  <p className="text-red-800 text-sm mb-3">{error}</p>
                  
                  {error.includes('Backend not available') && (
                    <div className="bg-white rounded p-3 text-sm text-gray-700">
                      <p className="font-semibold mb-2">Troubleshooting steps:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Verify Backend Edge Functions are deployed</li>
                        <li>Check environment variables (Backend_URL, Backend_SERVICE_ROLE_KEY, Backend_ANON_KEY)</li>
                        <li>Confirm the project ID matches your Backend project</li>
                        <li>Check browser console for detailed error logs</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Initialization Complete!</h3>
                  <p className="text-green-800 text-sm">{result.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{result.summary.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{result.summary.created}</p>
                  <p className="text-sm text-gray-600">Created</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{result.summary.existing}</p>
                  <p className="text-sm text-gray-600">Existing</p>
                </div>
              </div>

              {result.results.length > 0 && (
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Details:</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.results.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded text-sm ${
                          item.status === 'created'
                            ? 'bg-green-50 text-green-900'
                            : item.status === 'already_exists'
                            ? 'bg-blue-50 text-blue-900'
                            : 'bg-red-50 text-red-900'
                        }`}
                      >
                        <span className="font-medium">{item.title || item.id}</span>
                        <span className="text-xs uppercase tracking-wide">
                          {item.status === 'created' ? '✓ Created' : 
                           item.status === 'already_exists' ? '○ Exists' : 
                           '✗ Error'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Link
                  to="/admin/work-samples"
                  className="flex-1 inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Work Samples
                </Link>
                <Link
                  to="/work-sample"
                  className="flex-1 inline-flex items-center justify-center bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  View Public Page
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default InitializeWorkSamplesPage;
