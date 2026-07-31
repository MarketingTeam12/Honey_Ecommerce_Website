import { useState, useEffect } from 'react';
import { CheckCircle, Copy, Database, Download, Upload, AlertTriangle, Trash2, RefreshCw, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { copyToClipboard } from '@/app/utils/clipboard';

export default function OrdersSetupPage() {
  const [checking, setChecking] = useState(false);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [localStorageOrders, setLocalStorageOrders] = useState<any[]>([]);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    setChecking(true);
    
    try {
      // Check if database table exists by trying to fetch orders
      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTableExists(true);
        setOrdersCount(data.orders?.length || 0);
      } else {
        const errorText = await response.text();
        // Check if it's a table missing error
        if (errorText.includes('relation') || errorText.includes('does not exist')) {
          setTableExists(false);
        } else {
          setTableExists(null);
        }
      }

      // Check localStorage for orders
      const stored = localStorage.getItem('honey_translation_orders');
      if (stored) {
        const orders = JSON.parse(stored);
        setLocalStorageOrders(orders);
      }
    } catch (error) {
      console.error('Setup check error:', error);
      setTableExists(null);
    } finally {
      setChecking(false);
    }
  };

  const copySQL = async () => {
    const sql = `CREATE TABLE IF NOT EXISTS public.kv_store_a67f0635 (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kv_store_a67f0635_created_at 
ON public.kv_store_a67f0635(created_at DESC);

ALTER TABLE public.kv_store_a67f0635 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.kv_store_a67f0635 FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read" ON public.kv_store_a67f0635 FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon read" ON public.kv_store_a67f0635 FOR SELECT TO anon USING (true);
CREATE POLICY "Anon insert" ON public.kv_store_a67f0635 FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon update" ON public.kv_store_a67f0635 FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon delete" ON public.kv_store_a67f0635 FOR DELETE TO anon USING (true);`;

    const success = await copyToClipboard(sql);
    if (success) {
      toast.success('SQL copied to clipboard!');
    } else {
      toast.error('Failed to copy SQL script');
    }
  };

  const migrateLocalStorageOrders = async () => {
    if (localStorageOrders.length === 0) {
      toast.info('No orders to migrate');
      return;
    }

    setMigrating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const order of localStorageOrders) {
      try {
        // Save each order to the backend
        const response = await fetch(`${API_URL}/payment/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          },
          body: JSON.stringify({
            userId: order.user_id,
            userEmail: order.customer_email,
            userName: order.customer_name,
            orderId: order.id,
            orderNumber: order.order_number,
            trackingNumber: order.tracking_number,
            amount: parseFloat(order.total_amount),
            currency: order.currency,
            paymentMethod: order.payment_method,
            items: order.items,
            subtotal: parseFloat(order.subtotal),
            discount: parseFloat(order.discount),
            tax: parseFloat(order.tax),
            shippingAddress: order.shipping_address,
            notes: order.notes,
            tip: order.tip || 0,
            shippingMethod: order.shipping_method
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error('Migration error for order:', order.id, error);
        errorCount++;
      }
    }

    setMigrating(false);
    
    if (successCount > 0) {
      toast.success(`Migrated ${successCount} orders successfully!`);
      await checkSetup(); // Refresh status
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to migrate ${errorCount} orders`);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Database Setup</h1>
            <p className="text-gray-600">
              Set up the database table required for orders to appear in the admin panel
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Database Table Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Database Table</h2>
              </div>
              
              {checking ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking...</span>
                </div>
              ) : tableExists === true ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Table exists</span>
                </div>
              ) : tableExists === false ? (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Table missing</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Unknown status</span>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-600">
                Table: <code className="bg-gray-100 px-2 py-1 rounded">kv_store_a67f0635</code>
              </div>
            </div>

            {/* Orders Count */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Orders in Database</h2>
              </div>
              
              <div className="text-3xl font-bold text-gray-900">{ordersCount}</div>
              <div className="mt-2 text-sm text-gray-600">
                {ordersCount === 0 ? 'No orders yet' : `${ordersCount} order${ordersCount === 1 ? '' : 's'} stored`}
              </div>
            </div>
          </div>

          {/* localStorage Orders */}
          {localStorageOrders.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Orders Found in Browser Storage
                  </h3>
                  <p className="text-yellow-800 text-sm mb-4">
                    Found {localStorageOrders.length} order{localStorageOrders.length === 1 ? '' : 's'} stored in browser localStorage.
                    These should be migrated to the database.
                  </p>
                  
                  {tableExists && (
                    <button
                      onClick={migrateLocalStorageOrders}
                      disabled={migrating}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {migrating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Migrating...
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4" />
                          Migrate to Database
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Setup Instructions */}
          {tableExists === false && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Setup Instructions</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Copy SQL Script</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Click the button below to copy the SQL script to your clipboard
                    </p>
                    <button
                      onClick={copySQL}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy SQL Script
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Open Backend SQL Editor</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Go to your Backend project dashboard and open the SQL Editor
                    </p>
                    <a
                      href={`https://authClient.com/dashboard/project/${projectId}/sql/new`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open SQL Editor
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Run the SQL Script</h3>
                    <p className="text-gray-600 text-sm">
                      Paste the SQL script into the editor and click "Run" to create the table
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Verify Setup</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Come back to this page and click the button below to verify the table was created
                    </p>
                    <button
                      onClick={checkSetup}
                      disabled={checking}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                      Check Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {tableExists === true && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">
                    ✅ Database Setup Complete!
                  </h3>
                  <p className="text-green-800 text-sm mb-4">
                    The orders table is properly configured. New orders will automatically appear in the admin panel.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={checkSetup}
                      disabled={checking}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                      Refresh Status
                    </button>
                    <a
                      href="/admin/sales/orders"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      View Orders
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}