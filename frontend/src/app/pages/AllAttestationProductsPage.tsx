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

const attestationProducts: Product[] = [
  {
    id: 'china-attestation',
    name: 'China Attestation Services',
    price: 16000,
    originalPrice: 18000,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    url: '/attestation/china',
    description: 'Complete China attestation including MEA, Ministry of Foreign Affairs and Embassy verification',
    category: 'attestation'
  },
  {
    id: 'qatar-attestation',
    name: 'Qatar Attestation Services',
    price: 9500,
    originalPrice: 12000,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    url: '/attestation/qatar',
    description: 'Qatar embassy attestation for educational, personal and commercial documents',
    category: 'attestation'
  },
  {
    id: 'kuwait-attestation',
    name: 'Kuwait Attestation Services',
    price: 16000,
    originalPrice: 19000,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    url: '/attestation/kuwait',
    description: 'Kuwait attestation with MEA and embassy verification for all document types',
    category: 'attestation'
  },
  {
    id: 'uae-attestation',
    name: 'UAE Attestation Services',
    price: 9500,
    originalPrice: 13000,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    url: '/attestation/uae',
    description: 'UAE embassy attestation services for Dubai, Abu Dhabi and other emirates',
    category: 'attestation'
  },
  {
    id: 'hrd-attestation',
    name: 'HRD Attestation Services',
    price: 2500,
    originalPrice: 5000,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    url: '/attestation/hrd',
    description: 'HRD attestation for educational documents from all Indian states',
    category: 'attestation'
  }
];

export function AllAttestationProductsPage() {
  const { convertPrice } = useCurrency();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { products: adminProducts } = useProducts();

  // Get Attestation products from admin
  const adminAttestationProducts = adminProducts
    .filter(product => product.category?.toLowerCase().includes('attestation') && product.status === 'active')
    .map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.compareAtPrice || product.price,
      image: getFirstValidImage(product.images) || legacyFallbackImage,
      url: `/product/${product.id}`,
      description: product.description || 'Professional attestation service',
      category: 'attestation'
    }));

  // Use admin products if available, otherwise fallback
  const displayProducts = adminAttestationProducts.length > 0 
    ? adminAttestationProducts 
    : attestationProducts;

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
          <h1 className="text-4xl mb-2">Attestation Services</h1>
          <p className="text-gray-600 text-lg">
            Document attestation services for UAE, Qatar, Kuwait, China and HRD
          </p>
          <p className="text-gray-500 mt-2">
            {displayProducts.length} attestation services available
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayProducts.map((product) => (
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-400">Attestation Service</p>
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
      </div>
    </div>
  );
}

export default AllAttestationProductsPage;

