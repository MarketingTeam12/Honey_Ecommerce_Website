import { useProducts } from '@/app/context/ProductContext';
import { AdminLayout } from '@/app/components/admin/AdminLayout';
import { toast } from 'sonner';

export function DebugPage() {
  const { products, categories } = useProducts();

  const localStorageProducts = localStorage.getItem('admin_products');
  const localStorageCategories = localStorage.getItem('admin_categories');

  // Calculate storage sizes
  const productsSize = localStorageProducts ? new Blob([localStorageProducts]).size : 0;
  const categoriesSize = localStorageCategories ? new Blob([localStorageCategories]).size : 0;
  const totalSize = productsSize + categoriesSize;
  
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const handleClearProducts = () => {
    if (window.confirm('Are you sure you want to clear all product data? This cannot be undone!')) {
      localStorage.removeItem('admin_products');
      toast.success('Products cleared from localStorage. Please refresh the page.');
    }
  };

  const handleClearCategories = () => {
    if (window.confirm('Are you sure you want to clear all category data? This cannot be undone!')) {
      localStorage.removeItem('admin_categories');
      toast.success('Categories cleared from localStorage. Please refresh the page.');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      localStorage.clear();
      toast.success('All data cleared. Please refresh the page.');
    }
  };

  const handleCleanBase64Images = () => {
    const productsWithBase64 = products.filter(p => 
      p.images?.some(img => typeof img === 'string' && img.startsWith('data:'))
    );
    
    if (productsWithBase64.length === 0) {
      toast.info('No base64 images found. All products are clean!');
      return;
    }
    
    if (window.confirm(`Found ${productsWithBase64.length} product(s) with base64 images. Remove base64 images?`)) {
      localStorage.removeItem('admin_products');
      toast.success('Base64 images flagged for removal. Please refresh the page.');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Debug & Storage Management</h1>

        {/* Storage Overview */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h2 className="text-2xl font-semibold mb-4">Storage Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-1">Products Storage</p>
              <p className="text-2xl font-bold text-blue-600">{formatSize(productsSize)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-1">Categories Storage</p>
              <p className="text-2xl font-bold text-green-600">{formatSize(categoriesSize)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-1">Total Storage</p>
              <p className="text-2xl font-bold text-purple-600">{formatSize(totalSize)}</p>
            </div>
          </div>
          
          {totalSize > 5000000 && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 font-semibold">⚠️ Warning: Storage usage is high ({formatSize(totalSize)})</p>
              <p className="text-sm text-red-700 mt-1">
                LocalStorage is limited to ~5-10MB. Consider deleting old products or clearing storage.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleClearProducts}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
            >
              Clear Products Data
            </button>
            <button
              onClick={handleClearCategories}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
            >
              Clear Categories Data
            </button>
            <button
              onClick={handleClearAll}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Clear All Storage
            </button>
            <button
              onClick={handleCleanBase64Images}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Clean Base64 Images
            </button>
          </div>
        </div>

        {/* Products from Context */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Products from Context</h2>
          <p className="mb-2">Total Products: {products.length}</p>
          
          {/* Check for base64 images */}
          {(() => {
            const productsWithBase64 = products.filter(p => 
              p.images?.some(img => typeof img === 'string' && img.startsWith('data:'))
            );
            
            if (productsWithBase64.length > 0) {
              return (
                <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                  <p className="text-red-800 font-semibold">
                    🚨 CRITICAL: {productsWithBase64.length} product(s) have base64 images!
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    This is causing the storage quota issue. These products should use Backend Storage URLs instead.
                  </p>
                  <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                    {productsWithBase64.map(p => (
                      <li key={p.id}>{p.name} (ID: {p.id})</li>
                    ))}
                  </ul>
                </div>
              );
            }
            return null;
          })()}
          
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
            {JSON.stringify(products, null, 2)}
          </pre>
        </div>

        {/* Categories from Context */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Categories from Context</h2>
          <p className="mb-2">Total Categories: {categories.length}</p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
            {JSON.stringify(categories, null, 2)}
          </pre>
        </div>

        {/* Products from localStorage */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Products from localStorage</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
            {localStorageProducts || 'No data in localStorage'}
          </pre>
        </div>

        {/* Categories from localStorage */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Categories from localStorage</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
            {localStorageCategories || 'No data in localStorage'}
          </pre>
        </div>

        {/* Translation Products */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Translation Category Products</h2>
          {(() => {
            const translationProducts = products.filter(
              (p) => p.category === 'Translation' && p.status === 'active'
            );
            return (
              <>
                <p className="mb-2">Count: {translationProducts.length}</p>
                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
                  {JSON.stringify(translationProducts, null, 2)}
                </pre>
              </>
            );
          })()}
        </div>
      </div>
    </AdminLayout>
  );
}