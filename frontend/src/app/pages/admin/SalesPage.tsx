import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, TrendingUp, DollarSign, Clock, Package, Eye, Truck, CheckCircle, XCircle, Edit, AlertCircle, Bell, Search, Filter, RefreshCw, ChevronDown, ChevronUp, User, Calendar, MapPin, FileText, ArrowRight, Check, Loader, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { EnhancedOrderRow } from '@/app/components/admin/EnhancedOrderRow';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { isSalesManager } from '@/app/utils/roleAccess';

const ORDERS_STORAGE_KEY = 'honey_translation_orders';
const ORDER_ASSIGNMENTS_KEY = 'honey_translation_order_assignments';

// 12-step workflow system
const WORKFLOW_STAGES = [
  { id: 'received', label: 'Received', color: 'yellow', icon: Package },
  { id: 'payment-pending', label: 'Payment Pending', color: 'orange', icon: Clock },
  { id: 'confirmed', label: 'Confirmed', color: 'blue', icon: CheckCircle },
  { id: 'document-analysis', label: 'Document Analysis', color: 'indigo', icon: FileText },
  { id: 'translator-working', label: 'Translator Working', color: 'purple', icon: User },
  { id: 'formatting', label: 'Formatting', color: 'violet', icon: Edit },
  { id: 'proof-checking', label: 'Proof Checking', color: 'pink', icon: Eye },
  { id: 'draft-ready', label: 'Draft Ready', color: 'cyan', icon: FileText },
  { id: 'soft-copy-ready', label: 'Soft Copy Ready', color: 'teal', icon: CheckCircle },
  { id: 'courier', label: 'Courier', color: 'purple', icon: Truck },
  { id: 'shipped', label: 'Shipped', color: 'violet', icon: Truck },
  { id: 'delivered', label: 'Delivered', color: 'green', icon: CheckCircle }
] as const;

interface OrderItem {
  id: string;
  name: string;
  basePrice: number;
  totalPrice: number;
  pageCount: number;
}

interface WorkflowTimestamp {
  stage: string;
  timestamp: string;
  duration?: number; // in minutes
}

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
  subtotal: string;
  discount: string;
  tax: string;
  currency: string;
  items: OrderItem[];
  shipping_address?: any;
  shipping_details?: {
    email?: string;
    address?: string;
  };
  shipping_method?: string;
  tracking_number?: string;
  shipping_carrier?: string;
  estimated_delivery?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  workflow_timeline?: WorkflowTimestamp[];
  assigned_to?: string;
  notes?: string;
  isNew?: boolean; // For highlight animation
}

const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();
const toSearchableText = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).toLowerCase();
  }
  if (Array.isArray(value)) {
    return value.map((item) => toSearchableText(item)).join(' ');
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map((item) => toSearchableText(item))
      .join(' ');
  }
  return '';
};

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

