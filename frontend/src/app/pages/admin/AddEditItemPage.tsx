import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Image as ImageIcon, X, Plus, Trash2, GripVertical, Languages, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { useProducts } from '@/app/context/ProductContext';
import { useAuth } from '@/app/context/AuthContext';
import { canAccessRoleAction } from '@/app/utils/roleAccess';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

interface Language {
  id: string;
  label: string;
  type: 'source' | 'target';
}

interface DocumentType {
  id: string;
  label: string;
}

interface ProductConfig {
  showSourceLanguage: boolean;
  showTargetLanguage: boolean;
  showDocumentType: boolean;
  enabledSourceLanguages: string[];
  enabledTargetLanguages: string[];
  enabledDocumentTypes: string[];
}

export function AddEditItemPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { addProduct, updateProduct, getProduct, categories, uploadImages } = useProducts();
  const canEditItems = canAccessRoleAction(user?.role, 'items', 'edit');
  const canUpdateItems = canAccessRoleAction(user?.role, 'items', 'update');

  // Debug: Log categories to console
  useEffect(() => {
    console.log('ðŸ“‹ Categories loaded in AddEditItemPage:', categories);
  }, [categories]);

  useEffect(() => {
    if (isEdit && !canEditItems) {
      toast.error('Edit access denied');
      navigate('/admin/items', { replace: true });
    }
  }, [isEdit, canEditItems, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Translation',
    description: '',
    price: '',
    compareAtPrice: '',
    sku: '',
    barcode: '',
    stock: '',
    weight: '',
    status: 'active' as 'active' | 'draft' | 'archived',
    metaTitle: '',
    metaDescription: ''
  });

  const [pendingImages, setPendingImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Product Configuration State
  const [allSourceLanguages, setAllSourceLanguages] = useState<Language[]>([]);
  const [allTargetLanguages, setAllTargetLanguages] = useState<Language[]>([]);
  const [allDocumentTypes, setAllDocumentTypes] = useState<DocumentType[]>([]);
  
  const [productConfig, setProductConfig] = useState<ProductConfig>({
    showSourceLanguage: false,
    showTargetLanguage: false,
    showDocumentType: false,
    enabledSourceLanguages: [],
    enabledTargetLanguages: [],
    enabledDocumentTypes: [],
  });

  // New language/document type input states
  const [newSourceLang, setNewSourceLang] = useState({ id: '', label: '' });
  const [newTargetLang, setNewTargetLang] = useState({ id: '', label: '' });
  const [newDocType, setNewDocType] = useState({ id: '', label: '' });

  // Fetch all languages and document types on component mount
  useEffect(() => {
    fetchAllLanguages();
    fetchAllDocumentTypes();
  }, []);

  // Load product data if editing
  useEffect(() => {
    if (isEdit && id) {
      const product = getProduct(id);
      if (product) {
        setFormData({
          name: product.name,
          category: product.category,
          description: product.description || '',
          price: product.price.toString(),
          compareAtPrice: product.compareAtPrice?.toString() || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          stock: product.stock.toString(),
          weight: product.weight || '',
          status: product.status,
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || ''
        });
        setImagePreviews(product.images);
        setPendingImages([]);
      }
    }
  }, [id, isEdit, getProduct]);

  const fetchAllLanguages = async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin/languages`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAllSourceLanguages(data.sourceLanguages || []);
        setAllTargetLanguages(data.targetLanguages || []);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      // Don't show error to user, just log it
    }
  };

  const fetchAllDocumentTypes = async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin/document-types`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAllDocumentTypes(data.documentTypes || []);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
      // Don't show error to user, just log it
    }
  };

  // Load product configuration if editing
  useEffect(() => {
    if (isEdit && id) {
      fetchProductConfig(id);
    }
  }, [isEdit, id]);

  const fetchProductConfig = async (productId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/product-config/${productId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setProductConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error fetching product config:', error);
      // Don't show error to user, configuration is optional
    }
  };

  const saveProductConfig = async (productId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/admin/product-config/${productId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productConfig),
        }
      );

      if (response.ok) {
        console.log('âœ… Product configuration saved');
      }
    } catch (error) {
      console.error('Error saving product config:', error);
    }
  };

  const addSourceLanguage = async () => {
    if (!newSourceLang.id || !newSourceLang.label) {
      toast.error('Please fill in both ID and Label');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/languages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...newSourceLang, type: 'source' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', errorData);
        toast.error(errorData.error || `Failed to add language: ${response.statusText}`);
        return;
      }

      await fetchAllLanguages();
      setNewSourceLang({ id: '', label: '' });
      toast.success('Source language added!');
    } catch (error) {
      console.error('Error adding source language:', error);
      toast.error(`Failed to add source language: ${error.message || 'Network error'}`);
    }
  };

  const addTargetLanguage = async () => {
    if (!newTargetLang.id || !newTargetLang.label) {
      toast.error('Please fill in both ID and Label');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/languages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...newTargetLang, type: 'target' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', errorData);
        toast.error(errorData.error || `Failed to add language: ${response.statusText}`);
        return;
      }

      await fetchAllLanguages();
      setNewTargetLang({ id: '', label: '' });
      toast.success('Target language added!');
    } catch (error) {
      console.error('Error adding target language:', error);
      toast.error(`Failed to add target language: ${error.message || 'Network error'}`);
    }
  };

  const addDocumentType = async () => {
    if (!newDocType.id || !newDocType.label) {
      toast.error('Please fill in both ID and Label');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/document-types`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newDocType),
        }
      );

      if (response.ok) {
        await fetchAllDocumentTypes();
        setNewDocType({ id: '', label: '' });
        toast.success('Document type added!');
      }
    } catch (error) {
      console.error('Error adding document type:', error);
      toast.error('Failed to add document type');
    }
  };

  const deleteLanguage = async (langId: string, type: string) => {
    if (!confirm(`Delete this ${type} language?`)) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/languages/${langId}/${type}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success('Language deleted successfully');
        await fetchAllLanguages();
      }
    } catch (error) {
      console.error('Error deleting language:', error);
      toast.error('Failed to delete language');
    }
  };

  const deleteDocumentType = async (docTypeId: string) => {
    if (!confirm('Delete this document type?')) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/document-types/${docTypeId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success('Document type deleted successfully');
        await fetchAllDocumentTypes();
      }
    } catch (error) {
      console.error('Error deleting document type:', error);
      toast.error('Failed to delete document type');
    }
  };

  const toggleLanguageEnabled = (langId: string, type: 'source' | 'target') => {
    if (type === 'source') {
      const isEnabled = productConfig.enabledSourceLanguages.includes(langId);
      setProductConfig({
        ...productConfig,
        enabledSourceLanguages: isEnabled
          ? productConfig.enabledSourceLanguages.filter(id => id !== langId)
          : [...productConfig.enabledSourceLanguages, langId]
      });
    } else {
      const isEnabled = productConfig.enabledTargetLanguages.includes(langId);
      setProductConfig({
        ...productConfig,
        enabledTargetLanguages: isEnabled
          ? productConfig.enabledTargetLanguages.filter(id => id !== langId)
          : [...productConfig.enabledTargetLanguages, langId]
      });
    }
  };

  const toggleDocTypeEnabled = (docTypeId: string) => {
    const isEnabled = productConfig.enabledDocumentTypes.includes(docTypeId);
    setProductConfig({
      ...productConfig,
      enabledDocumentTypes: isEnabled
        ? productConfig.enabledDocumentTypes.filter(id => id !== docTypeId)
        : [...productConfig.enabledDocumentTypes, docTypeId]
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 10 - imagePreviews.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length > 0) {
      const nextUploads = filesToAdd.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setPendingImages((prev) => [...prev, ...nextUploads]);
      setImagePreviews((prev) => [...prev, ...nextUploads.map((item) => item.previewUrl)]);
      
      toast.success(`${filesToAdd.length} image(s) uploaded successfully!`);
    } else {
      toast.warning('Maximum 10 images allowed');
    }
  };

  const removeImage = (index: number) => {
    const previewUrl = imagePreviews[index];
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
      setPendingImages((prev) => prev.filter((item) => item.previewUrl !== previewUrl));
    }

    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    toast.info('Image removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && !canUpdateItems) {
      toast.error('Update access denied');
      return;
    }

    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || formData.name.trim() === '') {
        toast.error('Product name is required');
        setLoading(false);
        return;
      }

      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error('Valid price is required');
        setLoading(false);
        return;
      }

      if (!formData.stock || parseInt(formData.stock) < 0) {
        toast.error('Valid stock quantity is required');
        setLoading(false);
        return;
      }

      // Upload images to Backend Storage BEFORE saving product
      console.log('ðŸ“¤ Uploading images to Backend Storage...');
      toast.info('Uploading images...');
      
      const existingImageUrls = imagePreviews.filter((preview) => /^https?:\/\//i.test(preview));
      const uploadedImageUrls = await uploadImages(pendingImages.map((item) => item.file));
      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];
      
      console.log('âœ… Images uploaded successfully:', finalImageUrls);
      toast.success(`${finalImageUrls.length} image(s) ready!`);

      const productData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        sku: formData.sku,
        barcode: formData.barcode,
        stock: parseInt(formData.stock),
        weight: formData.weight,
        status: formData.status,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        images: finalImageUrls // Use Backend Storage URLs instead of local previews
      };

      console.log('ðŸ’¾ Saving product with Backend Storage URLs:', {
        isEdit,
        productName: productData.name,
        imageCount: productData.images.length,
        dataSize: new Blob([JSON.stringify(productData)]).size + ' bytes'
      });

      if (isEdit && id) {
        await updateProduct(id, productData);
        toast.success('Product updated successfully!');
      } else {
        await addProduct(productData);
        toast.success('Product created successfully!');
      }
      
      // Wait a moment for the toast to show
      await new Promise(resolve => setTimeout(resolve, 500));
      pendingImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      
      // Navigate back to items page
      navigate('/admin/items');
    } catch (error) {
      console.error('Error saving product:', error);
      
      // More specific error messages
      if (error instanceof Error) {
        toast.error(`Failed to save product: ${error.message}`);
      } else {
        toast.error('Failed to save product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/items')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Items"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Item' : 'Add New Item'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Update product information' : 'Create a new product listing'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product description"
                  />
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Product Images ({imagePreviews.length}/10)
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium">
                        Main
                      </span>
                    )}
                  </div>
                ))}
                
                {imagePreviews.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-500">Upload</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <p className="text-sm text-gray-500">
                Upload up to 10 images. First image will be the main product image.
              </p>
            </div>

            {/* Product Variations - Source Language, Target Language, Document Types */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5 text-purple-600" />
                Product Variations
              </h2>
              
              <div className="space-y-6">
                {/* Source Language Section */}
                <div className="border-b pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Source Language</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productConfig.showSourceLanguage}
                        onChange={(e) => setProductConfig({ ...productConfig, showSourceLanguage: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Show on product page</span>
                    </label>
                  </div>

                  {/* Add New Source Language */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="ID (e.g., spanish)"
                      value={newSourceLang.id}
                      onChange={(e) => setNewSourceLang({ ...newSourceLang, id: e.target.value.toLowerCase() })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Label (e.g., Spanish)"
                      value={newSourceLang.label}
                      onChange={(e) => setNewSourceLang({ ...newSourceLang, label: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addSourceLanguage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  {/* Source Language List */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {allSourceLanguages.map(lang => (
                      <div
                        key={lang.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          productConfig.enabledSourceLanguages.includes(lang.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productConfig.enabledSourceLanguages.includes(lang.id)}
                            onChange={() => toggleLanguageEnabled(lang.id, 'source')}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{lang.label}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteLanguage(lang.id, 'source')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {allSourceLanguages.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No source languages added yet</p>
                  )}
                </div>

                {/* Target Language Section */}
                <div className="border-b pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Target Language</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productConfig.showTargetLanguage}
                        onChange={(e) => setProductConfig({ ...productConfig, showTargetLanguage: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Show on product page</span>
                    </label>
                  </div>

                  {/* Add New Target Language */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="ID (e.g., french)"
                      value={newTargetLang.id}
                      onChange={(e) => setNewTargetLang({ ...newTargetLang, id: e.target.value.toLowerCase() })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Label (e.g., French)"
                      value={newTargetLang.label}
                      onChange={(e) => setNewTargetLang({ ...newTargetLang, label: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addTargetLanguage}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  {/* Target Language List */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {allTargetLanguages.map(lang => (
                      <div
                        key={lang.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          productConfig.enabledTargetLanguages.includes(lang.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productConfig.enabledTargetLanguages.includes(lang.id)}
                            onChange={() => toggleLanguageEnabled(lang.id, 'target')}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">{lang.label}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteLanguage(lang.id, 'target')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {allTargetLanguages.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No target languages added yet</p>
                  )}
                </div>

                {/* Document Type Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Document Types
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productConfig.showDocumentType}
                        onChange={(e) => setProductConfig({ ...productConfig, showDocumentType: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Show on product page</span>
                    </label>
                  </div>

                  {/* Add New Document Type */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="ID (e.g., birth-certificate)"
                      value={newDocType.id}
                      onChange={(e) => setNewDocType({ ...newDocType, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Label (e.g., Birth Certificate)"
                      value={newDocType.label}
                      onChange={(e) => setNewDocType({ ...newDocType, label: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addDocumentType}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  {/* Document Type List */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {allDocumentTypes.map(docType => (
                      <div
                        key={docType.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          productConfig.enabledDocumentTypes.includes(docType.id)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productConfig.enabledDocumentTypes.includes(docType.id)}
                            onChange={() => toggleDocTypeEnabled(docType.id)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{docType.label}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteDocumentType(docType.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {allDocumentTypes.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No document types added yet</p>
                  )}
                </div>
              </div>

              {/* Save Configuration Button */}
              {isEdit && id && (
                <div className="mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => saveProductConfig(id)}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Product Configuration
                  </button>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compare at Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.compareAtPrice}
                      onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  {formData.compareAtPrice && formData.price && (
                    parseFloat(formData.compareAtPrice) > parseFloat(formData.price) ? (
                      <p className="mt-1 text-xs text-green-600">
                        Customers will see {Math.round(((parseFloat(formData.compareAtPrice) - parseFloat(formData.price)) / parseFloat(formData.compareAtPrice)) * 100)}% OFF with the old price struck through.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-amber-600">
                        Compare at Price must be higher than Price, or it won't be shown to customers.
                      </p>
                    )
                  )}
                  {!formData.compareAtPrice && (
                    <p className="mt-1 text-xs text-gray-400">
                      Leave blank to show only the current price with no strikethrough.
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SKU"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Barcode"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Engine Optimization</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Meta title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Meta description"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'draft' | 'archived' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Organization</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Translation">Translation</option>
                        <option value="Attestation">Attestation</option>
                        <option value="Apostille">Apostille</option>
                        <option value="Startup Packages">Startup Packages</option>
                      </>
                    )}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                        Using default categories. Categories will load shortly.
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <button
                type="submit"
                disabled={loading || (isEdit && !canUpdateItems)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isEdit ? 'Update Item' : 'Create Item'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export default AddEditItemPage;

