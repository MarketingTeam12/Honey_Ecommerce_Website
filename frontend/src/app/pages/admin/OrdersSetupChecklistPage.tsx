import { useState } from 'react';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { CheckCircle, XCircle, Database, User, FileText, CreditCard, Package, Download } from 'lucide-react';

export function OrdersSetupChecklistPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Customer Order Details - What Admins See
            </h1>
            <p className="text-gray-600">
              Complete checklist of all customer information displayed in the Orders section
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  All Customer Details Are Automatically Captured
                </h3>
                <p className="text-blue-800 text-sm mb-3">
                  When a customer places an order, <strong>ALL</strong> the information they provide is saved and displayed in the admin panel. Nothing is lost or hidden.
                </p>
                <div className="bg-blue-100 rounded-lg p-3 text-sm text-blue-900">
                  <strong>Note:</strong> If you don't see orders in the admin panel, the database needs to be set up first. Visit <code className="bg-blue-200 px-2 py-0.5 rounded">/admin/orders-setup</code> to complete the setup.
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <button
              onClick={() => toggleSection('customer')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Customer Information</h3>
                  <p className="text-sm text-gray-600">Personal details and contact information</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </button>
            
            {expandedSection === 'customer' && (
              <div className="px-6 pb-4 border-t border-gray-200">
                <div className="pt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Customer Name</p>
                      <p className="text-sm text-gray-600">Full name from user profile</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "John Doe"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Email Address</p>
                      <p className="text-sm text-gray-600">Customer's email for communication</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "john@example.com"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">User ID</p>
                      <p className="text-sm text-gray-600">Unique identifier in the system</p>
                      <p className="text-xs text-gray-500 mt-1">Used to track all orders from this customer</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Shipping Address (if provided)</p>
                      <p className="text-sm text-gray-600">Physical delivery address</p>
                      <p className="text-xs text-gray-500 mt-1">Street, City, State, ZIP, Country</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Items Section */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <button
              onClick={() => toggleSection('items')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Order Items & Services</h3>
                  <p className="text-sm text-gray-600">Complete details of each service ordered</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </button>
            
            {expandedSection === 'items' && (
              <div className="px-6 pb-4 border-t border-gray-200">
                <div className="pt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Service Name</p>
                      <p className="text-sm text-gray-600">Type of translation service</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "Certified Document Translation"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Source Language</p>
                      <p className="text-sm text-gray-600">Language of the original document</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "English"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Target Language</p>
                      <p className="text-sm text-gray-600">Language to translate into</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "Spanish"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Page Count</p>
                      <p className="text-sm text-gray-600">Number of pages in the document</p>
                      <p className="text-xs text-gray-500 mt-1">Used for pricing calculation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Certificate Type</p>
                      <p className="text-sm text-gray-600">Type of certification needed (if applicable)</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "Notarized Translation"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Rate Per Page</p>
                      <p className="text-sm text-gray-600">Base price for each page</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "₹100 per page"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Total Price for Item</p>
                      <p className="text-sm text-gray-600">Complete price for this service</p>
                      <p className="text-xs text-gray-500 mt-1">Calculated: pages × rate + any modifiers</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Uploaded Documents Section */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <button
              onClick={() => toggleSection('documents')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Uploaded Documents</h3>
                  <p className="text-sm text-gray-600">Customer files available for download</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </button>
            
            {expandedSection === 'documents' && (
              <div className="px-6 pb-4 border-t border-gray-200">
                <div className="pt-4 space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3">
                    <div className="flex items-start gap-2">
                      <Download className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900 mb-1">All Documents Are Downloadable</p>
                        <p className="text-sm text-orange-800">
                          Every file the customer uploads is stored and can be downloaded as a PDF from the order detail page.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Document Name</p>
                      <p className="text-sm text-gray-600">Original filename as uploaded by customer</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "passport.pdf"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">File Type</p>
                      <p className="text-sm text-gray-600">MIME type of the uploaded file</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "application/pdf"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">File Size</p>
                      <p className="text-sm text-gray-600">Size of the document in KB</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "512.45 KB"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Download Button</p>
                      <p className="text-sm text-gray-600">Click to download the file as PDF</p>
                      <p className="text-xs text-gray-500 mt-1">Format: OrderNumber_ItemName_FileName.pdf</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Visual Indicator in List</p>
                      <p className="text-sm text-gray-600">Paperclip icon shows orders with documents</p>
                      <p className="text-xs text-gray-500 mt-1">Helps identify which orders have files</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment & Pricing Section */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <button
              onClick={() => toggleSection('payment')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Payment & Pricing Details</h3>
                  <p className="text-sm text-gray-600">Complete breakdown of charges</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </button>
            
            {expandedSection === 'payment' && (
              <div className="px-6 pb-4 border-t border-gray-200">
                <div className="pt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Subtotal</p>
                      <p className="text-sm text-gray-600">Sum of all items before tax/discount</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "₹2,000.00"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Discount (if applied)</p>
                      <p className="text-sm text-gray-600">Any promotional discounts</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "-₹200.00"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Tax (18%)</p>
                      <p className="text-sm text-gray-600">GST/Tax amount</p>
                      <p className="text-xs text-gray-500 mt-1">Calculated on subtotal after discount</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Tip (if added)</p>
                      <p className="text-sm text-gray-600">Optional gratuity from customer</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "₹50.00"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Total Amount</p>
                      <p className="text-sm text-gray-600">Final amount paid by customer</p>
                      <p className="text-xs text-gray-500 mt-1">Subtotal - Discount + Tax + Tip</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Payment Method</p>
                      <p className="text-sm text-gray-600">How the customer paid</p>
                      <p className="text-xs text-gray-500 mt-1">Razorpay, Net Banking, or Wallet</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Payment Status</p>
                      <p className="text-sm text-gray-600">Current payment state</p>
                      <p className="text-xs text-gray-500 mt-1">Paid, Pending, or Failed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Currency</p>
                      <p className="text-sm text-gray-600">Transaction currency</p>
                      <p className="text-xs text-gray-500 mt-1">INR (₹) or USD ($)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <button
              onClick={() => toggleSection('additional')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Additional Information</h3>
                  <p className="text-sm text-gray-600">Order metadata and tracking</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </button>
            
            {expandedSection === 'additional' && (
              <div className="px-6 pb-4 border-t border-gray-200">
                <div className="pt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Order Number</p>
                      <p className="text-sm text-gray-600">Unique order identifier for customer reference</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "HT65090576"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Order Status</p>
                      <p className="text-sm text-gray-600">Current processing stage</p>
                      <p className="text-xs text-gray-500 mt-1">Pending, Confirmed, Processing, Shipped, Delivered, Cancelled</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Order Date & Time</p>
                      <p className="text-sm text-gray-600">When the order was placed</p>
                      <p className="text-xs text-gray-500 mt-1">Full timestamp with timezone</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Tracking Number</p>
                      <p className="text-sm text-gray-600">Shipment tracking ID (if shipped)</p>
                      <p className="text-xs text-gray-500 mt-1">Added by admin when order is shipped</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Shipping Carrier</p>
                      <p className="text-sm text-gray-600">Delivery service provider</p>
                      <p className="text-xs text-gray-500 mt-1">Example: "BlueDart"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Shipping Method</p>
                      <p className="text-sm text-gray-600">Delivery method chosen</p>
                      <p className="text-xs text-gray-500 mt-1">Email or Physical Delivery</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Estimated Delivery</p>
                      <p className="text-sm text-gray-600">Expected delivery date</p>
                      <p className="text-xs text-gray-500 mt-1">Calculated automatically, can be updated</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Customer Notes</p>
                      <p className="text-sm text-gray-600">Special instructions from customer</p>
                      <p className="text-xs text-gray-500 mt-1">Any special requests or requirements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Admin Notes</p>
                      <p className="text-sm text-gray-600">Internal notes (editable by admin)</p>
                      <p className="text-xs text-gray-500 mt-1">For admin team communication</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Complete Transparency
                </h3>
                <p className="text-gray-700 mb-3">
                  Every single detail that a customer provides when placing an order is captured, stored securely, and displayed in the admin panel. Nothing is lost or hidden.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">100%</div>
                    <div className="text-sm text-gray-600">Data Captured</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">✓</div>
                    <div className="text-sm text-gray-600">All Documents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">✓</div>
                    <div className="text-sm text-gray-600">Full Details</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">✓</div>
                    <div className="text-sm text-gray-600">Downloadable</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Ready to start seeing customer orders?
            </p>
            <a
              href="/admin/orders-setup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Database className="w-5 h-5" />
              Set Up Database Now
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default OrdersSetupChecklistPage;
