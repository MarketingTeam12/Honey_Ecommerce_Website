import { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { Copy, ChevronRight, Eye, FileText, Truck, CreditCard, Paperclip, RefreshCw, Trash2, Database, AlertTriangle, Search, Calendar, Plus, X, Check, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { isSalesManager } from '@/app/utils/roleAccess';

const ORDERS_STORAGE_KEY = 'honey_translation_orders';
const DELETED_ORDERS_KEY = 'honey_translation_deleted_orders';
const SALES_MANAGER_NAMES_KEY = 'honey_sales_manager_names';
const ORDER_ASSIGNMENTS_KEY = 'honey_translation_order_assignments';
const USER_ROLES_STORAGE_KEY = 'honey_translation_user_roles';
const REGISTERED_USERS_STORAGE_KEY = 'registered_users';
const ROLES_STORAGE_KEY = 'honey_roles';
// Orders are only real, actionable sales once payment has actually gone
// through. Carts abandoned before Razorpay confirms (payment_status stays
// "pending") should never clutter the Sales Orders list.
const PAID_PAYMENT_STATUSES = new Set(['paid', 'completed', 'success', 'successful']);
const isOrderPaid = (order: { payment_status?: string }) =>
  PAID_PAYMENT_STATUSES.has(String(order.payment_status || '').trim().toLowerCase());
// Tracks which localStorage-only orders we've already attempted to push to
// the backend, so the 15s auto-refresh doesn't keep re-POSTing the same
// order every cycle (which was creating duplicate records server-side
// whenever the backend was slow to reflect a just-synced order back in
// the next GET /orders response).
const SYNCED_ORDER_IDS_KEY = 'honey_translation_synced_order_ids';
const getSyncedOrderIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(SYNCED_ORDER_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};
const markOrdersAsSynced = (ids: string[]) => {
  try {
    const existing = getSyncedOrderIds();
    ids.forEach((id) => existing.add(id));
    localStorage.setItem(SYNCED_ORDER_IDS_KEY, JSON.stringify(Array.from(existing)));
  } catch (error) {
    console.error('Failed to persist synced order ids:', error);
  }
};

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  data?: string; // Optional - excluded in list view for performance
  hasFile?: boolean; // Flag to indicate file exists (used in list view)
}

interface OrderItem {
  id: string;
  name: string;
  basePrice: number;
  totalPrice: number;
  pageCount: number;
  sourceLanguage?: string;
  targetLanguage?: string;
  certificateType?: string;
  documentType?: string;
  uploadedFile?: UploadedFile | null; // Keep for backward compatibility
  uploadedFiles?: UploadedFile[]; // Support multiple files
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
  tracking_number?: string;
  shipping_carrier?: string;
  shipping_method?: string;
  estimated_delivery?: string;
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
  tip?: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

interface StaffOption {
  value: string;
  label: string;
  email?: string;
  role?: string;
  source: 'role' | 'legacy';
}

const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();
const normalizeManagerName = (value?: string | null) => String(value || '').trim();
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
  user?: { id?: string; email?: string; role?: unknown } | null,
) => {
  if (!user) return false;
  const email = normalize(user.email);
  const userId = normalize(user.id);
  const userName = normalize((user as { name?: string }).name);
  const userRole = normalizeRoleKey((user as { role?: unknown }).role);
  const assignedTo = normalize(order.assigned_to);
  return !!assignedTo && (
    assignedTo === email ||
    assignedTo === userId ||
    assignedTo === userName ||
    assignedTo === userRole
  );
};

export function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showSetupBanner, setShowSetupBanner] = useState(false);
  const [salesManagerNames, setSalesManagerNames] = useState<string[]>([]);
  const [salesManagerOptions, setSalesManagerOptions] = useState<StaffOption[]>([]);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [assignDraft, setAssignDraft] = useState('');

  useEffect(() => {
    const savedNames = loadSalesManagerNames();
    setSalesManagerNames(savedNames);
    setSalesManagerOptions(loadSalesManagerOptions(savedNames));
  }, []);

  useEffect(() => {
    const cachedOrdersRaw = getSortedActiveOrders(applyStoredAssignments(loadOrdersFromLocalStorage())).filter(isOrderPaid);
    const cachedOrders = isSalesManager(user?.email, user?.role)
      ? cachedOrdersRaw.filter((order) => canSalesManagerSeeOrder(order, user))
      : cachedOrdersRaw;
    if (cachedOrders.length > 0) {
      setOrders(cachedOrders);
      setLoading(false);
    }

    void fetchOrders({ background: cachedOrders.length > 0 });
    
    // Listen for new order events
    const handleNewOrder = () => {
      console.log('ðŸ”” [OrdersPage] New order event received, refreshing...');
      void fetchOrders({ background: true });
    };
    
    window.addEventListener('newOrderNotification', handleNewOrder);

    const interval = setInterval(() => {
      console.log('?? [OrdersPage] Auto-refreshing orders...');
      void fetchOrders({ background: true });
    }, 15000);
    
    return () => {
      window.removeEventListener('newOrderNotification', handleNewOrder);
      clearInterval(interval);
    };
  }, [user?.id, user?.email, user?.role]);

  const fetchOrders = async ({ background = false }: { background?: boolean } = {}) => {
    try {
      if (!background) {
        setLoading(true);
      }
      console.log('ðŸ“¡ [OrdersPage] Fetching orders from all sources...');
      
      // ===== SOURCE 1: Backend KV store =====
      let backendOrders: Order[] = [];
      let backendAvailable = false;
      
      try {
        const url = `${API_URL}/orders`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          backendOrders = data.orders || [];
          backendAvailable = true;
          setShowSetupBanner(false);
          console.log(' [OrdersPage] Backend returned', backendOrders.length, 'orders');
        } else {
          const errorText = await response.text().catch(() => '');
          console.warn(' [OrdersPage] Backend returned status', response.status);
          if (errorText.includes('relation') || errorText.includes('does not exist') || errorText.includes('kv_store_a67f0635')) {
            setShowSetupBanner(true);
          }
        }
      } catch (backendError: any) {
        console.warn(' [OrdersPage] Backend fetch failed:', backendError.message);
      }
      
      // ===== SOURCE 2: localStorage =====
      const localOrders = loadOrdersFromLocalStorage();
      console.log('¦ [OrdersPage] localStorage has', localOrders.length, 'orders');
      
      // ===== MERGE: Combine both sources, deduplicate by order ID =====
      const orderMap = new Map<string, Order>();
      
      // Backend orders are the base record for each order
      backendOrders.forEach((order: Order) => {
        if (order && order.id) {
          orderMap.set(order.id, order);
        }
      });
      
      // Overlay localStorage orders so locally saved fields like assigned_to persist
      const unsyncedOrders: Order[] = [];
      const alreadySynced = getSyncedOrderIds();
      localOrders.forEach((order: Order) => {
        if (order && order.id) {
          if (orderMap.has(order.id)) {
            orderMap.set(order.id, mergeOrderRecords(orderMap.get(order.id)!, order));
          } else {
            orderMap.set(order.id, order);
            // Only orders that actually went through payment are worth
            // pushing to the backend, and only if we haven't already tried
            // - retrying every 15s auto-refresh was creating duplicates.
            if (isOrderPaid(order) && !alreadySynced.has(order.id)) {
              unsyncedOrders.push(order);
            }
          }
        }
      });
      
      // ===== AUTO-SYNC: Push unsynced localStorage orders to backend =====
      if (backendAvailable && unsyncedOrders.length > 0) {
        console.log('ðŸ„ [OrdersPage] Starting background sync for', unsyncedOrders.length, 'localStorage order(s)...');
        markOrdersAsSynced(unsyncedOrders.map((order) => order.id));
        void syncUnsyncedOrders(unsyncedOrders);
      }
      
      // ===== FINAL: Sort and set =====
      const sortedOrders = getSortedActiveOrders(applyStoredAssignments(Array.from(orderMap.values()))).filter(isOrderPaid);
      const visibleOrders = isSalesManager(user?.email, user?.role)
        ? sortedOrders.filter((order) => canSalesManagerSeeOrder(order, user))
        : sortedOrders;
      
      setOrders(visibleOrders);
      syncSalesManagerNamesFromOrders(visibleOrders);
      console.log('âœ… [OrdersPage] Total orders displayed:', visibleOrders.length, 
        `(${backendOrders.length} backend + ${unsyncedOrders.length} local-only)`);
      
    } catch (error: any) {
      console.error('âŒ [OrdersPage] Critical error fetching orders:', error);
      
      // Last resort: try localStorage only
      const localOrdersRaw = getSortedActiveOrders(loadOrdersFromLocalStorage()).filter(isOrderPaid);
      const localOrders = isSalesManager(user?.email, user?.role)
        ? localOrdersRaw.filter((order) => canSalesManagerSeeOrder(order, user))
        : localOrdersRaw;
      if (localOrders.length > 0) {
        setOrders(applyStoredAssignments(localOrders));
        if (!background) {
          toast.info('Showing orders from browser cache', { duration: 3000 });
        }
      } else if (!background) {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
    }
  };

  const deleteSelectedOrders = async () => {
    if (!user) {
      toast.error('Authentication required. Please log in as admin.');
      return;
    }

    if (selectedOrders.size === 0) {
      toast.error('Please select orders to delete');
      return;
    }

    const count = selectedOrders.size;
    if (!confirm(`Are you sure you want to delete ${count} order(s)? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    
    try {
      console.log(`ðŸ—‘ [OrdersPage] Deleting ${count} selected orders...`);
      console.log('ðŸ” [Delete] User:', user.email);
      
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      const deletedIds: string[] = [];

      for (const orderId of Array.from(selectedOrders)) {
        try {
          // Delete from the real backend first, so the order is actually
          // removed from the database and won't come back on refresh -
          // for this admin or any other browser/device.
          const response = await fetch(
            `${API_URL}/orders/${orderId}`,
            {
              method: 'DELETE',
              headers: buildHeaders(publicAnonKey),
            }
          );

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || `Server responded with status ${response.status}`);
          }

          // Mirror the deletion locally too, so cached copies of this
          // order disappear immediately in this browser as well.
          removeOrderFromLocalStorage(orderId);
          deletedIds.push(orderId);
          successCount++;
          console.log(`✅ [OrdersPage] Deleted order from backend + localStorage: ${orderId}`);
        } catch (error: any) {
          failCount++;
          const errorMsg = error.message || String(error);
          console.error(`❌ [OrdersPage] Error deleting order ${orderId}:`, error);
          errors.push(`Order ${orderId.substring(0, 8)}: ${errorMsg}`);
        }
      }
      
      // Show success message
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} order(s)`, { duration: 4000 });
      }
      
      if (failCount > 0) {
        const errorDetails = errors.length > 0 ? `\n\nDetails:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n... and ${errors.length - 3} more` : ''}` : '';
        toast.error(`Failed to delete ${failCount} order(s)${errorDetails}`, { duration: 5000 });
        console.error('ðŸ” [Delete] All errors:', errors);
      }

      // Clear selection
      setSelectedOrders(new Set());
      
      // Update local state immediately - remove deleted orders from the orders array
      setOrders(prevOrders => prevOrders.filter(order => !deletedIds.includes(order.id)));
      
      console.log(`âœ… [OrdersPage] Removed ${deletedIds.length} orders from display`);
      
    } catch (error) {
      console.error('âŒ [OrdersPage] Delete error:', error);
      toast.error('Failed to delete orders: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setDeleting(false);
    }
  };

  const openAssignEditor = (order: Order) => {
    setAssigningOrderId(order.id);
    setAssignDraft(order.assigned_to || '');
  };

  const closeAssignEditor = () => {
    setAssigningOrderId(null);
    setAssignDraft('');
  };

  const saveAssignedManager = (orderId: string, managerName?: string) => {
    const nextValue = normalizeManagerName(managerName ?? assignDraft);
    if (!nextValue) {
      toast.error('Please select a sales manager');
      return;
    }

    const selectedManager = salesManagerOptions.find((option) => normalize(option.value) === normalize(nextValue) || normalize(option.label) === normalize(nextValue) || normalize(option.email) === normalize(nextValue));
    const nextLabel = selectedManager?.label || nextValue;

    if (!selectedManager) {
      const nextSalesManagerNames = mergeSalesManagerNames(salesManagerNames, nextValue);
      setSalesManagerNames(nextSalesManagerNames);
      setSalesManagerOptions(loadSalesManagerOptions(nextSalesManagerNames));
      localStorage.setItem(SALES_MANAGER_NAMES_KEY, JSON.stringify(nextSalesManagerNames));
    }

    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) =>
        order.id === orderId
          ? { ...order, assigned_to: selectedManager?.email || nextValue, updated_at: new Date().toISOString() }
          : order,
      );

      saveOrdersToLocalStorage(updatedOrders);
      return updatedOrders;
    });

    toast.success(`Assigned ${nextLabel} to this order`);
    setAssigningOrderId(null);
    setAssignDraft('');
  };

  const clearAssignedManager = (orderId: string) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? { ...order, assigned_to: undefined, updated_at: new Date().toISOString() }
        : order,
    );

    setOrders(updatedOrders);
    saveOrdersToLocalStorage(updatedOrders);
    toast.success('Assignment removed');
    closeAssignEditor();
  };

  const removeSalesManagerName = (name: string) => {
    const nextNames = salesManagerNames.filter((item) => normalize(item) !== normalize(name));
    setSalesManagerNames(nextNames);
    setSalesManagerOptions(loadSalesManagerOptions(nextNames));
    localStorage.setItem(SALES_MANAGER_NAMES_KEY, JSON.stringify(nextNames));
    toast.success(`Removed ${name} from the sales manager list`);
  };

  const syncSalesManagerNamesFromOrders = (currentOrders: Order[]) => {
    const derivedNames = currentOrders
      .map((order) => normalizeManagerName(order.assigned_to))
      .filter(Boolean)
      .filter((name) => !salesManagerOptions.some((option) => option.source === "role" && normalize(option.value) === normalize(name)));

    if (derivedNames.length === 0) {
      return;
    }

    const nextNames = mergeSalesManagerNames(salesManagerNames, ...derivedNames);
    if (nextNames.join('|') !== salesManagerNames.join('|')) {
      setSalesManagerNames(nextNames);
      setSalesManagerOptions(loadSalesManagerOptions(nextNames));
      localStorage.setItem(SALES_MANAGER_NAMES_KEY, JSON.stringify(nextNames));
    }
  };

  const saveOrdersToLocalStorage = (updatedOrders: Order[]) => {
    try {
      saveOrderAssignmentsToLocalStorage(updatedOrders);
    } catch (error) {
      console.error('âŒ [OrdersPage] Failed to persist order assignments:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          toast.success('Copied to clipboard');
        })
        .catch(() => {
          // Fallback to execCommand
          fallbackCopyTextToClipboard(text);
        });
    } else {
      // Use fallback for browsers without Clipboard API
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success('Copied to clipboard');
      } else {
        toast.error('Failed to copy');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const getStatusBadge = (status: string) => {
    const safeStatus = status || 'pending';
    const statusColors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'draft': 'bg-gray-100 text-gray-800',
      'closed': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[safeStatus.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </span>
    );
  };

  const getPaymentDots = (paymentStatus: string) => {
    return (
      <div className="flex gap-1" title={paymentStatus ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1) : 'Unknown'}>
        <div className={`w-2 h-2 rounded-full ${paymentStatus === 'paid' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
      </div>
    );
  };

  const getShippedDots = (status: string) => {
    const shipped = ['shipped', 'delivered'].includes(status.toLowerCase());
    return (
      <div className="flex gap-1">
        <div className={`w-2 h-2 rounded-full ${shipped ? 'bg-green-500' : 'bg-gray-300'}`}></div>
      </div>
    );
  };

  const getRefundDots = () => {
    return (
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
      </div>
    );
  };

  const statusFilteredOrders = (filterStatus === 'All'
    ? orders
    : orders.filter(order => order.status.toLowerCase() === filterStatus.toLowerCase())
  ).filter(order =>
    filterPaymentStatus === 'All' || order.payment_status?.toLowerCase() === filterPaymentStatus.toLowerCase()
  );

  const isOrderWithinDateRange = (orderDateValue: string) => {
    if (!fromDate && !toDate) {
      return true;
    }

    const orderDate = new Date(orderDateValue);
    if (Number.isNaN(orderDate.getTime())) {
      return false;
    }

    if (fromDate) {
      const startDate = new Date(`${fromDate}T00:00:00`);
      if (orderDate.getTime() < startDate.getTime()) {
        return false;
      }
    }

    if (toDate) {
      const endDate = new Date(`${toDate}T23:59:59.999`);
      if (orderDate.getTime() > endDate.getTime()) {
        return false;
      }
    }

    return true;
  };

  const dateFilteredOrders = statusFilteredOrders.filter((order) =>
    isOrderWithinDateRange(order.created_at)
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredOrders = normalizedSearch
    ? dateFilteredOrders.filter((order) => {
        const searchableText = toSearchableText({
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
          tracking_number: order.tracking_number,
          shipping_carrier: order.shipping_carrier,
          shipping_method: order.shipping_method,
          estimated_delivery: order.estimated_delivery,
          notes: order.notes,
          assigned_to: order.assigned_to,
          created_at: order.created_at,
          updated_at: order.updated_at,
          shipping_address: order.shipping_address,
          shipping_details: order.shipping_details,
          items: order.items,
        });
        return searchableText.includes(normalizedSearch);
      })
    : dateFilteredOrders;

  const filteredSalesManagerOptions = salesManagerOptions.filter((option) =>
    `${option.label} ${option.email || ''} ${option.role || ''}`.toLowerCase().includes(assignDraft.trim().toLowerCase()),
  );

  const getAssigneeLabel = (assignedTo?: string) => {
    const value = normalize(assignedTo);
    if (!value) return '';

    const option = salesManagerOptions.find((item) =>
      normalize(item.value) === value ||
      normalize(item.email) === value ||
      normalize(item.label) === value
    );

    return option?.label || assignedTo || '';
  };

  const renderAssignmentField = (order: Order) => {
    if (assigningOrderId === order.id) {
      return (
        <form
          className="w-64 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            saveAssignedManager(order.id);
          }}
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={assignDraft}
              onChange={(e) => setAssignDraft(e.target.value)}
              placeholder="Search sales manager"
              className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  saveAssignedManager(order.id);
                }
                if (e.key === 'Escape') {
                  closeAssignEditor();
                }
              }}
            />
            <button
              type="submit"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
              title="Save assignment"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-32 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            {filteredSalesManagerOptions.length > 0 ? (
              filteredSalesManagerOptions.map((manager) => (
                <div
                  key={`${manager.source}-${manager.value}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setAssignDraft(manager.value);
                      saveAssignedManager(order.id, manager.value);
                    }}
                    className="flex-1 text-left text-gray-700 hover:text-gray-900"
                  >
                    <span className="block font-medium">{manager.label}</span>
                    {(manager.email || manager.role) && (
                      <span className="block text-xs text-gray-500">
                        {[manager.email, manager.role].filter(Boolean).join(' • ')}
                      </span>
                    )}
                  </button>
                  {manager.source === 'legacy' && (
                    <button
                      type="button"
                      onClick={() => removeSalesManagerName(manager.value)}
                      className="text-gray-400 hover:text-red-600"
                      title="Remove from dropdown"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-gray-500">
                No roles available for assignment yet. Create roles in Roles Management to show them here.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => clearAssignedManager(order.id)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Remove assignment
            </button>
            <button
              type="button"
              onClick={closeAssignEditor}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      );
    }

    if (order.assigned_to) {
      return (
        <div className="w-full max-w-[14rem] rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 px-3 py-2 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">
                Sales manager
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-green-900">
                {getAssigneeLabel(order.assigned_to)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openAssignEditor(order);
                }}
                className="rounded-md p-1.5 text-green-700 transition-colors hover:bg-green-100"
                title="Edit assignment"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAssignedManager(order.id);
                }}
                className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
                title="Remove assignment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700">
            <Check className="h-3.5 w-3.5" />
            <span>Saved</span>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => openAssignEditor(order)}
        className="inline-flex w-full max-w-[14rem] items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
        title="Assign sales manager"
      >
        <Plus className="h-4 w-4" />
        <span>Assign sales manager</span>
      </button>
    );
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
      <div className="bg-white min-h-screen">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">All Sales Orders</h1>
              <button className="text-gray-500 hover:text-gray-700">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders..."
                  className="w-64 px-3 py-1.5 pl-9 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-40 px-3 py-1.5 pl-9 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  aria-label="From Date"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-40 px-3 py-1.5 pl-9 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  aria-label="To Date"
                />
              </div>
              <button
                onClick={() => {
                  setRefreshing(true);
                  void fetchOrders({ background: true }).finally(() => setRefreshing(false));
                }}
                disabled={loading || refreshing}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Refresh orders"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              {selectedOrders.size > 0 && (
                <button
                  onClick={deleteSelectedOrders}
                  disabled={deleting}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={`Delete ${selectedOrders.size} selected order(s)`}
                >
                  <Trash2 className={`w-4 h-4 ${deleting ? 'animate-spin' : ''}`} />
                  Delete Selected ({selectedOrders.size})
                </button>
              )}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <button className="p-1.5 hover:bg-gray-100 rounded">
                <span className="text-gray-600"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Setup Banner - shown when database table might be missing */}
        {showSetupBanner && orders.length === 0 && (
          <div className="mx-6 mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Database Setup Required
                </h3>
                <p className="text-yellow-800 text-sm mb-4">
                  Orders cannot be displayed because the database table is not set up. Click the button below to set up the database and start seeing customer orders in the admin panel.
                </p>
                <button
                  onClick={() => navigate('/admin/orders-setup')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors inline-flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Set Up Database
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300"
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Sales Order#
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Shipped
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Refund
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Assign
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedOrders.has(order.id) ? 'bg-blue-50' : ''}`}
                  onClick={() => navigate(`/admin/sales/orders/${order.id}`)}
                >
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-medium hover:text-blue-800">
                        {order.order_number}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(order.order_number);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {/* Show paperclip icon if order has uploaded files */}
                      {order.items.some(item => {
                        const files = item.uploadedFiles || (item.uploadedFile ? [item.uploadedFile] : []);
                        return files.some(f => f.hasFile || f.data);
                      }) && (
                        <Paperclip className="w-3.5 h-3.5 text-blue-500" title="Order has uploaded files" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.customer_email || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getPaymentDots(order.payment_status)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getShippedDots(order.status)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getRefundDots()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {order.currency && order.currency !== 'INR' ? '$' : '\u20B9'}{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {renderAssignmentField(order)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/sales/orders/${order.id}`);
                        }}
                        className="p-1.5 hover:bg-purple-50 rounded transition-colors group"
                        title="View Shipment"
                      >
                        <Truck className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/sales/orders/${order.id}`);
                        }}
                        className="p-1.5 hover:bg-green-50 rounded transition-colors group"
                        title="View Payment"
                      >
                        <CreditCard className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
              {filterStatus !== 'All' && (
                <button
                  onClick={() => setFilterStatus('All')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
              {selectedOrders.size > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  ({selectedOrders.size} selected)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <span className="text-sm text-gray-600">1 / 1</span>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default OrdersPage;

const getSortedActiveOrders = (orders: Order[]) => {
  const deletedIds = getDeletedOrderIds();
  const activeOrders = orders.filter((order) => !deletedIds.has(order.id));
  return activeOrders.sort(
    (a: Order, b: Order) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
};

const syncUnsyncedOrders = async (ordersToSync: Order[]) => {
  if (ordersToSync.length === 0) return;

  await Promise.allSettled(
    ordersToSync.map(async (order) => {
      await fetch(`${API_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey,
        },
        body: JSON.stringify({
          userId: order.user_id || 'guest',
          userEmail: order.customer_email || '',
          userName: order.customer_name || 'Guest',
          orderId: order.id,
          orderNumber: order.order_number,
          trackingNumber: order.tracking_number || '',
          amount: parseFloat(order.total_amount) || 0,
          currency: order.currency || 'INR',
          paymentMethod: order.payment_method || 'zoho_payments',
          items: order.items || [],
          subtotal: parseFloat(order.subtotal) || 0,
          discount: parseFloat(order.discount) || 0,
          tax: parseFloat(order.tax) || 0,
          shippingAddress: order.shipping_address || null,
          notes: order.notes || '',
          tip: order.tip || 0,
          shippingMethod: order.shipping_method || 'email',
        }),
      });
    }),
  );
};

// Function to load orders from both localStorage sources
function loadOrdersFromLocalStorage(): Order[] {
  const orderMap = new Map<string, Order>();
  
  // Load from admin storage
  const adminStored = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (adminStored) {
    try {
      const adminOrders = JSON.parse(adminStored);
      adminOrders.forEach((order: Order) => {
        orderMap.set(order.id, order);
      });
    } catch (e) {
      console.error('âŒ [OrdersPage] Failed to parse admin localStorage:', e);
    }
  }
  
  // Load from user storage  
  const userStored = localStorage.getItem('user_orders');
  if (userStored) {
    try {
      const userOrders = JSON.parse(userStored);
      userOrders.forEach((order: Order) => {
        // Only add if not already in map (admin storage takes precedence)
        if (!orderMap.has(order.id)) {
          orderMap.set(order.id, order);
        }
      });
    } catch (e) {
      console.error('âŒ [OrdersPage] Failed to parse user localStorage:', e);
    }
  }
  
  return Array.from(orderMap.values());
}

function loadSalesManagerNames(): string[] {
  try {
    const stored = localStorage.getItem(SALES_MANAGER_NAMES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed
          .map((name) => normalizeManagerName(name))
          .filter(Boolean),
      ),
    );
  } catch (error) {
    console.error('âŒ [OrdersPage] Failed to load sales manager names:', error);
    return [];
  }
}

function normalizeRoleKey(role: unknown): string {
  const value = String(role || '').trim().toLowerCase();
  if (!value) return 'customer';
  return value.replace(/\s+/g, '_');
}

function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function roleHasOrdersAccess(roleKey: string): boolean {
  if (roleKey === 'admin') return true;
  if (!roleKey || roleKey === 'customer') return false;

  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!raw) return false;

    const roles = JSON.parse(raw) as Array<{
      key?: string;
      name?: string;
      status?: string;
      permissions?: {
        moduleAccess?: unknown[];
        dataAccess?: unknown[];
      };
    }>;
    if (!Array.isArray(roles)) return false;

    const role = roles.find((item) => normalizeRoleKey(item.key || item.name) === roleKey);
    if (!role || role.status === 'Inactive') return false;

    const moduleAccess = Array.isArray(role.permissions?.moduleAccess)
      ? role.permissions!.moduleAccess.map((item) => normalizeRoleKey(item))
      : [];
    const dataAccess = Array.isArray(role.permissions?.dataAccess)
      ? role.permissions!.dataAccess.map((item) => String(item || '').trim().toLowerCase())
      : [];

    return moduleAccess.includes('orders') || dataAccess.some((token) => token.startsWith('orders:'));
  } catch (error) {
    console.error('? [OrdersPage] Failed to check role orders access:', error);
    return false;
  }
}

function loadRoleOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(USER_ROLES_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([email, role]) => [normalize(email), normalizeRoleKey(role)])
    );
  } catch (error) {
    console.error('? [OrdersPage] Failed to load role overrides:', error);
    return {};
  }
}

function loadSalesManagerOptions(legacyNames: string[] = []): StaffOption[] {
  const options = new Map<string, StaffOption>();
  const roleKeys = new Set<string>();

  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    const roles = raw ? JSON.parse(raw) : [];

    if (Array.isArray(roles)) {
      roles.forEach((role: any) => {
        const roleKey = normalizeRoleKey(role.key || role.name);
        if (!roleKey || roleKey === 'customer') return;

        const label = normalizeManagerName(role.name) || formatRoleLabel(roleKey);
        const optionKey = `role:${roleKey}`;
        roleKeys.add(roleKey);

        options.set(optionKey, {
          value: roleKey,
          label,
          role: role.status === 'Inactive' ? `${label} (Inactive)` : label,
          source: 'role',
        });
      });
    }
  } catch (error) {
    console.error('? [OrdersPage] Failed to load assignable roles:', error);
  }

  legacyNames.forEach((name) => {
    const value = normalizeManagerName(name);
    if (!value) return;

    const key = normalize(value);
    const roleKey = normalizeRoleKey(value);
    if (options.has(key) || roleKeys.has(roleKey)) return;

    options.set(key, {
      value,
      label: value,
      source: 'legacy',
    });
  });

  return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function loadOrderAssignmentsFromLocalStorage(): Record<string, { assigned_to?: string; updated_at?: string }> {
  try {
    const stored = localStorage.getItem(ORDER_ASSIGNMENTS_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed as Record<string, { assigned_to?: string; updated_at?: string }>).map(([orderId, assignment]) => [
        orderId,
        {
          assigned_to: normalizeManagerName(assignment?.assigned_to),
          updated_at: typeof assignment?.updated_at === 'string' ? assignment.updated_at : undefined,
        },
      ]),
    );
  } catch (error) {
    console.error('âŒ [OrdersPage] Failed to load order assignments:', error);
    return {};
  }
}

function saveOrderAssignmentsToLocalStorage(updatedOrders: Order[]) {
  const existingAssignments = loadOrderAssignmentsFromLocalStorage();
  const nextAssignments: Record<string, { assigned_to?: string; updated_at?: string }> = { ...existingAssignments };

  updatedOrders.forEach((order) => {
    if (order.assigned_to) {
      nextAssignments[order.id] = {
        assigned_to: normalizeManagerName(order.assigned_to),
        updated_at: order.updated_at,
      };
    } else {
      delete nextAssignments[order.id];
    }
  });

  localStorage.setItem(ORDER_ASSIGNMENTS_KEY, JSON.stringify(nextAssignments));
}

function applyStoredAssignments(orders: Order[]): Order[] {
  const assignments = loadOrderAssignmentsFromLocalStorage();

  return orders.map((order) => {
    const storedAssignment = assignments[order.id];
    if (!storedAssignment?.assigned_to) {
      return order;
    }

    if (normalizeManagerName(order.assigned_to) === normalizeManagerName(storedAssignment.assigned_to)) {
      return order;
    }

    return {
      ...order,
      assigned_to: storedAssignment.assigned_to,
      updated_at: storedAssignment.updated_at || order.updated_at,
    };
  });
}

function mergeSalesManagerNames(baseNames: string[], ...extraNames: string[]): string[] {
  const merged = new Map<string, string>();

  [...baseNames, ...extraNames].forEach((name) => {
    const trimmed = normalizeManagerName(name);
    if (!trimmed) return;
    const key = normalize(trimmed);
    if (!merged.has(key)) {
      merged.set(key, trimmed);
    }
  });

  return Array.from(merged.values()).sort((a, b) => a.localeCompare(b));
}

function mergeOrderRecords(base: Order, overlay: Order): Order {
  return {
    ...base,
    ...overlay,
    shipping_address: overlay.shipping_address ?? base.shipping_address,
    shipping_details: {
      ...(base.shipping_details || {}),
      ...(overlay.shipping_details || {}),
    },
    items: overlay.items?.length ? overlay.items : base.items,
    assigned_to: overlay.assigned_to ?? base.assigned_to,
  };
}

// Function to remove an order from localStorage
function removeOrderFromLocalStorage(orderId: string) {
  // Remove from admin storage
  const adminStored = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (adminStored) {
    try {
      const adminOrders = JSON.parse(adminStored);
      const updatedOrders = adminOrders.filter((order: Order) => order.id !== orderId);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    } catch (e) {
      console.error('âŒ [OrdersPage] Failed to remove order from admin localStorage:', e);
    }
  }

  // Remove from lightweight assignment storage
  try {
    const assignments = loadOrderAssignmentsFromLocalStorage();
    if (assignments[orderId]) {
      delete assignments[orderId];
      localStorage.setItem(ORDER_ASSIGNMENTS_KEY, JSON.stringify(assignments));
    }
  } catch (e) {
    console.error('âŒ [OrdersPage] Failed to remove order assignment from localStorage:', e);
  }
  
  // Remove from user storage
  const userStored = localStorage.getItem('user_orders');
  if (userStored) {
    try {
      const userOrders = JSON.parse(userStored);
      const updatedOrders = userOrders.filter((order: Order) => order.id !== orderId);
      localStorage.setItem('user_orders', JSON.stringify(updatedOrders));
    } catch (e) {
      console.error('âŒ [OrdersPage] Failed to remove order from user localStorage:', e);
    }
  }
  
  // Add to deleted orders list (persistent tracking)
  try {
    const deletedStored = localStorage.getItem(DELETED_ORDERS_KEY);
    const deletedIds: string[] = deletedStored ? JSON.parse(deletedStored) : [];
    if (!deletedIds.includes(orderId)) {
      deletedIds.push(orderId);
      localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(deletedIds));
      console.log(`âœ… [OrdersPage] Added ${orderId} to deleted orders list`);
    }
  } catch (e) {
    console.error('âŒ [OrdersPage] Failed to update deleted orders list:', e);
  }
}

// Function to get list of deleted order IDs
function getDeletedOrderIds(): Set<string> {
  try {
    const deletedStored = localStorage.getItem(DELETED_ORDERS_KEY);
    if (deletedStored) {
      const deletedIds: string[] = JSON.parse(deletedStored);
      return new Set(deletedIds);
    }
  } catch (e) {
    console.error('âŒ [OrdersPage] Failed to load deleted orders list:', e);
  }
  return new Set();
}













