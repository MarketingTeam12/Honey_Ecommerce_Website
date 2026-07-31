import { useState } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { Search, AlertCircle, CheckCircle, Users, Database } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

export function FindMissingCustomersPage() {
  const [searchNames, setSearchNames] = useState('sasisha, swetha, madhan, pavi, sai');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchForCustomers = async () => {
    setIsSearching(true);
    setResults([]);
    
    const names = searchNames.split(',').map(n => n.trim().toLowerCase());
    
    try {
      // Step 1: Check localStorage
      console.log('🔍 Step 1: Checking localStorage...');
      const localStorageData = localStorage.getItem('registered_users');
      let localCustomers: any[] = [];
      
      if (localStorageData) {
        try {
          localCustomers = JSON.parse(localStorageData);
          console.log('📦 Found in localStorage:', localCustomers.length, 'users');
          console.log('📦 LocalStorage users:', localCustomers);
        } catch (e) {
          console.error('❌ Error parsing localStorage:', e);
        }
      }
      
      // Check which names are in localStorage
      const foundInLocal = names.map(name => {
        const found = localCustomers.find(u => 
          u.name?.toLowerCase().includes(name) || 
          u.email?.toLowerCase().includes(name)
        );
        return {
          name,
          source: 'localStorage',
          found: !!found,
          data: found || null
        };
      });
      
      setResults(prev => [...prev, {
        step: 'Step 1: LocalStorage Check',
        results: foundInLocal
      }]);
      
      // Step 2: Check backend /customers endpoint
      console.log('🔍 Step 2: Checking backend /customers endpoint...');
      const customersResponse = await fetch(
        `${API_URL}/customers`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        console.log('📦 Backend response:', customersData);
        
        const backendCustomers = customersData.customers || [];
        console.log('📦 Found in backend:', backendCustomers.length, 'customers');
        
        const foundInBackend = names.map(name => {
          const found = backendCustomers.find((c: any) => 
            c.name?.toLowerCase().includes(name) || 
            c.email?.toLowerCase().includes(name)
          );
          return {
            name,
            source: 'backend',
            found: !!found,
            data: found || null
          };
        });
        
        setResults(prev => [...prev, {
          step: 'Step 2: Backend /customers Check',
          results: foundInBackend
        }]);
      } else {
        console.error('❌ Backend request failed:', customersResponse.status);
        setResults(prev => [...prev, {
          step: 'Step 2: Backend /customers Check',
          error: `Failed with status ${customersResponse.status}`
        }]);
      }
      
      // Step 3: Check if users exist in Backend Auth (via our backend)
      console.log('🔍 Step 3: Summary of findings...');
      
      const summary = names.map(name => {
        const inLocal = foundInLocal.find(f => f.name === name);
        const inBackend = results[1]?.results?.find((f: any) => f.name === name);
        
        return {
          name,
          inLocalStorage: inLocal?.found || false,
          inBackend: inBackend?.found || false,
          status: (inLocal?.found || inBackend?.found) ? 'FOUND' : 'MISSING'
        };
      });
      
      setResults(prev => [...prev, {
        step: 'Step 3: Summary',
        summary
      }]);
      
    } catch (error) {
      console.error('❌ Search error:', error);
      setResults(prev => [...prev, {
        step: 'Error',
        error: error instanceof Error ? error.message : String(error)
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Missing Customers</h1>
          <p className="text-gray-600">Search for customers by name in all data sources</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter customer names (comma-separated)
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchNames}
              onChange={(e) => setSearchNames(e.target.value)}
              placeholder="e.g., sasisha, swetha, madhan, pavi, sai"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchForCustomers}
              disabled={isSearching}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className={`w-5 h-5 ${isSearching ? 'animate-spin' : ''}`} />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">{result.step}</h2>
                </div>
                
                <div className="p-6">
                  {result.error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                      <span>{result.error}</span>
                    </div>
                  )}
                  
                  {result.results && (
                    <div className="space-y-3">
                      {result.results.map((r: any, i: number) => (
                        <div
                          key={i}
                          className={`p-4 rounded-lg border-2 ${
                            r.found 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {r.found ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-600" />
                              )}
                              <span className={`font-semibold ${
                                r.found ? 'text-green-900' : 'text-red-900'
                              }`}>
                                {r.name}
                              </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              r.found 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {r.found ? 'FOUND' : 'NOT FOUND'}
                            </span>
                          </div>
                          
                          {r.data && (
                            <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                              <pre className="text-xs text-gray-700 overflow-x-auto">
                                {JSON.stringify(r.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {result.summary && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">LocalStorage</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Backend</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {result.summary.map((s: any, i: number) => (
                            <tr key={i}>
                              <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                              <td className="px-4 py-3">
                                {s.inLocalStorage ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {s.inBackend ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  s.status === 'FOUND'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How This Works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Step 1:</strong> Checks browser localStorage for customer data</li>
                <li>• <strong>Step 2:</strong> Queries the backend /customers API endpoint</li>
                <li>• <strong>Step 3:</strong> Shows a summary of where each customer was found</li>
                <li>• If customers are missing from both, they may not have signed up successfully</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}