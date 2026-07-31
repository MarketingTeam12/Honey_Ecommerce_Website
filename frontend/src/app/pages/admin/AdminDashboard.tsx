import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { useProducts } from '@/app/context/ProductContext';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { Clock, AlertCircle, XCircle, DollarSign, Package, BarChart3, TrendingUp, ShoppingCart, Users, Database, ExternalLink } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name?: string;
  customer_email?: string;
  payment_method: string;
  payment_status: string;
  status: string;
  total_amount: string;
  created_at: string;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: string;
}

interface DashboardData {
  stats: DashboardStats;
  pendingOrdersCount: number;
  cancellationRequestsCount: number;
  pendingPaymentsCount: number;
  outOfStockCount: number;
  pendingOrders: any[];
  cancellationRequests: any[];
  pendingPayments: any[];
  outOfStockItems: any[];
}

const ORDERS_STORAGE_KEY = 'honey_translation_orders';

const parseCurrencyAmount = (amount: unknown) => {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
  return Number.isFinite(numericAmount) ? numericAmount : 0;
};

const loadOrdersFromLocalStorage = (): Order[] => {
  const orderMap = new Map<string, Order>();

  ['honey_translation_orders', 'user_orders'].forEach((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((order: Order) => {
          if (order?.id) {
            orderMap.set(order.id, order);
          }
        });
      }
    } catch (error) {
      console.warn(`Failed to parse ${key}:`, error);
    }
  });

  return Array.from(orderMap.values());
};

