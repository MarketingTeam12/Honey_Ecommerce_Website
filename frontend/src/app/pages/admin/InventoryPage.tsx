import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { Users, Search, Eye, Mail, Phone, Calendar, RefreshCw, X, MapPin, ShoppingBag } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  source?: string;
  signupDate?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  status: 'active' | 'inactive';
}

// Load registered customers from localStorage (for backward compatibility)
const loadLocalCustomers = (): Customer[] => {
  try {
    const registeredUsersStr = localStorage.getItem('registered_users');
    if (registeredUsersStr) {
      const registeredUsers = JSON.parse(registeredUsersStr);
      return registeredUsers.map((user: any) => ({
        id: user.id,
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        phone: user.phone || 'N/A',
        source: 'Local',
        signupDate: 'N/A',
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: 'N/A',
        status: 'active' as const
      }));
    }
  } catch (e) {
    console.error('Error loading local customers:', e);
  }
  return [];
};

export function InventoryPage() {
  const { accessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [lastCustomerCount, setLastCustomerCount] = useState(0);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers from database
  const fetchCustomers = async () => {
    try {
      console.log('🔄 [InventoryPage] Fetching customers from database...');
      console.log('🔑 [InventoryPage] Current accessToken:', accessToken ? accessToken.substring(0, 20) + '...' : 'Not available');
      
      // Smart token detection: use publicAnonKey as fallback for Backend infra auth
      const isMockToken = accessToken?.startsWith('mock-token-');
      const bearerToken = (!isMockToken && accessToken) ? accessToken : publicAnonKey;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      };
      
      console.log('🔐 [InventoryPage] Using token type:', isMockToken ? 'publicAnonKey (mock detected)' : (accessToken ? 'User token' : 'publicAnonKey (no token)'));
      
      const response = await fetch(
        `${API_URL}/customers`,
        { headers }
      );

      console.log('📡 [InventoryPage] Response status:', response.status);
      console.log('📡 [InventoryPage] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        
        console.log('📦 [InventoryPage] Response data:', JSON.stringify(data, null, 2));
        
        if (data.success && data.customers) {
          console.log(`✅ [InventoryPage] Fetched ${data.customers.length} customers from database`);
          console.log('👥 [InventoryPage] Customer emails:', data.customers.map((c: any) => c.email));
          
          // Map database customers to UI format
          const mappedCustomers = data.customers.map((customer: any) => ({
            id: customer.id,
            name: customer.name || 'N/A',
            email: customer.email || 'N/A',
            phone: customer.phone || 'N/A',
            source: customer.source || 'Direct',
            signupDate: customer.signup_date ? new Date(customer.signup_date).toLocaleString() : 'N/A',
            totalOrders: customer.totalOrders || 0,
            totalSpent: customer.totalSpent || 0,
            lastOrderDate: customer.lastOrderDate || 'N/A',
            status: customer.status || 'active'
          }));
          
          // Filter to show ONLY signup customers (exclude customers created from orders)
          const signupCustomers = mappedCustomers.filter((customer: any) => 
            customer.source !== 'Order' && 
            customer.source !== 'Backfill from Order'
          );
          
          // Merge with local customers for backward compatibility
          const localCustomers = loadLocalCustomers();
          const allCustomers = [...signupCustomers];
          
          // Add local customers that aren't in database
          localCustomers.forEach(local => {
            if (!allCustomers.find(c => c.email === local.email)) {
              allCustomers.push(local);
            }
          });
          
          console.log(`✅ [InventoryPage] Total signup customers to display: ${allCustomers.length}`);
          
          // Track new customers
          const newCustomerCount = allCustomers.length - lastCustomerCount;
          if (newCustomerCount > 0 && lastCustomerCount > 0) {
            console.log(`🎉 [InventoryPage] ${newCustomerCount} NEW CUSTOMER(S) DETECTED!`);
          }
          
          setCustomers(allCustomers);
          setLastCustomerCount(allCustomers.length);
          setLastRefreshTime(new Date());
          setIsLoading(false);
          return;
        } else {
          console.log('⚠️ [InventoryPage] Invalid response format:', data);
        }
      } else {
        const errorText = await response.text();
        console.log('⚠️ [InventoryPage] Backend fetch failed, status:', response.status);
        console.log('⚠️ [InventoryPage] Error response:', errorText);
      }
      
      // Fallback to local storage if API fails
      console.log('⚠️ [InventoryPage] Falling back to local storage');
      setCustomers(loadLocalCustomers());
      setLastRefreshTime(new Date());
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ [InventoryPage] Error fetching customers:', error);
      console.error('❌ [InventoryPage] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Fallback to local storage
      setCustomers(loadLocalCustomers());
      setLastRefreshTime(new Date());
      setIsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    console.log('🚀 [InventoryPage] Component mounted, fetching customers...');
    fetchCustomers();
  }, [refreshKey]);

  // Auto-refresh every 10 seconds to catch new signups
  useEffect(() => {
    console.log('⏰ [InventoryPage] Setting up auto-refresh (every 10 seconds)...');
    const interval = setInterval(() => {
      console.log('⏰ [InventoryPage] Auto-refresh triggered');
      fetchCustomers();
    }, 10000); // Refresh every 10 seconds

    return () => {
      console.log('⏰ [InventoryPage] Cleaning up auto-refresh');
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    console.log('🔄 [Manual Refresh] User clicked refresh button');
    setIsRefreshing(true);
    await fetchCustomers();
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
              <p className="text-gray-600 mt-1">View and manage registered customers</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isRefreshing ? 'pointer-events-none' : ''
              }`}
              title="Refresh customer list"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">Total Customers</span>
            <span className="ml-4 text-2xl font-bold text-blue-600">{customers.length}</span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Signup Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Total Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {customer.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">ID: {customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {customer.source || 'Direct'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {customer.signupDate || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{customer.totalOrders}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">₹{customer.totalSpent.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => setSelectedCustomer(customer)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No customers found</p>
            </div>
          )}
        </div>

        {/* Customer Details Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                    {selectedCustomer.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-sm text-gray-500">Customer ID: {selectedCustomer.id}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCustomer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1)}
                  </span>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-gray-900">{selectedCustomer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="text-gray-900">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Source</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {selectedCustomer.source || 'Direct'}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Signup Date</p>
                      <div className="flex items-center gap-1 text-gray-900">
                        <Calendar className="w-4 h-4" />
                        <span>{selectedCustomer.signupDate || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Statistics */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Order Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <ShoppingBag className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-500">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedCustomer.totalOrders}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-500 mb-2">Total Spent</p>
                      <p className="text-2xl font-bold text-green-600">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm font-medium text-gray-500 mb-2">Last Order</p>
                      <p className="text-sm font-semibold text-purple-600">{selectedCustomer.lastOrderDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}