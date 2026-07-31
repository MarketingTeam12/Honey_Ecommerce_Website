import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { API_URL } from '@/app/utils/api';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function EdgeFunctionDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);
    const tests: DiagnosticResult[] = [];

    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        tests.push({
          test: 'Backend Connectivity',
          status: 'success',
          message: 'Node/MySQL backend is reachable',
          details: await response.json(),
        });
      } else {
        tests.push({
          test: 'Backend Connectivity',
          status: 'error',
          message: `Backend returned ${response.status}: ${response.statusText}`,
          details: await response.text(),
        });
      }
    } catch (error: any) {
      tests.push({
        test: 'Backend Connectivity',
        status: 'error',
        message: 'Cannot reach the Node/MySQL backend',
        details: { error: error.message },
      });
    }

    try {
      const response = await fetch(`${API_URL}/diagnostics`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      tests.push({
        test: 'Database Diagnostics',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'MySQL diagnostics passed' : 'MySQL diagnostics failed',
        details: response.ok ? await response.json() : await response.text(),
      });
    } catch (error: any) {
      tests.push({
        test: 'Database Diagnostics',
        status: 'error',
        message: 'Could not run MySQL diagnostics',
        details: { error: error.message },
      });
    }

    setResults(tests);
    setIsChecking(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const hasErrors = results.some((result) => result.status === 'error');

  if (!hasErrors && results.length > 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900">
            Backend Configuration Needs Attention
          </h3>
          <p className="text-sm text-yellow-800 mt-1">
            The app now uses the Node backend with Passport.js and MySQL. Make sure the backend is running and MySQL is reachable.
          </p>

          <div className="mt-3 space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                {result.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                )}
                <div>
                  <span className="font-medium">{result.test}:</span>{' '}
                  <span>{result.message}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={runDiagnostics}
              disabled={isChecking}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              Recheck
            </button>
            <Link
              to="/admin/deployment-guide"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-yellow-700 border border-yellow-300 text-sm rounded hover:bg-yellow-100"
            >
              Backend Setup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
