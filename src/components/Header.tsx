import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  LogOut,
  UserCircle,
  Settings,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://elshal.runasp.net';

const Header: React.FC = () => {
  const { getItemCount } = useApp();
  const { user, isAuthenticated, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      setSearchResult(null);
      setSearchError(null);
      return;
    }

    try {
      setIsLoading(true);
      setSearchError(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${apiUrl}/api/products/code/${searchCode.trim()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const product = await response.json();
          if (
            product.id &&
            product.name &&
            product.code &&
            product.price &&
            product.images?.[0]?.imagePath
          ) {
            setSearchResult(product);
          } else {
            setSearchError('البيانات المستلمة غير صالحة');
          }
        } else {
          throw new Error('Response is not JSON');
        }
      } else {
        const contentType = response.headers.get('content-type');
        let errorMessage = `خطأ في الخادم: ${response.status} ${response.statusText}`;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.message || errorMessage;
        } else if (response.status === 404) {
          errorMessage = 'لم يتم العثور على منتج بهذا الكود';
        }
        setSearchResult(null);
        setSearchError(errorMessage);
      }
    } catch {
      setSearchResult(null);
      setSearchError(
        'حدث خطأ أثناء البحث. تحقق من الاتصال بالإنترنت أو حاول مرة أخرى لاحقاً.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const itemCount = getItemCount();
  const currentPage = location.pathname;

  const menuItems = [
    { label: 'الرئيسية', page: 'home', icon: '🏠' },
    { label: 'شنط أطفال', page: 'kids-bags', icon: '🧸' },
    { label: 'شنط الفتيات', page: 'girls-bags', icon: '👛' },
    { label: 'مجموعة الأم والابنة', page: 'mother-daughter', icon: '👩‍👧' },
    { label: 'مجموعة رمضان', page: 'ramadan-collection', icon: '🌙' },
    { label: 'التصميمات الخاصة', page: 'custom-designs', icon: '🎨' },
    { label: 'التوزيعات', page: 'giveaways', icon: '🎁' },
  ];

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-md border-b border-[#E5DCC5] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between">
            {/* Menu Button - Always Visible */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-[#F5F5DC]/30 transition-all"
              aria-label="القائمة"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-[#8B7355]" />
              ) : (
                <MenuIcon className="h-6 w-6 text-[#8B7355]" />
              )}
            </button>

            {/* Logo + Name */}
            <Link
              to="/"
              className="flex items-center gap-3 transform hover:scale-105 transition-transform duration-300"
            >
              <img
                src="/turtle_art_logo.jpeg"
                alt="Turtle Art"
                className="h-12 w-12 rounded-full object-cover shadow-md"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  Turtle Art
                </h1>
                <p className="text-xs text-[#D4AF37]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  
                </p>
              </div>
            </Link>

            {/* Right Side: Search + Account + Cart */}
            <div className="flex items-center gap-3">
              {/* Search - Desktop */}
              <div className="hidden md:flex items-center">
                <div className="flex items-center space-x-reverse space-x-2 bg-[#F5F5DC]/50 rounded-lg px-4 py-2 border border-[#E5DCC5]">
                  <input
                    type="text"
                    placeholder="ابحث بكود المنتج..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-transparent outline-none text-right w-40 text-[#8B7355] placeholder:text-[#8B7355]/50"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                    dir="rtl"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSearch}
                    className="text-[#8B7355] hover:text-[#D4AF37] transition-colors"
                    disabled={isLoading}
                    aria-label="بحث"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>

              {/* User Account - Desktop */}
              <div className="hidden md:flex items-center">
                {isAuthenticated ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center space-x-reverse space-x-2 text-[#8B7355] hover:text-[#D4AF37] transition-colors p-2 rounded-lg hover:bg-[#F5F5DC]/30"
                    >
                      <UserCircle size={24} />
                      <span className="text-sm font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {user?.name}
                      </span>
                    </button>

                    {isProfileDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-[#E5DCC5] py-2 z-50">
                        <div className="px-4 py-3 border-b border-[#E5DCC5]">
                          <p className="text-sm font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {user?.name}
                          </p>
                          <p className="text-xs text-[#8B7355]/70 truncate" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {user?.email}
                          </p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center space-x-reverse space-x-3 px-4 py-3 text-[#8B7355] hover:bg-[#F5F5DC]/50 transition-colors"
                          style={{ fontFamily: 'Tajawal, sans-serif' }}
                        >
                          <Settings size={18} />
                          <span className="text-sm">الملف الشخصي</span>
                        </Link>

                        <Link
                          to="/my-orders"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center space-x-reverse space-x-3 px-4 py-3 text-[#8B7355] hover:bg-[#F5F5DC]/50 transition-colors"
                          style={{ fontFamily: 'Tajawal, sans-serif' }}
                        >
                          <ShoppingBag size={18} />
                          <span className="text-sm">طلباتي</span>
                        </Link>

                        {userRole === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center space-x-reverse space-x-3 px-4 py-3 text-[#D4AF37] hover:bg-[#F5F5DC]/50 transition-colors"
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            <Settings size={18} />
                            <span className="text-sm font-medium">لوحة التحكم</span>
                          </Link>
                        )}

                        <div className="border-t border-[#E5DCC5] mt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-reverse space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full"
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            <LogOut size={18} />
                            <span className="text-sm font-medium">تسجيل الخروج</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="text-[#8B7355] hover:text-[#D4AF37] font-medium transition-colors px-4 py-2 rounded-lg hover:bg-[#F5F5DC]/30"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    تسجيل دخول
                  </Link>
                )}
              </div>

              {/* Cart Button */}
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 rounded-full hover:bg-[#F5F5DC]/30 transition-all"
                aria-label="السلة"
              >
                <ShoppingBag className="h-6 w-6 text-[#8B7355]" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {isLoading && (
            <div className="mt-3 p-4 bg-[#F5F5DC]/50 rounded-lg border border-[#E5DCC5]">
              <p className="text-[#8B7355] text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                جارٍ البحث...
              </p>
            </div>
          )}

          {searchResult && !isLoading && (
            <div className="mt-3 p-4 bg-[#F5F5DC]/50 rounded-lg border border-[#D4AF37]">
              <div className="flex items-center space-x-reverse space-x-4">
                <img
                  src={`${apiUrl}${searchResult.images[0].imagePath}`}
                  alt={searchResult.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {searchResult.name}
                  </h3>
                  <p className="text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    كود المنتج: {searchResult.code}
                  </p>
                  <p className="text-[#D4AF37] font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {searchResult.price} جنيه
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate(`/product/${searchResult.id}`, {
                      state: { product: searchResult },
                    });
                    setSearchResult(null);
                    setSearchCode('');
                  }}
                  className="bg-[#D4AF37] text-white px-4 py-2 rounded-lg hover:bg-[#C49F27] transition-colors whitespace-nowrap"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  عرض المنتج
                </button>
              </div>
            </div>
          )}

          {searchError && !isLoading && (
            <div className="mt-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {searchError}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Menu Sidebar - Visible on All Devices */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="fixed top-0 right-0 w-72 h-full bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] shadow-2xl transform transition-transform duration-300 ease-out overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  Turtle Art 🐢
                </h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-white/50 transition-all"
                >
                  <X className="w-6 h-6 text-[#8B7355]" />
                </button>
              </div>

              {/* Search in Sidebar */}
              <div className="mb-6 md:hidden">
                <div className="flex items-center space-x-reverse space-x-2 bg-white/60 rounded-lg px-3 py-2 border border-[#E5DCC5]">
                  <input
                    type="text"
                    placeholder="ابحث بكود المنتج..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-transparent outline-none text-right flex-1 text-[#8B7355]"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                    dir="rtl"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSearch}
                    className="text-[#8B7355] hover:text-[#D4AF37]"
                    disabled={isLoading}
                    aria-label="بحث"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <nav className="space-y-2 mb-6">
                {menuItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => {
                      navigate(`/${item.page === 'home' ? '' : item.page}`);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-right px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between group ${
                      currentPage === `/${item.page === 'home' ? '' : item.page}`
                        ? 'bg-white/60 text-[#D4AF37]'
                        : 'text-[#8B7355] hover:bg-white/60'
                    }`}
                  >
                    <span className="text-lg font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {item.label}
                    </span>
                    <span className="text-2xl transform group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                  </button>
                ))}
              </nav>

              {/* User Account in Sidebar */}
              {isAuthenticated ? (
                <div className="border-t border-[#E5DCC5] pt-4 space-y-3">
                  <div className="px-4 py-2 bg-white/60 rounded-lg">
                    <p className="text-sm font-semibold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {user?.name}
                    </p>
                    <p className="text-xs text-[#8B7355]/70 truncate" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {user?.email}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-reverse space-x-3 py-3 px-4 text-[#8B7355] hover:text-[#D4AF37] font-medium transition-colors rounded-lg hover:bg-white/60"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <Settings size={18} />
                    <span>الملف الشخصي</span>
                  </Link>

                  {userRole === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-reverse space-x-3 py-3 px-4 text-[#D4AF37] hover:text-[#C49F27] font-medium transition-colors rounded-lg hover:bg-white/60"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      <Settings size={18} />
                      <span>لوحة التحكم</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-reverse space-x-3 w-full text-right py-3 px-4 text-red-600 hover:text-red-700 font-medium transition-colors rounded-lg hover:bg-red-50"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <LogOut size={18} />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-[#E5DCC5] pt-4">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-right py-3 px-4 text-[#8B7355] hover:text-[#D4AF37] font-medium transition-colors rounded-lg hover:bg-white/60"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    تسجيل دخول
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
