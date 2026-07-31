import React, { useState } from 'react';
import { 
  ShoppingCart, Database, Settings, Eye, CheckCircle, Clock, 
  ArrowRight, RefreshCw, Save, Edit, Package, FileText 
} from 'lucide-react';

interface OrderManagementVisualProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  saving?: boolean;
}

const ORDER_STATUSES = [
  { id: 'pending', label: 'Order Placed', color: 'yellow', icon: ShoppingCart },
  { id: 'confirmed', label: 'Confirmed', color: 'blue', icon: CheckCircle },
  { id: 'processing', label: 'In Progress', color: 'purple', icon: Clock },
  { id: 'completed', label: 'Completed', color: 'green', icon: CheckCircle },
  { id: 'cancelled', label: 'Cancelled', color: 'red', icon: Package }
] as const;

export function OrderManagementVisual({ 
  currentStatus, 
  onStatusChange,
  saving = false 
}: OrderManagementVisualProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSave = () => {
    onStatusChange(selectedStatus);
    setShowDropdown(false);
  };

  const getStatusColor = (color: string) => {
    const colorMap: Record<string, string> = {
      yellow: 'bg-yellow-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      green: 'bg-green-500',
      red: 'bg-red-500'
    };
    return colorMap[color] || 'bg-gray-500';
  };

  const getStatusBorderColor = (color: string) => {
    const colorMap: Record<string, string> = {
      yellow: 'border-yellow-500',
      blue: 'border-blue-500',
      purple: 'border-purple-500',
      green: 'border-green-500',
      red: 'border-red-500'
    };
    return colorMap[color] || 'border-gray-500';
  };

  const currentStatusInfo = ORDER_STATUSES.find(s => s.id === selectedStatus);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        Order Management System Flow
      </h2>

      {/* Visual Flow Diagram */}
      <div className="space-y-8">
        {/* Customer Order → Database */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Customer Order</h3>
            </div>
            <p className="text-sm text-gray-600 ml-11">
              Customer places an order with:
            </p>
            <ul className="text-xs text-gray-600 ml-11 mt-2 space-y-1">
              <li>• Order ID</li>
              <li>• Service Name</li>
              <li>• Payment Status</li>
              <li>• Current Status</li>
            </ul>
          </div>

          <ArrowRight className="w-8 h-8 text-blue-500 flex-shrink-0 animate-pulse" />

          <div className="flex-1 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Database</h3>
            </div>
            <p className="text-sm text-gray-600 ml-11">
              Stored in centralized database
            </p>
            <div className="text-xs font-mono bg-white rounded p-2 mt-2 ml-11 border border-purple-200">
              <div className="text-purple-700">order_[orderId]</div>
              <div className="text-gray-500 mt-1">KV Store</div>
            </div>
          </div>
        </div>

        {/* Two-way arrow for sync */}
        <div className="flex justify-center">
          <RefreshCw className="w-8 h-8 text-green-500 animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        {/* Admin Panel Update */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Admin Panel - Order Management</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Status Display */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Status
              </label>
              <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                currentStatusInfo ? getStatusBorderColor(currentStatusInfo.color) : 'border-gray-300'
              } bg-white`}>
                {currentStatusInfo && (
                  <>
                    <div className={`p-2 ${getStatusColor(currentStatusInfo.color)} rounded-lg`}>
                      {React.createElement(currentStatusInfo.icon, { className: 'w-5 h-5 text-white' })}
                    </div>
                    <span className="font-semibold text-gray-900">{currentStatusInfo.label}</span>
                  </>
                )}
              </div>
            </div>

            {/* Status Update Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Update Status
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full flex items-center justify-between gap-2 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-white"
                >
                  <div className="flex items-center gap-2">
                    <Edit className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      {ORDER_STATUSES.find(s => s.id === selectedStatus)?.label || 'Select Status'}
                    </span>
                  </div>
                  <span className="text-gray-400">▼</span>
                </button>

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                    {ORDER_STATUSES.map((status) => {
                      const Icon = status.icon;
                      return (
                        <button
                          key={status.id}
                          onClick={() => {
                            setSelectedStatus(status.id);
                            setShowDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedStatus === status.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className={`p-2 ${getStatusColor(status.color)} rounded-lg`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-gray-900">{status.label}</span>
                          {selectedStatus === status.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || selectedStatus === currentStatus}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save & Update Database
                </>
              )}
            </button>
          </div>

          {selectedStatus !== currentStatus && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Changes will be saved to the database and reflected on the customer tracking page immediately.
              </p>
            </div>
          )}
        </div>

        {/* Arrow down to Database Update */}
        <div className="flex justify-center">
          <ArrowRight className="w-8 h-8 text-purple-500 flex-shrink-0 transform rotate-90 animate-bounce" />
        </div>

        {/* Database Update → Tracking Page */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Database Updated</h3>
            </div>
            <p className="text-sm text-gray-600 ml-11">
              Order record updated with new status
            </p>
            <div className="text-xs font-mono bg-white rounded p-2 mt-2 ml-11 border border-purple-200">
              <div className="text-purple-700">status: "{selectedStatus}"</div>
              <div className="text-gray-500 mt-1">updated_at: {new Date().toISOString()}</div>
            </div>
          </div>

          <ArrowRight className="w-8 h-8 text-green-500 flex-shrink-0 animate-pulse" />

          <div className="flex-1 bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">Customer Tracking Page</h3>
            </div>
            <p className="text-sm text-gray-600 ml-11">
              Real-time status update displayed
            </p>
            <div className="ml-11 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-gray-700">Horizontal Progress Timeline</span>
              </div>
              <div className="flex items-center gap-1">
                {ORDER_STATUSES.slice(0, 4).map((status, index) => {
                  const isActive = ORDER_STATUSES.findIndex(s => s.id === selectedStatus) >= index;
                  return (
                    <div key={status.id} className="flex-1">
                      <div className={`h-2 rounded-full transition-all duration-500 ${
                        isActive ? getStatusColor(status.color) : 'bg-gray-300'
                      }`}></div>
                      <div className={`text-xs mt-1 text-center font-medium ${
                        isActive ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {status.label.split(' ')[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <strong>Progress:</strong> {Math.round((ORDER_STATUSES.findIndex(s => s.id === selectedStatus) + 1) / ORDER_STATUSES.length * 100)}%
              </div>
              <div className="mt-1 text-xs text-gray-500">
                <strong>Last Updated:</strong> {new Date().toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Summary */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Centralized Database
          </h4>
          <p className="text-sm text-gray-600">
            All order data stored in KV store with real-time sync
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-green-600" />
            Real-time Updates
          </h4>
          <p className="text-sm text-gray-600">
            Changes reflect immediately on customer tracking page
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            Visual Progress
          </h4>
          <p className="text-sm text-gray-600">
            Horizontal timeline with color-coded stages
          </p>
        </div>
      </div>
    </div>
  );
}
