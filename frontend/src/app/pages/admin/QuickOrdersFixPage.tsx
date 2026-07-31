import { useState, useEffect } from 'react';
import { CheckCircle, Copy, Database, AlertTriangle, ExternalLink, RefreshCw, XCircle, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { copyToClipboard } from '@/app/utils/clipboard';

export default function QuickOrdersFixPage() {
  const [checking, setChecking] = useState(false);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [settingUp, setSettingUp] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    checkLocalOrders();
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch(
        `${API_URL}/setup/status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTableExists(data.tableExists && data.accessible);
        setSetupComplete(data.tableExists && data.accessible);
      } else {
        setTableExists(false);
      }
    } catch (error) {
      console.error('Failed to check database status:', error);
      setTableExists(false);
    }
  };

  const checkLocalOrders = () => {
    try {
      const userOrders = localStorage.getItem('user_orders');
      const adminOrders = localStorage.getItem('honey_translation_orders');
      
      const allOrders = new Map();
      
      if (userOrders) {
        const parsed = JSON.parse(userOrders);
        parsed.forEach((order: any) => allOrders.set(order.id, order));
      }
      
      if (adminOrders) {
        const parsed = JSON.parse(adminOrders);
        parsed.forEach((order: any) => allOrders.set(order.id, order));
      }
      
      setLocalOrders(Array.from(allOrders.values()));
    } catch (error) {
      console.error('Failed to load local orders:', error);
    }
  };

  const sqlScript = `-- Honey Translation Services - Database Setup
-- Run this in your Backend SQL Editor

-- Create the key-value store table
CREATE TABLE IF NOT EXISTS public.kv_store_a67f0635 (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_kv_store_a67f0635_created_at 
ON public.kv_store_a67f0635(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.kv_store_a67f0635 ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Service role full access" ON public.kv_store_a67f0635 
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated read" ON public.kv_store_a67f0635 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon read" ON public.kv_store_a67f0635 
FOR SELECT TO anon USING (true);

CREATE POLICY "Anon insert" ON public.kv_store_a67f0635 
FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon update" ON public.kv_store_a67f0635 
FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon delete" ON public.kv_store_a67f0635 
FOR DELETE TO anon USING (true);`;

  const handleCopySQL = async () => {
    const success = await copyToClipboard(sqlScript);
    if (success) {
      toast.success('SQL script copied to clipboard!');
    } else {
      toast.error('Failed to copy SQL script');
    }
  };

  const handleOpenBackend = () => {
    const projectId = window.location.hostname.includes('localhost') 
      ? 'your-project-id' 
      : window.location.hostname.split('.')[0];
    window.open(`https://authClient.com/dashboard/project/${projectId}/sql/new`, '_blank');
  };

  const handleSetupDatabase = async () => {
    setSettingUp(true);
    toast.info('Setting up database... Please wait.');
    
    try {
      const response = await fetch(
        `${API_URL}/setup/database`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTableExists(true);
        setSetupComplete(true);
        toast.success('✅ Database setup complete! All orders will now appear in the admin panel.');
        
        // Refresh status
        setTimeout(() => {
          checkDatabaseStatus();
          window.location.href = '/admin/sales/orders';
        }, 2000);
      } else {
        console.error('Setup failed:', data);
        toast.error(`Setup failed: ${data.error || 'Unknown error'}. Please try the manual SQL method.`);
      }
    } catch (error) {
      console.error('Failed to set up database:', error);
      toast.error('Failed to set up database. Please try the manual SQL method instead.');
    } finally {
      setSettingUp(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quick Orders Fix
            </h1>
            <p className="text-gray-600">
              Your orders are being created but not displayed because the database table is missing
            </p>
          </div>

          {/* ONE-CLICK SETUP BANNER */}
          {!setupComplete && (
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-8 mb-8 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Zap className="w-10 h-10 text-yellow-300" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">
                    ⚡ One-Click Automatic Setup
                  </h2>
                  <p className="text-purple-100 text-lg">
                    Skip the manual steps! Click the button below to automatically create the database table.
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSetupDatabase}
                disabled={settingUp}
                className="w-full bg-white text-purple-700 font-bold text-xl py-5 px-8 rounded-lg hover:bg-purple-50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
              >
                {settingUp ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="animate-spin w-6 h-6 border-4 border-purple-700 border-t-transparent rounded-full"></div>
                    Setting up database... Please wait
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <Zap className="w-7 h-7" />
                    Click Here to Setup Database Automatically (30 seconds)
                  </span>
                )}
              </button>
              
              <p className="text-center text-purple-100 mt-4 text-sm">
                Or scroll down for manual 3-step setup instructions
              </p>
            </div>
          )}

          {/* SUCCESS BANNER */}
          {setupComplete && (
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-8 mb-8 shadow-lg">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-16 h-16" />
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">
                    ✅ Database Setup Complete!
                  </h2>
                  <p className="text-green-100 text-lg mb-4">
                    Your database is ready! All orders will now appear in the admin panel.
                  </p>
                  <a
                    href="/admin/sales/orders"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <Database className="w-5 h-5" />
                    View Orders in Admin Panel →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Current Status */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-900 mb-3">
                  Problem Identified
                </h3>
                <div className="space-y-2 text-orange-800">
                  <p className="flex items-start gap-2">
                    <span className="font-semibold">✅</span>
                    <span>Orders ARE being created successfully</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-semibold">✅</span>
                    <span>Customers CAN see their orders in "My Orders"</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-semibold">✅</span>
                    <span>All customer details and documents ARE being captured</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-semibold">❌</span>
                    <span>Database table <code className="bg-orange-200 px-2 py-0.5 rounded font-mono">kv_store_a67f0635</code> doesn't exist</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-semibold">❌</span>
                    <span>Orders can't be stored permanently in the database</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-semibold">❌</span>
                    <span>Admin panel can't retrieve orders from database</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Found Locally */}
          {localOrders.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {localOrders.length} Order{localOrders.length !== 1 ? 's' : ''} Found in Browser Storage
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    These orders were created but are stored in your browser only. Once you set up the database, they'll appear in the admin panel.
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-blue-900 font-semibold">Order Number</th>
                      <th className="px-4 py-2 text-left text-blue-900 font-semibold">Customer</th>
                      <th className="px-4 py-2 text-left text-blue-900 font-semibold">Amount</th>
                      <th className="px-4 py-2 text-left text-blue-900 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localOrders.map((order, index) => (
                      <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                        <td className="px-4 py-2 font-mono text-gray-900">{order.order_number}</td>
                        <td className="px-4 py-2 text-gray-700">
                          {order.customer_name || 'N/A'}
                          <div className="text-xs text-gray-500">{order.customer_email || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                          {order.currency && order.currency !== 'INR' ? '$' : '₹'}{parseFloat(order.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {order.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* The Fix - 3 Simple Steps */}
          <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4">
              <h2 className="text-2xl font-bold">The Fix (3 Simple Steps - 2 Minutes)</h2>
              <p className="text-green-100 mt-1">Follow these steps to make all orders appear in the admin panel</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Copy the SQL Script
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Click the button below to copy the database creation script to your clipboard
                  </p>
                  <button
                    onClick={handleCopySQL}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy SQL Script
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Open Backend SQL Editor
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Click the button below to open the Backend SQL Editor in a new tab
                  </p>
                  <button
                    onClick={handleOpenBackend}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open SQL Editor in Backend
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Paste and Run
                  </h3>
                  <div className="text-gray-600 space-y-2">
                    <p>In the Backend SQL Editor:</p>
                    <ol className="list-decimal ml-5 space-y-1">
                      <li>Paste the SQL script you copied in Step 1</li>
                      <li>Click the "Run" button (or press Ctrl+Enter)</li>
                      <li>Wait for the green success message</li>
                      <li>Come back to this page</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* After Setup */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">
                  After Running the SQL Script
                </h3>
                <div className="text-sm text-green-800 space-y-2">
                  <p>✅ The database table will be created</p>
                  <p>✅ All new orders will be saved to the database automatically</p>
                  <p>✅ Orders will appear in the admin panel at <code className="bg-green-200 px-2 py-0.5 rounded">/admin/sales/orders</code></p>
                  <p>✅ You'll see all customer details and uploaded documents</p>
                  <p>✅ You can download customer files as PDFs</p>
                  <p>✅ Full order management capabilities will be enabled</p>
                  {localOrders.length > 0 && (
                    <p className="pt-2 border-t border-green-300">
                      ✅ Your {localOrders.length} existing order{localOrders.length !== 1 ? 's' : ''} will automatically sync to the database
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex gap-4">
            <a
              href="/admin/sales/orders"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Database className="w-5 h-5" />
              Go to Orders Page
            </a>
            <button
              onClick={checkLocalOrders}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            <button
              onClick={handleSetupDatabase}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              disabled={settingUp}
            >
              <Zap className="w-5 h-5" />
              {settingUp ? 'Setting up...' : 'Setup Database'}
            </button>
          </div>

          {/* SQL Script Preview */}
          <details className="mt-8 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors font-medium text-gray-900">
              View SQL Script
            </summary>
            <div className="p-6 border-t border-gray-200">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {sqlScript}
              </pre>
            </div>
          </details>
        </div>
      </div>
    </AdminLayout>
  );
}