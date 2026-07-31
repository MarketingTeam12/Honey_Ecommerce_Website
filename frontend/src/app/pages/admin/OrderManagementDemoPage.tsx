import React, { useState } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { OrderManagementVisual } from '@/app/components/admin/OrderManagementVisual';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { projectId } from '@/app/utils/backendInfo';
import { useAuth } from '@/app/context/AuthContext';

export function OrderManagementDemoPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [saving, setSaving] = useState(false);

  // This is a demo - in real implementation, you'd update an actual order
  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setCurrentStatus(newStatus);
    setSaving(false);
    toast.success(`Status updated to: ${newStatus}`);
    
    console.log('[OK] Order Management Demo - Status changed to:', newStatus);
  };

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/sales/orders')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order Management System - Visual Demo
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Complete flow demonstration from customer order to tracking page
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Interactive Order Management System
            </h2>
            <p className="text-blue-700 text-sm mb-3">
              This page demonstrates the complete order management flow in your application:
            </p>
            <ul className="text-blue-700 text-sm space-y-1 ml-4">
              <li>[OK] <strong>Customer Order</strong> -&gt; Stored in centralized KV database</li>
              <li>[OK] <strong>Admin Panel</strong> -&gt; View and update order status via dropdown</li>
              <li>[OK] <strong>Database Update</strong> -&gt; Changes saved instantly to KV store</li>
              <li>[OK] <strong>Tracking Page</strong> -&gt; Real-time status fetched and displayed</li>
              <li>[OK] <strong>Progress Timeline</strong> -&gt; Horizontal stages with color indicators</li>
            </ul>
          </div>

          {/* Visual Component */}
          <OrderManagementVisual
            currentStatus={currentStatus}
            onStatusChange={handleStatusChange}
            saving={saving}
          />

          {/* Usage Guide */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Admin Panel */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
                  Admin Panel
                </h3>
                <div className="pl-10 space-y-2">
                  <p className="text-sm text-gray-700">
                    <strong>Location:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">/admin/sales/orders</code>
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Features:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>View all orders in a list</li>
                    <li>Click on order to see details</li>
                    <li>Select new status from dropdown</li>
                    <li>Click "Save & Update Database"</li>
                    <li>Changes persist to KV store</li>
                  </ul>
                </div>
              </div>

              {/* Customer Tracking */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
                  Customer Tracking
                </h3>
                <div className="pl-10 space-y-2">
                  <p className="text-sm text-gray-700">
                    <strong>Location:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">/track-order</code>
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Features:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>Enter Order Number + Email/Phone</li>
                    <li>Fetch latest status from database</li>
                    <li>Display horizontal progress timeline</li>
                    <li>Show progress percentage</li>
                    <li>Display last updated timestamp</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Implementation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Backend</h4>
                  <ul className="text-xs text-purple-700 space-y-1">
                    <li>- Backend Edge Functions</li>
                    <li>- KV Store (JSONB)</li>
                    <li>- RESTful API</li>
                    <li>- PATCH /orders/:id/status</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Frontend</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>- React + TypeScript</li>
                    <li>- Tailwind CSS</li>
                    <li>- React Router</li>
                    <li>- Lucide Icons</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">Features</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>- Real-time updates</li>
                    <li>- Progress tracking</li>
                    <li>- Status validation</li>
                    <li>- Toast notifications</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Try It Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Try It Out</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/admin/sales/orders')}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors shadow-md"
                >
                  Go to Admin Orders Page
                </button>
                <button
                  onClick={() => navigate('/track-order')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
                >
                  Go to Track Order Page
                </button>
                <button
                  onClick={() => window.open('/ORDER_MANAGEMENT_SYSTEM_GUIDE.md', '_blank')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
                >
                  View Documentation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default OrderManagementDemoPage;
