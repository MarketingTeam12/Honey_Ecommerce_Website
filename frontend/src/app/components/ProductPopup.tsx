import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useProducts } from '@/app/context/ProductContext';
import { getFirstValidImage } from '@/app/utils/imageUtils';

interface PopupProduct {
  id: string;
  name: string;
  category: string;
  imageUrl: string; // Changed from optional to required
  productUrl: string;
}

// Simulated customer locations for demo purposes
const DEMO_LOCATIONS = [
  'Mumbai, India',
  'Delhi, India',
  'Bangalore, India',
  'Chennai, India',
  'Hyderabad, India',
  'Pune, India',
  'Kolkata, India',
  'Ahmedabad, India',
  'West Bengal, India',
  'Tamil Nadu, India',
  'Karnataka, India',
  'Maharashtra, India',
];

// Simulated customer names
const DEMO_NAMES = [
  'Pradip',
  'Rahul',
  'Priya',
  'Amit',
  'Sneha',
  'Rajesh',
  'Kavita',
  'Vijay',
  'Anita',
  'Suresh',
  'Deepa',
  'Arjun',
];

const TIME_OPTIONS = ['10 minutes ago', '20 minutes ago', '30 minutes ago', '1 hour ago', '2 hours ago', '3 hours ago'];
const PROMO_TAGS = ['Top Rated', 'Best Offer', 'Popular Choice', 'Exclusive Deal', 'Best Seller', 'Limited Time Offer'];

export function ProductPopup() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [isVisible, setIsVisible] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [popupProducts, setPopupProducts] = useState<PopupProduct[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [location, setLocation] = useState('');
  const [timeAgo, setTimeAgo] = useState('');

  // Filter and organize products by category
  useEffect(() => {
    const categoryMapping = {
      'language': ['Language Translation', 'Translation'],
      'apostille': ['Apostille'],
      'attestation': ['Attestation'],
      'startup': ['Startup Package', 'Startup'],
    };

    const filteredProducts: PopupProduct[] = [];

    // Get products from each category
    Object.entries(categoryMapping).forEach(([key, categoryNames]) => {
      const categoryProducts = products.filter(product => 
        categoryNames.some(cat => 
          product.category?.toLowerCase().includes(cat.toLowerCase())
        )
      );

        categoryProducts.forEach(product => {
        // Only include products that have at least one image.
        if (product.images && product.images.length > 0) {
          const firstImage = getFirstValidImage(product.images);
          if (!firstImage) {
            return;
          }
          filteredProducts.push({
            id: product.id,
            name: product.name,
            category: product.category || key,
            imageUrl: firstImage,
            productUrl: `/product/${product.id}`,
          });
        }
      });
    });

    setPopupProducts(filteredProducts);
  }, [products]);

  // Generate random customer info
  const generateCustomerInfo = () => {
    const randomName = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
    const randomLocation = DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];
    const randomTime = TIME_OPTIONS[Math.floor(Math.random() * TIME_OPTIONS.length)];
    
    setCustomerName(randomName);
    setLocation(randomLocation);
    setTimeAgo(randomTime);
  };

  // Popup cycle: Show once every 10 seconds
  useEffect(() => {
    if (popupProducts.length === 0) return;

    // Show first popup after 3 seconds
    const initialDelay = setTimeout(() => {
      setIsVisible(true);
      generateCustomerInfo();
    }, 3000);

    return () => clearTimeout(initialDelay);
  }, [popupProducts]);

  // Main popup cycle - appears every 10 seconds with visibility check
  useEffect(() => {
    if (popupProducts.length === 0) return;

    let cycleInterval: NodeJS.Timeout | null = null;
    let hideTimeout: NodeJS.Timeout | null = null;

    const startCycle = () => {
      cycleInterval = setInterval(() => {
        // Only show if document is visible
        if (!document.hidden) {
          setIsVisible(true);
          setCurrentProductIndex((prev) => (prev + 1) % popupProducts.length);
          generateCustomerInfo();

          // Hide popup after 6 seconds
          hideTimeout = setTimeout(() => {
            setIsVisible(false);
          }, 6000);
        }
      }, 10000); // Repeat every 10 seconds
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (cycleInterval) {
          clearInterval(cycleInterval);
          cycleInterval = null;
        }
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
        setIsVisible(false);
      } else {
        if (!cycleInterval) {
          startCycle();
        }
      }
    };

    startCycle();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (cycleInterval) {
        clearInterval(cycleInterval);
      }
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [popupProducts.length]);

  if (popupProducts.length === 0 || !isVisible) return null;

  const currentProduct = popupProducts[currentProductIndex];
  const promoTag = PROMO_TAGS[currentProductIndex % PROMO_TAGS.length];

  const handleProductClick = () => {
    navigate(currentProduct.productUrl);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div
      className={`fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-auto z-50 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden max-w-sm w-full animate-slide-in-left">
        {/* Best Offer Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-md">
            {promoTag}
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 text-white hover:text-gray-300 transition-colors"
          aria-label="Close popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Clickable Content */}
        <div
          onClick={handleProductClick}
          className="flex items-center p-4 cursor-pointer hover:bg-gray-800 transition-colors"
        >
          {/* Product Image */}
          <div className="flex-shrink-0 w-24 h-24 bg-white rounded-lg overflow-hidden mr-4">
            <img
              src={currentProduct.imageUrl}
              alt={currentProduct.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300 mb-2">
              {customerName} from <span className="font-medium">{location}</span> purchased
            </p>
            <h4 className="text-sm font-semibold text-white mb-2 line-clamp-2">
              {currentProduct.name}
            </h4>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-gray-800 h-1">
          <div
            className="bg-blue-500 h-full transition-all duration-[6000ms] ease-linear"
            style={{
              width: isVisible ? '100%' : '0%',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProductPopup;

