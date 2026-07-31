import { useState } from 'react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

function CustomersDebugPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawResponse, setRawResponse] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    setRawResponse('');
    
    try {
      console.log('🔍 [DEBUG] Fetching customers...');
      console.log('🔍 [DEBUG] Using publicAnonKey:', publicAnonKey.substring(0, 20) + '...');
      
      const response = await fetch(
        `${API_URL}/customers`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📡 [DEBUG] Response status:', response.status);
      console.log('📡 [DEBUG] Response ok:', response.ok);

      const text = await response.text();
      setRawResponse(text);
      
      try {
        const data = JSON.parse(text);
        console.log('📦 [DEBUG] Response data:', data);
        
        if (data.success && data.customers) {
          setCustomers(data.customers);
          console.log('✅ [DEBUG] Successfully loaded', data.customers.length, 'customers');
        } else {
          setError('Response format error: ' + JSON.stringify(data));
        }
      } catch (e) {
        setError('JSON parse error: ' + e);
      }
    } catch (err) {
      console.error('❌ [DEBUG] Error:', err);
      setError('Fetch error: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6">Customers Debug Page</h1>
          
          <div className="mb-6">
            <button
              onClick={fetchCustomers}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Fetch Customers'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
              <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {rawResponse && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Raw Response:</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">{rawResponse}</pre>
            </div>
          )}

          {customers.length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="font-semibold text-gray-800 mb-3">Customers ({customers.length}):</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Phone</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Source</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Signup Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-sm">{customer.id}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{customer.name}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{customer.email}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{customer.phone}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{customer.source}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{customer.signup_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && customers.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
              Click "Fetch Customers" to load data
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
            <li>Click "Fetch Customers" to see all customers stored in the database</li>
            <li>Open browser console (F12) to see detailed logs</li>
            <li>Try signing up a new customer in another tab</li>
            <li>Come back and click "Fetch Customers" again to see if the new customer appears</li>
            <li>Check the "Raw Response" section to see the exact API response</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default CustomersDebugPage;
