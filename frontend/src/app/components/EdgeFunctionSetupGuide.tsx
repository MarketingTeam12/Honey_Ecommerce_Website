import { useState, useEffect } from 'react';
import { X, Terminal, CheckCircle } from 'lucide-react';
import { API_URL } from '@/app/utils/api';

export function EdgeFunctionSetupGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed this guide
    const dismissed = localStorage.getItem('edgeFunctionGuideDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Check if backend is available
    const checkBackend = async () => {
      try {
        const response = await fetch(
          `${API_URL}/health`,
          { method: 'HEAD' }
        );
        
        // If backend responds, don't show guide
        if (response.ok) {
          setIsVisible(false);
        } else {
          // Backend not available, show guide after 2 seconds
          setTimeout(() => setIsVisible(true), 2000);
        }
      } catch (error) {
        // Network error, show guide after 2 seconds
        setTimeout(() => setIsVisible(true), 2000);
      }
    };

    checkBackend();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('edgeFunctionGuideDismissed', 'true');
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl border border-blue-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-white" />
            <h3 className="text-white font-semibold text-lg">Quick Setup Required</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-gray-700">
            To enable full backend functionality, deploy your Backend Edge Functions:
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-1">Install Backend CLI:</p>
                <code className="block bg-gray-900 text-green-400 p-2 rounded text-xs overflow-x-auto">
                  npm install -g Backend
                </code>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-1">Link your project:</p>
                <code className="block bg-gray-900 text-green-400 p-2 rounded text-xs overflow-x-auto">
                  Backend link --project-ref {projectId}
                </code>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-1">Deploy the function:</p>
                <code className="block bg-gray-900 text-green-400 p-2 rounded text-xs overflow-x-auto">
                  Backend functions deploy make-server-a67f0635
                </code>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              After deployment, refresh this page to access all features including work samples, product management, and more.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Got it!
            </button>
            <a
              href="https://authClient.com/docs/guides/functions"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              View Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
