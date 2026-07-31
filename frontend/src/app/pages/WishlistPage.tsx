import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, X } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'sonner';

export function WishlistPage() {
  const { convertPrice } = useCurrency();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = (item: typeof wishlistItems[0]) => {
    if (!user) {
      toast.error('Please log in to add items to your cart.');
      return;
    }

    // Check if the product requires document upload
    if (item.category !== 'startup') {
      toast.error('Please upload the required document before adding this product to the cart.');
      return;
    }

    addToCart({
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      basePrice: item.price,
      category: item.category,
      url: item.url,
      image: item.image,
      pageCount: 1,
      totalPrice: item.price,
    });
    toast.success('Item added to cart!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2">My Wishlist</h1>
          <p className="text-gray-600">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {/* Wishlist Items */}
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl mb-2">Your Wishlist is Empty</h2>
            <p className="text-gray-600 mb-6">
              Save your favorite services to your wishlist
            </p>
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-6 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <Link to={item.url} className="flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full sm:w-48 h-48 object-cover rounded-lg"
                  />
                </Link>

                {/* Content */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{item.category}</p>
                      <Link to={item.url}>
                        <h3 className="text-xl hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                    </div>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <p className="text-2xl text-blue-600 mb-4">{convertPrice(item.price)}</p>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={item.url}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Continue Shopping */}
        {wishlistItems.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/"
              className="inline-block text-blue-600 hover:text-blue-700 underline"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default WishlistPage;
