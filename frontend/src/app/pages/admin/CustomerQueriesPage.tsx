import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Eye, Trash2, Mail, Phone, User, Calendar, CheckCircle, Clock, Archive, RefreshCw, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { useAuth } from '@/app/context/AuthContext';

interface CustomerQuery {
  id: string;
  name: string;
  mobile: string;
  email: string;
  message: string;
  submittedAt: string;
  status: string;
  details?: string;
}

function CustomerQueriesPage() {
  const { accessToken } = useAuth();
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState<CustomerQuery | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'month'>('all');
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);


  useEffect(() => {
    fetchQueries();
    
    // Auto-refresh every 30 seconds to catch new queries
    const interval = setInterval(() => {
      fetchQueries();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchQueries = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      console.log('📥 Fetching customer queries from backend...');
      
      const response = await fetch(`${API_URL}/admin/customer-queries`, {
        headers: buildHeaders(accessToken),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Fetch failed. Status:', response.status);
        console.error('❌ Response:', errorText);
        
        const isBackendIssue = errorText.includes('Missing authorization header') || 
                               errorText.includes('Invalid JWT') || 
                               errorText.includes('"code":401');
        
        if (isBackendIssue) {
          console.log('ℹ️ Backend not deployed - customer queries unavailable');
          toast.error('Backend not deployed. Please deploy the Backend Edge Functions.');
          setQueries([]);
          return;
        }
        
        throw new Error('Failed to fetch queries');
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data.queries?.length || 0} customer queries`);
      
      if (data.queries && data.queries.length > 0) {
        console.log('First query sample:', data.queries[0]);
      }
      
      setQueries(data.queries || []);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('ℹ️ Customer queries request timed out (backend not responding)');
        toast.error('Backend timeout. Please ensure Backend Edge Functions are deployed.');
        setQueries([]);
      } else {
        console.error('❌ Error fetching queries:', error);
        toast.error('Failed to load customer queries. Check console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchQueries();
      toast.success('Queries refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh queries');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteClick = (query: CustomerQuery) => {
    setQueryToDelete(query);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!queryToDelete) return;

    try {
      console.log('🗑️ Frontend: Attempting to delete query');
      console.log('📋 Query object:', queryToDelete);
      console.log('🔑 Query ID being sent:', queryToDelete.id);
      console.log('🌐 DELETE URL:', `${API_URL}/admin/customer-queries/${queryToDelete.id}`);
      
      const response = await fetch(`${API_URL}/admin/customer-queries/${queryToDelete.id}`, {
        method: 'DELETE',
        headers: buildHeaders(accessToken)
      });

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Delete failed:', errorData);
        
        // If query not found in backend, remove it from frontend state anyway
        if (response.status === 404 || errorData.error === 'Query not found') {
          console.log('Query not found in backend - removing from frontend state');
          toast.warning('Query was not found in database. Removed from display.');
          setQueries(queries.filter(q => q.id !== queryToDelete.id));
          setShowDeleteModal(false);
          setQueryToDelete(null);
          return;
        }
        
        const errorMessage = errorData.error || errorData.details || 'Failed to delete query';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Delete result:', result);

      toast.success(`Query from "${queryToDelete.name}" deleted successfully!`);
      setQueries(queries.filter(q => q.id !== queryToDelete.id));
      setShowDeleteModal(false);
      setQueryToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete query. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setQueryToDelete(null);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      console.log('🔄 Updating status for query:', id, 'to:', newStatus);
      
      const response = await fetch(`${API_URL}/admin/customer-queries/${id}/status`, {
        method: 'PATCH',
        headers: buildHeaders(accessToken),
        body: JSON.stringify({ status: newStatus })
      });

      console.log('Status update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Status update failed:', errorText);
        throw new Error('Failed to update status');
      }

      const result = await response.json();
      console.log('Status update result:', result);

      toast.success(`Status updated to "${newStatus}"!`);
      
      // Update local state
      setQueries(queries.map(q => 
        q.id === id ? { ...q, status: newStatus } : q
      ));
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status. Please try again.');
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Name', 'Mobile', 'Email', 'Message', 'Submitted Date', 'Status'],
      ...filteredQueries.map(q => [
        q.name,
        q.mobile,
        q.email || 'N/A',
        q.message || 'N/A',
        new Date(q.submittedAt).toLocaleString(),
        q.status
      ])
    ]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-queries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Queries exported to CSV!');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  const getFilteredQueries = () => {
    if (activeFilter === 'pending') {
      return queries.filter(q => q.status === 'pending');
    } else if (activeFilter === 'month') {
      return queries.filter(q => {
        const date = new Date(q.submittedAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
      });
    }
    return queries;
  };

  const filteredQueries = getFilteredQueries();

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Queries</h1>
            <p className="text-gray-600 mt-1">
              Manage customer inquiries from Contact Us form ({queries.length} total)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredQueries.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <button
            onClick={() => setActiveFilter('all')}
            className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-6 transition-all ${
              activeFilter === 'all' ? 'ring-4 ring-blue-300 scale-105' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-blue-100 text-sm font-medium mb-1">Total Queries</p>
                <p className="text-3xl font-bold">{queries.length}</p>
              </div>
              <MessageSquare className="w-12 h-12 text-blue-200" />
            </div>
          </button>

          <button
            onClick={() => setActiveFilter('pending')}
            className={`bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl shadow-lg p-6 transition-all ${
              activeFilter === 'pending' ? 'ring-4 ring-orange-300 scale-105' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-orange-100 text-sm font-medium mb-1">Pending Queries</p>
                <p className="text-3xl font-bold">
                  {queries.filter(q => q.status === 'pending').length}
                </p>
              </div>
              <MessageSquare className="w-12 h-12 text-orange-200" />
            </div>
          </button>

          <button
            onClick={() => setActiveFilter('month')}
            className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg p-6 transition-all ${
              activeFilter === 'month' ? 'ring-4 ring-purple-300 scale-105' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-purple-100 text-sm font-medium mb-1">This Month</p>
                <p className="text-3xl font-bold">
                  {queries.filter(q => {
                    const date = new Date(q.submittedAt);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && 
                           date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-purple-200" />
            </div>
          </button>
        </div>

        {/* Queries Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Loading customer queries...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Submitted Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredQueries.map((query) => [
                    <tr 
                      key={query.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedQuery(expandedQuery === query.id ? null : query.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{query.name}</div>
                            <div className="text-sm text-gray-500">ID: {query.id.substring(0, 15)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {query.mobile}
                          </div>
                          {query.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {query.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-700 max-w-md line-clamp-2 flex-1">
                            {query.message || <span className="text-gray-400 italic">No message provided</span>}
                          </p>
                          {expandedQuery === query.id ? (
                            <ChevronUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 text-sm">
                        {formatDate(query.submittedAt)}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={query.status}
                          onChange={(e) => handleStatusUpdate(query.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                            query.status === 'pending' 
                              ? 'bg-orange-100 text-orange-800' 
                              : query.status === 'contacted'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteClick(query)}
                          className={`p-2 hover:bg-red-50 rounded-lg transition-colors ${
                            deleteConfirm === query.id ? 'bg-red-100' : ''
                          }`}
                          title={deleteConfirm === query.id ? 'Click again to confirm' : 'Delete Query'}
                        >
                          <Trash2
                            className={`w-4 h-4 ${
                              deleteConfirm === query.id ? 'text-red-700' : 'text-red-600'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>,
                    /* Expanded Details Row */
                    expandedQuery === query.id && (
                      <tr key={`${query.id}-expanded`} className="bg-blue-50">
                        <td colSpan={6} className="px-6 py-6">
                          <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <MessageSquare className="w-5 h-5 text-blue-600" />
                              Full Message Details
                            </h3>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Customer Name</label>
                                  <p className="text-gray-900 mt-1">{query.name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Submitted Date</label>
                                  <p className="text-gray-900 mt-1">{formatDate(query.submittedAt)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Mobile Number</label>
                                  <p className="text-gray-900 mt-1">{query.mobile}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">Email Address</label>
                                  <p className="text-gray-900 mt-1">{query.email || <span className="text-gray-400 italic">Not provided</span>}</p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Message</label>
                                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                  <p className="text-gray-900 whitespace-pre-wrap">
                                    {query.message || <span className="text-gray-400 italic">No message provided</span>}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  ])}
                </tbody>
              </table>

              {filteredQueries.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">
                    {queries.length === 0 ? 'No customer queries yet' : 'No queries match this filter'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {queries.length === 0 
                      ? 'Customer queries will appear here when they submit the Contact Us form'
                      : 'Try selecting a different filter to view other queries'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && queryToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-5 w-[380px] max-w-[90%]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Query?</h3>
                  <p className="text-gray-500 text-xs mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-gray-700 text-sm">
                  Delete this query?
                </p>
                <p className="text-gray-900 font-semibold mt-1.5 text-sm">
                  <User className="w-3.5 h-3.5 inline mr-1.5 text-blue-600" />
                  {queryToDelete.name}
                </p>
                {queryToDelete.mobile && (
                  <p className="text-gray-700 text-xs mt-1">
                    <Phone className="w-3 h-3 inline mr-1.5 text-gray-400" />
                    {queryToDelete.mobile}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleDeleteCancel}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export { CustomerQueriesPage };
export default CustomerQueriesPage;
