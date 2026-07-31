import { Badge } from '@/app/components/ui/badge';
import { Link } from 'react-router-dom';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useProducts } from '@/app/context/ProductContext';
import spanishSwornImg from 'figma:asset/bae6e9023fb7c3265ca71db42883699dd1557abb.png';
import italianSwornImg from 'figma:asset/aebd76dfa545dcd480a431d627b9afa2c177b490.png';
import germanSwornImg from 'figma:asset/604e66db6f8e40cd18af4a70c2668969707585de.png';
import { getFirstValidImage } from '@/app/utils/imageUtils';

const PROMO_TAGS = ['Top Rated', 'Best Offer', 'Popular Choice', 'Exclusive Deal', 'Best Seller', 'Limited Time Offer'];

const getPromoTag = (seed: string) => {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PROMO_TAGS[hash % PROMO_TAGS.length];
};

export function ChooseSwornTranslation() {
  const { convertPrice } = useCurrency();
  const { products: adminProducts } = useProducts();
  
  // Get sworn translation products from admin
  const swornProducts = adminProducts.filter(
    product => product.category === 'Translation' && 
               product.status === 'active' &&
               product.name.toLowerCase().includes('sworn')
  );
  
  // Fallback products if no admin products
  const fallbackProducts = [
    { 
      id: 'english-to-spanish-sworn',
      title: 'English to Spanish Sworn Translation', 
      price: 3299,
      originalPrice: 5000,
      route: '/product/english-to-spanish-sworn',
      image: spanishSwornImg
    },
    { 
      id: 'english-to-german-sworn',
      title: 'English to German Sworn Translation', 
      price: 4299,
      originalPrice: 6000,
      route: '/product/english-to-german-sworn',
      image: germanSwornImg
    },
    { 
      id: 'english-to-italian-sworn',
      title: 'English to Italian Sworn Translation', 
      price: 1499,
      originalPrice: 5000,
      route: '/product/english-to-italian-sworn',
      image: italianSwornImg
    },
    { 
      id: 'english-to-french-sworn',
      title: 'English to French Sworn Translation', 
      price: 3300,
      originalPrice: 5000,
      route: '/product/english-to-french-sworn',
      image: spanishSwornImg
    },
  ];

  // Use admin products if available, otherwise fallback
  const products = swornProducts.length > 0
    ? swornProducts.map(product => ({
        id: product.id,
        title: product.name,
        price: product.price,
        originalPrice: product.price * 1.5, // Calculate original price
        route: `/product/${product.id}`,
        image: getFirstValidImage(product.images)
      }))
    : fallbackProducts;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Choose Your Sworn Translation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link 
              key={product.id} 
              to={product.route}
              className="group block"
            >
              {/* Image Box - Only contains image */}
              <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-600 hover:shadow-xl transition-all mb-4">
                <div className="relative w-full h-64 bg-gradient-to-br from-purple-100 to-pink-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">📄</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Below Box */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {product.title}
                </h3>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold text-red-600">
                    {convertPrice(product.price)}
                  </p>
                  <p className="text-sm text-gray-500 line-through">
                    {convertPrice(product.originalPrice)}
                  </p>
                </div>
                <Badge className="bg-red-600 hover:bg-red-700 text-sm px-4 py-1.5 font-bold">{getPromoTag(product.id)}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

