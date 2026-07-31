import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { useCart } from '@/app/context/CartContext';
import { useProducts } from '@/app/context/ProductContext';
import { getFirstValidImage } from '@/app/utils/imageUtils';
import { toast } from 'sonner';
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

// Static fallback products
const fallbackTranslationProducts: Product[] = [
  {
    id: 'english-to-foreign',
    name: 'English to Foreign Language',
    price: 2000,
    originalPrice: 2500,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
    url: '/product/english-to-foreign',
    description: 'Professional translation from English to all major foreign languages',
    category: 'translation'
  },
  {
    id: 'foreign-to-english',
    name: 'Foreign Language to English',
    price: 2000,
    originalPrice: 2500,
    image: 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&q=80',
    url: '/product/foreign-to-english',
    description: 'Accurate translation from foreign languages to English',
    category: 'translation'
  },
  {
    id: 'indian-to-english',
    name: 'Indian Language to English',
    price: 1500,
    originalPrice: 2000,
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',
    url: '/product/indian-to-english',
    description: 'Translation services from Hindi, Tamil, Telugu, and other Indian languages to English',
    category: 'translation'
  },
  {
    id: 'english-to-indian',
    name: 'English to Indian Language',
    price: 1500,
    originalPrice: 2000,
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
    url: '/product/english-to-indian',
    description: 'Translation from English to Hindi, Tamil, Telugu, and other Indian languages',
    category: 'translation'
  },
  {
    id: 'english-to-italian',
    name: 'English to Italian',
    price: 2200,
    originalPrice: 2800,
    image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80',
    url: '/product/english-to-italian',
    description: 'Professional English to Italian translation services for all document types',
    category: 'translation'
  },
  {
    id: 'english-to-french',
    name: 'English to French',
    price: 2200,
    originalPrice: 2800,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    url: '/product/english-to-french',
    description: 'Expert English to French translation with certified translators',
    category: 'translation'
  },
  {
    id: 'english-to-german',
    name: 'English to German',
    price: 2200,
    originalPrice: 2800,
    image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80',
    url: '/product/english-to-german',
    description: 'High-quality English to German translation for business and legal documents',
    category: 'translation'
  },
  {
    id: 'english-to-spanish',
    name: 'English to Spanish',
    price: 2200,
    originalPrice: 2800,
    image: 'https://images.unsplash.com/photo-1543513140-b86d5bd6f7ca?w=800&q=80',
    url: '/product/english-to-spanish',
    description: 'Professional English to Spanish translation services with fast turnaround',
    category: 'translation'
  }
];

export function AllTranslationProductsPage() {
  const { convertPrice } = useCurrency();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { products: adminProducts } = useProducts();

  // Get Translation products from admin
  const adminTranslationProducts = adminProducts
    .filter(product => product.category?.toLowerCase().includes('translation') && product.status === 'active')
    .map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.compareAtPrice || product.price,
      image: getFirstValidImage(product.images) || legacyFallbackImage,
      url: `/product/${product.id}`,
      description: product.description || 'Professional translation service',
      category: 'translation'
    }));

  // Use admin products if available, otherwise fallback
  const translationProducts = adminTranslationProducts.length > 0 
    ? adminTranslationProducts 
    : fallbackTranslationProducts;

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

  const handleAddToCart = (product: Product) => {
    if (product.category !== 'startup') {
      toast.error('Please upload the required document before adding this product to the cart.');
      return;
    }
    addToCart({
      id: `${product.id}-${Date.now()}`,
      name: product.name,
      basePrice: product.price,
      category: product.category,
      url: product.url,
      image: product.image,
      pageCount: 1,
      totalPrice: product.price,
    });
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Translation Services</h1>
          <p className="text-gray-600 text-lg">
            Professional translation services in multiple languages
          </p>
          <p className="text-gray-500 mt-2">
            {translationProducts.length} products available
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {translationProducts.map((product) => (
            <div
              key={product.id}
              className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 bg-white flex flex-col lg:flex-row"
            >
              {/* Image Container */}
              <Link to={product.url} className="block relative overflow-hidden bg-gray-100 lg:w-2/5">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 lg:h-full object-contain bg-white p-3 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-64 lg:h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                    <div className="text-center">
                      <svg className="w-20 h-20 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      <p className="text-sm text-gray-400">Translation Service</p>
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
              </Link>

              {/* Product Info */}
              <div className="p-4 lg:w-3/5 flex flex-col justify-between">
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
                  {/* Popular Choice Tag */}
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
      </div>
    </div>
  );
}

export default AllTranslationProductsPage;

