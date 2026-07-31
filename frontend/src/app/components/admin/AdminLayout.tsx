import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Package, ShoppingCart, Users, TrendingUp,
  Store, BarChart3, Settings, Bell,
  Menu, X, LogOut, ChevronDown, LayoutGrid, Tag, Mail, MessageSquare, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { canAccessRoleFeature, hasAdminAccess, isFullAdmin } from '@/app/utils/roleAccess';
import { projectId, publicAnonKey } from '@/app/utils/backendInfo';
import { API_BASE_URL } from '@/app/utils/api';

// Was reading VITE_BACKEND_URL (never set anywhere in this project) with a
// localhost:3000 fallback, so admin notifications silently kept hitting
// localhost even when the rest of the app was pointed at a real backend
// (ngrok, another system, production). API_BASE_URL is the same
// VITE_API_BASE_URL every other API call in the app already uses.
const LOCAL_BACKEND_BASE = API_BASE_URL;
import honeyLogo from 'figma:asset/d99fd9d20cac16122a3e457a66e96224eb5ad345.png';
import { AdminPageSkeleton } from '@/app/components/layout/PageSkeleton';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading, accessToken } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [userManagementExpanded, setUserManagementExpanded] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const canAccessAdmin = hasAdminAccess(user?.email, user?.role);
  const fullAdmin = isFullAdmin(user?.email, user?.role);

  useEffect(() => {
    if (!loading && !canAccessAdmin) {
      navigate('/signin?role=admin', { replace: true });
    }
  }, [loading, canAccessAdmin, navigate]);

  useEffect(() => {
    const isUserManagementRoute =
      location.pathname.startsWith('/admin/accounts') ||
      location.pathname.startsWith('/admin/users') ||
      location.pathname.startsWith('/admin/customers') ||
      location.pathname.startsWith('/admin/roles');

    if (isUserManagementRoute) {
      setUserManagementExpanded(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return;

    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const isMock = accessToken?.startsWith('mock-token-');
        const bearerToken = !isMock && accessToken ? accessToken : publicAnonKey;
        const response = await fetch(
          `${LOCAL_BACKEND_BASE}/make-server-a67f0635/notifications`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${bearerToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Notification request failed with ${response.status}`);
        }

        const data = await response.json();
        if (!isMounted) return;

        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      } catch (error) {
        if (!isMounted) return;

        const storedNotifications = localStorage.getItem('admin_notifications');
        setNotifications(storedNotifications ? JSON.parse(storedNotifications) : []);
      }
    };

    loadNotifications();

    const refreshNotifications = () => {
      loadNotifications();
    };

    window.addEventListener('notificationsUpdated', refreshNotifications);
    window.addEventListener('newOrderNotification', refreshNotifications as EventListener);

    return () => {
      isMounted = false;
      window.removeEventListener('notificationsUpdated', refreshNotifications);
      window.removeEventListener('newOrderNotification', refreshNotifications as EventListener);
    };
  }, [accessToken, canAccessAdmin]);

  const fullNavigation = [
    { name: 'Home', href: '/admin', icon: Home, permissionKey: 'home' },
    { 
      name: 'Items', 
      href: '/admin/items', 
      icon: Package,
      expandedKey: 'items',
      permissionKey: 'items',
      children: [
        { name: 'All Items', href: '/admin/items', permissionKey: 'items' },
        { name: 'Add New Item', href: '/admin/items/new', permissionKey: 'add_new_item' },
        { name: 'Categories', href: '/admin/categories', permissionKey: 'categories' },
        { name: 'Coupons', href: '/admin/coupons', permissionKey: 'coupons' },
        { name: 'Item Reviews', href: '/admin/item-reviews', permissionKey: 'item_reviews' }
      ]
    },
    {
      name: 'User Management',
      href: '/admin/accounts',
      icon: Users,
      expandedKey: 'userManagement',
      permissionKey: 'accounts',
      children: [
        { name: 'Users', href: '/admin/users', permissionKey: 'accounts' },
        { name: 'Roles', href: '/admin/roles', permissionKey: 'roles' },
      ],
    },
    { name: 'Orders', href: '/admin/sales/orders', icon: ShoppingCart, permissionKey: 'orders' },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3, permissionKey: 'reports' },
    { name: 'Customer Emails', href: '/admin/customer-emails', icon: Mail, permissionKey: 'customer_emails' },
    { name: 'Customer Queries', href: '/admin/customer-queries', icon: MessageSquare, permissionKey: 'customer_queries' }
  ];
  const filterNavigation = (items: any[]) =>
    items
      .map((item) => {
        if (!item.children) {
          return canAccessRoleFeature(user?.role, item.permissionKey) ? item : null;
        }

        const children = item.children.filter(
          (child: any) => !child.permissionKey || canAccessRoleFeature(user?.role, child.permissionKey)
        );
        const hasOwnAccess = !item.permissionKey || canAccessRoleFeature(user?.role, item.permissionKey);

        if (!hasOwnAccess && children.length === 0) {
          return null;
        }

        return {
          ...item,
          children,
        };
      })
      .filter(Boolean);
  const navigation = fullAdmin ? fullNavigation : filterNavigation(fullNavigation);
  const allowedPaths = navigation.flatMap((item) =>
    item.children && item.children.length > 0 ? item.children.map((child: any) => child.href) : [item.href]
  );
  const unreadNotificationsCount = notifications.filter((notification) => !notification.read).length;
  const recentNotifications = notifications.slice(0, 5);

  useEffect(() => {
    if (loading || !canAccessAdmin) return;
    if (allowedPaths.length === 0) return;

    const isAllowed = allowedPaths.some((path) => {
      return path.endsWith('/') ? location.pathname.startsWith(path) : location.pathname === path || location.pathname.startsWith(`${path}/`);
    });

    if (!isAllowed) {
      navigate(allowedPaths[0], { replace: true });
    }
  }, [loading, canAccessAdmin, location.pathname, navigate, allowedPaths]);

  if (loading) {
    return <AdminPageSkeleton />;
  }

  if (!canAccessAdmin) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#1a1f2e] text-white transition-transform duration-300 flex flex-col h-screen`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <Store className="w-6 h-6 text-blue-400" />
                <span className="font-bold text-lg">Commerce</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 hover:bg-gray-700 rounded mx-auto"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navigation.map((item) => {
            const isItemActive = item.children
              ? item.children.some((child) =>
                  location.pathname === child.href || location.pathname.startsWith(`${child.href}/`)
                )
              : location.pathname === item.href;
            const isExpanded =
              item.expandedKey === 'items'
                ? itemsExpanded
                : item.expandedKey === 'userManagement'
                  ? userManagementExpanded
                  : item.expandedKey === 'sales'
                    ? salesExpanded
                    : false;
            const toggleExpanded = () => {
              if (item.expandedKey === 'items') setItemsExpanded(!itemsExpanded);
              if (item.expandedKey === 'userManagement') setUserManagementExpanded(!userManagementExpanded);
              if (item.expandedKey === 'sales') setSalesExpanded(!salesExpanded);
            };

            if (item.children) {
              return (
                <div key={item.name}>
                  <button
                    onClick={toggleExpanded}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-700 transition-colors ${
                      isItemActive ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {sidebarOpen && <span>{item.name}</span>}
                    </div>
                    {sidebarOpen && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                  {sidebarOpen && isExpanded && (
                    <div className="bg-gray-800">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={`block px-12 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors ${
                            location.pathname === child.href || location.pathname.startsWith(`${child.href}/`)
                              ? 'bg-gray-700 text-white'
                              : ''
                          }`}
                        >
                          {child.icon && <child.icon className="inline-block w-4 h-4 mr-2 align-[-2px]" />}
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-600 transition-colors ${
                  location.pathname === item.href ? 'bg-gray-700 text-white' : ''
                }`}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header */}
        <header className="min-h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 py-2 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 hidden xl:block">
              Honey Translation Services
            </Link>
            <div className="relative">
              <button
                type="button"
                className="relative p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  setNotificationMenuOpen((prev) => !prev);
                }}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Notifications</p>
                      <p className="text-xs text-gray-500">{unreadNotificationsCount} unread updates</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationMenuOpen(false);
                        navigate('/admin/notifications');
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      View all
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        No updates yet.
                      </div>
                    ) : (
                      recentNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => {
                            setNotificationMenuOpen(false);
                            navigate('/admin/notifications');
                          }}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                            notification.read ? 'bg-white' : 'bg-blue-50/60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                                notification.read ? 'bg-gray-300' : 'bg-blue-500'
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title || 'New update'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-2">
                                {new Date(notification.created_at).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => navigate('/admin/product-fields-config')}
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            {/* Profile Dropdown */}
            <div className="relative">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
              }}>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.[0] || 'A'}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                    <p className="text-sm text-gray-500">{user?.email || 'admin@honey.com'}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Home className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Store className="w-4 h-4" />
                      View Store
                    </Link>
                  </div>
                  <div className="p-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
