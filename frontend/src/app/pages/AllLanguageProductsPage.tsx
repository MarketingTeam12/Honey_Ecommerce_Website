import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { useProducts } from '@/app/context/ProductContext';
import { allProductsMap } from '@/app/data/allProductData';
import { getFirstValidImage } from '@/app/utils/imageUtils';
import legacyFallbackImage from '@/assets/hero-banner-documents.png';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  url: string;
  description: string;
  category: string;
}

const PROMO_TAGS = ['Top Rated', 'Best Offer', 'Popular Choice', 'Exclusive Deal', 'Best Seller', 'Limited Time Offer'];

const getPromoTag = (seed: string) => {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PROMO_TAGS[hash % PROMO_TAGS.length];
};

const fallbackLanguageProducts: Product[] = Object.entries(allProductsMap)
  .filter(([, productData]) => productData.type === 'translation')
  .map(([id, productData]) => ({
    id,
    name: productData.title,
    price: productData.price,
    originalPrice: productData.originalPrice,
    image: getFirstValidImage(productData.images) || legacyFallbackImage,
    url: `/product/${id}`,
    description:
      productData.description ||
      productData.productDetails
        .map((detail) => (typeof detail === 'string' ? detail : detail.text))
        .filter(Boolean)
        .slice(0, 2)
        .join(' ') ||
      'Professional language translation service',
    category: 'language',
  }));

export function AllLanguageProductsPage() {
  const { convertPrice } = useCurrency();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { products: adminProducts, isLoading } = useProducts();

  // Get Language/Translation products from admin
  const adminLanguageProducts = adminProducts
    .filter(product => 
      product.status === 'active' && 
      (product.category?.toLowerCase().includes('translation') || 
       product.category?.toLowerCase().includes('language') ||
       product.tags?.some(tag => 
         tag.toLowerCase().includes('translation') || 
         tag.toLowerCase().includes('language')
       ))
    )
    .map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.compareAtPrice || product.price,
      image: getFirstValidImage(product.images) || legacyFallbackImage,
      url: `/product/${product.id}`,
      description: product.description || 'Professional language translation service',
      category: 'language'
    }));

  const languageProducts = adminLanguageProducts.length > 0
    ? adminLanguageProducts
    : fallbackLanguageProducts;

  const handleWishlistToggle = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: product.category,
        url: product.url,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading language services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Language Translation Services</h1>
          <p className="text-gray-600 text-lg">
            Professional translation services for all languages
          </p>
          <p className="text-gray-500 mt-2">
            {languageProducts.length} language services available
          </p>
        </div>

        {/* Products Grid */}
        {languageProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Language Services Available</h3>
              <p className="text-gray-600">
                There are currently no language translation services available. Please check back later or contact us for more information.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {languageProducts.map((product) => (
              <div
                key={product.id}
                className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white flex flex-col max-w-[28rem] w-full mx-auto"
              >
                {/* Image Container */}
                <Link to={product.url} className="block relative overflow-hidden bg-gray-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-80 sm:h-96 object-cover bg-white group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-80 sm:h-96 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                      <div className="text-center">
                        <svg className="w-20 h-20 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        <p className="text-sm text-gray-400">Language Service</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleWishlistToggle(product);
                    }}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isInWishlist(product.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                    />
                  </button>

                  {/* Discount Badge */}
                  {product.originalPrice > product.price && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Save {convertPrice(product.originalPrice - product.price)}
                    </div>
                  )}
                </Link>

                {/* Product Info */}
                <div className="p-5 sm:p-6 flex flex-col justify-between">
                  <Link to={product.url}>
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-semibold text-gray-900">
                        {convertPrice(product.price)}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {convertPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    {/* BEST OFFER Tag */}
                    <div className="mt-2">
                      <span className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">
                        {getPromoTag(product.id)}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button - Removed per requirement */}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Our Language Translation Services</h2>
          <div className="prose max-w-none text-gray-600">
            <p className="mb-4">
              Our professional language translation services cover a wide range of languages and document types. 
              We provide accurate and certified translations for personal, business, legal, and academic purposes.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Translation to and from multiple languages</li>
              <li>Certified and notarized translations available</li>
              <li>Fast turnaround time with quality assurance</li>
              <li>Expert native translators for each language pair</li>
              <li>Globally accepted translations for official use</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllLanguageProductsPage;

