import React, { useState, useEffect } from 'react';
import { Mail, Search, Copy, CheckCircle, RefreshCw, Download, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { useAuth } from '@/app/context/AuthContext';

interface SubscriberEmail {
  id: string;
  email: string;
  subscribedAt: string;
  status: string;
}

export function CustomerEmailsPage() {
  const { accessToken } = useAuth();
  const [emails, setEmails] = useState<SubscriberEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'month'>('all');


  useEffect(() => {
    fetchEmails();
    
    // Auto-refresh every 30 seconds to catch new subscriptions
    const interval = setInterval(() => {
      fetchEmails();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchEmails = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      console.log('📥 Fetching subscriber emails from backend...');
      
      const response = await fetch(`${API_URL}/admin/subscriber-emails`, {
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
                               errorText.includes('\"code\":401');
        
        if (isBackendIssue) {
          console.log('ℹ️ Backend not deployed - subscriber emails unavailable');
          toast.error('Backend not deployed. Please deploy the Backend Edge Functions.');
          setEmails([]);
          return;
        }
        
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data.emails?.length || 0} subscriber emails`);
      
      if (data.emails && data.emails.length > 0) {
        console.log('First subscriber sample:', data.emails[0]);
      }
      
      setEmails(data.emails || []);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('ℹ️ Subscriber emails request timed out (backend not responding)');
        toast.error('Backend timeout. Please ensure Backend Edge Functions are deployed.');
        setEmails([]);
      } else {
        console.error('❌ Error fetching emails:', error);
        toast.error('Failed to load subscriber emails. Check console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchEmails();
      toast.success('Emails refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh emails');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (deleteConfirm === id) {
      try {
        console.log('🗑️ Attempting to delete subscriber:', id);
        console.log('📧 Email:', email);
        
        const response = await fetch(`${API_URL}/admin/subscriber-emails/${id}`, {
          method: 'DELETE',
          headers: buildHeaders(accessToken)
        });

        console.log('Delete response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Delete failed:', errorData);
          
          // If subscriber not found in backend, remove it from frontend state anyway
          if (response.status === 404 || errorData.error?.includes('not found')) {
            console.log('Subscriber not found in backend - removing from frontend state');
            toast.warning('Email was not found in database. Removed from display.');
            setEmails(emails.filter(e => e.id !== id));
            setDeleteConfirm(null);
            return;
          }
          
          const errorMessage = errorData.error || errorData.message || 'Failed to delete email';
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Delete result:', result);

        toast.success(`Email "${email}" deleted successfully!`);
        
        // Remove from local state
        setEmails(emails.filter(e => e.id !== id));
        setDeleteConfirm(null);
        
        // Optionally refresh from backend to ensure sync
        setTimeout(() => fetchEmails(), 500);
      } catch (error) {
        console.error('Delete error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete email. Please try again.';
        toast.error(errorMessage);
        setDeleteConfirm(null);
      }
    } else {
      setDeleteConfirm(id);
      toast.warning(`Click delete again to confirm deletion of "${email}"`);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Email', 'Subscribed Date', 'Status'],
      ...emails.map(e => [
        e.email,
        new Date(e.subscribedAt).toLocaleString(),
        e.status
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriber-emails-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Emails exported to CSV!');
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
      minute: '2-digit'
    });
  };

  const getFilteredEmails = () => {
    console.log('🔍 Filtering emails. Active filter:', activeFilter);
    console.log('📊 Total emails:', emails.length);
    
    if (activeFilter === 'active') {
      const filtered = emails.filter(e => e.status === 'active');
      console.log('✅ Active filter - showing', filtered.length, 'emails');
      return filtered;
    } else if (activeFilter === 'month') {
      const filtered = emails.filter(e => {
        const date = new Date(e.subscribedAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
      });
      console.log('📅 Month filter - showing', filtered.length, 'emails');
      return filtered;
    }
    console.log('🌐 All filter - showing', emails.length, 'emails');
    return emails;
  };

  const filteredEmails = getFilteredEmails();

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Emails</h1>
            <p className="text-gray-600 mt-1">
              Manage newsletter subscriber emails ({emails.length} total)
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
              disabled={emails.length === 0}
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
            onClick={() => {
              console.log('🔘 Total Subscribers button clicked');
              setActiveFilter('all');
              toast.info('Showing all subscribers');
            }}
            className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-6 transition-all cursor-pointer ${
              activeFilter === 'all' ? 'ring-4 ring-blue-300 scale-105' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-blue-100 text-sm font-medium mb-1">Total Subscribers</p>
                <p className="text-3xl font-bold">{emails.length}</p>
              </div>
              <Mail className="w-12 h-12 text-blue-200" />
            </div>
          </button>

          <button
            onClick={() => {
              console.log('🔘 Active Subscribers button clicked');
              setActiveFilter('active');
              toast.info('Showing active subscribers');
            }}
            className={`bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg p-6 transition-all cursor-pointer ${
              activeFilter === 'active' ? 'ring-4 ring-green-300 scale-105' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-green-100 text-sm font-medium mb-1">Active Subscribers</p>
                <p className="text-3xl font-bold">
                  {emails.filter(e => e.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </button>

          <button
            onClick={() => {
              console.log('🔘 This Month button clicked');
              setActiveFilter('month');
              toast.info('Showing this month\'s subscribers');
            }}
            className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg p-6 transition-all cursor-pointer ${
              activeFilter === 'month' ? 'ring-4 ring-purple-300 scale-105' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-purple-100 text-sm font-medium mb-1">This Month</p>
                <p className="text-3xl font-bold">
                  {emails.filter(e => {
                    const date = new Date(e.subscribedAt);
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

        {/* Emails Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Loading subscriber emails...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Subscribed Date
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
                  {filteredEmails.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{subscriber.email}</div>
                            <div className="text-sm text-gray-500">ID: {subscriber.id.substring(0, 20)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {formatDate(subscriber.subscribedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {subscriber.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            console.log('🗑️ Delete button clicked for:', subscriber.email);
                            handleDelete(subscriber.id, subscriber.email);
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ml-auto ${
                            deleteConfirm === subscriber.id 
                              ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg animate-pulse' 
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                          title={deleteConfirm === subscriber.id ? 'Click again to confirm deletion' : 'Delete Email'}
                        >
                          <Trash2 className="w-4 h-4" />
                          {deleteConfirm === subscriber.id ? 'Confirm Delete?' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredEmails.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">
                    {emails.length === 0 ? 'No subscriber emails yet' : 'No emails match this filter'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {emails.length === 0 
                      ? 'Customer emails will appear here when they subscribe via the website footer'
                      : 'Try selecting a different filter to view other subscribers'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default CustomerEmailsPage;