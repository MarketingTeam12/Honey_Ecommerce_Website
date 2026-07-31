import { useState } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';
import { buildHeaders } from '@/app/utils/buildHeaders';

export function DataCleanupPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleClearAllData = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL orders, notifications, and customer records. This action cannot be undone. Are you sure?')) {
      return;
    }

    if (!confirm('⚠️ FINAL CONFIRMATION: Are you absolutely sure you want to clear all data?')) {
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      console.log('🧹 [Cleanup] Starting data cleanup...');

      const response = await fetch(
        `${API_URL}/admin/clear-all-data`,
        {
          method: 'POST',
          headers: buildHeaders(accessToken)
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        console.log('✅ [Cleanup] Data cleared:', data);
        toast.success('All data cleared successfully!');
        
        // Trigger notifications update
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      } else {
        const error = await response.text();
        console.error('❌ [Cleanup] Failed:', error);
        toast.error('Failed to clear data');
      }
    } catch (error) {
      console.error('❌ [Cleanup] Error:', error);
      toast.error('Failed to clear data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Cleanup Utility</h1>
            <p className="text-gray-600">
              Clear all existing data from the system. Only use this for demo/testing purposes.
            </p>
          </div>

          {/* Warning Card */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Warning</h3>
                <p className="text-sm text-red-800 mb-3">
                  This action will permanently delete:
                </p>
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1 mb-3">
                  <li>All orders and order history</li>
                  <li>All notifications</li>
                  <li>All customer records</li>
                </ul>
                <p className="text-sm text-red-900 font-semibold">
                  This action cannot be undone!
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleClearAllData}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Clearing Data...
              </>
            ) : (
              <>
                <Trash2 className="w-6 h-6" />
                Clear All Data
              </>
            )}
          </button>

          {/* Result Display */}
          {result && (
            <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    ✅ Data Cleared Successfully
                  </h3>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>• Orders deleted: {result.deleted?.orders || 0}</p>
                    <p>• Notifications deleted: {result.deleted?.notifications || 0}</p>
                    <p>• User records deleted: {result.deleted?.users || 0}</p>
                  </div>
                  <p className="text-sm text-green-900 font-medium mt-3">
                    The system is now clean. New signups and orders will appear as normal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> After clearing data, only newly signed-up customers and newly placed orders will be displayed going forward.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}