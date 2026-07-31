import { useState, useEffect } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { Bell, Check, Trash2, Filter, Search } from 'lucide-react';
import { projectId, publicAnonKey } from '@/app/utils/backendInfo';
import { API_BASE_URL } from '@/app/utils/api';

// Was reading VITE_BACKEND_URL (never set) with a localhost:3000 fallback.
const LOCAL_BACKEND_BASE = API_BASE_URL;
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'new_order' | 'payment' | 'review' | 'system' | 'user';
  title: string;
  message: string;
  order_id?: string;
  order_number?: string;
  amount?: string;
  currency?: string;
  created_at: string;
  read: boolean;
  priority?: 'high' | 'medium' | 'low';
}

function NotificationsPage() {
  const { accessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Load notifications from backend
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      console.log('📬 [NotificationsPage] Loading notifications from backend...');
      
      // Use publicAnonKey as fallback for Backend infra auth in demo mode
      const isMock = accessToken?.startsWith('mock-token-');
      const bearerToken = (!isMock && accessToken) ? accessToken : publicAnonKey;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      };
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(
          `${LOCAL_BACKEND_BASE}/make-server-a67f0635/notifications`,
          { 
            headers,
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          const notifs = data.notifications || [];
          setNotifications(notifs);
          console.log('✅ [NotificationsPage] Loaded', notifs.length, 'notifications from backend');
        } else {
          console.log('⚠️ [NotificationsPage] Backend returned error:', response.status);
          // Use empty array as fallback
          setNotifications([]);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.log('⚠️ [NotificationsPage] Request timed out - using empty state');
        } else {
          console.log('⚠️ [NotificationsPage] Fetch error:', fetchError.message);
        }
        
        // Use empty array as fallback
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      // Use empty array as fallback
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      console.log('🔔 [NotificationsPage] Marking notification as read:', id);
      
      // Use publicAnonKey as fallback for Backend infra auth in demo mode
      const isMock = accessToken?.startsWith('mock-token-');
      const bearerToken = (!isMock && accessToken) ? accessToken : publicAnonKey;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      };
      
      const response = await fetch(
        `${LOCAL_BACKEND_BASE}/make-server-a67f0635/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers
        }
      );
      
      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        
        // Trigger event to update AdminLayout notification count
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        
        console.log('✅ [NotificationsPage] Notification marked as read');
        toast.success('Notification marked as read');
      } else {
        console.error('❌ [NotificationsPage] Failed to mark as read');
        toast.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('❌ [NotificationsPage] Error marking as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('🔔 [NotificationsPage] Marking all notifications as read...');
      
      // Use publicAnonKey as fallback for Backend infra auth in demo mode
      const isMock = accessToken?.startsWith('mock-token-');
      const bearerToken = (!isMock && accessToken) ? accessToken : publicAnonKey;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
      };
      
      const response = await fetch(
        `${LOCAL_BACKEND_BASE}/make-server-a67f0635/notifications/mark-all-read`,
        {
          method: 'PATCH',
          headers
        }
      );
      
      console.log('📡 [NotificationsPage] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        console.log('📡 [NotificationsPage] Response data:', data);
        console.log('✅ [NotificationsPage] Updated count:', data.updatedCount);
        
        // Reload notifications from the server to ensure we have the latest state
        await loadNotifications();
        
        // Trigger event to update AdminLayout notification count
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        
        console.log('✅ [NotificationsPage] All notifications marked as read');
        toast.success(`Marked ${data.updatedCount} notification(s) as read`);
      } else {
        const errorText = await response.text();
        console.error('❌ [NotificationsPage] Failed to mark all as read:', errorText);
        toast.error('Failed to mark all as read');
      }
    } catch (error) {
      console.error('❌ [NotificationsPage] Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        console.log('🗑️ [NotificationsPage] Deleting notification:', id);
        
        // Use publicAnonKey as fallback for Backend infra auth in demo mode
        const isMock = accessToken?.startsWith('mock-token-');
        const bearerToken = (!isMock && accessToken) ? accessToken : publicAnonKey;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`,
        };
        
        const response = await fetch(
          `${LOCAL_BACKEND_BASE}/make-server-a67f0635/notifications/${id}`,
          {
            method: 'DELETE',
            headers
          }
        );
        
        if (response.ok) {
          // Update local state
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          
          // Trigger event to update AdminLayout notification count
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
          
          console.log('✅ [NotificationsPage] Notification deleted');
          toast.success('Notification deleted');
        } else {
          console.error('❌ [NotificationsPage] Failed to delete notification');
          toast.error('Failed to delete notification');
        }
      } catch (error) {
        console.error('❌ [NotificationsPage] Error deleting notification:', error);
        toast.error('Failed to delete notification');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (confirm('Are you sure you want to delete the selected notifications?')) {
      setDeleting(true);
      try {
        console.log('🗑️ [NotificationsPage] Deleting selected notifications:', selectedIds);
        
        // Use publicAnonKey as fallback for Backend infra auth in demo mode
        const isMock = accessToken?.startsWith('mock-token-');
        const bearerToken = (!isMock && accessToken) ? accessToken : publicAnonKey;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`,
        };
        
        const response = await fetch(
          `${LOCAL_BACKEND_BASE}/make-server-a67f0635/notifications/delete-selected`,
          {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ ids: Array.from(selectedIds) })
          }
        );
        
        if (response.ok) {
          // Update local state
          setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
          setSelectedIds(new Set());
          
          // Trigger event to update AdminLayout notification count
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
          
          console.log('✅ [NotificationsPage] Selected notifications deleted');
          toast.success('Selected notifications deleted');
        } else {
          console.error('❌ [NotificationsPage] Failed to delete selected notifications');
          toast.error('Failed to delete selected notifications');
        }
      } catch (error) {
        console.error('❌ [NotificationsPage] Error deleting selected notifications:', error);
        toast.error('Failed to delete selected notifications');
      } finally {
        setDeleting(false);
      }
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    return matchesSearch && matchesType;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all filtered notifications
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new_order':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500';
      case 'medium':
        return 'border-l-4 border-yellow-500';
      case 'low':
        return 'border-l-4 border-green-500';
      default:
        return '';
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {filteredNotifications.length > 0 && (
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">Select All</span>
              </label>
            )}
            <button
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
              disabled={selectedIds.size === 0 || loading || deleting}
            >
              <Trash2 className="w-5 h-5" />
              {deleting ? 'Deleting...' : `Bulk Delete${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              disabled={loading}
            >
              <option value="all">All Types</option>
              <option value="new_order">Orders</option>
              <option value="payment">Payments</option>
              <option value="review">Reviews</option>
              <option value="system">System</option>
              <option value="user">Users</option>
            </select>
          </div>
        </div>

        {/* Statistics Info Panel */}
        {!loading && notifications.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-900">
                Showing <strong>{filteredNotifications.length}</strong> of <strong>{notifications.length}</strong> total notifications
                {(searchQuery || filterType !== 'all') && ' (filtered)'}
              </span>
              {(searchQuery || filterType !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : (
          /* Notifications List */
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notifications found</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
                    !notification.read ? 'bg-blue-50' : ''
                  } ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.has(notification.id)}
                      onChange={() => handleToggleSelect(notification.id)}
                      className="mt-3 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${
                      !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Bell className={`w-5 h-5 ${
                        !notification.read ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className={`font-semibold ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                            {(notification.type || 'general').charAt(0).toUpperCase() + (notification.type || 'general').slice(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default NotificationsPage;

