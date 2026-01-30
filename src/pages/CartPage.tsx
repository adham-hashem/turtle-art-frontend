import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, Plus, Minus, Loader2, ShoppingBag, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CartItem } from '../types';

// --- Inline Interfaces ---
interface CartItemImage {
  id: string;
  imagePath: string;
  isMain: boolean;
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
  }[];
  total: number;
}
// -------------------------

const CartPage: React.FC = () => {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isClearingCart, setIsClearingCart] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Fetch authentication token
  useEffect(() => {
    const authToken = localStorage.getItem('accessToken');
    setToken(authToken);
    if (!authToken) {
      setError('يرجى تسجيل الدخول لعرض السلة');
      navigate('/login');
    }
  }, [navigate]);

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    if (!token) {
      setError('يرجى تسجيل الدخول لعرض السلة');
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
          throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
        }
        throw new Error('فشل في جلب بيانات السلة');
      }

      const data: ApiCartResponse = await response.json();
      const normalizedItems: CartItem[] = data.items.map(item => ({
        id: item.id,
        product: {
          id: item.productId,
          name: item.productName,
          price: item.price,
        },
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        images: item.images.map(img => {
          let fullPath = img.imagePath;
          if (!fullPath.startsWith('http://') && !fullPath.startsWith('https://')) {
            fullPath = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
            fullPath = `${apiUrl}${fullPath}`;
          }
          return {
            ...img,
            imagePath: fullPath,
          };
        }),
      }));

      setCartItems(normalizedItems || []);
      dispatch({ type: 'SET_CART', payload: normalizedItems || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  }, [dispatch, token, apiUrl]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [fetchCart, token]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!token) {
      alert('يرجى تسجيل الدخول لتعديل السلة');
      navigate('/login');
      return;
    }

    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    const previousItems = [...cartItems];
    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    dispatch({ type: 'SET_CART', payload: updatedItems });

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
      dispatch({ type: 'SET_CART', payload: previousItems });
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الكمية');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!token) {
      alert('يرجى تسجيل الدخول لتعديل السلة');
      navigate('/login');
      return;
    }

    const previousItems = [...cartItems];
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    dispatch({ type: 'SET_CART', payload: updatedItems });

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
      dispatch({ type: 'SET_CART', payload: previousItems });
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إزالة العنصر');
    }
  };

  const handleClearCart = async () => {
    if (!token) {
      alert('يرجى تسجيل الدخول لتعديل السلة');
      navigate('/login');
      return;
    }

    if (!window.confirm('هل أنت متأكد من إفراغ السلة؟')) {
      return;
    }

    setIsClearingCart(true);
    const previousItems = [...cartItems];
    setCartItems([]);
    dispatch({ type: 'SET_CART', payload: [] });

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
      dispatch({ type: 'SET_CART', payload: previousItems });
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إفراغ السلة');
    } finally {
      setIsClearingCart(false);
    }
  };

  const handleApplyDiscountCode = async () => {
    if (!token) {
      alert('يرجى تسجيل الدخول لتطبيق كود الخصم');
      navigate('/login');
      return;
    }

    if (!discountCode.trim()) {
      alert('يرجى إدخال كود خصم صالح');
      return;
    }

    setIsApplyingDiscount(true);
    try {
      const response = await fetch(`${apiUrl}/api/cart/discount`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: discountCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
        } else if (response.status === 400 || errorText.includes('invalid')) {
          throw new Error('كود الخصم غير صحيح أو منتهي الصلاحية');
        }
        throw new Error(errorText || 'فشل في تطبيق كود الخصم');
      }

      const data = await response.json();
      const discount = data.discountPercentage || 0;
      setAppliedDiscount(discount);
      if (discount <= 0) {
        alert('كود الخصم غير صحيح أو منتهي الصلاحية');
      } else {
        alert(`تم تطبيق خصم ${discount}% بنجاح`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تطبيق كود الخصم');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const discountAmount = (subtotal * appliedDiscount) / 100;
  const total = subtotal - discountAmount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] flex items-center justify-center px-4 pt-20" dir="rtl">
        <div className="text-center py-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-[#C4A57B] rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-[#8B7355] to-[#A67C52] rounded-full p-4">
              <ShoppingBag className="h-12 w-12 text-white animate-bounce" />
            </div>
          </div>
          <p className="text-[#8B7355] font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            جاري تحميل السلة...
          </p>
          <p className="text-[#8B7355]/70 text-sm mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            انتظر لحظة 👜
          </p>
        </div>
      </div>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] flex items-center justify-center px-4 pt-20" dir="rtl">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full border-2 border-[#E5DCC5]">
          <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            حدث خطأ
          </h2>
          <p className="text-sm sm:text-base text-[#8B7355]/70 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {error}
          </p>
          <button
            onClick={fetchCart}
            className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] font-semibold shadow-lg transition-all text-sm sm:text-base"
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
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] flex items-center justify-center px-4 pt-20" dir="rtl">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full border-2 border-[#E5DCC5]">
          <div className="text-5xl sm:text-6xl mb-4">🛒</div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#8B7355] mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            السلة فارغة
          </h2>
          <p className="text-[#8B7355]/70 mb-6 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            لم تقم بإضافة أي منتجات بعد
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] font-semibold shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
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
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] py-4 sm:py-6 md:py-8 pt-24" dir="rtl">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-[#8B7355] hover:text-[#D4AF37] font-medium mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <ArrowRight size={20} className="ml-2" />
          <span>العودة للتسوق</span>
        </button>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-md">
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
          <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border-2 border-[#E5DCC5]">
            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-[#E5DCC5]">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#8B7355] flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-[#D4AF37]" />
                <span>سلة التسوق ({cartItems.length})</span>
              </h2>
              <button
                onClick={handleClearCart}
                disabled={isClearingCart}
                className="flex items-center text-red-600 hover:text-red-700 font-semibold text-xs sm:text-sm md:text-base disabled:opacity-50 transition-colors"
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
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-[#E5DCC5] rounded-xl sm:rounded-2xl hover:shadow-md transition-all bg-[#FAF9F6]"
                  >
                    <img
                      src={mainImage?.imagePath || 'https://via.placeholder.com/150'}
                      alt={item.product.name}
                      loading="lazy"
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain rounded-lg sm:rounded-xl bg-white border-2 border-[#E5DCC5]"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-[#8B7355] text-sm sm:text-base md:text-lg truncate" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {item.product.name}
                      </h3>
                      {/* <p className="text-xs sm:text-sm text-[#8B7355]/70 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        المقاس: <span className="font-medium text-[#D4AF37]">{item.size || 'غير محدد'}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        اللون: <span className="font-medium text-[#D4AF37]">{item.color || 'غير محدد'}</span>
                      </p> */}
                      <p className="text-[#D4AF37] font-black text-base sm:text-lg md:text-xl mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {item.product.price.toFixed(2)} جنيه
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="flex items-center gap-1 sm:gap-2 bg-white border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-[#F5F5DC] text-[#8B7355] transition-colors"
                          aria-label="تقليل الكمية"
                          disabled={isClearingCart}
                        >
                          <Minus size={14} className="sm:hidden" />
                          <Minus size={16} className="hidden sm:block" />
                        </button>
                        <span className="w-6 sm:w-8 text-center font-bold text-[#8B7355] text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center hover:bg-[#F5F5DC] text-[#8B7355] transition-colors"
                          aria-label="زيادة الكمية"
                          disabled={isClearingCart}
                        >
                          <Plus size={14} className="sm:hidden" />
                          <Plus size={16} className="hidden sm:block" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
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
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 sticky top-4 sm:top-24 border-2 border-[#E5DCC5]">
              <h3 className="text-lg sm:text-xl font-bold text-[#8B7355] mb-4 sm:mb-6 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                <span>ملخص الطلب</span>
              </h3>

              {/* Price Summary */}
              <div className="space-y-3 mb-4 sm:mb-6 pb-4 border-b-2 border-[#E5DCC5]">
                <div className="flex justify-between text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span className="text-[#8B7355]/70">المجموع الفرعي</span>
                  <span className="font-semibold text-[#8B7355]">{subtotal.toFixed(2)} جنيه</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base bg-green-50 p-2 rounded-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <span className="font-medium">الخصم ({appliedDiscount}%)</span>
                    <span className="font-bold">-{discountAmount.toFixed(2)} جنيه</span>
                  </div>
                )}
                <div className="flex justify-between text-base sm:text-lg font-black pt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span className="text-[#8B7355]">المجموع الكلي</span>
                  <span className="text-[#D4AF37] text-xl sm:text-2xl">{total.toFixed(2)} جنيه</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                disabled={isClearingCart}
              >
                <ShoppingBag size={20} />
                <span>إتمام الطلب</span>
              </button>

              {/* Security Note */}
              <p className="text-xs sm:text-sm text-[#8B7355]/70 text-center mt-3 sm:mt-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
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
