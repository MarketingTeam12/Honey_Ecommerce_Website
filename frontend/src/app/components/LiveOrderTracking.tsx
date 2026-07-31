import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  Edit3,
  Check,
  Mail,
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { toast } from 'sonner';

interface TrackingStage {
  id: string;
  label: string;
  icon: any;
  status: 'completed' | 'active' | 'pending';
  timestamp?: string;
  details?: string;
}

interface ActivityItem {
  id: string;
  stage: string;
  message: string;
  timestamp: string;
  type: 'status_update' | 'info' | 'alert';
}

interface OrderTracking {
  stages: {
    [key: string]: {
      completed: boolean;
      timestamp?: string;
      details?: string;
    };
  };
  translator?: {
    name: string;
    location: string;
  };
  activities: ActivityItem[];
}

interface OrderDetails {
  id: string;
  order_number: string;
  total_amount: string;
  currency: string;
  status: string;
  payment_status: string;
  items: Array<{
    id: string;
    name: string;
    pageCount?: number;
    sourceLanguage?: string;
    targetLanguage?: string;
  }>;
  shipping_address?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  created_at: string;
  estimated_delivery?: string;
  tracking?: OrderTracking;
}

interface LiveOrderTrackingProps {
  orderId: string;
  orderNumber?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function LiveOrderTracking({
  orderId,
  orderNumber: initialOrderNumber,
  autoRefresh = true,
  refreshInterval = 5000, // 5 seconds
}: LiveOrderTrackingProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Define the 12 sequential stages
  const stageDefinitions = [
    { id: 'received', label: 'Received', icon: Package },
    { id: 'payment_received', label: 'Payment Received', icon: DollarSign },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { id: 'document_analysis', label: 'Document Analysis', icon: FileText },
    { id: 'translator_assigned', label: 'Translator Assigned', icon: UserCheck },
    { id: 'translator_working', label: 'Translator Working', icon: Edit3 },
    { id: 'formatting', label: 'Formatting', icon: Edit3 },
    { id: 'proof_checking', label: 'Proof Checking', icon: Check },
    { id: 'draft_ready', label: 'Draft Ready', icon: FileText },
    { id: 'soft_copy_ready', label: 'Soft Copy Ready', icon: Mail },
    { id: 'courier', label: 'Courier', icon: Package },
    { id: 'shipped', label: 'Shipped', icon: Truck },
  ];

  const fetchOrderDetails = React.useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      // Order tracking is public - no authentication required
      // Just send the public anon key without JWT validation
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `${API_URL}/orders/${orderId}/tracking`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data.order);
        setLastRefresh(new Date());
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Check if it's a backend deployment issue
        const isBackendIssue = errorData.code === 401 || 
                               errorData.error?.includes('Invalid JWT') ||
                               response.status === 401;
        
