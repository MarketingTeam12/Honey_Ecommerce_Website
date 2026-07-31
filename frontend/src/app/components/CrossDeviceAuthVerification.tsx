import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { CheckCircle, XCircle, Smartphone, Monitor, Globe, RefreshCw, Info } from 'lucide-react';
import { authClient } from '@/app/utils/authClient';

interface SessionInfo {
  deviceType: string;
  browser: string;
  lastActive: string;
  ipAddress: string;
}

export function CrossDeviceAuthVerification() {
  const { user, isAuthenticated, accessToken } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [deviceInfo, setDeviceInfo] = useState({
    deviceType: '',
    browser: '',
    os: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      checkCrossDeviceCapability();
      detectDeviceInfo();
    }
  }, [isAuthenticated]);

  const detectDeviceInfo = () => {
    const ua = navigator.userAgent;
    let deviceType = 'Desktop';
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect device type
    if (/mobile/i.test(ua)) {
      deviceType = 'Mobile';
    } else if (/tablet/i.test(ua)) {
      deviceType = 'Tablet';
    }

    // Detect browser
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) {
      browser = 'Chrome';
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
      browser = 'Safari';
    } else if (/firefox/i.test(ua)) {
      browser = 'Firefox';
    } else if (/edge/i.test(ua)) {
      browser = 'Edge';
    }

    // Detect OS
    if (/windows/i.test(ua)) {
      os = 'Windows';
    } else if (/macintosh|mac os x/i.test(ua)) {
      os = 'macOS';
    } else if (/linux/i.test(ua)) {
      os = 'Linux';
    } else if (/android/i.test(ua)) {
      os = 'Android';
    } else if (/iphone|ipad|ipod/i.test(ua)) {
      os = 'iOS';
    }

    setDeviceInfo({ deviceType, browser, os });
  };

  const checkCrossDeviceCapability = async () => {
    try {
      setVerificationStatus('checking');

      // Check Backend session
      const { data: { session }, error } = await authClient.auth.getSession();

      if (error) {
        console.error('Session check error:', error);
        setVerificationStatus('error');
        return;
      }

      if (session) {
        // Session exists - this means cross-device auth is working
        setSessionInfo({
          deviceType: deviceInfo.deviceType || 'Unknown',
          browser: deviceInfo.browser || 'Unknown',
          lastActive: new Date().toLocaleString(),
          ipAddress: 'Hidden for privacy'
        });
        setVerificationStatus('success');
      } else {
        // No session but user is authenticated - might be using mock auth
        setVerificationStatus('error');
      }
    } catch (error) {
      console.error('Cross-device check error:', error);
      setVerificationStatus('error');
    }
  };

  const refreshSession = async () => {
    try {
      setVerificationStatus('checking');
      const { data, error } = await authClient.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        setVerificationStatus('error');
      } else {
        console.log('Session refreshed successfully');
        await checkCrossDeviceCapability();
      }
    } catch (error) {
      console.error('Refresh error:', error);
      setVerificationStatus('error');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Check if using mock authentication
  const isMockAuth = accessToken?.startsWith('mock-token-');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Cross-Device Authentication Status</h3>
        <button
          onClick={refreshSession}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh session"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {isMockAuth ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 mb-1">Demo Mode Active</p>
              <p className="text-sm text-amber-700">
                You're using a demo account for testing. Demo accounts use local storage and will NOT work across different devices or browsers. 
                To test cross-device authentication, please sign up with a real email address.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Authentication Status */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Cross-Device Authentication Enabled</p>
              <p className="text-sm text-green-700">
                Your account is stored in the cloud. You can sign in from any device or browser.
              </p>
            </div>
          </div>

          {/* Current Device Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Current Session Details</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                {deviceInfo.deviceType === 'Mobile' ? (
                  <Smartphone className="w-4 h-4 text-gray-500" />
                ) : (
                  <Monitor className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-gray-600">Device:</span>
                <span className="text-gray-900 font-medium">{deviceInfo.deviceType} ({deviceInfo.os})</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Browser:</span>
                <span className="text-gray-900 font-medium">{deviceInfo.browser}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Account:</span>
                <span className="text-gray-900 font-medium">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">How Cross-Device Authentication Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Your account is stored securely in Backend's cloud database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Use the same email and password to sign in from any device</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Your session is automatically synchronized across devices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Sessions are automatically refreshed to keep you signed in</span>
              </li>
            </ul>
          </div>

          {/* Testing Instructions */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">Test Cross-Device Login</h4>
            <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
              <li>Open this website on a different device or browser</li>
              <li>Click "Sign In" and enter your credentials:
                <div className="ml-6 mt-1 font-mono text-xs bg-white p-2 rounded border border-purple-200">
                  Email: {user?.email}<br />
                  Password: Your password
                </div>
              </li>
              <li>You should be able to sign in successfully from any device</li>
              <li>Your profile, orders, and preferences will be synchronized</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}