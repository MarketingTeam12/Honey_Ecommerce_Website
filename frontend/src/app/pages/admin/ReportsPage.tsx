import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { TrendingUp, Users, DollarSign, Package, Download, Calendar, Award, ShoppingCart } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { isSalesManager } from '@/app/utils/roleAccess';

const ORDERS_STORAGE_KEY = 'honey_translation_orders';

interface TopBuyer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
}

interface ProductSales {
  productName: string;
  quantity: number;
  revenue: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  items: Array<{
    id: string;
    name: string;
    basePrice: number;
    totalPrice: number;
    pageCount: number;
  }>;
  total_amount: string;
  currency: string;
  status: string;
  created_at: string;
  payment_status: string;
  assigned_to?: string;
}

const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();

const canSalesManagerSeeOrder = (
  order: Order,
  user?: { id?: string; email?: string } | null,
) => {
  if (!user) return false;
  const email = normalize(user.email);
  const userId = normalize(user.id);
  const assignedTo = normalize(order.assigned_to);
  return !!assignedTo && (assignedTo === email || assignedTo === userId);
};

export function ReportsPage() {
  const { accessToken, user } = useAuth();
  const [dateRange, setDateRange] = useState('this-month');
  const [orders, setOrders] = useState<Order[]>([]);
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingProduct: 'N/A',
    topSellingProductCount: 0,
    repeatCustomerRate: 0,
    previousMonthRevenue: 0,
    previousMonthOrders: 0,
    previousMonthAOV: 0,
    totalCustomers: 0
  });

  // Calculate date range
  const getDateRange = (range: string) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this-week':
        const day = now.getDay();
        start.setDate(now.getDate() - day);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this-month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last-month':
        start.setMonth(now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this-year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'all-time':
        // Set to a very early date to include all orders
        start.setFullYear(2000, 0, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  };

  // Load orders and calculate analytics
  useEffect(() => {
    loadOrders();
    loadCustomerCount();
  }, [dateRange, accessToken]);

  const loadOrders = async () => {
    try {
      // STEP 1: Fetch all orders from both backend and localStorage
      let allOrders: Order[] = [];
      
      // Try to fetch from backend first
      try {
        console.log('📡 [ReportsPage] Fetching orders from backend...');
        
        // Smart token detection: use publicAnonKey as fallback for Backend infra auth
        const isMockToken = accessToken?.startsWith('mock-token-');
        const bearerToken = (!isMockToken && accessToken) ? accessToken : publicAnonKey;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`,
        };
        
        console.log('🔐 [ReportsPage] Using token type:', isMockToken ? 'publicAnonKey (mock detected)' : (accessToken ? 'User token' : 'publicAnonKey (no token)'));
        
        const response = await fetch(
          `${API_URL}/orders`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          const backendOrders = data.orders || [];
          console.log(`✅ [ReportsPage] Loaded ${backendOrders.length} orders from backend`);
          allOrders = backendOrders;
        } else {
          console.log('⚠️ [ReportsPage] Backend fetch failed, status:', response.status);
        }
      } catch (backendError) {
        console.log('❌ [ReportsPage] Backend error:', backendError);
      }
      
      // Merge with localStorage orders
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        console.log(`📦 [ReportsPage] Found ${parsedOrders.length} orders in localStorage`);
        
        // Merge orders - backend takes priority
        const backendOrderIds = new Set(allOrders.map(o => o.id));
        const localOnlyOrders = parsedOrders.filter((o: Order) => !backendOrderIds.has(o.id));
        
        if (localOnlyOrders.length > 0) {
          console.log(`➕ [ReportsPage] Adding ${localOnlyOrders.length} localStorage-only orders`);
          allOrders = [...allOrders, ...localOnlyOrders];
        }
      } else {
        console.log('⚠️ [ReportsPage] No orders found in localStorage');
      }
      
      const roleFilteredOrders = isSalesManager(user?.email, user?.role)
        ? allOrders.filter((order) => canSalesManagerSeeOrder(order, user))
        : allOrders;

      console.log('📊 [ReportsPage] Loading analytics for', dateRange);
      console.log('📊 [ReportsPage] Total orders in system:', roleFilteredOrders.length);

      // Get date range
      const { start, end } = getDateRange(dateRange);
      
      // Filter orders by date range
      const filteredOrders = roleFilteredOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= start && orderDate <= end;
      });

      console.log('📊 [ReportsPage] Orders in selected range:', filteredOrders.length);
      console.log('📊 [ReportsPage] Date range:', start.toLocaleDateString(), '-', end.toLocaleDateString());

      setOrders(filteredOrders);

      // Calculate total revenue
      const totalRevenue = filteredOrders.reduce((sum, order) => {
        // Convert to INR if needed (assuming USD to INR conversion rate of 83)
        const orderTotal = order.currency === 'USD' ? parseFloat(order.total_amount) * 83 : parseFloat(order.total_amount);
        return sum + orderTotal;
      }, 0);

      // Calculate total orders
      const totalOrders = filteredOrders.length;

      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate top selling product
      const productSales = new Map<string, ProductSales>();
      filteredOrders.forEach(order => {
        order.items.forEach(item => {
          const existing = productSales.get(item.name) || { productName: item.name, quantity: 0, revenue: 0 };
          const itemRevenue = order.currency === 'USD' ? item.totalPrice * 83 : item.totalPrice;
          existing.quantity += item.pageCount;
          existing.revenue += itemRevenue * item.pageCount;
          productSales.set(item.name, existing);
        });
      });

      let topSellingProduct = 'N/A';
      let topSellingProductCount = 0;
      if (productSales.size > 0) {
        const sorted = Array.from(productSales.values()).sort((a, b) => b.quantity - a.quantity);
        topSellingProduct = sorted[0].productName;
        topSellingProductCount = sorted[0].quantity;
      }

      // Calculate repeat customer rate
      const customerOrderCounts = new Map<string, number>();
      filteredOrders.forEach(order => {
        // Normalize email: lowercase and trim whitespace to avoid duplicates
        const normalizedEmail = order.customer_email?.toLowerCase().trim() || '';
        if (normalizedEmail) {
          customerOrderCounts.set(normalizedEmail, (customerOrderCounts.get(normalizedEmail) || 0) + 1);
        }
      });
      const repeatCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;
      const customersWhoOrdered = customerOrderCounts.size; // Renamed to avoid confusion
      const repeatCustomerRate = customersWhoOrdered > 0 ? (repeatCustomers / customersWhoOrdered) * 100 : 0;

      // Calculate previous period data for comparison
      let previousMonthRevenue = 0;
      let previousMonthOrders = 0;
      let previousMonthAOV = 0;

      if (dateRange === 'this-month') {
        const prevStart = new Date();
        prevStart.setMonth(prevStart.getMonth() - 1, 1);
        prevStart.setHours(0, 0, 0, 0);
        const prevEnd = new Date();
        prevEnd.setMonth(prevEnd.getMonth(), 0);
        prevEnd.setHours(23, 59, 59, 999);

        const prevMonthOrders = roleFilteredOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= prevStart && orderDate <= prevEnd;
        });

        previousMonthRevenue = prevMonthOrders.reduce((sum, order) => {
          const orderTotal = order.currency === 'USD' ? parseFloat(order.total_amount) * 83 : parseFloat(order.total_amount);
          return sum + orderTotal;
        }, 0);
        previousMonthOrders = prevMonthOrders.length;
        previousMonthAOV = previousMonthOrders > 0 ? previousMonthRevenue / previousMonthOrders : 0;
      }

      // Calculate top buyers
      const buyerStats = new Map<string, { name: string; email: string; orders: number; spent: number }>();
      filteredOrders.forEach(order => {
        // Normalize email: lowercase and trim whitespace to avoid duplicates
        const normalizedEmail = order.customer_email?.toLowerCase().trim() || '';
        if (!normalizedEmail) return;
        
        const orderTotal = order.currency === 'USD' ? parseFloat(order.total_amount) * 83 : parseFloat(order.total_amount);
        
        if (buyerStats.has(normalizedEmail)) {
          const buyer = buyerStats.get(normalizedEmail)!;
          buyer.orders += 1;
          buyer.spent += orderTotal;
        } else {
          buyerStats.set(normalizedEmail, {
            name: order.customer_name,
            email: normalizedEmail,
            orders: 1,
            spent: orderTotal
          });
        }
      });

      const topBuyersList: TopBuyer[] = Array.from(buyerStats.values())
        .map((buyer, index) => ({
          id: String(index + 1),
          name: buyer.name,
          email: buyer.email,
          totalOrders: buyer.orders,
          totalSpent: buyer.spent,
          averageOrderValue: buyer.spent / buyer.orders
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 3); // Show only top 3 buyers

      setTopBuyers(topBuyersList);

      setSalesData(prev => ({
        ...prev,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topSellingProduct,
        topSellingProductCount,
        repeatCustomerRate,
        previousMonthRevenue,
        previousMonthOrders,
        previousMonthAOV
        // totalCustomers is now set by loadCustomerCount() only
      }));

      console.log('✅ [ReportsPage] Analytics calculated:', {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        topSellingProduct,
        topBuyers: topBuyersList.length
      });

    } catch (error) {
      console.error('❌ [ReportsPage] Failed to load analytics:', error);
    }
  };

  const loadCustomerCount = async () => {
    try {
      console.log('👥 [ReportsPage] Fetching customer count...');
      
      // Smart token detection: use publicAnonKey as fallback for Backend infra auth
      const isMockToken = accessToken?.startsWith('mock-token-');
      const custBearerToken = (!isMockToken && accessToken) ? accessToken : publicAnonKey;
      const custHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${custBearerToken}`,
      };
      
      console.log('🔐 [ReportsPage] Using token type:', isMockToken ? 'publicAnonKey (mock detected)' : (accessToken ? 'User token' : 'publicAnonKey (no token)'));
      
      const response = await fetch(
        `${API_URL}/customers`,
        { headers: custHeaders }
      );

      if (response.ok) {
        const data = await response.json();
        const allCustomers = data.customers || [];
        
        // Filter to show ONLY signup customers (exclude customers created from orders)
        // This matches the Inventory page filtering logic
        const signupCustomers = allCustomers.filter((customer: any) => 
          customer.source !== 'Order' && 
          customer.source !== 'Backfill from Order'
        );
        
        const customerCount = signupCustomers.length;
        console.log(`✅ [ReportsPage] Total customers from backend: ${allCustomers.length}`);
        console.log(`✅ [ReportsPage] Signup customers only: ${customerCount}`);
        setSalesData(prev => ({ ...prev, totalCustomers: customerCount }));
      } else {
        console.log('⚠️ [ReportsPage] Backend fetch failed, status:', response.status);
      }
    } catch (error) {
      console.error('❌ [ReportsPage] Failed to load customer count:', error);
    }
  };

  // Calculate growth percentages
  const revenueGrowth = salesData.previousMonthRevenue > 0 
    ? ((salesData.totalRevenue - salesData.previousMonthRevenue) / salesData.previousMonthRevenue * 100).toFixed(1)
    : '0.0';
  const ordersGrowth = salesData.previousMonthOrders > 0
    ? ((salesData.totalOrders - salesData.previousMonthOrders) / salesData.previousMonthOrders * 100).toFixed(1)
    : '0.0';
  const aovGrowth = salesData.previousMonthAOV > 0
    ? ((salesData.averageOrderValue - salesData.previousMonthAOV) / salesData.previousMonthAOV * 100).toFixed(1)
    : '0.0';

  const handleExportReport = () => {
    try {
      // Prepare report data
      const reportData = {
        dateRange,
        generatedAt: new Date().toISOString(),
        summary: salesData,
        topBuyers,
        orders: orders.map(order => ({
          id: order.id,
          customer: order.customer_name,
          email: order.customer_email,
          total: parseFloat(order.total_amount),
          currency: order.currency,
          status: order.status,
          date: order.created_at
        }))
      };

      // Convert to CSV format
      let csv = 'HONEY TRANSLATION SERVICES - SALES REPORT\n';
      csv += `Date Range: ${dateRange}\n`;
      csv += `Generated: ${new Date().toLocaleString()}\n\n`;
      
      csv += 'SUMMARY\n';
      csv += `Total Revenue,₹${Math.round(salesData.totalRevenue).toLocaleString()}\n`;
      csv += `Total Orders,${salesData.totalOrders}\n`;
      csv += `Average Order Value,₹${Math.round(salesData.averageOrderValue).toLocaleString()}\n`;
      csv += `Top Selling Product,${salesData.topSellingProduct}\n`;
      csv += `Total Customers,${salesData.totalCustomers}\n`;
      csv += `Repeat Customer Rate,${salesData.repeatCustomerRate.toFixed(1)}%\n\n`;

      csv += 'TOP BUYERS\n';
      csv += 'Rank,Name,Email,Total Orders,Total Spent,Avg Order Value\n';
      topBuyers.forEach((buyer, index) => {
        csv += `${index + 1},${buyer.name},${buyer.email},${buyer.totalOrders},₹${Math.round(buyer.totalSpent).toLocaleString()},₹${Math.round(buyer.averageOrderValue).toLocaleString()}\n`;
      });

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `honey-sales-report-${dateRange}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ [ReportsPage] Report exported successfully');
    } catch (error) {
      console.error('❌ [ReportsPage] Failed to export report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Real-time sales insights and customer analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="all-time">All Time</option>
            </select>
            <button 
              onClick={handleExportReport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Sales Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">TOTAL REVENUE</h3>
            <p className="text-3xl font-bold">₹{Math.round(salesData.totalRevenue).toLocaleString('en-IN')}</p>
            {dateRange === 'this-month' && (
              <p className="text-sm opacity-80 mt-2">
                {parseFloat(revenueGrowth) >= 0 ? '+' : ''}{revenueGrowth}% from last month
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">TOTAL ORDERS</h3>
            <p className="text-3xl font-bold">{salesData.totalOrders}</p>
            {dateRange === 'this-month' && (
              <p className="text-sm opacity-80 mt-2">
                {parseFloat(ordersGrowth) >= 0 ? '+' : ''}{ordersGrowth}% from last month
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">AVG ORDER VALUE</h3>
            <p className="text-3xl font-bold">₹{Math.round(salesData.averageOrderValue).toLocaleString('en-IN')}</p>
            {dateRange === 'this-month' && (
              <p className="text-sm opacity-80 mt-2">
                {parseFloat(aovGrowth) >= 0 ? '+' : ''}{aovGrowth}% from last month
              </p>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Top Selling Product</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{salesData.topSellingProduct}</p>
            <p className="text-sm text-gray-500 mt-1">
              {salesData.topSellingProductCount} {salesData.topSellingProductCount === 1 ? 'order' : 'orders'} this period
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Customers</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{salesData.totalCustomers}</p>
            <p className="text-sm text-gray-500 mt-1">Unique customers</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Repeat Customers</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{salesData.repeatCustomerRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500 mt-1">Customer retention rate</p>
          </div>
        </div>

        {/* Top Buyers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Top Buyers</h2>
                  <p className="text-sm text-gray-600">Customers with highest purchase value in this period</p>
                </div>
              </div>
            </div>
          </div>

          {topBuyers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topBuyers.map((buyer, index) => (
                    <tr key={buyer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          <span className="font-semibold text-gray-900">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {buyer.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{buyer.name}</p>
                            <p className="text-sm text-gray-500">{buyer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">{buyer.totalOrders}</span>
                        <span className="text-gray-500 text-sm ml-1">{buyer.totalOrders === 1 ? 'order' : 'orders'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-green-600">₹{Math.round(buyer.totalSpent).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">₹{Math.round(buyer.averageOrderValue).toLocaleString('en-IN')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No customer data available</p>
              <p className="text-sm text-gray-400 mt-2">Top buyers will appear here once orders are placed</p>
            </div>
          )}
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sales Overview</h2>
                <p className="text-sm text-gray-600">Performance metrics for selected period</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <DollarSign className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{Math.round(salesData.totalRevenue).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <Package className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">Orders</p>
              <p className="text-2xl font-bold text-gray-900">{salesData.totalOrders}</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <Users className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">Customers</p>
              <p className="text-2xl font-bold text-gray-900">{salesData.totalCustomers}</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <TrendingUp className="w-10 h-10 text-orange-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">Avg Order</p>
              <p className="text-2xl font-bold text-gray-900">₹{Math.round(salesData.averageOrderValue).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default ReportsPage;
