import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, Plus, Minus, Loader2, ShoppingBag, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CartItem } from '../types';

// --- Inline Interfaces ---
interface CartItemImage {
  id: string;
  imagePath: string;
  isMain: boolean;
}

interface ProductExtension {
  id: string;
  productId: string;
  name: string;
  additionalPrice: number;
  isActive: boolean;
}

interface ApiCartResponse {
  id: string;
  userId: string;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    size: string;
    color: string;
    price: number;
    images: CartItemImage[];
    selectedExtensions?: string;
    extensions?: ProductExtension[];
    extensionsTotal?: number;
  }[];
  total: number;
}
// -------------------------

const CartPage: React.FC = () => {
  const { dispatch, state } = useApp();
  const navigate = useNavigate();

  // Local interface matching API response structure
  interface CartPageItem {
    id: string;
    productId: string;
    product: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
    size?: string;
    color?: string;
    images: CartItemImage[];
    selectedExtensions?: string;
    extensions?: ProductExtension[];
    extensionsTotal?: number;
  }

  const [cartItems, setCartItems] = useState<CartPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isClearingCart, setIsClearingCart] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Fetch authentication token
  useEffect(() => {
    const authToken = localStorage.getItem('accessToken');
    setToken(authToken);
    // Don't redirect - guests can use cart too
  }, [navigate]);

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    if (!token) {
      // Guest user - use localStorage cart managed by AppContext
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, fall back to localStorage
          setToken(null);
          localStorage.removeItem('accessToken');
          setLoading(false);
          return;
        }
        throw new Error('فشل في جلب بيانات السلة');
      }

      const data: ApiCartResponse = await response.json();
      const normalizedItems: CartPageItem[] = data.items.map(item => {
        // Parse selected extensions if it's a JSON string
        let parsedSelectedExtensions: string[] = [];
        try {
          if (item.selectedExtensions) {
            parsedSelectedExtensions = JSON.parse(item.selectedExtensions);
          }
        } catch (e) {
          console.error("Failed to parse selectedExtensions", e);
        }

        return {
          id: item.id,
          productId: item.productId,
          product: {
            id: item.productId,
            name: item.productName,
            price: item.price,
            // Ensure product has extensions so mappings work
            extensions: item.extensions?.map(ext => ({
              id: ext.id,
              productId: ext.productId,
              name: ext.name,
              additionalPrice: ext.additionalPrice,
              isActive: ext.isActive
            })) || []
          },
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          images: item.images || [],
          selectedExtensions: item.selectedExtensions, // Keep original string for CartPageItem
          extensions: item.extensions || [],
          extensionsTotal: item.extensionsTotal || 0,
        };
      });

      setCartItems(normalizedItems || []);
      // Map to global type for context
      dispatch({ type: 'SET_CART', payload: mapToGlobalCartItems(normalizedItems || []) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  }, [dispatch, token, apiUrl]);


  // Helper to map Global CartItem to Local CartPageItem
  const mapToCartPageItems = useCallback((items: CartItem[]): CartPageItem[] => {
    return items.map((item, index) => {
      // Calculate extensions for guest users
      let extensions: ProductExtension[] = [];
      let extensionsTotal = 0;

      if (item.selectedExtensions && item.product.extensions) {
        extensions = item.selectedExtensions
          .map(extId => item.product.extensions?.find(e => e.id === extId))
          .filter((ext): ext is ProductExtension => ext !== undefined && ext.isActive);

        extensionsTotal = extensions.reduce((sum, ext) => sum + ext.additionalPrice, 0);
      }

      return {
        id: `guest-${index}-${item.product.id}`,
        productId: item.product.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price
        },
        quantity: item.quantity,
        size: item.selectedSize,
        color: item.selectedColor,
        images: item.product.images.map(img => ({
          id: img.id,
          imagePath: img.imagePath,
          isMain: img.isMain
        })),
        selectedExtensions: item.selectedExtensions ? JSON.stringify(item.selectedExtensions) : undefined,
        extensions: extensions,
        extensionsTotal: extensionsTotal
      };
    });
  }, []);

  // Helper to map Local CartPageItem to Global CartItem
  const mapToGlobalCartItems = (items: CartPageItem[]): CartItem[] => {
    return items.map(item => ({
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        code: 'N/A', // Default
        description: '', // Default
        createdAt: new Date().toISOString(),
        sizes: [],
        colors: [],
        images: item.images,
        inStock: true,
        isOffer: false,
        rating: 0,
        salesCount: 0
      },
      quantity: item.quantity,
      selectedSize: item.size,
      selectedColor: item.color,
      // Parse JSON string back to string[] for Global CartItem
      selectedExtensions: item.selectedExtensions ? JSON.parse(item.selectedExtensions) : undefined
    }));
  };

  // Effect for authenticated users - only fetch when token changes
  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token, fetchCart]);

  // Effect for guest users - update display when state.cart changes
  useEffect(() => {
    if (!token) {
      setCartItems(mapToCartPageItems(state.cart));
      setLoading(false);
    }
  }, [token, state.cart, mapToCartPageItems]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    if (!token) {
      // Guest user - update in AppContext/localStorage
      const updatedItems = cartItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);
      dispatch({ type: 'SET_CART', payload: mapToGlobalCartItems(updatedItems) });
      return;
    }

    // Authenticated user - update on server
    const previousItems = [...cartItems];
    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    dispatch({ type: 'SET_CART', payload: mapToGlobalCartItems(updatedItems) });

    try {
      const response = await fetch(`${apiUrl}/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuantity),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
        } else if (response.status === 400) {
          throw new Error('كمية غير صالحة');
        } else if (response.status === 404) {
          throw new Error('العنصر غير موجود في السلة');
        } else if (response.status === 409) {
          throw new Error('تم تعديل العنصر من قبل مستخدم آخر، يرجى إعادة المحاولة');
        }
        throw new Error(errorText || 'فشل في تحديث الكمية');
      }

      await fetchCart();
    } catch (err) {
      setCartItems(previousItems);
      setCartItems(previousItems);
      dispatch({ type: 'SET_CART', payload: mapToGlobalCartItems(previousItems) });
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الكمية');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const previousItems = [...cartItems];
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    dispatch({ type: 'SET_CART', payload: mapToGlobalCartItems(updatedItems) });

    if (!token) {
      // Guest user - just update localStorage via AppContext
      return;
    }

    // Authenticated user - also update on server
    try {
      const response = await fetch(`${apiUrl}/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
        } else if (response.status === 404) {
          throw new Error('العنصر غير موجود في السلة');
        } else if (errorText.includes('REFERENCE constraint') || errorText.includes('Orders')) {
          throw new Error('لا يمكن حذف هذا العنصر لأنه مرتبط بطلب حالي');
        }
        throw new Error(errorText || 'فشل في إزالة العنصر');
      }
    } catch (err) {
      setCartItems(previousItems);
      dispatch({ type: 'SET_CART', payload: mapToGlobalCartItems(previousItems) });
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إزالة العنصر');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('هل أنت متأكد من إفراغ السلة؟')) {
      return;
    }

    setIsClearingCart(true);
    const previousItems = [...cartItems];
    setCartItems([]);
    dispatch({ type: 'SET_CART', payload: [] });

    if (!token) {
      // Guest user - just clear localStorage via AppContext
      setIsClearingCart(false);
      return;
    }

    // Authenticated user - also clear on server
    try {
      const response = await fetch(`${apiUrl}/api/cart`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
        } else if (errorText.includes('REFERENCE constraint') || errorText.includes('Orders')) {
          throw new Error('لا يمكن إفراغ السلة لأنها تحتوي على عناصر مرتبطة بطلبات حالية');
        }
        throw new Error(errorText || 'فشل في إفراغ السلة');
      }
    } catch (err) {
      setCartItems(previousItems);
      dispatch({ type: 'SET_CART', payload: mapToGlobalCartItems(previousItems) });
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إفراغ السلة');
    } finally {
      setIsClearingCart(false);
    }
  };

  const subtotal = cartItems.reduce((total, item) => {
    const itemPrice = item.product.price + (item.extensionsTotal || 0);
    return total + itemPrice * item.quantity;
  }, 0);
  const total = subtotal;

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center px-4 pt-20" dir="rtl">
        <div className="text-center py-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary-green rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-primary-green rounded-full p-4">
              <ShoppingBag className="h-12 w-12 text-white animate-bounce" />
            </div>
          </div>
          <p className="text-primary-green font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            جاري تحميل السلة...
          </p>
          <p className="text-warm-gray-500 text-sm mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            انتظر لحظة 👜
          </p>
        </div>
      </div>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center px-4 pt-20" dir="rtl">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl max-w-md w-full border border-warm-gray-200">
          <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            حدث خطأ
          </h2>
          <p className="text-sm sm:text-base text-warm-gray-500 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {error}
          </p>
          <button
            onClick={fetchCart}
            className="w-full btn-primary font-semibold shadow-lg transition-all text-sm sm:text-base"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center px-4 pt-20" dir="rtl">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl max-w-md w-full border border-warm-gray-200">
          <div className="text-5xl sm:text-6xl mb-4">🛒</div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary-green mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            السلة فارغة
          </h2>
          <p className="text-warm-gray-500 mb-6 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            لم تقم بإضافة أي منتجات بعد
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full btn-primary font-semibold shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <Sparkles size={20} />
            <span>تصفح المنتجات</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-white py-4 sm:py-6 md:py-8 pt-24" dir="rtl">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-warm-gray-600 hover:text-primary-green font-medium mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <ArrowRight size={20} className="ml-2" />
          <span>العودة للتسوق</span>
        </button>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900 font-bold text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 border border-warm-gray-200">
            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-warm-gray-100">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-warm-gray-800 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-primary-green" />
                <span>سلة التسوق ({cartItems.length})</span>
              </h2>
              <button
                onClick={handleClearCart}
                disabled={isClearingCart}
                className="flex items-center text-red-500 hover:text-red-700 font-semibold text-xs sm:text-sm md:text-base disabled:opacity-50 transition-colors"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                {isClearingCart ? (
                  <Loader2 className="animate-spin ml-1 sm:ml-2" size={16} />
                ) : (
                  <Trash2 className="ml-1 sm:ml-2" size={16} />
                )}
                <span className="hidden sm:inline">إفراغ السلة</span>
                <span className="sm:hidden">إفراغ</span>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {cartItems.map((item) => {
                const mainImage = item.images?.find(img => img.isMain) || item.images?.[0];
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-warm-gray-200 rounded-xl sm:rounded-2xl hover:shadow-md transition-all bg-soft-white"
                  >
                    <img
                      src={mainImage?.imagePath || 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3e%3crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3e%3ctext x=\'50%25\' y=\'50%25\' font-family=\'Arial\' font-size=\'12\' fill=\'%239ca3af\' text-anchor=\'middle\' dy=\'.3em\'%3eNo Image%3c/text%3e%3c/svg%3e'}
                      alt={item.product.name}
                      loading="lazy"
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain rounded-lg sm:rounded-xl bg-white border border-warm-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-warm-gray-800 text-sm sm:text-base md:text-lg truncate" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {item.product.name}
                      </h3>

                      {/* Display extensions if any */}
                      {item.extensions && item.extensions.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {item.extensions.map((ext) => (
                            <p key={ext.id} className="text-xs text-warm-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                              + {ext.name} (+{ext.additionalPrice.toFixed(2)} جنيه)
                            </p>
                          ))}
                        </div>
                      )}

                      <p className="text-primary-green font-black text-base sm:text-lg md:text-xl mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {(item.product.price + (item.extensionsTotal || 0)).toFixed(2)} جنيه
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="flex items-center gap-1 sm:gap-2 bg-white border border-warm-gray-200 rounded-lg sm:rounded-xl p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-warm-gray-100 text-warm-gray-600 transition-colors"
                          aria-label="تقليل الكمية"
                          disabled={isClearingCart}
                        >
                          <Minus size={14} className="sm:hidden" />
                          <Minus size={16} className="hidden sm:block" />
                        </button>
                        <span className="w-6 sm:w-8 text-center font-bold text-warm-gray-800 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-warm-gray-100 text-warm-gray-600 transition-colors"
                          aria-label="زيادة الكمية"
                          disabled={isClearingCart}
                        >
                          <Plus size={14} className="sm:hidden" />
                          <Plus size={16} className="hidden sm:block" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="إزالة العنصر"
                        disabled={isClearingCart}
                      >
                        <Trash2 size={16} className="sm:hidden" />
                        <Trash2 size={18} className="hidden sm:block" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 sticky top-4 sm:top-24 border border-warm-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-warm-gray-800 mb-4 sm:mb-6 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Sparkles className="h-5 w-5 text-primary-green" />
                <span>ملخص الطلب</span>
              </h3>

              {/* Price Summary */}
              <div className="space-y-3 mb-4 sm:mb-6 pb-4 border-b border-warm-gray-100">
                <div className="flex justify-between text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span className="text-warm-gray-500">المجموع الفرعي</span>
                  <span className="font-semibold text-warm-gray-800">{subtotal.toFixed(2)} جنيه</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-black pt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span className="text-warm-gray-800">المجموع الكلي</span>
                  <span className="text-primary-green text-xl sm:text-2xl">{total.toFixed(2)} جنيه</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full btn-primary font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                disabled={isClearingCart}
              >
                <ShoppingBag size={20} />
                <span>إتمام الطلب</span>
              </button>

              {/* Security Note */}
              <p className="text-xs sm:text-sm text-warm-gray-400 text-center mt-3 sm:mt-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                🔒 الدفع آمن ومضمون
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
