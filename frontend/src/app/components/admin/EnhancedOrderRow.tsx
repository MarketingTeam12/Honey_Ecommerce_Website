import React from 'react';
import { Eye, Edit, ArrowRight, ChevronDown, ChevronUp, Check, Loader, Clock, Package, CheckCircle, FileText, User, Edit3, Mail, Truck } from 'lucide-react';

const WORKFLOW_STAGES = [
  { id: 'received', label: 'Received', color: 'yellow', icon: Package },
  { id: 'payment-pending', label: 'Payment Pending', color: 'orange', icon: Clock },
  { id: 'confirmed', label: 'Confirmed', color: 'blue', icon: CheckCircle },
  { id: 'document-analysis', label: 'Document Analysis', color: 'indigo', icon: FileText },
  { id: 'translator-working', label: 'Translator Working', color: 'purple', icon: User },
  { id: 'formatting', label: 'Formatting', color: 'violet', icon: Edit3 },
  { id: 'proof-checking', label: 'Proof Checking', color: 'pink', icon: Eye },
  { id: 'draft-ready', label: 'Draft Ready', color: 'cyan', icon: FileText },
  { id: 'soft-copy-ready', label: 'Soft Copy Ready', color: 'teal', icon: CheckCircle },
  { id: 'courier', label: 'Courier', color: 'purple', icon: Truck },
  { id: 'shipped', label: 'Shipped', color: 'violet', icon: Truck },
  { id: 'delivered', label: 'Delivered', color: 'green', icon: CheckCircle }
] as const;

interface OrderItem {
  id: string;
  name: string;
  basePrice: number;
  totalPrice: number;
  pageCount: number;
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
    whatsappNumber?: string;
  };
  tracking_number?: string;
  shipping_carrier?: string;
  shipping_method?: string;
  estimated_delivery?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  notes?: string;
  isNew?: boolean;
}

interface EnhancedOrderRowProps {
  order: Order;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetails: () => void;
  onUpdateStatus: () => void;
  onMoveToNextStage: () => void;
  getProgressPercentage: (status: string) => number;
  getTimeInStage: (order: Order) => string;
  getStatusBadgeClass: (status: string) => string;
  getStatusLabel: (status: string) => string;
  getNextStage: (status: string) => string | null;
}