        if (isBackendIssue) {
          console.log('ℹ️ Backend not deployed - order tracking unavailable');
          if (!showRefreshIndicator) {
            toast.error('Order tracking requires backend deployment.');
          }
        } else if (response.status === 404) {
          // Order not found - show specific message
          console.log('ℹ️ Order not found:', orderId);
          if (!showRefreshIndicator) {
            toast.error('Order not found. Please check your order ID and try again.');
          }
        } else {
          // Other errors
          console.log('ℹ️ Failed to fetch order tracking details:', errorData);
          if (!showRefreshIndicator) {
            toast.error('Failed to load order tracking details. Please try again later.');
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('ℹ️ Order tracking request timed out (backend not responding)');
      } else {
        console.log('ℹ️ Error fetching order tracking:', error.message);
      }
      if (!showRefreshIndicator) {
        toast.error('Unable to connect to the server. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  // Initial fetch
  useEffect(() => {
    fetchOrderDetails(false);
  }, [fetchOrderDetails]);

  // Auto-refresh mechanism with tab visibility check
  useEffect(() => {
    if (!autoRefresh) return;

    let interval: NodeJS.Timeout | null = null;

    const startInterval = () => {
      interval = setInterval(() => {
        // Only fetch if document is visible
        if (!document.hidden) {
          fetchOrderDetails(true);
        }
      }, refreshInterval);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Clear interval when tab is hidden
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      } else {
        // Restart interval when tab becomes visible
        if (!interval) {
          startInterval();
          // Fetch immediately when returning to tab
          fetchOrderDetails(true);
        }
      }
    };

    // Start initial interval
    startInterval();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefresh, refreshInterval, fetchOrderDetails]);

  const getTrackingStages = (): TrackingStage[] => {
    if (!orderDetails?.tracking) {
      // If no tracking data, mark only received as completed
      return stageDefinitions.map((stage, index) => ({
        ...stage,
        status: index === 0 ? 'completed' : 'pending',
        timestamp: index === 0 ? orderDetails?.created_at : undefined,
      }));
    }

    const tracking = orderDetails.tracking;
    let activeFound = false;

    return stageDefinitions.map((stageDef) => {
      const stageData = tracking.stages[stageDef.id];
      const completed = stageData?.completed || false;

      let status: 'completed' | 'active' | 'pending' = 'pending';

      if (completed) {
        status = 'completed';
      } else if (!activeFound && !completed) {
        status = 'active';
        activeFound = true;
      }

      return {
        ...stageDef,
        status,
        timestamp: stageData?.timestamp,
        details: stageData?.details,
      };
    });
  };

  const calculateProgress = (): number => {
    const stages = getTrackingStages();
    const completedCount = stages.filter((s) => s.status === 'completed').length;
    return Math.round((completedCount / stageDefinitions.length) * 100);
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEstimatedDelivery = () => {
    if (orderDetails?.estimated_delivery) {
      const date = new Date(orderDetails.estimated_delivery);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return 'TBD';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0a1247] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order tracking...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    );
  }

  const stages = getTrackingStages();
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Live Badge */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Order Tracking
                </h1>
                {autoRefresh && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-green-700">LIVE</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600">
                Order #{orderDetails.order_number || initialOrderNumber}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => fetchOrderDetails(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              <div className="text-right">
                <p className="text-xs text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-700">
                  {lastRefresh.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-2xl font-bold text-[#3B82F6]">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3B82F6] to-[#10B981] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stages.filter((s) => s.status === 'completed').length} of{' '}
              {stageDefinitions.length} stages completed
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tracking Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Desktop: Horizontal Timeline */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Order Status Timeline
              </h3>
              <div className="space-y-6">
                {/* First 6 stages */}
                <div className="grid grid-cols-6 gap-2">
                  {stages.slice(0, 6).map((stage, index) => {
                    const Icon = stage.icon;
                    const isCompleted = stage.status === 'completed';
                    const isActive = stage.status === 'active';

                    return (
                      <div key={stage.id} className="flex flex-col items-center">
                        <div className="relative w-full">
                          <div className="flex items-center">
                            {/* Icon */}
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                isCompleted
                                  ? 'bg-[#10B981] scale-100'
                                  : isActive
                                  ? 'bg-[#3B82F6] scale-110 shadow-lg'
                                  : 'bg-[#9CA3AF]'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6 text-white" />
                              ) : (
                                <Icon className="w-5 h-5 text-white" />
                              )}
                            </div>
                            {/* Connector Line */}
                            {index < 5 && (
                              <div
                                className={`flex-1 h-1 transition-all duration-300 ${
                                  isCompleted ? 'bg-[#10B981]' : 'bg-gray-300'
                                }`}
                              ></div>
                            )}
                          </div>
                        </div>
                        {/* Label */}
                        <div className="mt-3 text-center">
                          <p
                            className={`text-xs font-semibold transition-colors ${
                              isCompleted
                                ? 'text-[#10B981]'
                                : isActive
                                ? 'text-[#3B82F6]'
                                : 'text-[#9CA3AF]'
                            }`}
                          >
                            {stage.label}
                          </p>
                          {isActive && (
                            <p className="text-xs text-[#3B82F6] mt-1 font-medium animate-pulse">
                              IN PROGRESS
                            </p>
                          )}
                          {isCompleted && stage.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(stage.timestamp)}
                            </p>
                          )}
                          {stage.details && (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              {stage.details}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Last 6 stages */}
                <div className="grid grid-cols-6 gap-2">
                  {stages.slice(6, 12).map((stage, index) => {
                    const Icon = stage.icon;
                    const isCompleted = stage.status === 'completed';
                    const isActive = stage.status === 'active';

                    return (
                      <div key={stage.id} className="flex flex-col items-center">
                        <div className="relative w-full">
                          <div className="flex items-center">
                            {/* Icon */}
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                isCompleted
                                  ? 'bg-[#10B981] scale-100'
                                  : isActive
                                  ? 'bg-[#3B82F6] scale-110 shadow-lg'
                                  : 'bg-[#9CA3AF]'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6 text-white" />
                              ) : (
                                <Icon className="w-5 h-5 text-white" />
                              )}
                            </div>
                            {/* Connector Line */}
                            {index < 5 && (
                              <div
                                className={`flex-1 h-1 transition-all duration-300 ${
                                  isCompleted ? 'bg-[#10B981]' : 'bg-gray-300'
                                }`}
                              ></div>
                            )}
                          </div>
                        </div>
                        {/* Label */}
                        <div className="mt-3 text-center">
                          <p
                            className={`text-xs font-semibold transition-colors ${
                              isCompleted
                                ? 'text-[#10B981]'
                                : isActive
                                ? 'text-[#3B82F6]'
                                : 'text-[#9CA3AF]'
                            }`}
                          >
                            {stage.label}
                          </p>
                          {isActive && (
                            <p className="text-xs text-[#3B82F6] mt-1 font-medium animate-pulse">
                              IN PROGRESS
                            </p>
                          )}
                          {isCompleted && stage.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(stage.timestamp)}
                            </p>
                          )}
                          {stage.details && (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              {stage.details}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile: Vertical Timeline */}
            <div className="md:hidden bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Order Status Timeline
              </h3>
              <div className="space-y-1">
                {stages.map((stage, index) => {
                  const Icon = stage.icon;
                  const isCompleted = stage.status === 'completed';
                  const isActive = stage.status === 'active';

                  return (
                    <div key={stage.id} className="relative">
                      <div className="flex items-start gap-3">
                        {/* Icon Container */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                              isCompleted
                                ? 'bg-[#10B981] scale-100'
                                : isActive
                                ? 'bg-[#3B82F6] scale-110 shadow-lg'
                                : 'bg-[#9CA3AF]'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            ) : (
                              <Icon className="w-5 h-5 text-white" />
                            )}
                          </div>
                          {/* Connector Line */}
                          {index < stages.length - 1 && (
                            <div
                              className={`w-0.5 h-12 transition-all duration-300 ${
                                isCompleted ? 'bg-[#10B981]' : 'bg-gray-300'
                              }`}
                            ></div>
                          )}
                        </div>

                        {/* Stage Info */}
                        <div className="flex-1 pb-4">
                          <p
                            className={`font-semibold text-sm transition-colors ${
                              isCompleted
                                ? 'text-[#10B981]'
                                : isActive
                                ? 'text-[#3B82F6]'
                                : 'text-[#9CA3AF]'
                            }`}
                          >
                            {stage.label}
                          </p>
                          {isActive && (
                            <p className="text-xs text-[#3B82F6] mt-1 font-medium animate-pulse">
                              IN PROGRESS
                            </p>
                          )}
                          {isCompleted && stage.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(stage.timestamp)}
                            </p>
                          )}
                          {stage.details && (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              {stage.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Activity Feed */}
            {orderDetails.tracking?.activities &&
              orderDetails.tracking.activities.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-[#3B82F6]" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Live Activity Feed
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {orderDetails.tracking.activities
                      .slice()
                      .reverse()
                      .map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="w-2 h-2 bg-[#3B82F6] rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTimestamp(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>

          {/* Right Column - Order Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <p className="text-sm font-medium text-gray-900">
                    {orderDetails.order_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="text-sm font-bold text-gray-900">
                    {orderDetails.currency === 'INR' ? '₹' : '$'}
                    {parseFloat(orderDetails.total_amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Service</p>
                  {orderDetails.items.map((item, index) => (
                    <div key={item.id} className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                      </p>
                      {item.sourceLanguage && item.targetLanguage && (
                        <p className="text-xs text-gray-600">
                          {item.sourceLanguage} to {item.targetLanguage}
                          {item.pageCount ? ` • ${item.pageCount} page(s)` : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {orderDetails.tracking?.translator && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Assigned Translator</p>
                    <p className="text-sm font-medium text-gray-900">
                      {orderDetails.tracking.translator.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {orderDetails.tracking.translator.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {orderDetails.shipping_address && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delivery Address
                  </h3>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  {orderDetails.shipping_address.name && (
                    <p className="font-medium">{orderDetails.shipping_address.name}</p>
                  )}
                  {orderDetails.shipping_address.line1 && (
                    <p>{orderDetails.shipping_address.line1}</p>
                  )}
                  {orderDetails.shipping_address.line2 && (
                    <p>{orderDetails.shipping_address.line2}</p>
                  )}
                  <p>
                    {orderDetails.shipping_address.city}
                    {orderDetails.shipping_address.state &&
                      `, ${orderDetails.shipping_address.state}`}
                    {orderDetails.shipping_address.postalCode &&
                      ` - ${orderDetails.shipping_address.postalCode}`}
                  </p>
                  {orderDetails.shipping_address.country && (
                    <p>{orderDetails.shipping_address.country}</p>
                  )}
                </div>
              </div>
            )}

            {/* Estimated Delivery */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Estimated Delivery
                </h3>
              </div>
              <p className="text-2xl font-bold text-[#3B82F6]">
                {getEstimatedDelivery()}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Order placed on {formatTimestamp(orderDetails.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}