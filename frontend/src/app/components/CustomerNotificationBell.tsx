import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Package, CheckCircle, Truck, Gift, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { projectId, publicAnonKey } from '@/app/utils/backendInfo';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { API_BASE_URL } from '@/app/utils/api';

// Was reading VITE_BACKEND_URL (never set) with a localhost:3000 fallback —
// broke the customer notification bell on any deployment other than local
// dev. API_BASE_URL is the same VITE_API_BASE_URL every other API call uses.
const LOCAL_BACKEND_BASE = API_BASE_URL;

interface Notification {
  id: string;
  type: 'welcome' | 'order_placed' | 'order_confirmed' | 'order_shipped' | 'order_delivered' | 'offer';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  order_id?: string;
  order_number?: string;
}

export function CustomerNotificationBell() {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (user) {
      // Show welcome notification when user first signs in
      checkWelcomeNotification();
      
      // Fetch all notifications
      fetchNotifications();
      
      // Poll for new notifications with visibility check
      let interval: NodeJS.Timeout | null = null;

      const startInterval = () => {
        interval = setInterval(() => {
          if (!document.hidden) {
            fetchNotifications();
          }
        }, 10000);
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        } else {
          if (!interval) {
            startInterval();
          }
        }
      };

      startInterval();
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user]);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below the button
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  const checkWelcomeNotification = () => {
    // Check if welcome notification was already shown
    const welcomeShown = localStorage.getItem(`welcome_shown_${user?.id}`);
    
    if (!welcomeShown) {
      const welcomeNotification: Notification = {
        id: `welcome_${Date.now()}`,
        type: 'welcome',
        title: 'Welcome to Honey Translation Services',
        message: 'Thank you for joining us! We are here to help with all your translation needs.',
        created_at: new Date().toISOString(),
        read: false
      };
      
      setNotifications(prev => [welcomeNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Mark as shown
      localStorage.setItem(`welcome_shown_${user?.id}`, 'true');
      
      // Save to backend
      saveNotificationToBackend(welcomeNotification);
    }
  };

  const fetchNotifications = async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch(
        `${LOCAL_BACKEND_BASE}/make-server-a67f0635/notifications/customer`,
        {
          headers: buildHeaders(accessToken)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const fetchedNotifications = data.notifications || [];
        
        setNotifications(fetchedNotifications);
        
        // Count unread
        const unread = fetchedNotifications.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      } else if (response.status !== 401) {
        // Only log non-auth errors
        console.log('Failed to fetch notifications, status:', response.status);
      }
    } catch (error) {
      // Silently handle fetch errors during development
    }
  };

  const saveNotificationToBackend = async (notification: Notification) => {
    if (!accessToken) return;
    
    try {
      await fetch(
        `${LOCAL_BACKEND_BASE}/make-server-a67f0635/notifications/create`,
        {
          method: 'POST',
          headers: buildHeaders(accessToken),
          body: JSON.stringify(notification)
        }
      );
    } catch (error) {
      console.error('❌ [NotificationBell] Error saving notification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update locally
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update backend
      if (accessToken) {
        await fetch(
          `${LOCAL_BACKEND_BASE}/make-server-a67f0635/notifications/${notificationId}/read`,
          {
            method: 'PATCH',
            headers: buildHeaders(accessToken)
          }
        );
      }
    } catch (error) {
      console.error('❌ [NotificationBell] Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update locally
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Update backend
      if (accessToken) {
        await fetch(
          `${LOCAL_BACKEND_BASE}/make-server-a67f0635/notifications/mark-all-read`,
          {
            method: 'PATCH',
            headers: buildHeaders(accessToken)
          }
        );
      }
    } catch (error) {
      console.error('❌ [NotificationBell] Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'order_placed':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'order_confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'order_shipped':
        return <Truck className="w-5 h-5 text-purple-600" />;
      case 'order_delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'offer':
        return <Gift className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!user) {
    return null;
  }

  const notificationPanel = isOpen ? (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Dropdown Panel - Using fixed positioning */}
      <div
        className="fixed w-[calc(100vw-1rem)] max-w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] max-h-[70vh] sm:max-h-[600px] overflow-hidden flex flex-col"
        style={{
          top: `${dropdownPosition.top}px`,
          right: `${Math.max(dropdownPosition.right, 8)}px`
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700" />
            Notifications
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.order_number && (
                        <p className="text-xs text-gray-500 mt-1">
                          Order: {notification.order_number}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      {/* Bell Icon Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Render notification panel in a portal */}
      {createPortal(notificationPanel, document.body)}
    </>
  );
}
