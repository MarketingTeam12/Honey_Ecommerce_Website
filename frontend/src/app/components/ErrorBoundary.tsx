import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                The application encountered an error. This might be due to:
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-red-900 mb-2">Possible causes:</h3>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>Corrupted data in browser storage</li>
                <li>Network error while loading data</li>
                <li>Invalid product data format</li>
                <li>Browser compatibility issue</li>
              </ul>
            </div>

            {this.state.error && (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6 overflow-auto">
                <h3 className="font-bold text-gray-900 mb-2">Error details:</h3>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Go to Homepage
              </button>
              <button
                onClick={() => {
                  if (window.confirm('This will clear all data and reload the page. Continue?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Clear Storage & Reload
              </button>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;