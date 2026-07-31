import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Languages as LanguagesIcon, FileText, Package } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';
import { AdminLayout } from '@/app/components/admin/AdminLayout';

interface Language {
  id: string;
  label: string;
  type: 'source' | 'target';
}

interface DocumentType {
  id: string;
  label: string;
  category?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
}

interface ProductConfig {
  productId: string;
  showSourceLanguage: boolean;
  showTargetLanguage: boolean;
  showDocumentType: boolean;
  enabledSourceLanguages: string[];
  enabledTargetLanguages: string[];
  enabledDocumentTypes: string[];
}

export function ProductFieldsConfigPage() {
  const [sourceLanguages, setSourceLanguages] = useState<Language[]>([]);
  const [targetLanguages, setTargetLanguages] = useState<Language[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [newLanguage, setNewLanguage] = useState({ id: '', label: '', type: 'source' as 'source' | 'target' });
  const [newDocType, setNewDocType] = useState({ id: '', label: '', category: '' });
  
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productConfig, setProductConfig] = useState<ProductConfig | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('languages');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductConfig(selectedProduct);
    }
  }, [selectedProduct]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchLanguages(),
      fetchDocumentTypes(),
      fetchProducts(),
    ]);
  };

  const fetchLanguages = async () => {
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
        setSourceLanguages(data.sourceLanguages || []);
        setTargetLanguages(data.targetLanguages || []);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchDocumentTypes = async () => {
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
        setDocumentTypes(data.documentTypes || []);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `${API_URL}/products`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

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
        setProductConfig(data.config);
      }
    } catch (error) {
      console.error('Error fetching product config:', error);
    }
  };

  const addLanguage = async () => {
    if (!newLanguage.id || !newLanguage.label) {
      alert('Please fill in both ID and Label');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/languages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newLanguage),
        }
      );

      if (response.ok) {
        await fetchLanguages();
        setNewLanguage({ id: '', label: '', type: 'source' });
        alert('Language added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding language:', error);
      alert('Failed to add language');
    } finally {
      setLoading(false);
    }
  };

  const deleteLanguage = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type} language?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/languages/${id}/${type}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        await fetchLanguages();
        alert('Language deleted successfully!');
      } else {
        alert('Failed to delete language');
      }
    } catch (error) {
      console.error('Error deleting language:', error);
      alert('Failed to delete language');
    } finally {
      setLoading(false);
    }
  };

  const addDocumentType = async () => {
    if (!newDocType.id || !newDocType.label) {
      alert('Please fill in ID and Label');
      return;
    }

    setLoading(true);
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
        await fetchDocumentTypes();
        setNewDocType({ id: '', label: '', category: '' });
        alert('Document type added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding document type:', error);
      alert('Failed to add document type');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocumentType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document type?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/document-types/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        await fetchDocumentTypes();
        alert('Document type deleted successfully!');
      } else {
        alert('Failed to delete document type');
      }
    } catch (error) {
      console.error('Error deleting document type:', error);
      alert('Failed to delete document type');
    } finally {
      setLoading(false);
    }
  };

  const saveProductConfig = async () => {
    if (!selectedProduct || !productConfig) {
      alert('Please select a product first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/product-config/${selectedProduct}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productConfig),
        }
      );

      if (response.ok) {
        alert('Product configuration saved successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving product config:', error);
      alert('Failed to save product configuration');
    } finally {
      setLoading(false);
    }
  };

  const toggleSourceLanguage = (langId: string) => {
    if (!productConfig) return;
    
    const isEnabled = productConfig.enabledSourceLanguages.includes(langId);
    setProductConfig({
      ...productConfig,
      enabledSourceLanguages: isEnabled
        ? productConfig.enabledSourceLanguages.filter(id => id !== langId)
        : [...productConfig.enabledSourceLanguages, langId]
    });
  };

  const toggleTargetLanguage = (langId: string) => {
    if (!productConfig) return;
    
    const isEnabled = productConfig.enabledTargetLanguages.includes(langId);
    setProductConfig({
      ...productConfig,
      enabledTargetLanguages: isEnabled
        ? productConfig.enabledTargetLanguages.filter(id => id !== langId)
        : [...productConfig.enabledTargetLanguages, langId]
    });
  };

  const toggleDocumentType = (docTypeId: string) => {
    if (!productConfig) return;
    
    const isEnabled = productConfig.enabledDocumentTypes.includes(docTypeId);
    setProductConfig({
      ...productConfig,
      enabledDocumentTypes: isEnabled
        ? productConfig.enabledDocumentTypes.filter(id => id !== docTypeId)
        : [...productConfig.enabledDocumentTypes, docTypeId]
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Product Fields Configuration</h1>
          <p className="text-gray-600 mt-2">
            Manage languages, document types, and configure which fields appear on each product page
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="document-types">Document Types</TabsTrigger>
            <TabsTrigger value="product-config">Product Configuration</TabsTrigger>
          </TabsList>

          {/* Languages Tab */}
          <TabsContent value="languages" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Language Form */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <LanguagesIcon className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold">Add Language</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="lang-type">Language Type</Label>
                    <Select value={newLanguage.type} onValueChange={(value: 'source' | 'target') => setNewLanguage({ ...newLanguage, type: value })}>
                      <SelectTrigger id="lang-type" className="w-full mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="source">Source Language</SelectItem>
                        <SelectItem value="target">Target Language</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="lang-id">ID (Lowercase)</Label>
                    <Input
                      id="lang-id"
                      placeholder="e.g., spanish, french, german"
                      value={newLanguage.id}
                      onChange={(e) => setNewLanguage({ ...newLanguage, id: e.target.value.toLowerCase() })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lang-label">Display Label</Label>
                    <Input
                      id="lang-label"
                      placeholder="e.g., Spanish, French, German"
                      value={newLanguage.label}
                      onChange={(e) => setNewLanguage({ ...newLanguage, label: e.target.value })}
                    />
                  </div>
                  
                  <Button onClick={addLanguage} disabled={loading} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Language
                  </Button>
                </div>
              </div>

              {/* Languages List */}
              <div className="space-y-4">
                {/* Source Languages */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Badge className="bg-blue-600">Source</Badge>
                    Source Languages ({sourceLanguages.length})
                  </h3>
                  
                  {sourceLanguages.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No source languages added yet</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {sourceLanguages.map((lang) => (
                        <div
                          key={lang.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <p className="font-medium">{lang.label}</p>
                            <p className="text-sm text-gray-500">ID: {lang.id}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteLanguage(lang.id, 'source')}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Target Languages */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Badge className="bg-green-600">Target</Badge>
                    Target Languages ({targetLanguages.length})
                  </h3>
                  
                  {targetLanguages.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No target languages added yet</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {targetLanguages.map((lang) => (
                        <div
                          key={lang.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <p className="font-medium">{lang.label}</p>
                            <p className="text-sm text-gray-500">ID: {lang.id}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteLanguage(lang.id, 'target')}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Document Types Tab */}
          <TabsContent value="document-types" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Document Type Form */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-bold">Add Document Type</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="doc-id">ID (Lowercase, hyphenated)</Label>
                    <Input
                      id="doc-id"
                      placeholder="e.g., birth-certificate"
                      value={newDocType.id}
                      onChange={(e) => setNewDocType({ ...newDocType, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="doc-label">Display Label</Label>
                    <Input
                      id="doc-label"
                      placeholder="e.g., Birth Certificate"
                      value={newDocType.label}
                      onChange={(e) => setNewDocType({ ...newDocType, label: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="doc-category">Category (Optional)</Label>
                    <Input
                      id="doc-category"
                      placeholder="e.g., personal, business"
                      value={newDocType.category}
                      onChange={(e) => setNewDocType({ ...newDocType, category: e.target.value })}
                    />
                  </div>
                  
                  <Button onClick={addDocumentType} disabled={loading} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Document Type
                  </Button>
                </div>
              </div>

              {/* Document Types List */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-bold mb-4">Document Types ({documentTypes.length})</h3>
                
                {documentTypes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No document types added yet</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {documentTypes.map((docType) => (
                      <div
                        key={docType.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{docType.label}</p>
                          <p className="text-sm text-gray-500">
                            ID: {docType.id}
                            {docType.category && ` • Category: ${docType.category}`}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteDocumentType(docType.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Product Configuration Tab */}
          <TabsContent value="product-config" className="mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-bold">Configure Product Fields</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Select which languages and document types should appear on each product page
              </p>

              {/* Product Selector */}
              <div className="mb-6">
                <Label htmlFor="product-select">Select Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger id="product-select" className="w-full mt-1">
                    <SelectValue placeholder="Choose a product to configure" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {productConfig && selectedProduct && (
                <div className="space-y-6">
                  {/* Show/Hide Toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-source"
                        checked={productConfig.showSourceLanguage}
                        onCheckedChange={(checked) => setProductConfig({ ...productConfig, showSourceLanguage: !!checked })}
                      />
                      <label htmlFor="show-source" className="font-medium cursor-pointer">
                        Show Source Language
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-target"
                        checked={productConfig.showTargetLanguage}
                        onCheckedChange={(checked) => setProductConfig({ ...productConfig, showTargetLanguage: !!checked })}
                      />
                      <label htmlFor="show-target" className="font-medium cursor-pointer">
                        Show Target Language
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-doctype"
                        checked={productConfig.showDocumentType}
                        onCheckedChange={(checked) => setProductConfig({ ...productConfig, showDocumentType: !!checked })}
                      />
                      <label htmlFor="show-doctype" className="font-medium cursor-pointer">
                        Show Document Types
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Source Languages Selection */}
                    {productConfig.showSourceLanguage && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                          <Badge className="bg-blue-600">Source</Badge>
                          Enabled Source Languages
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {sourceLanguages.map((lang) => (
                            <div key={lang.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`source-${lang.id}`}
                                checked={productConfig.enabledSourceLanguages.includes(lang.id)}
                                onCheckedChange={() => toggleSourceLanguage(lang.id)}
                              />
                              <label htmlFor={`source-${lang.id}`} className="cursor-pointer">
                                {lang.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Target Languages Selection */}
                    {productConfig.showTargetLanguage && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                          <Badge className="bg-green-600">Target</Badge>
                          Enabled Target Languages
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {targetLanguages.map((lang) => (
                            <div key={lang.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`target-${lang.id}`}
                                checked={productConfig.enabledTargetLanguages.includes(lang.id)}
                                onCheckedChange={() => toggleTargetLanguage(lang.id)}
                              />
                              <label htmlFor={`target-${lang.id}`} className="cursor-pointer">
                                {lang.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Document Types Selection */}
                    {productConfig.showDocumentType && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                          <Badge className="bg-purple-600">Documents</Badge>
                          Enabled Document Types
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {documentTypes.map((docType) => (
                            <div key={docType.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`doc-${docType.id}`}
                                checked={productConfig.enabledDocumentTypes.includes(docType.id)}
                                onCheckedChange={() => toggleDocumentType(docType.id)}
                              />
                              <label htmlFor={`doc-${docType.id}`} className="cursor-pointer">
                                {docType.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={saveProductConfig} disabled={loading} size="lg" className="bg-green-600 hover:bg-green-700">
                      <Package className="w-5 h-5 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </div>
              )}

              {!selectedProduct && (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Please select a product to configure its fields</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

export default ProductFieldsConfigPage;