export function EnhancedOrderRow({
  order,
  isExpanded,
  onToggleExpand,
  onViewDetails,
  onUpdateStatus,
  onMoveToNextStage,
  getProgressPercentage,
  getTimeInStage,
  getStatusBadgeClass,
  getStatusLabel,
  getNextStage
}: EnhancedOrderRowProps) {
  const progressPercentage = getProgressPercentage(order.status);
  const timeInStage = getTimeInStage(order);
  const currentStageIndex = WORKFLOW_STAGES.findIndex(s => s.id === order.status);

  return (
    <>
      {/* Main Order Row */}
      <tr 
        className={`hover:bg-gray-50 transition-colors ${
          order.isNew ? 'bg-yellow-50' : ''
        }`}
        style={{
          animation: order.isNew ? 'highlightFade 3s ease-in-out forwards' : 'none'
        }}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleExpand}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Expand Timeline"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <span className="font-mono font-semibold text-gray-900">{order.order_number}</span>
            {order.isNew && (
              <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full animate-pulse">
                NEW
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div>
            <p className="font-medium text-gray-900">{order.customer_name || 'N/A'}</p>
            <p className="text-sm text-gray-500">{order.customer_email || 'N/A'}</p>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          <div>
            <p>{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
            <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-gray-900">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="font-semibold text-gray-900">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">{progressPercentage}%</span>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
            order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {getStatusLabel(order.payment_status)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex gap-2">
            <button
              onClick={onViewDetails}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={onUpdateStatus}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Update Status"
            >
              <Edit className="w-4 h-4" />
            </button>
            {getNextStage(order.status) && (
              <button
                onClick={onMoveToNextStage}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Move to Next Stage"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expandable Timeline Row */}
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-6 py-6">
            <div className="space-y-4">
              {/* Progress Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Workflow Progress</h3>
                  <p className="text-sm text-gray-500">Time in current stage: <span className="font-medium text-gray-700">{timeInStage}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{progressPercentage}%</p>
                  <p className="text-xs text-gray-500">Complete</p>
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div 
                  className="absolute left-6 top-0 w-0.5 bg-blue-600 transition-all duration-500"
                  style={{ height: `${progressPercentage}%` }}
                ></div>

                {/* Workflow Steps */}
                <div className="space-y-6">
                  {WORKFLOW_STAGES.map((stage, index) => {
                    const isCompleted = index < currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    const isPending = index > currentStageIndex;
                    const StageIcon = stage.icon;

                    return (
                      <div key={stage.id} className="relative flex items-start gap-4">
                        {/* Icon Circle */}
                        <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted ? 'bg-green-500 border-green-500' :
                          isCurrent ? 'bg-blue-500 border-blue-500 animate-pulse' :
                          'bg-white border-gray-300'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-6 h-6 text-white" />
                          ) : (
                            <StageIcon className={`w-6 h-6 ${
                              isCurrent ? 'text-white' :
                              isPending ? 'text-gray-400' :
                              'text-white'
                            }`} />
                          )}
                        </div>

                        {/* Stage Info */}
                        <div className="flex-1 min-w-0 pt-1.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-semibold ${
                                isCurrent ? 'text-gray-900' : 
                                isCompleted ? 'text-green-700' : 
                                'text-gray-400'
                              }`}>
                                {stage.label}
                                {isCurrent && <span className="ml-2 text-blue-600 text-sm">(Current)</span>}
                              </p>
                              {isCurrent && (
                                <p className="text-sm text-gray-500 mt-1">
                                  In progress for {timeInStage}
                                </p>
                              )}
                              {isCompleted && (
                                <p className="text-sm text-green-600 mt-1">✓ Completed</p>
                              )}
                            </div>
                            {isCurrent && (
                              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-3">
                  {getNextStage(order.status) && (
                    <button
                      onClick={onMoveToNextStage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Move to Next Stage
                    </button>
                  )}
                  <button
                    onClick={onUpdateStatus}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Update Status
                  </button>
                  <button
                    onClick={onViewDetails}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Details
                  </button>
                </div>
              </div>

              {/* Order Info Summary */}
              <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                {order.shipping_method === 'physical' ? (
                  <div>
                    <p className="text-xs text-gray-500">Tracking Number</p>
                    <p className="font-mono text-sm font-semibold">{order.tracking_number || 'Not assigned'}</p>
                    {order.shipping_carrier && (
                      <p className="text-xs text-gray-500 mt-1">Carrier: <span className="font-semibold">{order.shipping_carrier}</span></p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500">Delivery Email</p>
                    <p className="text-sm font-semibold break-all">{order.shipping_details?.email || 'Not provided'}</p>
                    {order.shipping_details?.whatsappNumber && (
                      <p className="text-xs text-gray-500 mt-1">WhatsApp: <span className="font-semibold">{order.shipping_details.whatsappNumber}</span></p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Assigned To</p>
                  <p className="text-sm font-semibold">{order.assigned_to || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Est. Delivery</p>
                  <p className="text-sm font-semibold">
                    {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('en-IN') : 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      <style>{`
        @keyframes highlightFade {
          0% {
            background-color: rgb(254, 249, 195);
            box-shadow: 0 0 20px rgba(250, 204, 21, 0.5);
          }
          50% {
            background-color: rgb(254, 240, 138);
            box-shadow: 0 0 30px rgba(250, 204, 21, 0.7);
          }
          100% {
            background-color: transparent;
            box-shadow: none;
          }
        }
      `}</style>
    </>
  );
}
