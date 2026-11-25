import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Key, Shield, ChevronDown, Menu, X, ShoppingCart, Heart, Package, MapPin, MessageSquare } from 'lucide-react';
import { useCurrency } from '@/app/context/CurrencyContext';
import { useCart } from '@/app/context/CartContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { useProducts } from '@/app/context/ProductContext';
import { useAuth } from '@/app/context/AuthContext';
import { CustomerNotificationBell } from '@/app/components/CustomerNotificationBell';
import { QueryModal } from '@/app/components/QueryModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import honeyLogo from '@/assets/honey-log.webp';
import { projectId, publicAnonKey } from '@/app/utils/backendInfo';
import { startupProducts } from '@/app/data/startupProductsList';
import { getFirstValidImage } from '@/app/utils/imageUtils';
import { hasAdminAccess } from '@/app/utils/roleAccess';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
}

interface Category {
  name: string;
  slug: string;
  products: Product[];
}

export function HeaderNew() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [attestationOpen, setAttestationOpen] = useState(false);
  const [startupOpen, setStartupOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { currency, currencies, setCurrency } = useCurrency();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const { products: adminProducts, categories: adminCategories } = useProducts();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canAccessAdmin = hasAdminAccess(user?.email, user?.role);


  // Build dynamic categories from admin products
  const categories: Category[] = adminCategories.map(category => ({
    name: category.name,
    slug: category.slug,
    products: adminProducts
      .filter(product => product.category === category.name && product.status === 'active')
      .map(product => ({
        id: product.id,
        name: product.name,
        slug: product.id, // Use ID as slug for routing
        price: product.price,
        image: getFirstValidImage(product.images)
      }))
  }));

  // Get category by name
  const getCategory = (name: string) => {
    return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  };

  // For "Language" dropdown, check both "Language" and "Translation" categories
  const languageCategory = getCategory('Language') || getCategory('Translation');
  const attestationCategory = getCategory('Attestation');
  const startupCategory = getCategory('Startup') || getCategory('Startup Packages');
  
  const categoriesLoading = false; // Products are loaded synchronously from localStorage

  // Debug logging
  console.log('HeaderNew - Admin Products:', adminProducts);
  console.log('HeaderNew - Admin Categories:', adminCategories);
  console.log('HeaderNew - Built Categories:', categories);
  console.log('HeaderNew - Language Category:', languageCategory);

  // Close overlays on Escape key for full keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setQueryModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if current page is a "View All Services" page
  const isViewAllServicesPage = [
    '/all-language-products',
    '/all-translation-products',
    '/all-apostille-products',
    '/all-attestation-products',
    '/all-startup-products'
  ].includes(location.pathname);

  // Active navigation states based on current route
  const pathname = location.pathname;
  const isHome = pathname === '/';
  const isTranslation = pathname.startsWith('/all-translation-products') || pathname.startsWith('/all-language-products') || (pathname.startsWith('/product/') && Boolean(languageCategory?.products.some(p => pathname.includes(p.id))));
  const isApostille = pathname.startsWith('/all-apostille-products') || pathname.startsWith('/apostille');
  const isAttestation = pathname.startsWith('/all-attestation-products') || (pathname.startsWith('/product/') && Boolean(attestationCategory?.products.some(p => pathname.includes(p.id))));
  const isStartup = pathname.startsWith('/all-startup-products') || startupProducts.some(p => p.url === pathname);
  const isMore = ['/about', '/services', '/work-sample', '/contact-us', '/track-order', '/faq', '/blog', '/terms-and-conditions', '/privacy-policy', '/refund-cancellation-policy'].includes(pathname);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white shadow-md">
        {/* Top Bar */}
        <div className="bg-[#1a1f5c] text-white px-3 sm:px-6 py-2 w-full">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="order-2 sm:order-1 flex items-center gap-3 sm:gap-5 text-[12px] sm:text-[14px] flex-wrap">
            <a href="mailto:salesteam@honeytranslations.com" className="hover:text-gray-300 transition-colors">
              salesteam@honeytranslations.com
            </a>
            <div className="flex items-center gap-3">
              <a href="tel:+917299005577" className="hover:text-gray-300 transition-colors">
                +91 72990 05577
              </a>
            </div>
          </div>
          
          {/* Sign In/Out Button in Top Bar */}
          <div className="order-1 sm:order-2 flex items-center gap-2 w-full sm:w-auto justify-end">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => setQueryModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-orange-700 to-orange-800 hover:from-orange-800 hover:to-orange-900 text-white rounded-full transition-all text-[14px] font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                  title="Submit your query"
                >
                  <MessageSquare className="w-4 h-4" />
                  Query
                </button>

                {/* Notification Bell */}
                <CustomerNotificationBell />
                
                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">
                    <span className="text-white text-[15px]">Hi, {user.name?.split(' ')[0] || 'User'}</span>
                    <ChevronDown className="w-4 h-4 text-white" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 mt-2">
                    <DropdownMenuItem asChild>
                      <Link to="/my-profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-orders" className="cursor-pointer">
                        <Package className="w-4 h-4 mr-2" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-address" className="cursor-pointer">
                        <MapPin className="w-4 h-4 mr-2" />
                        My Address
                      </Link>
                    </DropdownMenuItem>
                    {canAccessAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-[15px]"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/signin"
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-[15px] inline-block"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

        {/* Main Navigation Bar */}
        <div className="bg-white border-b border-gray-100 w-full">
        <div className="max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-6 py-2">
          <div className="flex items-center justify-between gap-1.5 lg:gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 min-w-0">
              <img 
                src={honeyLogo} 
                alt="Honey Translation Services" 
                width={400}
                height={131}
                loading="eager"
                decoding="async"
                className="h-10 sm:h-12 lg:h-14 xl:h-16 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-shrink min-w-0 justify-center">
              <Link
                to="/"
                className={`transition-all font-bold text-xs xl:text-sm 2xl:text-base whitespace-nowrap ${
                  isHome
                    ? 'bg-[#1a1f5c] text-white px-3 xl:px-5 py-1.5 xl:py-2 rounded-full shadow-sm'
                    : 'text-gray-700 hover:text-[#1a1f5c] hover:bg-gray-100 px-2 xl:px-3 py-1.5 xl:py-2 rounded-full'
                }`}
              >
                Home
              </Link>

              {/* Translation Services Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setTranslationOpen(true)}
                onMouseLeave={() => setTranslationOpen(false)}
              >
                <DropdownMenu open={translationOpen} onOpenChange={setTranslationOpen}>
                  <DropdownMenuTrigger
                    className={`flex items-center gap-1 transition-all font-bold text-xs xl:text-sm 2xl:text-base whitespace-nowrap outline-none ${
                      isTranslation
                        ? 'bg-[#1a1f5c] text-white px-3 xl:px-4 py-1.5 xl:py-2 rounded-full shadow-sm'
                        : 'text-gray-700 hover:text-[#1a1f5c] hover:bg-gray-100 px-2 xl:px-3 py-1.5 xl:py-2 rounded-full'
                    }`}
                  >
                    Translation Services <ChevronDown className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform duration-200 ${translationOpen ? 'rotate-180' : ''}`} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="start">
                    <DropdownMenuItem asChild>
                      <Link to="/all-translation-products" className="font-semibold text-blue-600">
                        View All Translation Services
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {categoriesLoading ? (
                      <DropdownMenuItem disabled>
                        <span className="text-gray-500">Loading...</span>
                      </DropdownMenuItem>
                    ) : languageCategory && languageCategory.products.length > 0 ? (
                      languageCategory.products.map(product => (
                        <DropdownMenuItem key={product.id} asChild>
                          <Link to={`/product/${product.id}`}>{product.name}</Link>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        <span className="text-gray-500 text-xs">No products - Please initialize products via Admin Panel</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link
                to="/all-apostille-products"
                className={`transition-all font-bold text-xs xl:text-sm 2xl:text-base whitespace-nowrap ${
                  isApostille
                    ? 'bg-[#1a1f5c] text-white px-3 xl:px-4 py-1.5 xl:py-2 rounded-full shadow-sm'
                    : 'text-gray-700 hover:text-[#1a1f5c] hover:bg-gray-100 px-2 xl:px-3 py-1.5 xl:py-2 rounded-full'
                }`}
              >
                Apostille Services
              </Link>

              {/* Attestation Services Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setAttestationOpen(true)}
                onMouseLeave={() => setAttestationOpen(false)}
              >
                <DropdownMenu open={attestationOpen} onOpenChange={setAttestationOpen}>
                  <DropdownMenuTrigger
                    className={`flex items-center gap-1 transition-all font-bold text-xs xl:text-sm 2xl:text-base whitespace-nowrap outline-none ${
                      isAttestation
                        ? 'bg-[#1a1f5c] text-white px-3 xl:px-4 py-1.5 xl:py-2 rounded-full shadow-sm'
                        : 'text-gray-700 hover:text-[#1a1f5c] hover:bg-gray-100 px-2 xl:px-3 py-1.5 xl:py-2 rounded-full'
                    }`}
                  >
                    Attestation Services <ChevronDown className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform duration-200 ${attestationOpen ? 'rotate-180' : ''}`} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link to="/all-attestation-products" className="font-semibold text-blue-600">
                        View All Attestation Services
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {categoriesLoading ? (
                      <DropdownMenuItem disabled>
                        <span className="text-gray-500">Loading...</span>
                      </DropdownMenuItem>
                    ) : attestationCategory && attestationCategory.products.length > 0 ? (
                      attestationCategory.products.map(product => (
                        <DropdownMenuItem key={product.id} asChild>
                          <Link to={`/product/${product.id}`}>{product.name}</Link>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        <span className="text-gray-500">No products available</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Startup Packages Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setStartupOpen(true)}
                onMouseLeave={() => setStartupOpen(false)}
              >
                <DropdownMenu open={startupOpen} onOpenChange={setStartupOpen}>
                  <DropdownMenuTrigger
                    className={`flex items-center gap-1 transition-all font-bold text-xs xl:text-sm 2xl:text-base whitespace-nowrap outline-none ${
                      isStartup
                        ? 'bg-[#1a1f5c] text-white px-3 xl:px-4 py-1.5 xl:py-2 rounded-full shadow-sm'
                        : 'text-gray-700 hover:text-[#1a1f5c] hover:bg-gray-100 px-2 xl:px-3 py-1.5 xl:py-2 rounded-full'
                    }`}
                  >
                    Startup Packages <ChevronDown className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform duration-200 ${startupOpen ? 'rotate-180' : ''}`} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link to="/all-startup-products" className="font-semibold text-blue-600">
                        View All Startup Packages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {startupProducts.map(product => {
                      return (
                        <DropdownMenuItem key={product.id} asChild>
                          <Link to={product.url}>{product.name}</Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* More Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setMoreOpen(true)}
                onMouseLeave={() => setMoreOpen(false)}
              >
                <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
                  <DropdownMenuTrigger
                    className={`flex items-center gap-1 transition-all font-bold text-xs xl:text-sm 2xl:text-base whitespace-nowrap outline-none ${
                      isMore
                        ? 'bg-[#1a1f5c] text-white px-3 xl:px-4 py-1.5 xl:py-2 rounded-full shadow-sm'
                        : 'text-gray-700 hover:text-[#1a1f5c] hover:bg-gray-100 px-2 xl:px-3 py-1.5 xl:py-2 rounded-full'
                    }`}
                  >
                    More <ChevronDown className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link to="/about">About Us</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/services">Services</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/work-sample">Work Samples</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/contact-us">Contact Us</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/track-order">Track Order</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/faq">FAQ</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/blog">Blog</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/terms-and-conditions">Terms & Conditions</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/privacy-policy">Privacy Policy</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/refund-cancellation-policy">Refund & Cancellation Policy</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-2 xl:gap-3 flex-shrink-0">
              <Link
                to="/all-language-products"
                className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-1.5 xl:py-2 rounded-full bg-[#1a1f5c] text-white font-semibold text-xs xl:text-sm hover:bg-[#252b70] transition-colors whitespace-nowrap"
              >
                <ShoppingCart className="w-4 h-4" />
                Order Now
              </Link>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors relative flex-shrink-0"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5 text-gray-700" aria-hidden="true" />
                <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {getWishlistCount()}
                </span>
              </Link>

              {/* Cart - Always visible across all screen sizes and routes */}
              <Link
                to="/cart"
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors relative flex-shrink-0"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" aria-hidden="true" />
                <span className="absolute top-0.5 right-0.5 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {getCartCount()}
                </span>
              </Link>

              {/* Currency Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center justify-center gap-1.5 min-h-[40px] p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Select Currency"
                  >
                    <img 
                      src={currency.flag} 
                      alt={currency.code} 
                      width={20}
                      height={20}
                      loading="eager"
                      decoding="async"
                      className="w-5 h-5 rounded-full object-cover border border-gray-200"
                    />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      {currency.code}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {currencies.map((curr) => (
                    <DropdownMenuItem
                      key={curr.code}
                      onClick={() => setCurrency(curr)}
                      className={`flex items-center gap-3 cursor-pointer ${
                        currency.code === curr.code ? 'bg-blue-50' : ''
                      }`}
                    >
                      <img 
                        src={curr.flag} 
                        alt={curr.code} 
                        width={20}
                        height={20}
                        loading="lazy"
                        decoding="async"
                        className="w-5 h-5 rounded-full object-cover border border-gray-200"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{curr.name}</div>
                        <div className="text-xs text-gray-500">{curr.code} ({curr.symbol})</div>
                      </div>
                      {currency.code === curr.code && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 flex-shrink-0"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-full z-40 border-t border-gray-200 bg-white shadow-lg max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 space-y-2.5">
              {/* User Section in Mobile */}
              {user ? (
                <div className="border-b pb-3 mb-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name || 'User'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Link
                      to="/my-profile"
                      className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 hover:bg-gray-100 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <Link
                      to="/my-orders"
                      className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 hover:bg-gray-100 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package className="w-4 h-4" />
                      My Orders
                    </Link>
                    <Link
                      to="/my-address"
                      className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 hover:bg-gray-100 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <MapPin className="w-4 h-4" />
                      My Address
                    </Link>
                    {canAccessAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 hover:bg-gray-100 rounded-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 min-h-[44px] px-4 py-2.5 hover:bg-red-50 text-red-600 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-[#1a1f5c] text-white rounded-lg hover:bg-[#252b70] transition-colors font-medium"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </Link>
              )}
              
              <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
                <Link
                  to="/cart"
                  className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Cart ({getCartCount()})
                </Link>
                <Link
                  to="/wishlist"
                  className="flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="w-4 h-4" />
                  Wishlist ({getWishlistCount()})
                </Link>
              </div>
              
              <Link
                to="/"
                className={`flex items-center min-h-[44px] px-4 py-2.5 rounded-lg transition-colors font-medium ${
                  isHome ? 'bg-[#1a1f5c] text-white' : 'text-gray-800 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/all-language-products"
                className="flex items-center justify-center min-h-[44px] px-4 py-2.5 bg-blue-600 text-white rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Order Now
              </Link>
              <Link
                to="/all-translation-products"
                className={`flex items-center min-h-[44px] px-4 py-2.5 rounded-lg transition-colors font-medium ${
                  isTranslation ? 'bg-[#1a1f5c] text-white' : 'text-gray-800 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Translation Services
              </Link>
              <Link
                to="/all-apostille-products"
                className={`flex items-center min-h-[44px] px-4 py-2.5 rounded-lg transition-colors font-medium ${
                  isApostille ? 'bg-[#1a1f5c] text-white' : 'text-gray-800 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Apostille Services
              </Link>
              <Link
                to="/all-attestation-products"
                className={`flex items-center min-h-[44px] px-4 py-2.5 rounded-lg transition-colors font-medium ${
                  isAttestation ? 'bg-[#1a1f5c] text-white' : 'text-gray-800 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Attestation Services
              </Link>
              <Link
                to="/all-startup-products"
                className={`flex items-center min-h-[44px] px-4 py-2.5 rounded-lg transition-colors font-medium ${
                  isStartup ? 'bg-[#1a1f5c] text-white' : 'text-gray-800 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Startup Packages
              </Link>
              <Link
                to="/about"
                className="flex items-center min-h-[44px] px-4 py-2.5 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                to="/services"
                className="flex items-center min-h-[44px] px-4 py-2.5 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                to="/work-sample"
                className="flex items-center min-h-[44px] px-4 py-2.5 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Work Samples
              </Link>
              <Link
                to="/faq"
                className="flex items-center min-h-[44px] px-4 py-2.5 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
              <Link
                to="/blog"
                className="flex items-center min-h-[44px] px-4 py-2.5 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                to="/contact-us"
                className="flex items-center min-h-[44px] px-4 py-2.5 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact Us
              </Link>
            </div>
          </div>
        )}
        </div>
      </header>

      {/* Query Modal */}
      <QueryModal isOpen={queryModalOpen} onClose={() => setQueryModalOpen(false)} />
    </>
  );
}


