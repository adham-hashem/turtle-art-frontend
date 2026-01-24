// src/pages/admin/AdminPage.tsx

import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowRight, Package, Users, ShoppingCart, LogOut, Tag, Truck, Menu, X, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationButton from '../../components/NotificationButton';

const AdminPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { to: '/admin/notifications', icon: Bell, label: 'إشعارات الطلبات' },
    { to: '/admin/products', icon: Package, label: 'إدارة المنتجات' },
    { to: '/admin/orders', icon: ShoppingCart, label: 'إدارة الطلبات' },
    { to: '/admin/customers', icon: Users, label: 'إدارة العملاء' },
    { to: '/admin/discounts', icon: Tag, label: 'أكواد الخصم' },
    { to: '/admin/shipping', icon: Truck, label: 'رسوم الشحن' },
    { to: '/admin/custom-orders-management', icon: Truck, label: 'طلبات خاصة' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] via-[#F5F5DC] to-white">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-2 border-[#E5DCC5] sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-reverse space-x-2 sm:space-x-4">
              <div className="relative">
                <img 
                  src="/turtle_art_logo.jpeg" 
                  alt="Turtle Art" 
                  className="h-10 w-10 sm:h-14 sm:w-14 rounded-full object-cover border-2 border-[#E5DCC5] shadow-md" 
                />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  لوحة تحكم Turtle Art
                </h1>
                <p className="text-xs sm:text-sm text-[#C4A57B] hidden sm:block" style={{ fontFamily: 'Tajawal, sans-serif' }}>مرحباً مدير النظام 👑</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-reverse space-x-4">
              <NotificationButton />
              <Link
                to="/"
                className="flex items-center space-x-reverse space-x-2 px-4 py-2 text-[#8B7355] hover:text-[#D4AF37] hover:bg-[#FAF9F6] rounded-lg transition-all font-medium"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <ArrowRight size={20} />
                <span>العودة للموقع</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-reverse space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all font-medium"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <LogOut size={20} />
                <span>تسجيل خروج</span>
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-reverse space-x-2">
              <NotificationButton />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-[#8B7355] hover:text-[#D4AF37] hover:bg-[#FAF9F6] rounded-lg transition-all"
                aria-label="القائمة"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t-2 border-[#E5DCC5] bg-white shadow-lg">
            <nav className="container mx-auto px-3 py-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white shadow-md' 
                        : 'text-[#8B7355] hover:bg-[#FAF9F6]'
                    }`
                  }
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <div className="border-t-2 border-[#E5DCC5] pt-2 mt-2 space-y-1">
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-reverse space-x-3 px-4 py-3 text-[#8B7355] hover:bg-[#FAF9F6] rounded-xl transition-all font-medium"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <ArrowRight size={20} />
                  <span>العودة للموقع</span>
                </Link>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-reverse space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <LogOut size={20} />
                  <span>تسجيل خروج</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24 border-2 border-[#E5DCC5]">
              <div className="mb-6 pb-4 border-b-2 border-[#E5DCC5]">
                <h2 className="text-lg font-bold text-[#8B7355] flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                  القائمة الرئيسية
                </h2>
              </div>
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `w-full flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                        isActive 
                          ? 'bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white shadow-lg transform scale-105' 
                          : 'text-[#8B7355] hover:bg-[#FAF9F6] hover:text-[#D4AF37]'
                      }`
                    }
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Sidebar Footer */}
              <div className="mt-6 pt-6 border-t-2 border-[#E5DCC5]">
                <div className="bg-gradient-to-br from-[#FAF9F6] to-[#F5F5DC] rounded-xl p-4 text-center border-2 border-[#E5DCC5]">
                  <Sparkles className="h-8 w-8 text-[#D4AF37] mx-auto mb-2" />
                  <p className="text-sm text-[#8B7355] font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>Turtle Art</p>
                  <p className="text-xs text-[#C4A57B]" style={{ fontFamily: 'Tajawal, sans-serif' }}>لوحة التحكم</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-[#E5DCC5]">
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Decoration Elements */}
      <div className="fixed bottom-8 right-8 pointer-events-none hidden lg:block opacity-10">
        <Sparkles className="h-16 w-16 text-[#8B7355] animate-pulse" />
      </div>
    </div>
  );
};

export default AdminPage;
