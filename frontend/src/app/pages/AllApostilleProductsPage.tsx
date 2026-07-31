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

const PROMO_TAGS = ['Top Rated', 'Popular Choice', 'Exclusive Deal'];
const POPULAR_CHOICE_IDS = new Set([
  'usa-apostille',
  'canada-apostille',
  'germany-apostille',
  'new-zealand-apostille',
  'saudi-arabia-apostille',
  'poland-apostille',
  'dutch-apostille',
  'serbia-apostille',
  'netherlands-apostille',
]);

const getPromoTag = (seed: string) => {
  if (POPULAR_CHOICE_IDS.has(seed)) {
    return 'Popular Choice';
  }
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PROMO_TAGS[hash % PROMO_TAGS.length];
};

const apostilleProducts: Product[] = [
  {
    id: 'usa-apostille',
    name: 'USA Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/usa',
    description: 'Complete USA apostille service including MEA and Embassy attestation',
    category: 'apostille'
  },
  {
    id: 'uk-apostille',
    name: 'UK Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/uk',
    description: 'UK apostille service for all document types',
    category: 'apostille'
  },
  {
    id: 'canada-apostille',
    name: 'Canada Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/canada',
    description: 'Canada apostille and authentication services',
    category: 'apostille'
  },
  {
    id: 'australia-apostille',
    name: 'Australia Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/australia',
    description: 'Australia apostille services with fast processing',
    category: 'apostille'
  },
  {
    id: 'germany-apostille',
    name: 'Germany Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/germany',
    description: 'Germany apostille service for Indian documents',
    category: 'apostille'
  },
  {
    id: 'france-apostille',
    name: 'France Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/france',
    description: 'France apostille and embassy attestation',
    category: 'apostille'
  },
  {
    id: 'spain-apostille',
    name: 'Spain Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/spain',
    description: 'Spain apostille services for all certificates',
    category: 'apostille'
  },
  {
    id: 'italy-apostille',
    name: 'Italy Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/italy',
    description: 'Italy apostille service with MEA attestation',
    category: 'apostille'
  },
  {
    id: 'netherlands-apostille',
    name: 'Netherlands Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/netherlands',
    description: 'Netherlands apostille for education and commercial documents',
    category: 'apostille'
  },
  {
    id: 'belgium-apostille',
    name: 'Belgium Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/belgium',
    description: 'Belgium apostille services with tracking',
    category: 'apostille'
  },
  {
    id: 'switzerland-apostille',
    name: 'Switzerland Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/switzerland',
    description: 'Switzerland apostille and legalization services',
    category: 'apostille'
  },
  {
    id: 'austria-apostille',
    name: 'Austria Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/austria',
    description: 'Austria apostille for personal and commercial documents',
    category: 'apostille'
  },
  {
    id: 'portugal-apostille',
    name: 'Portugal Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/portugal',
    description: 'Portugal apostille services for all document types',
    category: 'apostille'
  },
  {
    id: 'poland-apostille',
    name: 'Poland Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/poland',
    description: 'Poland apostille with MEA and embassy verification',
    category: 'apostille'
  },
  {
    id: 'new-zealand-apostille',
    name: 'New Zealand Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/new-zealand',
    description: 'New Zealand apostille and document legalization',
    category: 'apostille'
  },
  {
    id: 'saudi-arabia-apostille',
    name: 'Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/saudi-arabia',
    description: 'Saudi Arabia apostille service including MEA and Embassy attestation',
    category: 'apostille'
  },
  {
    id: 'slovakia-apostille',
    name: 'Slovakia Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/slovakia',
    description: 'Slovakia apostille service for all document types',
    category: 'apostille'
  },
  {
    id: 'iceland-apostille',
    name: 'Iceland Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/iceland',
    description: 'Iceland apostille and authentication services',
    category: 'apostille'
  },
  {
    id: 'russia-apostille',
    name: 'Russia Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/russia',
    description: 'Russia apostille services with fast processing',
    category: 'apostille'
  },
  {
    id: 'serbia-apostille',
    name: 'Serbia Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/serbia',
    description: 'Serbia apostille service for Indian documents',
    category: 'apostille'
  },
  {
    id: 'czech-republic-apostille',
    name: 'Czech Republic Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/czech-republic',
    description: 'Czech Republic apostille and embassy attestation',
    category: 'apostille'
  },
  {
    id: 'luxembourg-apostille',
    name: 'Luxembourg Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/luxembourg',
    description: 'Luxembourg apostille services for all certificates',
    category: 'apostille'
  },
  {
    id: 'dutch-apostille',
    name: 'Dutch Apostille Services',
    price: 2500,
    originalPrice: 3500,
    image: 'https://images.unsplash.com/photo-1757361821434-691a76960f0e?w=800&q=80',
    url: '/apostille/dutch',
    description: 'Dutch apostille service with MEA attestation',
    category: 'apostille'
  }
];

export function AllApostilleProductsPage() {
  const { convertPrice } = useCurrency();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { products: adminProducts } = useProducts();

  // Debug logging - Log ALL products first
  console.log('=== AllApostilleProductsPage Debug ===');
  console.log('Total admin products:', adminProducts.length);
  console.log('All admin products:', adminProducts.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    status: p.status,
    imageCount: p.images.length,
    firstImage: getFirstValidImage(p.images).substring(0, 50) + '...'
  })));

  // Get Apostille products from admin
  const adminApostilleProducts = adminProducts
    .filter(product => {
      const matches = product.category?.toLowerCase().includes('apostille') && product.status === 'active';
      console.log(`Product "${product.name}": category="${product.category}", status="${product.status}", matches=${matches}`);
      return matches;
    })
    .map(product => {
      console.log(`Mapping Apostille product "${product.name}":`, {
        id: product.id,
        images: product.images,
        firstImage: getFirstValidImage(product.images)
      });
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.compareAtPrice || product.price,
        image: getFirstValidImage(product.images) || legacyFallbackImage,
        url: `/product/${product.id}`,
        description: product.description || 'Professional apostille service',
        category: 'apostille'
      };
    });

  console.log('Filtered Apostille products:', adminApostilleProducts.length);
  console.log('Apostille products details:', adminApostilleProducts.map(p => ({
    id: p.id,
    name: p.name,
    image: p.image.substring(0, 50) + '...'
  })));

  // Use admin products if available, otherwise fallback
  const displayProducts = adminApostilleProducts.length > 0 
    ? adminApostilleProducts 
    : apostilleProducts;
  
  console.log('Final display products:', displayProducts.length);
  console.log('=== End Debug ===');

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
          <h1 className="text-4xl mb-2">Apostille Services</h1>
          <p className="text-gray-600 text-lg">
            Complete apostille services for 15 countries including MEA and Embassy attestation
          </p>
          <p className="text-gray-500 mt-2">
            {displayProducts.length} countries available
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
                      <p className="text-sm text-gray-400">Apostille Service</p>
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

export default AllApostilleProductsPage;