const mergeOrders = (backendOrders: Order[], localOrders: Order[]) => {
  const orderMap = new Map<string, Order>();

  backendOrders.forEach((order) => {
    if (order?.id) {
      orderMap.set(order.id, order);
    }
  });

  localOrders.forEach((order) => {
    if (order?.id) {
      const existing = orderMap.get(order.id);
      orderMap.set(order.id, existing ? { ...existing, ...order } : order);
    }
  });

  return Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

const normalizeStatus = (value: unknown) => String(value || '').trim().toLowerCase();

const isPendingOrder = (order: Order) => {
  const status = normalizeStatus(order.status);
  const paymentStatus = normalizeStatus(order.payment_status);

  if (['shipped', 'delivered', 'cancelled', 'canceled', 'refunded'].includes(status)) {
    return false;
  }

  if (
    status.includes('pending') ||
    status.includes('received') ||
    status.includes('await') ||
    status.includes('new') ||
    status.includes('confirmed') ||
    status.includes('review') ||
    status.includes('processing') ||
    status.includes('analysis')
  ) {
    return true;
  }

  return paymentStatus === 'pending';
};

const getOrdersStats = (orders: Order[]) => {
  const pendingOrders = orders.filter(isPendingOrder);
  const shippingOrders = orders.filter((order) => {
    const status = normalizeStatus(order.status);
    return ['processing', 'shipped', 'courier'].includes(status);
  });
  const paidOrders = orders.filter((order) => ['paid', 'delivered'].includes(normalizeStatus(order.payment_status)));
  const unpaidOrders = orders.filter((order) => normalizeStatus(order.payment_status) !== 'paid');
  const uniqueCustomers = new Set(
    orders.map((order) => order.customer_email || order.customer_name || order.user_id).filter(Boolean)
  );

  return {
    pendingOrders,
    shippingOrders,
    totalOrders: orders.length,
    totalCustomers: uniqueCustomers.size,
    totalRevenue: paidOrders.reduce((sum, order) => sum + parseCurrencyAmount(order.total_amount), 0),
    yetToReceivePayments: unpaidOrders.reduce((sum, order) => sum + parseCurrencyAmount(order.total_amount), 0),
  };
};

export function AdminDashboard() {
  const { products } = useProducts();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false); // Changed to false for instant load
  const [storageStatus, setStorageStatus] = useState<{ allReady: boolean } | null>(null);
  const [showStorageBanner, setShowStorageBanner] = useState(true);

  // Load dashboard data from backend
  useEffect(() => {
    // Load immediately without blocking UI
    loadDashboardData();
    checkStorageStatus();

    const handleNewOrder = () => {
      console.log('?? [Dashboard] New order notification received, refreshing dashboard...');
      void loadDashboardData();
    };

    window.addEventListener('newOrderNotification', handleNewOrder);

    const interval = setInterval(() => {
      console.log('?? [Dashboard] Auto-refreshing dashboard metrics...');
      void loadDashboardData();
    }, 15000);

    return () => {
      window.removeEventListener('newOrderNotification', handleNewOrder);
      clearInterval(interval);
    };
  }, []);

  // Check storage bucket status
  const checkStorageStatus = async () => {
    try {
      const response = await fetch(
        `${API_URL}/storage/check-buckets`
      );
      if (response.ok) {
        const data = await response.json();
        setStorageStatus(data);
      }
    } catch (error) {
      console.log('Could not check storage status:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Keep UI interactive while data refreshes in background
      
      console.log('?? [Dashboard] Fetching dashboard data...');
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(
          `${API_URL}/orders`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${publicAnonKey}`,
              apikey: publicAnonKey,
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        console.log('?? [Dashboard] Response status:', response.status);

        if (!response.ok) {
          throw new Error('Orders endpoint unavailable');
        }

        const data = await response.json();
        const backendOrders: Order[] = Array.isArray(data.orders) ? data.orders : [];
        const localOrders = loadOrdersFromLocalStorage();
        const mergedOrders = mergeOrders(backendOrders, localOrders);
        const orderStats = getOrdersStats(mergedOrders);

        setDashboardData({
          stats: {
            totalProducts: products.length,
            totalOrders: orderStats.totalOrders,
            totalCustomers: orderStats.totalCustomers,
            totalRevenue: String(orderStats.totalRevenue),
          },
          pendingOrdersCount: orderStats.pendingOrders.length,
          cancellationRequestsCount: 0,
          pendingPaymentsCount: orderStats.yetToReceivePayments > 0 ? 1 : 0,
          outOfStockCount: 0,
          pendingOrders: orderStats.pendingOrders,
          cancellationRequests: [],
          pendingPayments: orderStats.yetToReceivePayments > 0
            ? [{ amount: String(orderStats.yetToReceivePayments) }]
            : [],
          outOfStockItems: []
        });
        console.log(`? [Dashboard] Loaded ${mergedOrders.length} orders from backend/localStorage`);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.log('? [Dashboard] Request timed out - using fallback data');
        } else {
          console.log('? [Dashboard] Fetch error:', fetchError.message);
        }

        const localOrders = loadOrdersFromLocalStorage();
        const orderStats = getOrdersStats(localOrders);

        setDashboardData({
          stats: {
            totalProducts: products.length,
            totalOrders: orderStats.totalOrders,
            totalCustomers: orderStats.totalCustomers,
            totalRevenue: String(orderStats.totalRevenue),
          },
          pendingOrdersCount: orderStats.pendingOrders.length,
          cancellationRequestsCount: 0,
          pendingPaymentsCount: orderStats.yetToReceivePayments > 0 ? 1 : 0,
          outOfStockCount: 0,
          pendingOrders: orderStats.pendingOrders,
          cancellationRequests: [],
          pendingPayments: orderStats.yetToReceivePayments > 0
            ? [{ amount: String(orderStats.yetToReceivePayments) }]
            : [],
          outOfStockItems: []
        });
      }
    } catch (error) {
      // Set local fallback data - no error shown to user
      console.log('? [Dashboard] Using local fallback mode (backend not available)');
      const localOrders = loadOrdersFromLocalStorage();
      const orderStats = getOrdersStats(localOrders);
      setDashboardData({
        stats: {
          totalProducts: products.length,
          totalOrders: orderStats.totalOrders,
          totalCustomers: orderStats.totalCustomers,
          totalRevenue: String(orderStats.totalRevenue),
        },
        pendingOrdersCount: orderStats.pendingOrders.length,
        cancellationRequestsCount: 0,
        pendingPaymentsCount: 0,
        outOfStockCount: 0,
        pendingOrders: orderStats.pendingOrders,
        cancellationRequests: [],
        pendingPayments: [],
        outOfStockItems: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate real-time statistics
  const stats = dashboardData ? {
    pendingOrders: dashboardData.pendingOrdersCount,
    returnRequests: 0, // Not tracking return requests currently
    pendingCancelRequests: dashboardData.cancellationRequestsCount,
    yetToReceivePayments: dashboardData.pendingPayments.reduce((sum, payment) => {
      const amount = String(payment.amount || '0').replace(/[^\d.-]/g, '');
      return sum + parseFloat(amount);
    }, 0),
    outOfStockItems: dashboardData.outOfStockCount,
    salesSummary: dashboardData.stats.totalOrders,
    totalProducts: dashboardData.stats.totalProducts,
    totalCustomers: dashboardData.stats.totalCustomers,
    totalRevenue: parseFloat(dashboardData.stats.totalRevenue),
    activeProducts: products.filter(p => p.status === 'active').length,
    draftProducts: products.filter(p => p.status === 'draft').length,
    shippingOrders: dashboardData.pendingOrders.filter((order: any) => 
      order.status === 'processing' || order.status === 'shipped'
    ).length
  } : {
    pendingOrders: 0,
    returnRequests: 0,
    pendingCancelRequests: 0,
    yetToReceivePayments: 0,
    outOfStockItems: 0,
    salesSummary: 0,
    totalProducts: products.length,
    totalCustomers: 0,
    totalRevenue: 0,
    activeProducts: products.filter(p => p.status === 'active').length,
    draftProducts: products.filter(p => p.status === 'draft').length,
    shippingOrders: 0
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your store today.</p>
          {loading && (
            <p className="text-xs text-blue-600 mt-2">Updating latest data...</p>
          )}
        </div>

        {/* Storage Setup Banner */}
        {storageStatus && !storageStatus.allReady && showStorageBanner && (
          <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-orange-900 mb-1">
                    Storage Setup Required
                  </h3>
                  <p className="text-sm text-orange-800 mb-2">
                    Storage buckets need to be created manually in your Backend Dashboard to enable file uploads.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/storage-setup"
                      className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-900 underline"
                    >
                      View Setup Guide
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <span className="text-gray-400">•</span>
                    <a
                      href="https://authClient.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-900 underline"
                    >
                      Open Backend Dashboard
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowStorageBanner(false)}
                className="text-orange-400 hover:text-orange-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Pending Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">PENDING ORDERS</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingOrders}</p>
            <p className="text-xs text-gray-500">To Be Confirmed</p>
          </div>

          {/* Return Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">RETURN REQUESTS</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.returnRequests}</p>
            <p className="text-xs text-gray-500">To Be Reviewed</p>
          </div>

          {/* Cancel Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">PENDING CANCEL REQUEST</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.pendingCancelRequests}</p>
            <p className="text-xs text-gray-500">To Be Processed</p>
          </div>

          {/* Payments to Receive */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">YET TO RECEIVE PAYMENTS</h3>
            <p className="text-2xl font-bold text-gray-900 mb-1 break-words">{stats.yetToReceivePayments.toFixed(2)}</p>
            <p className="text-xs text-gray-500">To Be Received</p>
          </div>

        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Sales Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sales Summary</h3>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-6xl font-bold text-gray-900">{stats.salesSummary}</p>
                <p className="text-sm text-gray-500 mt-2">Total Sales</p>
              </div>
            </div>
          </div>

          {/* Shipping Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Shipping Overview</h3>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-6xl font-bold text-gray-900">{stats.shippingOrders}</p>
                <p className="text-sm text-gray-500 mt-2">Orders Being Shipped</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Link
            to="/admin/items/new"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all group"
          >
            <Package className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-2">Add New Product</h3>
            <p className="text-blue-100">Create a new product listing</p>
          </Link>

          <Link
            to="/admin/orders"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all group"
          >
            <ShoppingCart className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-2">Manage Orders</h3>
            <p className="text-purple-100">View and process orders</p>
          </Link>

          <Link
            to="/admin/customers"
            className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all group"
          >
            <Users className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold mb-2">View Customers</h3>
            <p className="text-green-100">Manage customer database</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
