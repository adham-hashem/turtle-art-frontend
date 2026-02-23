import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Quote, Star, Sparkles, ShoppingBag, Clock, ShieldCheck, Truck } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

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
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreScroll, setRestoreScroll] = useState<number | null>(null);

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

      const response = await fetch(`${apiUrl}/api/products?pageNumber=1&pageSize=10`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('Content-Type');

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
      }

      if (!contentType?.includes('application/json')) {
        throw new Error(`Invalid response format: Expected JSON, received ${contentType}`);
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
        extensions: Array.isArray(item.extensions) ? item.extensions : [],

        isHidden: item.isHidden !== undefined ? item.isHidden : false,
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        isInstant: item.isInstant !== undefined ? item.isInstant : false,
        isFeatured: item.isFeatured !== undefined ? item.isFeatured : false,

        inStock: item.isAvailable !== undefined ? item.isAvailable : true,
        isOffer: item.originalPrice !== undefined && item.originalPrice > item.price ? true : false,

        rating: item.rating !== undefined ? item.rating : 0,
        priority: item.priority ?? 0,
        salesCount: item.salesCount !== undefined ? item.salesCount : 0,

        category: item.category || undefined,
        type: item.type || undefined,
        season: item.season || undefined,
      }));

      setProducts(mappedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error fetching products. Please try again later.');
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
    if (userRole === 'admin') {
      alert('عذرًا، لا يمكن للمسؤول إضافة منتجات للسلة.');
      return;
    }

    if (!product || !product.inStock) return;

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

  return (
    <div className="min-h-screen bg-soft-white" dir="rtl">
      <main>
        {/* Hero Section with Background - starts after header */}
        <div className="relative w-full h-[50vh] max-h-[400px] overflow-hidden mt-20 bg-gradient-to-r from-gray-100 via-white to-gray-100 flex items-center justify-center">
          <img
            src="/background2.jpeg"
            alt="Turtle Art"
            className="w-full h-full object-cover"
            loading="eager"
          />

          {/* Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white/65" />

          {/* Warm tint overlay */}
          <div className="absolute inset-0 bg-black/5 mix-blend-multiply" />

        </div>

        {/* Products Section */}
        <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center mb-8 mt-6 w-full">
            <h1 className="text-3xl font-bold text-black mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              Turtle Art
            </h1>
            <p className="text-black text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              ✨By Sara Mostafa✨
            </p>

            {/* Guest Shopping Notice */}
            <div className="mt-4 bg-primary-green/10 border border-primary-green/20 rounded-xl px-4 py-2 flex items-center gap-2 animate-fade-in">
              <span className="text-xl">💡</span>
              <p className="text-primary-green-dark font-medium text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                معلومة: يمكنك التسوق وإتمام الطلب كزائر دون الحاجة لتسجيل الدخول!
              </p>
            </div>
          </div>

          {loading && products.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-green mb-4"></div>
              <p className="text-xl text-black font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                جار التحميل...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-20 max-w-2xl mx-auto">
              <div className="text-6xl mb-6">⚠️</div>
              <p className="text-2xl text-red-600 font-bold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {error}
              </p>
              <p className="text-black mb-8 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                حدث خطأ أثناء جلب المنتجات. يرجى التأكد من اتصالك أو معاودة المحاولة.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary px-6 py-3 rounded-full"
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
                        className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden"
                      >
                        <ProductCard product={product} onViewProduct={handleViewProduct} onAddToCart={handleAddToCart} />
                      </div>
                    ))}
                  </div>

                  <div className="text-center mb-16">
                    <button
                      onClick={() => navigate('/products')}
                      className="btn-primary px-8 py-3 rounded-full text-base"
                    >
                      <span style={{ fontFamily: 'Tajawal, sans-serif' }}>عرض كل المنتجات</span>
                    </button>
                  </div>
                </>
              )}

              {/* Our Story Section */}
              <div className="mb-20 bg-white rounded-[2rem] p-8 sm:p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8 sm:gap-12 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary-green/5 rounded-full -translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-warm-gray-100 rounded-full translate-x-20 translate-y-20 opacity-50" />

                <div className="w-full md:w-2/5 flex-shrink-0 relative">
                  <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 border-4 border-white">
                    <img
                      src="/background2.jpeg"
                      alt="Our Story"
                      className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-700"
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-xl shadow-lg border border-gray-100 hidden sm:block">
                    <Heart className="text-red-500 fill-red-500" size={24} />
                  </div>
                </div>

                <div className="w-full md:w-3/5 space-y-6 relative">
                  <div className="inline-flex items-center gap-2 bg-primary-green/10 px-4 py-1.5 rounded-full">
                    <Sparkles size={16} className="text-primary-green" />
                    <span className="text-primary-green-dark text-sm font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>قصتنا</span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-black text-black leading-tight" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    Turtle Art <br />
                    <span className="text-primary-green">صُنع بكل حب وشغف</span>
                  </h2>

                  <p className="text-gray-600 text-lg leading-relaxed" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    بدأت رحلتنا في عالم التصميم من شغفنا بالجمال والتميز. في Turtle Art، نؤمن أن كل حقيبة تحمل معها قصة وشخصية فريدة. نحرص على تقديم تصاميم عصرية تجمع بين الأناقة والعملية، لتكون رفيقتكِ المثالية في كل لحظة.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h4 className="font-bold text-black mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>جودة عالية</h4>
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>نهتم بأدق التفاصيل والخدمات</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h4 className="font-bold text-black mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>تصاميم فريدة</h4>
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>نبتكر دائماً ما هو جديد كلياً</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback/Testimonials Section */}
              <div className="mb-20">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-black mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>آراء عملائنا المميزين</h2>
                  <div className="w-20 h-1.5 bg-primary-green mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: 'سارة أحمد', text: 'الشنطة تجنن والجودة فوق الوصف، فعلاً تستاهل كل مليم وشكراً على سرعة التوصيل 😍', rating: 5 },
                    { name: 'منى يوسف', text: 'أول مرة أتعامل معاكم ومش هتكون الأخيرة، الذوق عالي جداً والتغليف شيك أوي.', rating: 5 },
                    { name: 'إيمان علي', text: 'منتجات Turtle Art دايماً بتبهرني، شكراً سارة على ذوقك وتعبك في كل قطعة.', rating: 5 },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative">
                      <div className="absolute top-6 left-6 text-primary-green/20">
                        <Quote size={40} />
                      </div>
                      <div className="flex gap-1 mb-4">
                        {[...Array(item.rating)].map((_, i) => (
                          <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-700 italic mb-6 leading-relaxed relative z-10" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        "{item.text}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-warm-gray-200 rounded-full flex items-center justify-center font-bold text-primary-green-dark">
                          {item.name[0]}
                        </div>
                        <span className="font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features/Trust Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 border-t border-b border-gray-100 py-10">
                {[
                  { icon: Truck, title: 'توصيل سريع', desc: 'لكل المحافظات' },
                  { icon: ShieldCheck, title: 'ضمان الجودة', desc: 'خامات ممتازة' },
                  { icon: Clock, title: 'دعم فني', desc: 'متوفرين دائماً' },
                  { icon: ShoppingBag, title: 'تسوق سهل', desc: 'تجربة سريعة' },
                ].map((feature, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-primary-green/10 rounded-full flex items-center justify-center mb-3">
                      <feature.icon className="text-primary-green" size={24} />
                    </div>
                    <h4 className="font-black text-black text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>{feature.title}</h4>
                    <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>{feature.desc}</p>
                  </div>
                ))}
              </div>

              {products.length === 0 && !loading && !error && (
                <div className="text-center py-20">
                  <div className="text-7xl mb-6">📦</div>
                  <p className="text-2xl text-black font-bold mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    لا توجد منتجات للعرض حالياً
                  </p>
                  <p className="text-black text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    نحن نعمل على إضافة مجموعة جديدة ومميزة من الحقائب قريباً!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
