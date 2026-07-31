import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function TestReviewPage() {
  const { user, accessToken, login } = useAuth();
  const [testResults, setTestResults] = useState<Array<{type: 'success' | 'error' | 'info', message: string}>>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (type: 'success' | 'error' | 'info', message: string) => {
    setTestResults(prev => [...prev, { type, message }]);
  };

  const runAuthTest = async () => {
    setTestResults([]);
    setTesting(true);
    
    try {
      addResult('info', '🔍 Starting authentication test...');
      
      // Test 1: Check if user is logged in
      if (!user) {
        addResult('error', '❌ No user logged in');
        addResult('info', '📝 Attempting auto-login with demo credentials...');
        
        const result = await login('customer@example.com', 'customer123');
        if (result.success) {
          addResult('success', '✅ Auto-login successful!');
          addResult('info', '⏳ Please wait and run the test again to verify token...');
          setTesting(false);
          return;
        } else {
          addResult('error', '❌ Auto-login failed: ' + result.message);
          setTesting(false);
          return;
        }
      }
      
      addResult('success', `✅ User logged in: ${user.email}`);
      addResult('info', `👤 User ID: ${user.id}`);
      addResult('info', `🔑 Access Token: ${accessToken?.substring(0, 30)}...`);
      
      // Test 2: Verify token format
      if (!accessToken) {
        addResult('error', '❌ No access token found');
        setTesting(false);
        return;
      }
      
      if (accessToken.startsWith('mock-token-')) {
        addResult('success', '✅ Mock token detected (expected for demo)');
        addResult('info', `📋 Token format: ${accessToken}`);
      } else {
        addResult('info', '🔐 Real Backend token detected');
      }
      
      // Test 2.5: Test authentication endpoint directly
      addResult('info', '🧪 Testing authentication endpoint...');
      try {
        const authTestResponse = await fetch(
          `${API_URL}/auth/test`,
          {
            method: 'POST',
            headers: buildHeaders(accessToken),
            body: JSON.stringify({}),
          }
        );
        
        const authTestData = await authTestResponse.json();
        addResult('info', `🧪 Auth test response: ${JSON.stringify(authTestData, null, 2)}`);
        
        if (authTestResponse.ok) {
          addResult('success', '✅ Direct authentication test passed!');
        } else {
          addResult('error', `❌ Direct authentication test failed: ${authTestData.error}`);
        }
      } catch (authTestError) {
        addResult('error', `❌ Auth test error: ${authTestError.message}`);
      }
      
      // Test 3: Test review submission
      addResult('info', '📤 Testing review submission...');
      
      const testReviewData = {
        productId: 'test-product-123',
        productName: 'Test Product',
        rating: 5,
        reviewText: 'This is a test review to verify the authentication system is working properly.'
      };
      
      const requestUrl = `${API_URL}/reviews`;
      const authHeaderValue = `Bearer ${accessToken}`;
      
      addResult('info', `📍 Request URL: ${requestUrl}`);
      addResult('info', `🔑 Auth Header: ${authHeaderValue}`);
      addResult('info', `📦 Request Body: ${JSON.stringify(testReviewData)}`);
      
      let response;
      try {
        response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeaderValue,
          },
          body: JSON.stringify(testReviewData),
        });
        
        addResult('info', `📥 Response status: ${response.status} ${response.statusText}`);
        addResult('info', `📥 Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      } catch (fetchError) {
        addResult('error', `❌ Fetch error: ${fetchError.message}`);
        setTesting(false);
        return;
      }
      
      let data;
      try {
        const responseText = await response.text();
        addResult('info', `📥 Raw response text: ${responseText}`);
        data = JSON.parse(responseText);
        addResult('info', `📥 Parsed response data: ${JSON.stringify(data, null, 2)}`);
      } catch (parseError) {
        addResult('error', `❌ Failed to parse response: ${parseError.message}`);
        setTesting(false);
        return;
      }
      
      if (response.ok) {
        addResult('success', '✅ Review submitted successfully!');
        addResult('success', `✅ Review ID: ${data.review?.id}`);
        addResult('success', '🎉 Authentication system is working correctly!');
      } else {
        addResult('error', `❌ Review submission failed: ${data.error || data.message}`);
        if (data.details) {
          addResult('error', `📋 Details: ${data.details}`);
        }
        if (data.code) {
          addResult('error', `📋 Error code: ${data.code}`);
        }
      }
      
    } catch (error) {
      addResult('error', `❌ Test failed with exception: ${error.message}`);
      console.error('Test error:', error);
    } finally {
      setTesting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Review Submission Test</h1>
          <p className="text-gray-600 mb-8">
            This page tests the authentication and review submission functionality.
          </p>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h2 className="font-semibold text-yellow-900 mb-2">Current Authentication Status:</h2>
            {user ? (
              <div className="space-y-1 text-sm">
                <p className="text-green-700">✅ Logged in as: <strong>{user.email}</strong></p>
                <p className="text-gray-700">User ID: {user.id}</p>
                <p className="text-gray-700">Name: {user.name}</p>
                <p className="text-gray-700">Role: {user.role}</p>
                <p className="text-gray-700">Token: {accessToken?.substring(0, 40)}...</p>
              </div>
            ) : (
              <p className="text-red-700">❌ Not logged in - Test will attempt auto-login</p>
            )}
          </div>

          <button
            onClick={runAuthTest}
            disabled={testing}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {testing ? 'Running Tests...' : 'Run Authentication & Review Test'}
          </button>

          {testResults.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Test Results:</h2>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border flex items-start gap-3 ${getColorClass(result.type)}`}
                  >
                    {getIcon(result.type)}
                    <p className="flex-1 text-sm font-mono whitespace-pre-wrap break-all">
                      {result.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-2">Demo Credentials:</h3>
            <div className="text-sm space-y-1 text-gray-700">
              <p><strong>Customer:</strong> customer@example.com / customer123</p>
              <p><strong>Admin:</strong> admin@honeytranslations.com / admin123</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Expected Behavior:</h3>
            <ul className="text-sm space-y-1 text-blue-800 list-disc list-inside">
              <li>If logged in: Should show user details and access token</li>
              <li>Mock token format: <code className="bg-blue-100 px-1 rounded">mock-token-2</code></li>
              <li>Review submission should succeed with status 201</li>
              <li>Response should include the created review object</li>
              <li>No "Invalid JWT" errors should occur</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}