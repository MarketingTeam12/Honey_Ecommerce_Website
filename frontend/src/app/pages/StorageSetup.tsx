import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { API_URL } from '@/app/utils/api';

interface BucketStatus {
  name: string;
  exists: boolean;
  isPublic: boolean;
  recommendedSizeLimit: string;
  status: string;
}

interface StorageCheckResponse {
  success: boolean;
  allReady: boolean;
  message: string;
  buckets: BucketStatus[];
  setupGuide?: string;
}

export default function StorageSetup() {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<StorageCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkBuckets = async () => {
    setChecking(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/storage/check-buckets`
      );
      
      if (!response.ok) {
        throw new Error('Failed to check bucket status');
      }
      
      const data: StorageCheckResponse = await response.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to check storage status');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkBuckets();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Storage Setup Status
          </h1>
          <p className="text-gray-600">
            Check if your Backend Storage buckets are configured correctly
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bucket Configuration</CardTitle>
                <CardDescription>
                  Required storage buckets for file uploads
                </CardDescription>
              </div>
              <Button
                onClick={checkBuckets}
                disabled={checking}
                variant="outline"
                size="sm"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {status && (
              <>
                {/* Overall Status */}
                <Alert
                  variant={status.allReady ? 'default' : 'destructive'}
                  className="mb-6"
                >
                  {status.allReady ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {status.allReady ? 'All Set!' : 'Action Required'}
                  </AlertTitle>
                  <AlertDescription>{status.message}</AlertDescription>
                </Alert>

                {/* Individual Bucket Status */}
                <div className="space-y-4">
                  {status.buckets.map((bucket) => (
                    <div
                      key={bucket.name}
                      className="border rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {bucket.name}
                            </code>
                            {bucket.exists ? (
                              <span className="text-green-600 font-medium">
                                ✅ Ready
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium">
                                ❌ Missing
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>
                              <span className="font-medium">Public:</span>{' '}
                              {bucket.exists ? (
                                bucket.isPublic ? (
                                  <span className="text-green-600">Yes ✓</span>
                                ) : (
                                  <span className="text-orange-600">
                                    No (needs to be public)
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium">
                                Recommended Size Limit:
                              </span>{' '}
                              {bucket.recommendedSizeLimit}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {checking && !status && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Checking bucket status...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        {status && !status.allReady && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900">
                Setup Instructions
              </CardTitle>
              <CardDescription className="text-orange-700">
                Follow these steps to create the missing storage buckets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">
                  Quick Setup (5 minutes)
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>
                    Open your{' '}
                    <a
                      href="https://authClient.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Backend Dashboard
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Navigate to Storage in the left sidebar</li>
                  <li>Click "New bucket" for each missing bucket</li>
                  <li>
                    Use the exact bucket name shown above (case-sensitive)
                  </li>
                  <li>Toggle "Public bucket" to ON</li>
                  <li>Set the recommended file size limit</li>
                  <li>Click "Create bucket"</li>
                  <li>Refresh this page to verify</li>
                </ol>
              </div>

              <Alert>
                <AlertTitle>Need detailed instructions?</AlertTitle>
                <AlertDescription>
                  See <code>STORAGE_SETUP_GUIDE.md</code> in your project root
                  for step-by-step instructions with additional details.
                </AlertDescription>
              </Alert>

              <div className="pt-2">
                <Button
                  onClick={checkBuckets}
                  disabled={checking}
                  className="w-full"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Re-check Status
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State */}
        {status && status.allReady && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Storage is Configured Correctly
              </CardTitle>
              <CardDescription className="text-green-700">
                All storage buckets are ready for file uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-800">
                Your application can now upload and manage files successfully.
                No further action is needed for storage setup.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
