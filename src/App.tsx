// src/App.tsx

import React, { useEffect, useMemo } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import { BottomNav } from './components/BottomNav';

import ExternalBrowserGuard from './components/ExternalBrowserGuard';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onForegroundMessage } from './services/firebase';
import { Unsubscribe } from 'firebase/messaging';

// Public Pages
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import InstantPage from './pages/InstantPage';
import NotFoundPage from './pages/NotFoundPage';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';

// Category pages
import KidsBagsPage from './pages/KidsBagsPage';
import GirlsBagsPage from './pages/GirlsBagsPage';
import GirlsBagsEveningPage from './pages/GirlsBagsEveningPage';
import GirlsBagsCasualPage from './pages/GirlsBagsCasualPage';
import MomDaughterSetPage from './pages/MomDaughterSetPage';
import RamadanSetPage from './pages/RamadanSetPage';
import GiveawaysPage from './pages/GiveawaysPage';

// Admin Pages
import AdminPage from './pages/admin/AdminPage';
import ProductsManagement from './pages/admin/ProductsManagement';
import OrdersManagement from './pages/admin/OrdersManagement';
import CustomersManagement from './pages/admin/CustomersManagement';
import DiscountCodesManagement from './pages/admin/DiscountCodesManagement';
import ShippingManagement from './pages/admin/ShippingManagement';
import OrderNotifications from './pages/admin/OrderNotifications';
import CakeConfigurationManagement from './pages/admin/CakeConfigurationManagement';
import CustomOrdersManagement from './pages/admin/CustomOrdersManagement';

import CompleteProfile from './pages/CompleteProfile';
import ProfilePage from './pages/ProfilePage';
import CustomOrders from './pages/CustomOrders';
import MyCustomOrders from './pages/MyCustomOrders';
import CustomOrderNotifications from './pages/admin/CustomOrderNotifications';
import AllProductsPage from './pages/AllProductsPage';

function useNavPageId() {
  const { pathname } = useLocation();

  return useMemo(() => {
    // ✅ map routes to BottomNav ids
    if (pathname === '/' || pathname.startsWith('/product')) return 'home';

    if (pathname.startsWith('/kids-bags')) return 'kids-bags';

    // Girls bags (including evening/casual sub-routes)
    if (pathname.startsWith('/girls-bags')) return 'girls-bags';

    // لو عندك صفحة /girls-bags فعلاً حطها هنا
    if (
      pathname.startsWith('/girls-bags') ||
      pathname.startsWith('/mother-daughter') ||
      pathname.startsWith('/ramadan-collection')
    ) {
      return 'girls-bags';
    }

    if (pathname.startsWith('/giveaways')) return 'giveaways';

    if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) return 'cart';

    // افتراضي
    return 'home';
  }, [pathname]);
}

// ✅ Public Layout: Header + Footer + BottomNav always
function PublicLayout() {
  const navigate = useNavigate();
  const currentPage = useNavPageId();

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'home':
        navigate('/');
        break;
      case 'kids-bags':
        navigate('/kids-bags');
        break;
      case 'girls-bags':
        navigate('/girls-bags');
        break;
      case 'giveaways':
        navigate('/giveaways');
        break;
      case 'cart':
        navigate('/cart');
        break;
      case 'custom-designs':
        navigate('/custom-designs');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <Header />

      {/* ✅ pb-24 so pages never get covered by BottomNav */}
      <main className="flex-grow pb-24">
        <Outlet />
      </main>

      <Footer />

      <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
}

// ✅ Admin Layout: no Header/Footer/BottomNav
function AdminLayout() {
  return (
    <div className="min-h-screen" dir="rtl">
      <Outlet />
    </div>
  );
}

function AppContent() {
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    if ('Notification' in window) {
      unsubscribe = onForegroundMessage((payload) => {
        const { notification } = payload;
        toast.info(
          <div>
            <strong>{notification?.title}</strong>
            <br />
            {notification?.body}
          </div>,
          {
            position: 'top-right',
            autoClose: 6000,
          }
        );
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <>
      {/* ✅ runs ASAP before routing */}
      <ExternalBrowserGuard />

      <Router>
        <Routes>
          {/* ✅ Admin routes without public layout */}
          <Route path="/admin" element={<AdminLayout />}>
            {/* ✅ IMPORTANT: /admin redirects to /admin/notifications */}
            <Route index element={<Navigate to="/admin/notifications" replace />} />

            {/* ✅ Admin nested pages */}
            <Route
              path="*"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            >
              <Route path="notifications" element={<OrderNotifications />} />
              <Route path="custom-order-notifications" element={<CustomOrderNotifications />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="customers" element={<CustomersManagement />} />
              <Route path="discounts" element={<DiscountCodesManagement />} />
              <Route path="shipping" element={<ShippingManagement />} />
              <Route path="custom-orders-management" element={<CustomOrdersManagement />} />
              <Route path="cake-configuration" element={<CakeConfigurationManagement />} />
            </Route>
          </Route>

          {/* ✅ Public routes with layout */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />

            <Route path="/products" element={<AllProductsPage />} />

            {/* Public category pages */}
            <Route path="instant" element={<InstantPage />} />
            <Route path="kids-bags" element={<KidsBagsPage />} />

            {/* Girls Bags main + sub-categories */}
            <Route path="girls-bags" element={<GirlsBagsPage />} />
            <Route path="girls-bags/evening" element={<GirlsBagsEveningPage />} />
            <Route path="girls-bags/casual" element={<GirlsBagsCasualPage />} />

            <Route path="mother-daughter" element={<MomDaughterSetPage />} />
            <Route path="ramadan-collection" element={<RamadanSetPage />} />
            <Route path="giveaways" element={<GiveawaysPage />} />

            {/* Auth */}
            <Route path="login" element={<LoginPage />} />

            {/* Product */}
            <Route path="product/:id" element={<ProductPage />} />

            {/* Protected */}
            <Route
              path="custom-designs"
              element={
                <ProtectedRoute>
                  <CustomOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="my-orders"
              element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="my-custom-orders"
              element={
                <ProtectedRoute>
                  <MyCustomOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="order/:id"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>

        <ToastContainer />
      </Router>
    </>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
