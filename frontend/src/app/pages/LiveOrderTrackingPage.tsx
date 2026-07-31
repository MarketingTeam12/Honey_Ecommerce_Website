import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { LiveOrderTracking } from '@/app/components/LiveOrderTracking';

export function LiveOrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Log for debugging
  console.log('📦 [Live Tracking Page] Order ID from URL:', orderId);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Order ID</h2>
          <p className="text-gray-600 mb-6">
            No order ID was provided. Please enter a valid order ID to track your order.
          </p>
          <button
            onClick={() => navigate('/track-order')}
            className="px-6 py-3 bg-[#0a1247] text-white rounded-lg hover:bg-[#1a2457] transition-colors"
          >
            Go to Track Order Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Live Order Tracking Component */}
      <LiveOrderTracking
        orderId={orderId}
        autoRefresh={true}
        refreshInterval={5000}
      />
    </div>
  );
}

export default LiveOrderTrackingPage;
