import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye, RefreshCw, X, DollarSign, Package, Tag, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { useAuth } from '@/app/context/AuthContext';
import { useProducts } from '@/app/context/ProductContext';
import { canAccessRoleAction } from '@/app/utils/roleAccess';

export function ItemsPage() {
  const { user } = useAuth();
  const { products, deleteProduct, isLoading, refreshProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showServerNotice, setShowServerNotice] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  // Additional filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterStockMin, setFilterStockMin] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const canEditItems = canAccessRoleAction(user?.role, 'items', 'edit');
  const canDeleteItems = canAccessRoleAction(user?.role, 'items', 'delete');

  const safeText = (value: unknown, fallback = '') => String(value ?? fallback).trim();
  const safeNumber = (value: unknown, fallback = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value.replace(/,/g, '').trim());
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const formatPrice = (value: unknown) => `$${safeNumber(value).toFixed(2)}`;

  // Show server notice if no products after loading
  useEffect(() => {
    if (!isLoading && products.length === 0) {
      // Wait a bit to see if products are being initialized
      const timer = setTimeout(() => {
        if (products.length === 0) {
          setShowServerNotice(true);
        }
      }, 2000); // Wait 2 seconds before showing notice
      
      return () => clearTimeout(timer);
    } else {
      setShowServerNotice(false);
    }
  }, [isLoading, products.length]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProducts();
      toast.success('Products refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh products');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const productName = safeText(product.name, 'Unnamed Product');
    const productCategory = safeText(product.category, 'Uncategorized');
    const productStatus = safeText(product.status, 'draft');
    const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || productCategory === filterCategory;
    const matchesStatus = filterStatus === 'all' || productStatus === filterStatus;
    const productPrice = safeNumber(product.price);
    const productStock = safeNumber(product.stock);
    const matchesPriceMin = filterPriceMin === '' || productPrice >= parseFloat(filterPriceMin);
    const matchesPriceMax = filterPriceMax === '' || productPrice <= parseFloat(filterPriceMax);
    const matchesStockMin = filterStockMin === '' || productStock >= parseInt(filterStockMin);
    
    // Debug logging for Startup category
    if (filterCategory === 'Startup' && productCategory === 'Startup') {
      console.log('âœ… Startup product matched:', productName, '| Category:', productCategory);
    }
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPriceMin && matchesPriceMax && matchesStockMin;
  }).sort((a, b) => {
    const [sortKey, sortOrder] = sortBy.split('-');
    if (sortKey === 'name') {
      const nameA = safeText(a.name, 'Unnamed Product');
      const nameB = safeText(b.name, 'Unnamed Product');
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else if (sortKey === 'price') {
      return sortOrder === 'asc'
        ? safeNumber(a.price) - safeNumber(b.price)
        : safeNumber(b.price) - safeNumber(a.price);
    } else if (sortKey === 'stock') {
      return sortOrder === 'asc'
        ? safeNumber(a.stock) - safeNumber(b.stock)
        : safeNumber(b.stock) - safeNumber(a.stock);
    }
    return 0;
  });

  const handleDelete = async (id: string, name: string) => {
    if (deleteConfirm === id) {
      try {
        await deleteProduct(id);
        toast.success(`Product \"${name}\" deleted successfully!`);
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Delete error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('Product not found')) {
          toast.error(`Product \"${name}\" not found in database. Refreshing list...`);
          // Refresh to sync with server state
          await refreshProducts();
        } else {
          toast.error(`Failed to delete \"${name}\": ${errorMessage}`);
        }
        setDeleteConfirm(null);
      }
    } else {
      setDeleteConfirm(id);
      toast.warning(`Click delete again to confirm deletion of \"${name}\"`);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Items</h1>
            <p className="text-gray-600 mt-1">Manage your product inventory ({products.length} total)</p>
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
            <Link
              to="/admin/items/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add New Item
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="Translation">Translation</option>
              <option value="Attestation">Attestation</option>
              <option value="Apostille">Apostille</option>
              <option value="Startup Packages">Startup Packages</option>
            </select>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              <Filter className="w-5 h-5" />
              More Filters
            </button>
          </div>

          {showMoreFilters && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Min Price..."
                    value={filterPriceMin}
                    onChange={(e) => setFilterPriceMin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Max Price..."
                    value={filterPriceMax}
                    onChange={(e) => setFilterPriceMax(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Min Stock..."
                    value={filterStockMin}
                    onChange={(e) => setFilterStockMin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Loading products from server...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stock
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
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{safeText(product.name, 'Unnamed Product')}</div>
                          <div className="text-sm text-gray-500">ID: {safeText(product.id, 'unknown')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {safeText(product.category, 'Uncategorized')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            safeText(product.status, 'draft') === 'active'
                              ? 'bg-green-100 text-green-700'
                              : safeText(product.status, 'draft') === 'draft'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {safeText(product.status, 'draft')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Product"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {canEditItems ? (
                            <Link
                              to={`/admin/items/edit/${product.id}`}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="p-2 rounded-lg text-gray-300 cursor-not-allowed"
                              title="Edit access denied"
                              disabled
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteItems ? (
                            <button 
                              onClick={() => handleDelete(product.id, product.name)}
                              className={`p-2 hover:bg-red-50 rounded-lg transition-colors ${
                                deleteConfirm === product.id ? 'bg-red-100' : ''
                              }`}
                              title={deleteConfirm === product.id ? 'Click again to confirm' : 'Delete Product'}
                            >
                              <Trash2 className={`w-4 h-4 ${
                                deleteConfirm === product.id ? 'text-red-700' : 'text-red-600'
                              }`} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="p-2 rounded-lg text-gray-300 cursor-not-allowed"
                              title="Delete access denied"
                              disabled
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">
                    {searchQuery || filterCategory !== 'all' 
                      ? 'No items found matching your filters' 
                      : 'No items found'}</p>
                  <Link
                    to="/admin/items/new"
                    className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                  >
                    Add your first item
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Server Notice */}
        {showServerNotice && (
          <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-900">  Server Notice</h2>
              <button
                onClick={() => setShowServerNotice(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg mb-4">
              <h3 className="font-bold text-red-900 mb-2">  No Products Found:</h3>
              <p className="text-sm text-gray-700 mb-3">
                It seems there are no products available in the server. The system should have automatically initialized default products.
              </p>
              <p className="text-sm text-gray-700">
                If products still don't appear, try:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside mt-2 ml-2">
                <li>Click the <strong>Refresh</strong> button above to reload from server</li>
                <li>Add products manually using the <strong>Add New Item</strong> button</li>
                <li>Check the browser console for error messages</li>
              </ul>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
              </button>
              <Link
                to="/admin/items/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Add New Item
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Product Images */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    Product Images
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedProduct.images.map((image: string, index: number) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${safeText(selectedProduct.name, 'Product')} ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Product Name</p>
                    <p className="text-gray-900 font-semibold">{safeText(selectedProduct.name, 'Unnamed Product')}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Product ID</p>
                    <p className="text-gray-900 font-mono text-sm">{selectedProduct.id}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Category</p>
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <Tag className="w-3 h-3 mr-1" />
                      {safeText(selectedProduct.category, 'Uncategorized')}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        safeText(selectedProduct.status, 'draft') === 'active'
                          ? 'bg-green-100 text-green-700'
                          : safeText(selectedProduct.status, 'draft') === 'draft'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {safeText(selectedProduct.status, 'draft')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Pricing & Inventory
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Price</p>
                    <p className="text-2xl font-bold text-green-700">{formatPrice(selectedProduct.price)}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Stock Quantity</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedProduct.stock}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedProduct.description}</p>
                  </div>
                </div>
              )}

              {/* Additional Fields */}
              {selectedProduct.languages && selectedProduct.languages.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Supported Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.languages.map((lang: any, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {lang.from}  {lang.to}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-between items-center">
              <Link
                to={`/admin/items/edit/${selectedProduct.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Product
              </Link>
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default ItemsPage;

