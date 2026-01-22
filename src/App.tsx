// src/App.tsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onForegroundMessage } from './services/firebase';

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

// ✅ New category pages
import KidsBagsPage from './pages/KidsBagsPage';
import GirlsBagsPage from './pages/GirlsBagsPage';
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
import { Unsubscribe } from 'firebase/messaging';
import OrderNotifications from './pages/admin/OrderNotifications';
import CompleteProfile from './pages/CompleteProfile';
import ProfilePage from './pages/ProfilePage';
import CustomOrders from './pages/CustomOrders';
import CakeConfigurationManagement from './pages/admin/CakeConfigurationManagement';
import CustomOrdersManagement from './pages/admin/CustomOrdersManagement';
import MyCustomOrders from './pages/MyCustomOrders';

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
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
        <Routes>
          <Route path="/admin/*" element={null} />
          <Route path="*" element={<Header />} />
        </Routes>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* Public category pages */}
            <Route path="/instant" element={<InstantPage />} />
            <Route path="/kids-bags" element={<KidsBagsPage />} />
            <Route path="/girls-bags" element={<GirlsBagsPage />} />
            <Route path="/mother-daughter" element={<MomDaughterSetPage />} />
            <Route path="/ramadan-collection" element={<RamadanSetPage />} />
            <Route path="/giveaways" element={<GiveawaysPage />} />

            {/* Protected Routes - Require Authentication */}
            <Route
              path="/custom-designs"
              element={
                <ProtectedRoute>
                  <CustomOrders />
                </ProtectedRoute>
              }
            />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-orders"
              element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-custom-orders"
              element={
                <ProtectedRoute>
                  <MyCustomOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order/:id"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="notifications" replace />} />
              <Route path="notifications" element={<OrderNotifications />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="customers" element={<CustomersManagement />} />
              <Route path="discounts" element={<DiscountCodesManagement />} />
              <Route path="shipping" element={<ShippingManagement />} />
              <Route path="custom-orders-management" element={<CustomOrdersManagement />} />
              <Route path="cake-configuration" element={<CakeConfigurationManagement />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Routes>
          <Route path="/admin/*" element={null} />
          <Route path="*" element={<Footer />} />
        </Routes>

        <ToastContainer />
      </div>
    </Router>
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
