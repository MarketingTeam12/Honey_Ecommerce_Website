import { useState, useEffect } from "react";
import { Suspense, lazy } from "react";
import AdminUpload from "@/app/components/AdminUpload";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { initializeStorageBucket } from "@/app/utils/backendStorage";
import {
  // initializeDemoToken,
} from "@/app/utils/buildHeaders";
import {
  projectId,
  publicAnonKey,
} from "@/app/utils/backendInfo";


// Import contexts
import { AuthProvider } from "@/app/context/AuthContext";
import { AuthGateProvider } from "@/app/context/AuthGateContext";
import { CurrencyProvider } from "@/app/context/CurrencyContext";
import { CartProvider } from "@/app/context/CartContext";
import { WishlistProvider } from "@/app/context/WishlistContext";
import { ProductProvider } from "@/app/context/ProductContext";

// Import pages
const HomePage = lazy(() => import("@/app/pages/HomePage"));
const ContactPage = lazy(() => import("@/app/pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("@/app/pages/PrivacyPolicyPage"));
const FAQPage = lazy(() => import("@/app/pages/FAQPage"));
const BlogPage = lazy(() => import("@/app/pages/BlogPage"));
const SignInPage = lazy(() => import("@/app/pages/SignInPage"));
const SignUpPage = lazy(() => import("@/app/pages/SignUpPage"));
const AuthCallbackPage = lazy(() => import("@/app/pages/AuthCallbackPage"));
const WishlistPage = lazy(() => import("@/app/pages/WishlistPage"));
const TestReviewPage = lazy(() => import("@/app/pages/TestReviewPage"));

// Admin pages
import AdminDashboard from "@/app/pages/admin/AdminDashboard";
import ItemsPage from "@/app/pages/admin/ItemsPage";
import AddEditItemPage from "@/app/pages/admin/AddEditItemPage";
import ProductFieldsConfigPage from "@/app/pages/admin/ProductFieldsConfigPage";
import CategoriesPage from "@/app/pages/admin/CategoriesPage";
import CouponsPage from "@/app/pages/admin/CouponsPage";
import OrdersPageAdmin from "@/app/pages/admin/OrdersPage";
import OrderDetailPageAdmin from "@/app/pages/admin/OrderDetailPage";
import CustomersPage from "@/app/pages/admin/CustomersPage";
import RoleManagementPage from "@/app/pages/admin/RoleManagementPage";
import CustomerEmailsPage from "@/app/pages/admin/CustomerEmailsPage";
import { CustomerQueriesPage } from "@/app/pages/admin/CustomerQueriesPage";
import SalesPage from "@/app/pages/admin/SalesPage";
import NotificationsPage from "@/app/pages/admin/NotificationsPage";
import ReportsPage from "@/app/pages/admin/ReportsPage";
import OrderManagementDemoPage from "@/app/pages/admin/OrderManagementDemoPage";
import WorkSamplesPage from "@/app/pages/admin/WorkSamplesPage";
import InitializeWorkSamplesPage from "@/app/pages/admin/InitializeWorkSamplesPage";
import DebugOrdersPage from "@/app/pages/admin/DebugOrdersPage";
import { OrdersDiagnosticsPage } from "@/app/pages/admin/OrdersDiagnosticsPage";
import { APIKeysPage } from "@/app/pages/admin/APIKeysPage";
import { PaymentSettingsPage } from "@/app/pages/admin/PaymentSettingsPage";
import { ItemReviewsPage } from "@/app/pages/admin/ItemReviewsPage";
import { DataCleanupPage } from "@/app/pages/admin/DataCleanupPage";
import OrdersSetupPage from "@/app/pages/admin/OrdersSetupPage";
import { OrdersSetupChecklistPage } from "@/app/pages/admin/OrdersSetupChecklistPage";
import QuickOrdersFixPage from "@/app/pages/admin/QuickOrdersFixPage";
import { DiagnosticPage } from "@/app/pages/admin/DiagnosticPage";
import { DeploymentGuidePage } from "@/app/pages/admin/DeploymentGuidePage";

// Pages used in routes
const CheckoutDemo = lazy(() => import("@/app/pages/CheckoutDemo"));
const ProductPage = lazy(() => import("@/app/pages/ProductPage"));
const TrackOrderPage = lazy(() => import("@/app/pages/TrackOrderPage"));
const LiveOrderTrackingPage = lazy(() => import("@/app/pages/LiveOrderTrackingPage"));
const AllApostilleProductsPage = lazy(() => import("@/app/pages/AllApostilleProductsPage"));
const ApostillePage = lazy(() => import("@/app/pages/ApostillePage"));
const AllAttestationProductsPage = lazy(() => import("@/app/pages/AllAttestationProductsPage"));
const AllStartupProductsPage = lazy(() => import("@/app/pages/AllStartupProductsPage"));
const AllLanguageProductsPage = lazy(() => import("@/app/pages/AllLanguageProductsPage"));
const MyOrdersPage = lazy(() => import("@/app/pages/MyOrdersPage"));
const MyProfilePage = lazy(() => import("@/app/pages/MyProfilePage"));
const MyAddressPage = lazy(() => import("@/app/pages/MyAddressPage"));
const MyDashboardPage = lazy(() => import("@/app/pages/MyDashboardPage"));
const NewCartPage = lazy(() => import("@/app/pages/NewCartPage"));
const NewCheckoutAddressPage = lazy(() => import("@/app/pages/NewCheckoutAddressPage"));
const NewCheckoutReviewPage = lazy(() => import("@/app/pages/NewCheckoutReviewPage"));
const NewPaymentPage = lazy(() => import("@/app/pages/NewPaymentPage"));
const BankGatewayPage = lazy(() => import("@/app/pages/BankGatewayPage"));
const WalletGatewayPage = lazy(() => import("@/app/pages/WalletGatewayPage"));
const OrderSuccessPage = lazy(() => import("@/app/pages/OrderSuccessPage"));
const PaymentSummaryPage = lazy(() => import("@/app/pages/PaymentSummaryPage"));
const AllTranslationProductsPage = lazy(() => import("@/app/pages/AllTranslationProductsPage"));
const TermsAndConditionsPage = lazy(() => import("@/app/pages/TermsAndConditionsPage"));
const RefundCancellationPolicyPage = lazy(() => import("@/app/pages/RefundCancellationPolicyPage"));
const WorkSamplePage = lazy(() => import("@/app/pages/WorkSamplePage"));
const TermsOfServicePage = lazy(() => import("@/app/pages/TermsOfServicePage"));
const SwornTranslationsListingPage = lazy(() => import("@/app/pages/SwornTranslationsListingPage"));
const SwornTranslationPage = lazy(() => import("@/app/pages/SwornTranslationPage"));
const ContentPage = lazy(() => import("@/app/pages/ContentPage"));
const ServicesPage = lazy(() => import("@/app/pages/ServicesPage"));
const DirectProductPage = lazy(() => import("@/app/pages/DirectProductPage"));
const ContactUsPage = lazy(() => import("@/app/pages/ContactUsPage"));
const PricingPlanPage = lazy(() => import("@/app/pages/PricingPlanPage"));
const ZohoPaymentDemoPage = lazy(() => import("@/app/pages/ZohoPaymentDemoPage"));
const QuickPaymentPage = lazy(() => import("@/app/pages/QuickPaymentPage"));
const TestPayNowPage = lazy(() => import("@/app/pages/TestPayNowPage"));

// Import components
import { SalesNotificationPopup } from "@/app/components/SalesNotificationPopup";
import SalesIQWidget from "@/app/components/SalesIQWidget";
import DemoUserInitializer from "@/app/components/DemoUserInitializer";
import ErrorBoundary from "@/app/components/ErrorBoundary";
import ScrollToTop from "@/app/components/ScrollToTop";
import PublicLayout from "@/app/components/layout/PublicLayout";
import { PublicPageSkeleton } from "@/app/components/layout/PageSkeleton";

function App() {
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("🚀 App initialization started...");

        // Initialize storage bucket (non-blocking)
        initializeStorageBucket()
          .then(({ success }) => {
            if (success) {
              console.log("✅ Storage bucket initialized");
            }
          })
          .catch((err) => {
            console.log(
              "ℹ Storage bucket initialization failed (non-critical):",
              err,
            );
          });

        // Supabase/Edge-function demo auth initialization removed.



        // Mark app as ready immediately - don't wait for demo initialization
        console.log("✅ App ready!");
        setAppReady(true);
      } catch (error) {
        console.error("❌ App initialization error:", error);
        setInitError(
          error instanceof Error
            ? error.message
            : "Unknown error",
        );
        setAppReady(true); // Still render app even if init fails
      }
    };

    initializeApp();
  }, []);

  if (!appReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">
            Loading Honey Translation Services...
          </p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Initialization Error
          </h1>
          <p className="text-gray-600 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ScrollToTop />
        <DemoUserInitializer />
        <AuthProvider>
          <AuthGateProvider>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                <ProductProvider>
                  <SalesIQWidget />
                  <SalesNotificationPopup />
                  <Toaster position="top-right" richColors closeButton />
                  <Suspense
                    fallback={<PublicPageSkeleton />}
                  >
                    <Routes>
                    <Route
                      path="/admin-upload"
                      element={<AdminUpload />}
                    />
                    <Route
                      path="/signin"
                      element={<SignInPage />}
                    />
                    <Route
                      path="/login"
                      element={<SignInPage />}
                    />
                    <Route
                      path="/signup"
                      element={<SignUpPage />}
                    />
                    <Route
                      path="/auth/callback"
                      element={<AuthCallbackPage />}
                    />
                    <Route
                      path="/test-review"
                      element={<TestReviewPage />}
                    />
                    <Route
                      path="/admin"
                      element={<AdminDashboard />}
                    />
                    <Route
                      path="/admin/items"
                      element={<ItemsPage />}
                    />
                    <Route
                      path="/admin/items/new"
                      element={<AddEditItemPage />}
                    />
                    <Route
                      path="/admin/items/edit/:id"
                      element={<AddEditItemPage />}
                    />
                    <Route
                      path="/admin/product-fields-config"
                      element={<ProductFieldsConfigPage />}
                    />
                    <Route
                      path="/admin/categories"
                      element={<CategoriesPage />}
                    />
                    <Route
                      path="/admin/coupons"
                      element={<CouponsPage />}
                    />
                    <Route
                      path="/admin/item-reviews"
                      element={<ItemReviewsPage />}
                    />
                    <Route
                      path="/admin/collections"
                      element={<ItemsPage />}
                    />
                    <Route
                      path="/admin/price-lists"
                      element={<ItemsPage />}
                    />
                    <Route
                      path="/admin/orders"
                      element={<OrdersPageAdmin />}
                    />
                    <Route
                      path="/admin/orders/:orderId"
                      element={<OrderDetailPageAdmin />}
                    />
                    <Route
                      path="/admin/customers"
                      element={<CustomersPage />}
                    />
                    <Route
                      path="/admin/users"
                      element={<CustomersPage />}
                    />
                    <Route
                      path="/admin/roles"
                      element={<RoleManagementPage />}
                    />
                    <Route
                      path="/admin/customer-emails"
                      element={<CustomerEmailsPage />}
                    />
                    <Route
                      path="/admin/customer-queries"
                      element={<CustomerQueriesPage />}
                    />
                    <Route
                      path="/admin/sales"
                      element={<SalesPage />}
                    />
                    <Route
                      path="/admin/sales/orders"
                      element={<OrdersPageAdmin />}
                    />
                    <Route
                      path="/admin/sales/orders/:orderId"
                      element={<OrderDetailPageAdmin />}
                    />
                    <Route
                      path="/admin/notifications"
                      element={<NotificationsPage />}
                    />
                    <Route
                      path="/admin/reports"
                      element={<ReportsPage />}
                    />
                    <Route
                      path="/admin/api-keys"
                      element={<APIKeysPage />}
                    />
                    <Route
                      path="/admin/payment-settings"
                      element={<PaymentSettingsPage />}
                    />
                    <Route
                      path="/admin/data-cleanup"
                      element={<DataCleanupPage />}
                    />
                    <Route
                      path="/admin/work-samples"
                      element={<WorkSamplesPage />}
                    />
                    <Route
                      path="/admin/work-samples/initialize"
                      element={<InitializeWorkSamplesPage />}
                    />
                    <Route
                      path="/admin/order-management-demo"
                      element={<OrderManagementDemoPage />}
                    />
                    <Route
                      path="/admin/debug/orders"
                      element={<DebugOrdersPage />}
                    />
                    <Route
                      path="/admin/orders-diagnostics"
                      element={<OrdersDiagnosticsPage />}
                    />
                    <Route
                      path="/admin/orders-setup"
                      element={<OrdersSetupPage />}
                    />
                    <Route
                      path="/admin/orders-setup/checklist"
                      element={<OrdersSetupChecklistPage />}
                    />
                    <Route
                      path="/admin/quick-orders-fix"
                      element={<QuickOrdersFixPage />}
                    />
                    <Route
                      path="/admin/diagnostics"
                      element={<DiagnosticPage />}
                    />
                    <Route
                      path="/admin/deployment-guide"
                      element={<DeploymentGuidePage />}
                    />
                    <Route
                      path="/"
                      element={
                        <PublicLayout>
                          <HomePage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/checkout-demo"
                      element={
                        <PublicLayout>
                          <CheckoutDemo />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/product/:id"
                      element={
                        <PublicLayout>
                          <ProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/track-order"
                      element={
                        <PublicLayout>
                          <TrackOrderPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/live-order-tracking/:orderId"
                      element={
                        <PublicLayout>
                          <LiveOrderTrackingPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/apostille-products"
                      element={
                        <PublicLayout>
                          <AllApostilleProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/apostille/:id"
                      element={
                        <PublicLayout>
                          <ApostillePage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/attestation-products"
                      element={
                        <PublicLayout>
                          <AllAttestationProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/apostille"
                      element={
                        <PublicLayout>
                          <AllApostilleProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/apostille/:country"
                      element={
                        <PublicLayout>
                          <ApostillePage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/attestation"
                      element={
                        <PublicLayout>
                          <AllAttestationProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/attestation/:country"
                      element={
                        <PublicLayout>
                          <ApostillePage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/startup"
                      element={
                        <PublicLayout>
                          <AllStartupProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/startup/:type"
                      element={
                        <PublicLayout>
                          <ApostillePage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/language"
                      element={
                        <PublicLayout>
                          <AllLanguageProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/startup-products"
                      element={
                        <PublicLayout>
                          <AllStartupProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/language-products"
                      element={
                        <PublicLayout>
                          <AllLanguageProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/contact"
                      element={
                        <PublicLayout>
                          <ContactPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/wishlist"
                      element={
                        <PublicLayout>
                          <WishlistPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/cart"
                      element={
                        <PublicLayout>
                          <NewCartPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/my-dashboard"
                      element={
                        <PublicLayout>
                          <MyDashboardPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/my-orders"
                      element={
                        <PublicLayout>
                          <MyOrdersPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/my-profile"
                      element={
                        <PublicLayout>
                          <MyProfilePage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/my-address"
                      element={
                        <PublicLayout>
                          <MyAddressPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/checkout/address"
                      element={
                        <PublicLayout>
                          <NewCheckoutAddressPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/checkout/review"
                      element={
                        <PublicLayout>
                          <NewCheckoutReviewPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/checkout/payment"
                      element={
                        <PublicLayout>
                          <NewPaymentPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/checkout/bank-gateway"
                      element={
                        <PublicLayout>
                          <BankGatewayPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/checkout/wallet-gateway"
                      element={
                        <PublicLayout>
                          <WalletGatewayPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/order-success"
                      element={
                        <PublicLayout>
                          <OrderSuccessPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/payment-summary"
                      element={
                        <PublicLayout>
                          <PaymentSummaryPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/translation-products"
                      element={
                        <PublicLayout>
                          <AllTranslationProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/terms-and-conditions"
                      element={
                        <PublicLayout>
                          <TermsAndConditionsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/privacy-policy"
                      element={
                        <PublicLayout>
                          <PrivacyPolicyPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/refund-cancellation-policy"
                      element={
                        <PublicLayout>
                          <RefundCancellationPolicyPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/faq"
                      element={
                        <PublicLayout>
                          <FAQPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/work-sample"
                      element={
                        <PublicLayout>
                          <WorkSamplePage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/terms-of-service"
                      element={
                        <PublicLayout>
                          <TermsOfServicePage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/pricing-plan"
                      element={
                        <PublicLayout>
                          <PricingPlanPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/contact-us"
                      element={
                        <PublicLayout>
                          <ContactUsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/blog"
                      element={
                        <PublicLayout>
                          <BlogPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/services"
                      element={
                        <PublicLayout>
                          <ServicesPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/sworn-translations-listing"
                      element={
                        <PublicLayout>
                          <SwornTranslationsListingPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/sworn-translation/:id"
                      element={
                        <PublicLayout>
                          <SwornTranslationPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/sworn-translations"
                      element={
                        <PublicLayout>
                          <SwornTranslationsListingPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/sworn-translation/:language"
                      element={
                        <PublicLayout>
                          <SwornTranslationPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/terms-conditions"
                      element={
                        <PublicLayout>
                          <TermsAndConditionsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/refund-cancellation"
                      element={
                        <PublicLayout>
                          <RefundCancellationPolicyPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/pricing"
                      element={
                        <PublicLayout>
                          <PricingPlanPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/about"
                      element={
                        <PublicLayout>
                          <ContentPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/all-translation-products"
                      element={
                        <PublicLayout>
                          <AllTranslationProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/all-apostille-products"
                      element={
                        <PublicLayout>
                          <AllApostilleProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/all-attestation-products"
                      element={
                        <PublicLayout>
                          <AllAttestationProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/all-startup-products"
                      element={
                        <PublicLayout>
                          <AllStartupProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/all-language-products"
                      element={
                        <PublicLayout>
                          <AllLanguageProductsPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/english-to-foreign-language"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/foreign-language-to-english"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/any-indian-language-to-english"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/english-to-any-indian-language"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/uae-attestation"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/china-attestation"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/qatar-attestation"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/kuwait-attestation"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/hrd-attestation-tn"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/basic-startup-package"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/standard-startup-package"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/premium-startup-package"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/content/:id"
                      element={
                        <PublicLayout>
                          <ContentPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/direct-product/:id"
                      element={
                        <PublicLayout>
                          <DirectProductPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/zoho-payment-demo"
                      element={
                        <PublicLayout>
                          <ZohoPaymentDemoPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/quick-payment"
                      element={
                        <PublicLayout>
                          <QuickPaymentPage />
                        </PublicLayout>
                      }
                    />
                    <Route
                      path="/test-pay-now"
                      element={
                        <PublicLayout>
                          <TestPayNowPage />
                        </PublicLayout>
                      }
                    />
                    </Routes>
                  </Suspense>
                </ProductProvider>
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
          </AuthGateProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
