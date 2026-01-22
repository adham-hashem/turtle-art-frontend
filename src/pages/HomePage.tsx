import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { BottomNav } from '../components/BottomNav';

interface ApiResponse {
  items: Product[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

interface HomeRestoreState {
  scrollY: number;
}

const HomePage: React.FC = () => {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreScroll, setRestoreScroll] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const state = location.state?.fromHome as HomeRestoreState | undefined;

    if (state) {
      setRestoreScroll(state.scrollY);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('jwt_token') || 'jwt_token';
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      const response = await fetch(
        `${apiUrl}/api/products?pageNumber=1&pageSize=10`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const contentType = response.headers.get('Content-Type');

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status} ${response.statusText}`
        );
      }

      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(
          `Invalid response format: Expected JSON, received ${contentType}`
        );
      }

      const data: ApiResponse = await response.json();

      if (!data || !Array.isArray(data.items)) {
        throw new Error('Invalid response format: items is not an array');
      }

      const mappedProducts: Product[] = data.items.map((item) => ({
        id: item.id,
        name: item.name || '',
        code: item.code || '',
        price: item.price || 0,
        originalPrice: item.originalPrice || undefined,
        description: item.description || '',
        createdAt: item.createdAt || new Date().toISOString(),

        images: Array.isArray(item.images) ? item.images : [],
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        colors: Array.isArray(item.colors) ? item.colors : [],

        isHidden: item.isHidden !== undefined ? item.isHidden : false,
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        isInstant: item.isInstant !== undefined ? item.isInstant : false,
        isFeatured: item.isFeatured !== undefined ? item.isFeatured : false,

        inStock: item.isAvailable !== undefined ? item.isAvailable : true,
        isOffer: (item.originalPrice !== undefined && 
                  item.originalPrice > item.price) ? true : false,

        rating: item.rating !== undefined ? item.rating : 0,
        salesCount: item.salesCount !== undefined ? item.salesCount : 0,

        category: item.category || undefined,
        type: item.type || undefined,
        season: item.season || undefined,
      }));

      setProducts(mappedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error fetching products. Please try again later.'
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (restoreScroll !== null && !loading && products.length > 0) {
      const timer = setTimeout(() => {
        window.scrollTo(0, restoreScroll);
        setRestoreScroll(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, restoreScroll, products]);

  const handleViewProduct = (product: Product) => {
    navigate(`/product/${product.id}`, {
      state: {
        product,
        fromHome: {
          scrollY: window.scrollY,
        },
      },
    });
  };

  const handleAddToCart = (product: Product) => {
    if (!product || !product.inStock) {
      return;
    }

    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    const hasColors = Array.isArray(product.colors) && product.colors.length > 0;

    if (hasSizes || hasColors) {
      handleViewProduct(product);
    } else {
      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          product,
          quantity: 1,
          selectedSize: hasSizes ? product.sizes[0] : '',
          selectedColor: hasColors ? product.colors[0] : '',
        },
      });
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    
    switch (page) {
      case 'home':
        navigate('/');
        break;
      case 'kids-bags':
        navigate('/kids-bags');
        break;
      case 'women-bags':
        navigate('/women-bags');
        break;
      case 'giveaways':
        navigate('/giveaways');
        break;
      case 'cart':
        navigate('/cart');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] pt-20 pb-20" dir="rtl">
      <main>
        {/* Animation styles */}
        <style>{`
          @keyframes bounce-down {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(8px); }
          }
          .animate-bounce-down {
            animation: bounce-down 2s infinite;
          }
        `}</style>

        {/* Hero Section */}
        <div className="relative w-full h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FAF9F6]/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <img
              src="/turtle_art_logo.jpeg"
              alt="Turtle Art Logo"
              className="w-20 h-20 rounded-full object-cover shadow-2xl mb-3 animate-pulse"
            />
            <button 
              onClick={() => navigate('/menu')}
              className="px-6 py-2 bg-white/90 backdrop-blur-sm rounded-full text-[#8B7355] font-bold hover:bg-[#D4AF37] hover:text-white transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>تسوّقي الآن 👜✨</span>
            </button>
          </div>
        </div>

        {/* Navigation Buttons Section */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <button
              onClick={() => navigate('/menu')}
              className="group bg-gradient-to-b from-[#8B7355] to-[#6B5644] hover:from-[#6B5644] hover:to-[#5A4736] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2"
            >
              <span className="text-lg sm:text-xl">👜</span>
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>المنيو</span>
            </button>

            <button
              onClick={() => navigate('/custom')}
              className="group bg-gradient-to-b from-[#C4A57B] to-[#B4956B] hover:from-[#B4956B] hover:to-[#A4855B] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2"
            >
              <span className="text-lg sm:text-xl">🎨</span>
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>تصاميم خاصة</span>
            </button>

            <button
              onClick={() => navigate('/instant')}
              className="group bg-gradient-to-b from-[#D4AF37] to-[#C49F27] hover:from-[#C49F27] hover:to-[#B48F17] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2"
            >
              <span className="text-lg sm:text-xl">⚡</span>
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>المتاح فوري</span>
            </button>

            <button
              onClick={() => navigate('/giveaways')}
              className="group bg-gradient-to-b from-[#A67C52] to-[#966C42] hover:from-[#966C42] hover:to-[#865C32] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2"
            >
              <span className="text-lg sm:text-xl">🎁</span>
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>التوزيعات</span>
            </button>
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-[#8B7355] mb-2"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              منتجاتنا المميزة 🤍
            </h1>
            <p
              className="text-[#8B7355]/70"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              صُنع بحب وإتقان خصيصاً لكِ 👜✨
            </p>
          </div>

          {loading && products.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#D4AF37] mb-4"></div>
              <p className="text-xl text-[#8B7355] font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                جار التحميل...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-20 max-w-2xl mx-auto">
              <div className="text-6xl mb-6">⚠️</div>
              <p className="text-2xl text-red-600 font-bold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {error}
              </p>
              <p className="text-[#8B7355]/70 mb-8 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                حدث خطأ أثناء جلب المنتجات. يرجى التأكد من اتصالك أو معاودة المحاولة.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white/90 backdrop-blur-sm rounded-full text-[#8B7355] font-bold hover:bg-[#D4AF37] hover:text-white transition-all duration-300 shadow-lg transform hover:scale-105"
              >
                <span style={{ fontFamily: 'Tajawal, sans-serif' }}>إعادة المحاولة</span>
              </button>
            </div>
          ) : (
            <>
              {products.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-12">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border border-[#E5DCC5] hover:border-[#D4AF37] overflow-hidden"
                      >
                        <ProductCard
                          product={product}
                          onViewProduct={handleViewProduct}
                          onAddToCart={handleAddToCart}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => navigate('/menu')}
                      className="px-6 py-2 bg-white/90 backdrop-blur-sm rounded-full text-[#8B7355] font-bold hover:bg-[#D4AF37] hover:text-white transition-all duration-300 shadow-lg transform hover:scale-105"
                    >
                      <span style={{ fontFamily: 'Tajawal, sans-serif' }}>عرض كل المنتجات</span>
                    </button>
                  </div>
                </>
              )}

              {products.length === 0 && !loading && !error && (
                <div className="text-center py-20">
                  <div className="text-7xl mb-6">📦</div>
                  <p className="text-2xl text-[#8B7355] font-bold mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    لا توجد منتجات للعرض حالياً
                  </p>
                  <p className="text-[#8B7355]/70 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    نحن نعمل على إضافة مجموعة جديدة ومميزة من الحقائب قريباً!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
};

export default HomePage;
