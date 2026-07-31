import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useProducts } from '@/app/context/ProductContext';
import { Badge } from '@/app/components/ui/badge';
import { useState } from 'react';
import { getFirstValidImage } from '@/app/utils/imageUtils';

const PROMO_TAGS = ['Top Rated', 'Best Offer', 'Popular Choice', 'Exclusive Deal', 'Best Seller', 'Limited Time Offer'];

const getPromoTag = (seed: string) => {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PROMO_TAGS[hash % PROMO_TAGS.length];
};

export function SwornTranslationsListingPage() {
  const { convertPrice } = useCurrency();
  const { products, isLoading } = useProducts();
  const [sortBy, setSortBy] = useState('popular');

  // Filter products for Sworn Translation category
  const swornTranslationProducts = products.filter(
    product => product.status === 'active' && 
    (product.category?.toLowerCase().includes('sworn') || 
     product.tags?.some(tag => tag.toLowerCase().includes('sworn')))
  );

  // Sort products based on selection
  const sortedProducts = [...swornTranslationProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sworn translation services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sworn Translations</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Professional sworn translation services for official documents</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Sort by:</span>
              <select 
                className="border border-gray-300 rounded px-3 py-1 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {sortedProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sworn Translation Services Available</h3>
              <p className="text-gray-600">
                There are currently no sworn translation services available. Please check back later or contact us for more information.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/product/${product.id}`} className="block">
                  <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    {/* Product Image */}
                    <div className="relative overflow-hidden">
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <Badge className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 text-xs font-bold z-10">
                          SALE
                        </Badge>
                      )}
                      <div className="relative w-full h-72 bg-gray-100 p-2">
                        <div className="relative w-full h-full rounded-[2rem] border border-gray-200 bg-white shadow-sm overflow-hidden">
                          <img
                            src={getFirstValidImage(product.images, 'https://images.unsplash.com/photo-1673515335152-f2589ba8bb7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600')}
                            alt={product.name}
                            className="w-full h-full object-contain object-center"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300" />
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 min-h-[48px] line-clamp-2">
                        {product.name}
                      </h3>

                      {/* Pricing */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-green-600">
                            {convertPrice(product.price)}
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through">
                              {convertPrice(product.compareAtPrice)}
                            </span>
                          )}
                        </div>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <Badge className="bg-red-600 text-white px-4 py-1.5 text-sm font-bold">
                            {getPromoTag(product.id)}
                          </Badge>
                        )}
                      </div>

                      {/* View Details Button */}
                      <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Sworn Translation Services</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="mb-4">
              Our sworn translation services provide officially certified translations that are legally recognized 
              for visa applications, immigration, embassy submissions, legal proceedings, and academic purposes worldwide.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pricing applicable per page</li>
              <li>Scanned copies emailed before dispatch</li>
              <li>Hard copies delivered across India & internationally</li>
              <li>Globally recognized for official use</li>
              <li>Includes signed & stamped sworn translation + affidavit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwornTranslationsListingPage;