export function SalesPage() {
  const { accessToken, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [updating, setUpdating] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [notifications, setNotifications] = useState<string[]>([]);
  const previousOrdersRef = useRef<Order[]>([]);
  const [assignedPerson, setAssignedPerson] = useState('');
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    fetchOrders();
    
    // Listen for new order notifications from customers
    const handleNewOrderEvent = (event: any) => {
      console.log('🔔 [SalesPage] New order notification received!', event.detail);
      toast.success(`New order received: ${event.detail.orderNumber || 'Order placed'}`);
      // Immediately fetch orders to show the new order
      fetchOrders();
    };
    
    window.addEventListener('newOrderNotification', handleNewOrderEvent);
    
    // Poll for new orders with live updates
    const interval = setInterval(() => {
      if (liveUpdatesEnabled) {
        console.log('🔄 [SalesPage] Auto-refreshing orders...');
        fetchOrders();
        setLastRefresh(new Date());
      }
    }, 15000);
    
    return () => {
      window.removeEventListener('newOrderNotification', handleNewOrderEvent);
      clearInterval(interval);
    };
  }, [liveUpdatesEnabled, user?.id, user?.email, user?.role]);

  // Helper function to calculate progress percentage based on current stage
  const getProgressPercentage = (status: string): number => {
    const currentIndex = WORKFLOW_STAGES.findIndex(stage => stage.id === status);
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / WORKFLOW_STAGES.length) * 100);
  };

  // Helper function to get next stage
  const getNextStage = (currentStatus: string): string | null => {
    const currentIndex = WORKFLOW_STAGES.findIndex(stage => stage.id === currentStatus);
    if (currentIndex === -1 || currentIndex === WORKFLOW_STAGES.length - 1) return null;
    return WORKFLOW_STAGES[currentIndex + 1].id;
  };

  // Helper function to get stage color classes
  const getStageColorClass = (stage: string, currentStage: string): string => {
    const currentIndex = WORKFLOW_STAGES.findIndex(s => s.id === currentStage);
    const stageIndex = WORKFLOW_STAGES.findIndex(s => s.id === stage);
    
    if (stageIndex < currentIndex) {
      return 'bg-green-100 text-green-800 border-green-300'; // Completed
    } else if (stageIndex === currentIndex) {
      const stageInfo = WORKFLOW_STAGES[stageIndex];
      const colorMap = {
        yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse',
        orange: 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse',
        blue: 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse',
        indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300 animate-pulse',
        purple: 'bg-purple-100 text-purple-800 border-purple-300 animate-pulse',
        violet: 'bg-violet-100 text-violet-800 border-violet-300 animate-pulse',
        pink: 'bg-pink-100 text-pink-800 border-pink-300 animate-pulse',
        cyan: 'bg-cyan-100 text-cyan-800 border-cyan-300 animate-pulse',
        teal: 'bg-teal-100 text-teal-800 border-teal-300 animate-pulse',
        green: 'bg-green-100 text-green-800 border-green-300'
      };
      return colorMap[stageInfo.color] || 'bg-gray-100 text-gray-800 border-gray-300';
    } else {
      return 'bg-gray-50 text-gray-400 border-gray-200'; // Pending
    }
  };

  // Helper function to toggle row expansion
  const toggleRowExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  // Helper function to move order to next stage
  const moveToNextStage = async (order: Order) => {
    const nextStage = getNextStage(order.status);
    if (!nextStage) {
      toast.info('Order is already at final stage');
      return;
    }
    
    setStatusUpdateModal(order);
    setNewStatus(nextStage);
    setTimeout(() => handleUpdateStatus(), 100);
  };

  // Helper function to calculate time in current stage
  const getTimeInStage = (order: Order): string => {
    const updatedAt = new Date(order.updated_at);
    const now = new Date();
    const diffMs = now.getTime() - updatedAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('📦 [SalesPage] Fetching all orders from backend...');
      console.log('📦 [SalesPage] API URL:', `${API_URL}/orders`);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      let backendOrders = [];
      let backendFailed = false;
      
      try {
        const response = await fetch(
          `${API_URL}/orders`,
          {
            headers: buildHeaders(accessToken),
            signal: controller.signal
          }
        );

        clearTimeout(timeout);

        console.log('📡 [SalesPage] Response status:', response.status);
        console.log('📡 [SalesPage] Response ok:', response.ok);

        if (response.ok) {
          const data = await response.json();
          backendOrders = data.orders || [];
          console.log(`✅ [SalesPage] Loaded ${backendOrders.length} orders from backend`);
          console.log('🔍 [SalesPage] Raw response data:', data);
          
          // Log each order's key details
          backendOrders.forEach((order, index) => {
            console.log(`  📋 Order ${index + 1}:`, {
              id: order.id,
              orderNumber: order.order_number,
              customerEmail: order.customer_email,
              customerName: order.customer_name,
              amount: order.total_amount,
              status: order.status,
              createdAt: order.created_at
            });
          });
        } else {
          console.log('⚠️ [SalesPage] Backend fetch failed, status:', response.status);
          backendFailed = true;
          
          // Try to get error details
          try {
            const errorData = await response.json();
            console.log('⚠️ [SalesPage] Error details:', errorData);
          } catch (e) {
            console.log('⚠️ [SalesPage] Could not parse error response');
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeout);
        backendFailed = true;
        
        if (fetchError.name === 'AbortError') {
          console.log('⚠️ [SalesPage] Request timed out (backend not responding)');
        } else {
          console.error('❌ [SalesPage] Fetch error:', fetchError);
        }
      }
      
      // Get localStorage orders
      const localOrders = localStorage.getItem('honey_translation_orders');
      let parsedLocalOrders = [];
      if (localOrders) {
        parsedLocalOrders = JSON.parse(localOrders);
        console.log(`📦 [SalesPage] Found ${parsedLocalOrders.length} orders in localStorage`);
      } else {
        console.log('⚠️ [SalesPage] No orders in localStorage');
      }
      
      // Merge backend and localStorage orders (use backend as source of truth, but include localStorage orders not in backend)
      const mergedOrders = [...backendOrders];
      const backendOrderIds = new Set(backendOrders.map(o => o.id));
      
      // Add localStorage orders that are not in backend
      for (const localOrder of parsedLocalOrders) {
        if (!backendOrderIds.has(localOrder.id)) {
          console.log(`📋 [SalesPage] Adding localStorage-only order: ${localOrder.order_number}`);
          mergedOrders.push(localOrder);
        }
      }
      
      // Sort by created_at descending
      mergedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const assignedMergedOrders = applyStoredAssignments(mergedOrders);
      const visibleOrders = isSalesManager(user?.email, user?.role)
        ? assignedMergedOrders.filter((order) => canSalesManagerSeeOrder(order, user))
        : assignedMergedOrders;
      
      console.log(`✅ [SalesPage] Total orders to display: ${visibleOrders.length} (${backendOrders.length} from backend, ${mergedOrders.length - backendOrders.length} from localStorage only)`);
      if (visibleOrders.length > 0) {
        console.log('👥 [SalesPage] Customers in orders:', [...new Set(visibleOrders.map(o => o.customer_name || o.customer_email || 'Unknown'))]);
      }
      
      // Highlight new orders
      const previousOrders = previousOrdersRef.current;
      const newOrderIds = new Set(previousOrders.map(o => o.id));
      
      // Mark new orders with isNew flag
      visibleOrders.forEach(order => {
        if (!newOrderIds.has(order.id)) {
          order.isNew = true;
          // Remove isNew flag after 3 seconds
          setTimeout(() => {
            setOrders(prevOrders => 
              prevOrders.map(o => o.id === order.id ? { ...o, isNew: false } : o)
            );
          }, 3000);
        }
      });
      
      setOrders(visibleOrders);
      previousOrdersRef.current = visibleOrders;
      
      // Check for status changes and show notifications
      const statusChanges = visibleOrders.filter(order => {
        const previousOrder = previousOrders.find(prevOrder => prevOrder.id === order.id);
        return previousOrder && previousOrder.status !== order.status;
      });
      
      if (statusChanges.length > 0) {
        statusChanges.forEach(order => {
          toast.success(`Order ${order.order_number} moved to ${getStatusLabel(order.status)}`);
        });
        const newNotifications = statusChanges.map(order => `Order ${order.order_number} status changed to ${order.status}`);
        setNotifications([...notifications, ...newNotifications]);
      }
    } catch (error) {
      console.error('❌ [SalesPage] Error loading orders:', error);
      
      // Final fallback: try to load from localStorage
      const localOrders = localStorage.getItem('honey_translation_orders');
      if (localOrders) {
        const parsedOrders = JSON.parse(localOrders);
        console.log(`✅ [SalesPage] Loaded ${parsedOrders.length} orders from localStorage (final fallback)`);
        const assignedOrders = applyStoredAssignments(parsedOrders);
        const visibleOrders = isSalesManager(user?.email, user?.role)
          ? assignedOrders.filter((order: Order) => canSalesManagerSeeOrder(order, user))
          : assignedOrders;
        setOrders(visibleOrders);
      } else {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusUpdateModal || !newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      
      // PRIORITY 1: Update order in backend database
      console.log('🔄 [SalesPage] Updating order status in backend...', statusUpdateModal.id);
      console.log('📦 [SalesPage] Status:', newStatus);
      console.log('📦 [SalesPage] Tracking Number:', trackingNumber || statusUpdateModal.tracking_number || 'NOT SET');
      console.log('📦 [SalesPage] Shipping Carrier:', shippingCarrier || statusUpdateModal.shipping_carrier || 'NOT SET');
      
      let backendSuccess = false;
      
      try {
        const updatePayload = {
          status: newStatus,
          tracking_number: trackingNumber || statusUpdateModal.tracking_number || undefined,
          shipping_carrier: shippingCarrier || statusUpdateModal.shipping_carrier || undefined
        };
        
        console.log('📦 [SalesPage] Sending payload to backend:', JSON.stringify(updatePayload, null, 2));
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(
          `${API_URL}/orders/${statusUpdateModal.id}/status`,
          {
            method: 'PATCH',
            headers: buildHeaders(accessToken),
            body: JSON.stringify(updatePayload),
            signal: controller.signal
          }
        );

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [SalesPage] Order status updated in backend:', data);
          backendSuccess = true;
          
          // Update local state with the backend response
          const updatedOrder = data.order;
          const updatedOrders = orders.map(o => o.id === statusUpdateModal.id ? updatedOrder : o);
          setOrders(updatedOrders);
          
          // Also update localStorage for backwards compatibility
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
          
          // Also update in user_orders (customer view) so customers see updated status
          try {
            const userOrders = localStorage.getItem('user_orders');
            if (userOrders) {
              const parsedUserOrders = JSON.parse(userOrders);
              const updatedUserOrders = parsedUserOrders.map((o: Order) => 
                o.id === statusUpdateModal.id ? updatedOrder : o
              );
              localStorage.setItem('user_orders', JSON.stringify(updatedUserOrders));
              console.log('✅ [SalesPage] Order synced to user_orders localStorage');
            }
          } catch (e) {
            console.log('ℹ️ [SalesPage] Could not sync to user_orders (no customer orders found)');
          }
          
          toast.success('Order status updated successfully');
          setStatusUpdateModal(null);
          setNewStatus('');
          setTrackingNumber('');
          setShippingCarrier('');
          
          console.log('✅ [SalesPage] Order status updated:', updatedOrder.order_number, 'to', newStatus);
          return;
        } else {
          const errorText = await response.text();
          console.log('ℹ️ [SalesPage] Backend not available (status:', response.status, '), using offline mode');
        }
      } catch (backendError: any) {
        if (backendError.name === 'AbortError') {
          console.log('ℹ️ [SalesPage] Backend timeout, using offline mode');
        } else {
          console.log('ℹ️ [SalesPage] Backend not reachable, using offline mode');
        }
      }
      
      // FALLBACK: Update order in localStorage (offline mode)
      if (!backendSuccess) {
        console.log('💾 [SalesPage] Saving order update to localStorage (offline mode)...');
        const updatedOrder = {
          ...statusUpdateModal,
          status: newStatus,
          tracking_number: trackingNumber || statusUpdateModal.tracking_number,
          shipping_carrier: shippingCarrier || statusUpdateModal.shipping_carrier,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'shipped' && { shipped_at: new Date().toISOString() }),
          ...(newStatus === 'delivered' && { delivered_at: new Date().toISOString() })
        };
        
        // Update orders array in admin view
        const updatedOrders = orders.map(o => o.id === statusUpdateModal.id ? updatedOrder : o);
        
        // Save to honey_translation_orders (admin view)
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
        
        // Also update in user_orders (customer view) so customers see updated status
        try {
          const userOrders = localStorage.getItem('user_orders');
          if (userOrders) {
            const parsedUserOrders = JSON.parse(userOrders);
            const updatedUserOrders = parsedUserOrders.map((o: Order) => 
              o.id === statusUpdateModal.id ? updatedOrder : o
            );
            localStorage.setItem('user_orders', JSON.stringify(updatedUserOrders));
            console.log('✅ [SalesPage] Order synced to user_orders');
          }
        } catch (e) {
          console.error('⚠️ [SalesPage] Failed to sync order to user_orders:', e);
        }
        
        // Update local state
        setOrders(updatedOrders);
        
        toast.success('Order status updated successfully (localStorage)');
        setStatusUpdateModal(null);
        setNewStatus('');
        setTrackingNumber('');
        setShippingCarrier('');
        
        console.log('✅ [SalesPage] Order status updated:', updatedOrder.order_number, 'to', newStatus);
      }
    } catch (error) {
      console.error('❌ [SalesPage] Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const statusFilteredOrders = selectedFilter === 'all'
    ? orders
    : orders.filter(order => order.status === selectedFilter);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredOrders = normalizedSearch
    ? statusFilteredOrders.filter((order) => {
        const searchableOrderText = toSearchableText({
          id: order.id,
          order_number: order.order_number,
          user_id: order.user_id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          status: order.status,
          total_amount: order.total_amount,
          subtotal: order.subtotal,
          discount: order.discount,
          tax: order.tax,
          currency: order.currency,
          created_at: order.created_at,
          updated_at: order.updated_at,
          shipping_method: order.shipping_method,
          tracking_number: order.tracking_number,
          shipping_carrier: order.shipping_carrier,
          estimated_delivery: order.estimated_delivery,
          assigned_to: order.assigned_to,
          notes: order.notes,
          shipping_address: order.shipping_address,
          shipping_details: order.shipping_details,
          items: order.items?.map((item) => ({
            id: item.id,
            name: item.name,
            basePrice: item.basePrice,
            totalPrice: item.totalPrice,
            pageCount: item.pageCount,
          })),
        });
        return searchableOrderText.includes(normalizedSearch);
      })
    : statusFilteredOrders;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid' || o.status === 'delivered')
    .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
  
  // Calculate unique customers (Amazon-style multi-customer tracking)
  const uniqueCustomers = [...new Set(orders.map(o => o.customer_email || o.customer_name || o.user_id).filter(Boolean))];
  const uniqueCustomerCount = uniqueCustomers.length;
  
  console.log(`📊 [SalesPage] Stats: ${totalOrders} orders from ${uniqueCustomerCount} unique customers`);
  console.log(`👥 [SalesPage] Unique customers:`, uniqueCustomers);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'received':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment-received':
        return 'bg-emerald-100 text-emerald-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'document-analysis':
      case 'translator-working':
      case 'formatting':
      case 'proof-checking':
      case 'processing':
        return 'bg-indigo-100 text-indigo-800';
      case 'draft':
        return 'bg-cyan-100 text-cyan-800';
      case 'soft':
        return 'bg-teal-100 text-teal-800';
      case 'courier':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-violet-100 text-violet-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    // Convert kebab-case to Title Case
    return status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales & Order Management</h1>
          <p className="text-gray-600 mt-1">Complete order details and sales analytics</p>
        </div>

        {/* Multi-Customer Info Banner (Amazon-style) */}
        {uniqueCustomerCount > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {totalOrders} Total Order{totalOrders !== 1 ? 's' : ''} from {uniqueCustomerCount} Customer{uniqueCustomerCount !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing all orders from all customers across all devices and locations
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500">Total Revenue</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">TOTAL ORDERS</h3>
            <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">PENDING</h3>
            <p className="text-3xl font-bold text-gray-900">{pendingOrders}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">SHIPPED</h3>
            <p className="text-3xl font-bold text-gray-900">{shippedOrders}</p>
            <p className="text-xs text-gray-500 mt-1">In transit</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">DELIVERED</h3>
            <p className="text-3xl font-bold text-gray-900">{deliveredOrders}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">REVENUE</h3>
            <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-1">From paid orders</p>
          </div>
        </div>

        {/* Filters and Live Updates Control */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Filter by Status</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-[28rem]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order id, email, name, phone, item, status, amount..."
                  className="w-full rounded-lg border border-blue-300 bg-white pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
              <button
                onClick={() => setLiveUpdatesEnabled(!liveUpdatesEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                  liveUpdatesEnabled 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {liveUpdatesEnabled ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live Updates ON</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="text-sm font-medium">Live Updates OFF</span>
                  </>
                )}
              </button>
              <button
                onClick={() => fetchOrders()}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh Now"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <span className="text-xs text-gray-500">
                Last refresh: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Orders ({totalOrders})
            </button>
            <button
              onClick={() => setSelectedFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFilter === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({pendingOrders})
            </button>
            <button
              onClick={() => setSelectedFilter('processing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFilter === 'processing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Processing ({processingOrders})
            </button>
            <button
              onClick={() => setSelectedFilter('shipped')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFilter === 'shipped'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Shipped ({shippedOrders})
            </button>
            <button
              onClick={() => setSelectedFilter('delivered')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFilter === 'delivered'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Delivered ({deliveredOrders})
            </button>
            <button
              onClick={() => setSelectedFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFilter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
            
            {/* Workflow Stage Filters */}
            {WORKFLOW_STAGES.map(stage => {
              const stageCount = orders.filter(o => o.status === stage.id).length;
              if (stageCount === 0) return null; // Hide empty filters
              
              return (
                <button
                  key={stage.id}
                  onClick={() => setSelectedFilter(stage.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === stage.id
                      ? `bg-${stage.color}-600 text-white`
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {stage.label} ({stageCount})
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <EnhancedOrderRow
                    key={order.id}
                    order={order}
                    isExpanded={expandedRows.has(order.id)}
                    onToggleExpand={() => toggleRowExpansion(order.id)}
                    onViewDetails={() => setSelectedOrder(order)}
                    onUpdateStatus={() => {
                      setStatusUpdateModal(order);
                      setNewStatus(order.status);
                      setTrackingNumber(order.tracking_number || '');
                      setShippingCarrier(order.shipping_carrier || '');
                    }}
                    onMoveToNextStage={() => moveToNextStage(order)}
                    getProgressPercentage={getProgressPercentage}
                    getTimeInStage={getTimeInStage}
                    getStatusBadgeClass={getStatusBadgeClass}
                    getStatusLabel={getStatusLabel}
                    getNextStage={getNextStage}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                    <p className="text-gray-600 mt-1">Order ID: {selectedOrder.order_number}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XCircle className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Name</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.customer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.customer_email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Order Date</p>
                      <p className="font-semibold text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                      <p className="font-semibold text-gray-900">{selectedOrder.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Order Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(selectedOrder.status)}`}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedOrder.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getStatusLabel(selectedOrder.payment_status)}
                      </span>
                    </div>
                    {selectedOrder.tracking_number && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                        <p className="font-semibold text-gray-900">{selectedOrder.tracking_number}</p>
                      </div>
                    )}
                    {selectedOrder.shipping_carrier && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Shipping Carrier</p>
                        <p className="font-semibold text-gray-900">{selectedOrder.shipping_carrier}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shipping_address && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-900">{selectedOrder.shipping_address.name}</p>
                      <p className="text-gray-700 mt-1">{selectedOrder.shipping_address.addressLine1}</p>
                      {selectedOrder.shipping_address.addressLine2 && (
                        <p className="text-gray-700">{selectedOrder.shipping_address.addressLine2}</p>
                      )}
                      <p className="text-gray-700">
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.pincode}
                      </p>
                      <p className="text-gray-700">{selectedOrder.shipping_address.country}</p>
                      <p className="text-gray-700 mt-2">
                        <span className="font-medium">Phone:</span> {selectedOrder.shipping_address.phone}
                      </p>
                    </div>
                  </div>
                )}
                
                {!selectedOrder.shipping_address && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <p className="text-yellow-800 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Shipping address not available for this order. This information is available for orders placed after the latest update.
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Order Items ({selectedOrder.items?.length || 0})</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Pages: {item.pageCount} × ₹{item.basePrice}</p>
                        </div>
                        <p className="font-semibold text-gray-900">₹{item.totalPrice.toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{parseFloat(selectedOrder.subtotal).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Discount</span>
                      <span>-₹{parseFloat(selectedOrder.discount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>₹{parseFloat(selectedOrder.tax).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>₹{parseFloat(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {statusUpdateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Update Order Status</h2>
                <p className="text-gray-600 mt-1">Order: {statusUpdateModal.order_number}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Status *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status...</option>
                    <option value="received">Received</option>
                    <option value="payment-received">Payment Received</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="document-analysis">Document Analysis</option>
                    <option value="translator-working">Translator Working</option>
                    <option value="formatting">Formatting</option>
                    <option value="proof-checking">Proof Checking</option>
                    <option value="draft">Draft</option>
                    <option value="soft">Soft</option>
                    <option value="courier">Courier</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {(newStatus === 'shipped' || newStatus === 'delivered') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shipping Carrier
                      </label>
                      <input
                        type="text"
                        value={shippingCarrier}
                        onChange={(e) => setShippingCarrier(e.target.value)}
                        placeholder="e.g., FedEx, DHL, Blue Dart"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setStatusUpdateModal(null);
                    setNewStatus('');
                    setTrackingNumber('');
                    setShippingCarrier('');
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || !newStatus}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default SalesPage;

function loadOrderAssignmentsFromLocalStorage(): Record<string, { assigned_to?: string; updated_at?: string }> {
  try {
    const stored = localStorage.getItem(ORDER_ASSIGNMENTS_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return parsed as Record<string, { assigned_to?: string; updated_at?: string }>;
  } catch (error) {
    console.error('❌ [SalesPage] Failed to load order assignments:', error);
    return {};
  }
}

function applyStoredAssignments(orders: Order[]): Order[] {
  const assignments = loadOrderAssignmentsFromLocalStorage();

  return orders.map((order) => {
    const assignment = assignments[order.id];
    if (!assignment?.assigned_to) return order;

    return {
      ...order,
      assigned_to: assignment.assigned_to,
      updated_at: assignment.updated_at || order.updated_at,
    };
  });
}
