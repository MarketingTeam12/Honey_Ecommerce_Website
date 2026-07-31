import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, Package, Star, MapPin, Settings, LogOut, Boxes, Clock3, LoaderCircle, CircleCheckBig } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { toApiUrl } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';

interface OrderSummary {
  id: string;
  order_number: string;
  total_amount: string;
  status: string;
  created_at: string;
  user_email?: string;
  customer_email?: string;
}

const ORDERS_KEY = 'user_orders';

export function MyDashboardPage() {
  const { user, accessToken } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      // ===== Try backend first (MySQL) so data survives refresh/reopen =====
      try {
        const response = await fetch(toApiUrl('/orders/my-orders'), {
          headers: buildHeaders(accessToken),
        });

        if (response.ok) {
          const data = await response.json();
          const backendOrders: OrderSummary[] = data.orders || [];
          if (!cancelled && backendOrders.length > 0) {
            setOrders(
              [...backendOrders].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            );
            return;
          }
        }
      } catch (error) {
        console.warn('⚠️ [MyDashboardPage] Backend fetch failed, falling back to localStorage:', error);
      }

      // ===== Fallback: localStorage (only used if backend has nothing / is unreachable) =====
      try {
        const raw = localStorage.getItem(ORDERS_KEY);
        if (!raw || !user?.email) {
          if (!cancelled) setOrders([]);
          return;
        }
        const parsed = JSON.parse(raw) as OrderSummary[];
        const filtered = parsed
          .filter((o) => o.user_email === user.email || o.customer_email === user.email)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (!cancelled) setOrders(filtered);
      } catch {
        if (!cancelled) setOrders([]);
      }
    }

    if (user?.email) {
      loadOrders();
    } else {
      setOrders([]);
    }

    return () => {
      cancelled = true;
    };
  }, [user?.email, accessToken]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status?.toLowerCase() === 'pending').length;
    const processing = orders.filter((o) => {
      const s = o.status?.toLowerCase();
      return ['processing', 'confirmed', 'document-analysis', 'translator-working', 'formatting', 'proof-checking', 'draft', 'soft', 'courier', 'shipped'].includes(s);
    }).length;
    const delivered = orders.filter((o) => o.status?.toLowerCase() === 'delivered').length;
    return { total, pending, processing, delivered };
  }, [orders]);

  const recentOrders = orders.slice(0, 5);
  const joinedDate = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-700">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-slate-700 font-medium">My Account</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 h-fit">
            <div className="pb-4 mb-4 border-b border-slate-200">
              <p className="text-lg font-semibold text-slate-900">{user?.name || 'User'}</p>
              <p className="text-sm text-slate-500">Member since {joinedDate}</p>
            </div>
            <nav className="space-y-2">
              <Link to="/my-dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link to="/my-orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100">
                <Package className="w-4 h-4" /> Orders
              </Link>
              <Link to="/my-profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100">
                <Star className="w-4 h-4" /> My Review
              </Link>
              <Link to="/my-address" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100">
                <MapPin className="w-4 h-4" /> Addresses
              </Link>
              <Link to="/my-profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100">
                <Settings className="w-4 h-4" /> Account Setting
              </Link>
              <Link to="/signin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100">
                <LogOut className="w-4 h-4" /> Logout
              </Link>
            </nav>
          </aside>

          <section className="lg:col-span-9 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Orders</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Boxes className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending Orders</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
                </div>
                <Clock3 className="w-8 h-8 text-amber-500" />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Processing Orders</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.processing}</p>
                </div>
                <LoaderCircle className="w-8 h-8 text-violet-500" />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Delivered Orders</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.delivered}</p>
                </div>
                <CircleCheckBig className="w-8 h-8 text-sky-500" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
                <Link to="/my-orders" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-sm text-slate-500">
                      <th className="px-5 py-3 font-medium">Order</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-500">No orders found</td>
                      </tr>
                    ) : recentOrders.map((order) => {
                      const status = order.status || 'pending';
                      const lower = status.toLowerCase();
                      const badgeClass =
                        lower === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                        lower === 'pending' ? 'bg-amber-50 text-amber-700' :
                        'bg-violet-50 text-violet-700';

                      return (
                        <tr key={order.id} className="border-t border-slate-100">
                          <td className="px-5 py-4 text-sm font-medium text-slate-800">#{order.order_number}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                            ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default MyDashboardPage;
