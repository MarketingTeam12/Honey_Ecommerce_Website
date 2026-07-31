import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { buildHeaders } from '@/app/utils/buildHeaders';
import { useAuth } from '@/app/context/AuthContext';
import { BackendStatusBanner } from '@/app/components/BackendStatusBanner';
import { canAccessRoleAction } from '@/app/utils/roleAccess';
import { API_URL } from '@/app/utils/api';

interface WorkSample {
  id: string;
  title: string;
  category: string;
  description: string;
  fileUrl: string;
  fileName: string;
  order: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  'Indian Languages',
  'Foreign Languages',
  'Legal Documents',
  'Academic Documents',
  'Business Documents',
  'Medical Documents'
] as const;

export function WorkSamplesPage() {
  const { accessToken, user } = useAuth();
  const [samples, setSamples] = useState<WorkSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSample, setEditingSample] = useState<WorkSample | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const canEditSamples = canAccessRoleAction(user?.role, 'work_samples', 'edit');
  const canDeleteSamples = canAccessRoleAction(user?.role, 'work_samples', 'delete');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'Indian Languages',
    description: '',
    fileUrl: '',
    fileName: '',
    order: 0,
    status: 'active'
  });

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      console.log('📋 [WorkSamples] Fetching work samples...');
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `${API_URL}/work-samples`,
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

      console.log('📋 [WorkSamples] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if it's a backend deployment issue
        const isBackendIssue = errorText.includes('Invalid JWT') || 
                               errorText.includes('"code":401') ||
                               errorText.includes('Missing authorization header') ||
                               response.status === 401 ||
                               response.status === 404;
        
        if (isBackendIssue) {
          console.log('ℹ Backend not deployed - showing demo work samples');
          setBackendAvailable(false);
          
          // Load demo data for better UX
          const demoSamples: WorkSample[] = [
            {
              id: 'demo-netherlands-apostille-sample',
              title: 'Netherlands Apostille Sample Documents',
              category: 'Legal Documents',
              description: 'Sample reference documents for Netherlands Apostille service',
              fileUrl: '#',
              fileName: 'netherlands_apostille_sample.pdf',
              order: 0,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'demo-1',
              title: 'Certified Translation - Hindi to English (Birth Certificate)',
              category: 'Indian Languages',
              description: 'Sample of certified translation from Hindi to English for a birth certificate',
              fileUrl: '#',
              fileName: 'birth_certificate_sample.pdf',
              order: 1,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'demo-2',
              title: 'Business Contract - English to Spanish',
              category: 'European Languages',
              description: 'Professional business contract translation showcasing legal terminology expertise',
              fileUrl: '#',
              fileName: 'contract_sample.pdf',
              order: 2,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'demo-3',
              title: 'Medical Report - French to English',
              category: 'European Languages',
              description: 'Technical medical report translation with specialized medical terminology',
              fileUrl: '#',
              fileName: 'medical_report_sample.pdf',
              order: 3,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          
          setSamples(demoSamples);
          return;
        }
        
        throw new Error('Failed to fetch samples');
      }

      const data = await response.json();
      console.log('📋 [WorkSamples] Fetched', data.samples?.length || 0, 'samples');
      setSamples(data.samples || []);
      setBackendAvailable(true);
    } catch (error) {
      console.error('Error fetching samples:', error);
      
      // Check if it's a timeout/network error
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
        console.log('ℹ [WorkSamples] Request timed out or network error - showing demo samples');
        setBackendAvailable(false);
        
        // Load demo data for better UX
        const demoSamples: WorkSample[] = [
          {
            id: 'demo-netherlands-apostille-sample',
            title: 'Netherlands Apostille Sample Documents',
            category: 'Legal Documents',
            description: 'Sample reference documents for Netherlands Apostille service',
            fileUrl: '#',
            fileName: 'netherlands_apostille_sample.pdf',
            order: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'demo-1',
            title: 'Certified Translation - Hindi to English (Birth Certificate)',
            category: 'Indian Languages',
            description: 'Sample of certified translation from Hindi to English for a birth certificate',
            fileUrl: '#',
            fileName: 'birth_certificate_sample.pdf',
            order: 1,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'demo-2',
            title: 'Business Contract - English to Spanish',
            category: 'European Languages',
            description: 'Professional business contract translation showcasing legal terminology expertise',
            fileUrl: '#',
            fileName: 'contract_sample.pdf',
            order: 2,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'demo-3',
            title: 'Medical Report - French to English',
            category: 'European Languages',
            description: 'Technical medical report translation with specialized medical terminology',
            fileUrl: '#',
            fileName: 'medical_report_sample.pdf',
            order: 3,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        setSamples(demoSamples);
      } else {
        setBackendAvailable(false);
        setSamples([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      alert('Please upload a PDF or DOC file');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    try {
      setUploading(true);
      console.log('📤 Uploading file:', file.name);

      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('folder', 'work-samples');

      const headers = buildHeaders(accessToken);
      // Remove Content-Type for FormData - browser will set it with boundary
      delete headers['Content-Type'];

      const response = await fetch(
        `${API_URL}/api/s3/upload`,
        {
          method: 'POST',
          headers,
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('✅ Upload successful:', data);

      setFormData(prev => ({
        ...prev,
        fileUrl: data.url,
        fileName: file.name
      }));

      alert('File uploaded successfully!');
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!formData.fileUrl) {
      alert('Please upload a file');
      return;
    }

    try {
      const endpoint = editingSample
        ? `${API_URL}/admin/work-samples/${editingSample.id}`
        : `${API_URL}/admin/work-samples`;

      const response = await fetch(endpoint, {
        method: editingSample ? 'PUT' : 'POST',
        headers: buildHeaders(accessToken),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save sample');
      }

      alert(editingSample ? 'Sample updated successfully!' : 'Sample created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        category: 'Indian Languages',
        description: '',
        fileUrl: '',
        fileName: '',
        order: 0,
        status: 'active'
      });
      setEditingSample(null);
      setShowAddForm(false);
      
      // Refresh list
      fetchSamples();
    } catch (error) {
      console.error('Error saving sample:', error);
      alert(error instanceof Error ? error.message : 'Failed to save sample');
    }
  };

  const handleEdit = (sample: WorkSample) => {
    setEditingSample(sample);
    setFormData({
      title: sample.title,
      category: sample.category,
      description: sample.description || '',
      fileUrl: sample.fileUrl,
      fileName: sample.fileName,
      order: sample.order,
      status: sample.status
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sample?')) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/work-samples/${id}`,
        {
          method: 'DELETE',
          headers: buildHeaders(accessToken),
        }
      );

      if (!response.ok) throw new Error('Failed to delete sample');

      alert('Sample deleted successfully!');
      fetchSamples();
    } catch (error) {
      console.error('Error deleting sample:', error);
      alert('Failed to delete sample');
    }
  };

  const cancelEdit = () => {
    setEditingSample(null);
    setShowAddForm(false);
    setFormData({
      title: '',
      category: 'Indian Languages',
      description: '',
      fileUrl: '',
      fileName: '',
      order: 0,
      status: 'active'
    });
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Work Samples</h1>
              <p className="text-sm text-gray-600">Manage downloadable work sample documents</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/work-samples/initialize">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Restore Samples
              </Button>
            </Link>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Sample
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Backend Status Banner */}
        <BackendStatusBanner />

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editingSample ? 'Edit Work Sample' : 'Add New Work Sample'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Certified Translation from Hindi to English"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this sample..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File (PDF, DOC, DOCX) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Choose File'}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {formData.fileName && (
                    <span className="text-sm text-gray-600">
                      ✓ {formData.fileName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Max file size: 50MB</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={uploading || !formData.fileUrl}
                >
                  {editingSample ? 'Update Sample' : 'Create Sample'}
                </Button>
                <Button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Samples List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Work Samples ({samples.length})</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading samples...</p>
            </div>
          ) : samples.length === 0 ? (
            <div className="p-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto text-center">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Work Samples Found</h3>
                <p className="text-yellow-800 mb-4">
                  No work samples are currently available. You can:
                </p>
                <ul className="text-left text-yellow-800 space-y-2 mb-4 inline-block">
                  <li key="step-1" className="flex items-start gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Click "Add Sample" above to manually create a work sample</span>
                  </li>
                  <li key="step-2" className="flex items-start gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Click "Restore Samples" to initialize demo work samples</span>
                  </li>
                </ul>
                <p className="text-sm text-yellow-700 mt-4">
                  <strong>Note:</strong> If you're seeing this message and expect samples to exist, 
                  the backend may not be available. Check the browser console for more details.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {samples.map((sample) => (
                <div key={sample.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{sample.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sample.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {sample.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Category:</strong> {sample.category}</p>
                        {sample.description && <p><strong>Description:</strong> {sample.description}</p>}
                        <p><strong>File:</strong> {sample.fileName}</p>
                        <p><strong>Order:</strong> {sample.order}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={sample.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {canEditSamples ? (
                        <button
                          onClick={() => handleEdit(sample)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="p-2 text-gray-300 rounded-lg cursor-not-allowed"
                          title="Edit access denied"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteSamples ? (
                        <button
                          onClick={() => handleDelete(sample.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="p-2 text-gray-300 rounded-lg cursor-not-allowed"
                          title="Delete access denied"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default WorkSamplesPage;

