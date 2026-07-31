import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { useCart } from '@/app/context/CartContext';
import { useProducts } from '@/app/context/ProductContext';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { startupProducts, StartupProduct } from '@/app/data/startupProductsList';
import { getFirstValidImage } from '@/app/utils/imageUtils';

const PROMO_TAGS = ['Top Rated', 'Best Offer', 'Popular Choice', 'Exclusive Deal', 'Best Seller', 'Limited Time Offer'];

const getPromoTag = (seed: string) => {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PROMO_TAGS[hash % PROMO_TAGS.length];
};

export function AllStartupProductsPage() {
  const { convertPrice } = useCurrency();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { products } = useProducts();

  // Get Startup products from admin database
  const adminStartupProducts = products
    .filter(product => product.category === 'Startup' && product.status === 'active')
    .map(product => {
      // Map database product names to static page URLs
      let staticUrl = `/product/${product.id}`;
      const nameLower = product.name.toLowerCase();
      if (nameLower.includes('basic')) {
        staticUrl = '/basic-startup-package';
      } else if (nameLower.includes('standard')) {
        staticUrl = '/standard-startup-package';
      } else if (nameLower.includes('premium')) {
        staticUrl = '/premium-startup-package';
      }
      
      // Get the first image from the product, with fallback
      const productImage = getFirstValidImage(
        product.images,
        'https://via.placeholder.com/400/9333EA/FFFFFF?text=Startup+Package',
      );
      
      console.log('🖼 [AllStartupProductsPage] Product:', product.name, 'Image URL:', productImage);
      
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.compareAtPrice || product.price,
        image: productImage,
        url: staticUrl,
        description: product.description || 'Professional startup service',
        category: 'startup'
      };
    });

  // Use admin products if available, otherwise fallback to static
  const displayProducts = adminStartupProducts.length > 0 
    ? adminStartupProducts 
    : startupProducts;

  const handleWishlistToggle = (product: StartupProduct) => {
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

  const handleAddToCart = (product: StartupProduct) => {
    console.log(' [AllStartupProductsPage] Adding to cart:', product.name);
    console.log(' [AllStartupProductsPage] Product image value:', product.image);
    console.log(' [AllStartupProductsPage] Image type:', typeof product.image);
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
          <h1 className="text-4xl mb-2">Startup Packages</h1>
          <p className="text-gray-600 text-lg">
            Complete branding, digital setup, website, and promotion packages for your business
          </p>
          <p className="text-gray-500 mt-2">
            {displayProducts.length} package options available
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 bg-white flex flex-col lg:flex-row"
            >
              {/* Image Container */}
              <Link to={product.url} className="block relative overflow-hidden bg-gray-100 lg:w-2/5">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 lg:h-full object-contain bg-white p-3 group-hover:scale-105 transition-transform duration-300"
                />
                
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
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {product.description}
                </p>

                {/* Price */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold text-gray-900">
                      {convertPrice(product.price)}
                    </span>
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

export default AllStartupProductsPage;

