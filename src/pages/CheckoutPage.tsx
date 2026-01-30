import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  Calendar,
  Clock,
  CreditCard,
  Truck,
  Loader2,
  Sparkles,
  ShoppingBag,
  Package,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CartItem } from '../types';

// Interfaces (Unchanged)
interface ShippingFee {
  id: string;
  governorate: string;
  fee: number;
  deliveryTime: string;
  status: number;
  createdAt: string;
}

interface DiscountCode {
  id: string;
  code: string;
  type: number;
  percentageValue: number | null;
  fixedValue: number | null;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface ApiResponse {
  items: ShippingFee[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
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
    images: { id: string; imagePath: string; isMain: boolean }[];
  }[];
  total: number;
}

const CheckoutPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    governorate: '',
    paymentMethod: 'instapay' as 'instapay' | 'vodafonecash',
    senderDetails: '',
    paymentProofImage: null as File | null,
    discountCode: '',
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [shippingFees, setShippingFees] = useState<ShippingFee[]>([]);
  const [loadingShippingFees, setLoadingShippingFees] = useState(true);
  const [errorShippingFees, setErrorShippingFees] = useState<string | null>(null);
  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [errorDiscount, setErrorDiscount] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // --- Cart Fetching Logic (Unchanged) ---
  const fetchCart = useCallback(async (retryCount = 3, retryDelay = 1000) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setCartError('يرجى تسجيل الدخول لعرض السلة');
      setLoadingCart(false);
      navigate('/login');
      return;
    }
    setLoadingCart(true);
    setCartError(null);
    for (let attempt = 1; attempt <= retryCount; attempt++) {
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
        const normalizedItems: CartItem[] =
          data.items?.map((item) => ({
            id: item.id,
            product: {
              id: item.productId,
              name: item.productName || 'Unknown Product',
              price: item.price || 0,
            },
            quantity: item.quantity || 1,
            size: item.size || undefined,
            color: item.color || undefined,
            images:
              item.images?.map((img) => ({
                ...img,
                imagePath:
                  img.imagePath.startsWith('/Uploads') ||
                    img.imagePath.startsWith('/images')
                    ? `${apiUrl}${img.imagePath}`
                    : img.imagePath,
              })) || [],
          })) || [];
        dispatch({ type: 'SET_CART', payload: normalizedItems });
        if (normalizedItems.length === 0) {
          setCartError('السلة فارغة');
        }
        setLoadingCart(false);
        return;
      } catch (err) {
        if (attempt === retryCount) {
          setCartError(
            err instanceof Error ? err.message : 'حدث خطأ أثناء جلب بيانات السلة'
          );
          setLoadingCart(false);
          if (err instanceof Error && err.message.includes('جلسة منتهية')) {
            localStorage.removeItem('accessToken');
            navigate('/login');
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }
  }, [dispatch, navigate, apiUrl]);

  // --- Shipping Fees Fetching Logic (Unchanged) ---
  const fetchShippingFees = useCallback(async () => {
    setLoadingShippingFees(true);
    setErrorShippingFees(null);
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(
        `${apiUrl}/api/shipping-fees?pageNumber=1&pageSize=30`,
        {
          method: 'GET',
          headers,
        }
      );
      if (!response.ok) {
        throw new Error(`فشل في جلب رسوم التوصيل: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      const cleanedItems = data.items
        .map((item) => ({
          ...item,
          governorate: item.governorate ? item.governorate.trim() : '',
        }))
        .filter((item) => item.governorate);
      setShippingFees(cleanedItems || []);
      if (
        formData.governorate &&
        !cleanedItems.some((item) => item.governorate === formData.governorate)
      ) {
        setFormData((prev) => ({ ...prev, governorate: '' }));
      }
    } catch (err) {
      setErrorShippingFees(
        err instanceof Error ? err.message : 'فشل في جلب رسوم التوصيل'
      );
    } finally {
      setLoadingShippingFees(false);
    }
  }, [apiUrl, formData.governorate]);

  // --- Calculations (Unchanged) ---
  const { subtotal, selectedGovernorate, shippingFee, discountAmount, total } =
    useMemo(() => {
      const subtotalCalc = state.cart.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
      const selectedGov = shippingFees.find(
        (g) => g.governorate === formData.governorate
      );
      const shipFee = selectedGov?.fee || 0;
      const discountAmt = discount?.amount || 0;
      const totalCalc = Math.max(0, subtotalCalc - discountAmt + shipFee);
      return {
        subtotal: subtotalCalc,
        selectedGovernorate: selectedGov,
        shippingFee: shipFee,
        discountAmount: discountAmt,
        total: totalCalc,
      };
    }, [state.cart, shippingFees, formData.governorate, discount]);

  // --- Discount Code Fetching Logic (Unchanged) ---
  const fetchDiscountCode = useCallback(
    async (code: string) => {
      if (!code.trim()) return;
      setLoadingDiscount(true);
      setErrorDiscount(null);
      setDiscount(null);
      try {
        const response = await fetch(
          `${apiUrl}/api/discount-codes/code/${code}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) {
          throw new Error(`فشل في التحقق من كود الخصم: ${response.status}`);
        }
        const data: DiscountCode = await response.json();
        if (!data.isActive) {
          throw new Error('الكود غير صالح أو منتهي الصلاحية');
        }
        const subtotalCalc = state.cart.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
        if (data.minOrderAmount > subtotalCalc) {
          throw new Error(
            `يجب أن يكون إجمالي الطلب ${data.minOrderAmount} جنيه على الأقل لاستخدام هذا الكود`
          );
        }
        let discountAmountCalc = 0;
        if (data.percentageValue) {
          discountAmountCalc = (subtotalCalc * data.percentageValue) / 100;
          if (
            data.maxDiscountAmount &&
            discountAmountCalc > data.maxDiscountAmount
          ) {
            discountAmountCalc = data.maxDiscountAmount;
          }
        } else if (data.fixedValue) {
          discountAmountCalc = data.fixedValue;
        }
        setDiscount({ code, amount: discountAmountCalc });
      } catch (err) {
        setErrorDiscount(
          err instanceof Error ? err.message : 'فشل في التحقق من الكود'
        );
      } finally {
        setLoadingDiscount(false);
      }
    },
    [state.cart, apiUrl]
  );

  // --- Form Validation Logic (Unchanged) ---
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'الاسم الكامل مطلوب';
    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^01[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }
    if (!formData.address.trim()) newErrors.address = 'العنوان مطلوب';
    if (!formData.governorate.trim()) newErrors.governorate = 'المحافظة مطلوبة';

    // Validate sender details
    if (!formData.senderDetails.trim()) {
      newErrors.senderDetails = formData.paymentMethod === 'vodafonecash'
        ? 'رقم الموبايل المُحوِّل مطلوب'
        : 'بيانات المُحوِّل مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // --- Admin Notification Logic (Unchanged) ---
  const sendAdminNotification = useCallback(
    async (orderId: string, total: number, retryCount = 3, retryDelay = 1000) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('authentication_required');
      }
      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          const response = await fetch(`${apiUrl}/api/notification/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderNumber: orderId,
              total: total.toFixed(2),
            }),
          });
          if (!response.ok) {
            throw new Error(`فشل إرسال الإشعار: ${response.status}`);
          }
          return;
        } catch (err) {
          if (attempt === retryCount) {
            throw err;
          }
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    },
    [apiUrl]
  );

  // --- Order Submission Logic (Unchanged) ---
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;
      if (!validateForm()) return;

      if (!selectedGovernorate && formData.governorate.trim()) {
        alert(
          'حدث خطأ في تحديد رسوم التوصيل لهذه المحافظة. يرجى اختيار محافظة أخرى أو المحاولة لاحقاً.'
        );
        return;
      }

      setIsSubmitting(true);
      setNotificationError(null);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('authentication_required');
        }

        // Upload payment proof image if provided
        let paymentProofImageUrl = null;
        if (formData.paymentProofImage) {
          const imageFormData = new FormData();
          imageFormData.append('file', formData.paymentProofImage);
          imageFormData.append('upload_preset', 'turtle_art_preset'); // Update with your Cloudinary preset

          try {
            const cloudinaryResponse = await fetch('https://api.cloudinary.com/v1_1/dptvzuqzp/image/upload', {
              method: 'POST',
              body: imageFormData,
            });
            if (cloudinaryResponse.ok) {
              const cloudinaryData = await cloudinaryResponse.json();
              paymentProofImageUrl = cloudinaryData.secure_url;
            }
          } catch (error) {
            console.error('Failed to upload payment proof:', error);
            // Continue even if image upload fails
          }
        }

        const requestBody = {
          fullname: formData.fullName.trim(),
          phonenumber: formData.phone.trim(),
          address: formData.address.trim(),
          governorate: formData.governorate.trim(),
          discountCode: discount?.code || null,
          paymentMethod: formData.paymentMethod === 'instapay' ? 0 : 1,
          senderDetails: formData.senderDetails.trim(),
          paymentProofImage: paymentProofImageUrl,
          paymentNotes: formData.notes.trim() || null,
          items: state.cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
            size: item.size || null,
            color: item.color || null,
          })),
        };

        const response = await fetch(`${apiUrl}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`فشل إرسال الطلب: ${response.status} - ${errorData}`);
        }

        const orderResult = await response.json();

        const mapStatus = (
          status: number
        ):
          | 'Pending'
          | 'Confirmed'
          | 'Processing'
          | 'Shipped'
          | 'Delivered'
          | 'Cancelled' => {
          switch (status) {
            case 0:
              return 'Pending';
            case 1:
              return 'Confirmed';
            case 2:
              return 'Processing';
            case 3:
              return 'Shipped';
            case 4:
              return 'Delivered';
            case 5:
              return 'Cancelled';
            default:
              return 'Pending';
          }
        };
        const mapPaymentMethod = (
          method: number
        ): 'InstaPay' | 'VodafoneCash' => {
          switch (method) {
            case 0:
              return 'InstaPay';
            case 1:
              return 'VodafoneCash';
            default:
              return 'InstaPay';
          }
        };

        const localOrder = {
          id: orderResult.id || `order-${Date.now()}`,
          customerId: orderResult.customerId || 'authenticated-user',
          items: state.cart.map((item) => ({
            id: `item-${Date.now()}-${item.product.id}`,
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
            size: item.size || 'غير محدد',
            color: item.color || 'غير محدد',
          })),
          total: Number(total.toFixed(2)),
          shippingFee: Number(shippingFee.toFixed(2)),
          discountCode: discount?.code || null,
          discountAmount: Number(discountAmount.toFixed(2)),
          paymentMethod: mapPaymentMethod(
            orderResult.paymentMethod ||
            (formData.paymentMethod === 'instapay' ? 0 : 1)
          ),
          status: mapStatus(orderResult.status || 0),
          createdAt: orderResult.date || new Date().toISOString(),
          customerInfo: {
            id: orderResult.customerId || 'authenticated-user',
            fullName: formData.fullName.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            governorate: formData.governorate.trim(),
          },
        };

        dispatch({ type: 'ADD_ORDER', payload: localOrder });

        try {
          await sendAdminNotification(localOrder.id, total);
        } catch {
          setNotificationError(
            'فشل إرسال إشعار للإدارة، تم إنشاء الطلب بنجاح'
          );
        }

        dispatch({ type: 'CLEAR_CART' });
        alert('تم تأكيد طلبك بنجاح! سيتم التواصل معك قريباً.');
        navigate('/', { replace: true });
      } catch (error) {
        let errorMessage =
          'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.';
        if (error instanceof Error) {
          if (
            error.message.includes('authentication_required') ||
            error.message.includes('401')
          ) {
            errorMessage =
              'جلسة تسجيل الدخول منتهية أو غير صالحة. يرجى تسجيل الدخول مرة أخرى.';
            localStorage.removeItem('accessToken');
            navigate('/login', { replace: true });
          } else if (error.message.includes('400')) {
            errorMessage =
              'بيانات الطلب غير صحيحة. يرجى مراجعة البيانات المدخلة.';
          } else if (error.message.includes('403')) {
            errorMessage =
              'غير مصرح بإنشاء الطلب. يرجى التحقق من الصلاحيات.';
          } else if (error.message.includes('500')) {
            errorMessage = 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.';
          } else if (
            error.message.includes('network') ||
            error.message.includes('fetch')
          ) {
            errorMessage = 'تحقق من اتصال الإنترنت وحاول مرة أخرى.';
          }
        }
        alert(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      validateForm,
      formData,
      discount,
      state.cart,
      total,
      shippingFee,
      discountAmount,
      dispatch,
      navigate,
      apiUrl,
      sendAdminNotification,
      selectedGovernorate,
    ]
  );

  // --- Input Handlers (Unchanged) ---
  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleApplyDiscount = useCallback(() => {
    const code = formData.discountCode.trim();
    if (code) {
      fetchDiscountCode(code);
    } else {
      setErrorDiscount('يرجى إدخال كود خصم');
    }
  }, [formData.discountCode, fetchDiscountCode]);

  // --- Initial Mount Effect (Unchanged) ---
  useEffect(() => {
    fetchCart();
    fetchShippingFees();
  }, [fetchCart, fetchShippingFees]);

  // --- Loading Screen ---
  if (loadingCart) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] flex items-center justify-center px-4 pt-20" dir="rtl">
        <div className="text-center py-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-[#C4A57B] rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-[#8B7355] to-[#A67C52] rounded-full p-4">
              <ShoppingBag className="h-12 w-12 text-white animate-bounce" />
            </div>
          </div>
          <p className="text-[#8B7355] font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>جاري تحميل السلة...</p>
          <p className="text-[#8B7355]/70 text-sm mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>انتظر لحظة 🛍️</p>
        </div>
      </div>
    );
  }

  // --- Cart Error Screen ---
  if (cartError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] py-6 sm:py-8 pt-24" dir="rtl">
        <div className="container mx-auto px-3 sm:px-4 max-w-md">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 text-center border-2 border-[#E5DCC5]">
            <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
            <h2 className="text-lg sm:text-xl font-bold text-red-600 mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>خطأ</h2>
            <p className="text-sm sm:text-base text-[#8B7355]/70 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>{cartError}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => fetchCart()}
                className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all font-semibold shadow-lg text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="w-full bg-[#F5F5DC] text-[#8B7355] px-6 py-3 rounded-xl hover:bg-[#E5DCC5] transition-colors font-medium text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                العودة إلى السلة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Empty Cart Screen ---
  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] py-6 sm:py-8 pt-24" dir="rtl">
        <div className="container mx-auto px-3 sm:px-4 max-w-md">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 text-center border-2 border-[#E5DCC5]">
            <div className="text-5xl sm:text-6xl mb-4">🛒</div>
            <h2 className="text-lg sm:text-xl font-bold text-[#8B7355] mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              السلة فارغة
            </h2>
            <p className="text-sm sm:text-base text-[#8B7355]/70 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>لا يمكن إتمام الطلب بسلة فارغة</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white px-6 py-3 rounded-xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all font-semibold shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <Sparkles size={20} />
              <span>العودة للتسوق</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Checkout Form ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] pt-24" dir="rtl">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8 max-w-6xl">
        <Link
          to="/cart"
          className="flex items-center gap-2 text-[#8B7355] hover:text-[#D4AF37] mb-4 sm:mb-6 transition-colors font-medium text-sm sm:text-base"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <ArrowRight size={20} />
          <span>العودة للسلة</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#8B7355] mb-4 sm:mb-6 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <Package className="h-6 w-6 sm:h-7 sm:w-7 text-[#D4AF37]" />
          <span>إتمام الطلب</span>
        </h1>

        {notificationError && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl sm:rounded-2xl text-center">
            <p className="text-yellow-700 text-xs sm:text-sm font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>{notificationError}</p>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-1 lg:order-2">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border-2 border-[#E5DCC5] sticky top-24">
              <h2 className="text-lg sm:text-xl font-bold text-[#8B7355] mb-4 flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                <span>ملخص الطلب</span>
              </h2>

              <div className="space-y-2 sm:space-y-3 mb-4">
                {state.cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    className="flex justify-between items-start gap-2 pb-2 border-b border-[#E5DCC5]"
                  >
                    <span className="text-[#D4AF37] font-bold text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {(item.product.price * item.quantity).toFixed(2)} ج
                    </span>
                    <div className="text-right flex-1">
                      <span className="text-[#8B7355] font-medium text-xs sm:text-sm block" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {item.product.name} × {item.quantity}
                      </span>
                      {(item.size || item.color) && (
                        <p className="text-[10px] sm:text-xs text-[#8B7355]/70 mt-0.5" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {item.size && `${item.size}`}
                          {item.size && item.color && ' • '}
                          {item.color && `${item.color}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 sm:space-y-2.5 border-t-2 border-[#E5DCC5] pt-3 sm:pt-4">
                <div className="flex justify-between text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span className="text-[#8B7355]/70">المجموع الفرعي</span>
                  <span className="font-semibold text-[#8B7355]">{subtotal.toFixed(2)} جنيه</span>
                </div>
                {discount && (
                  <div className="flex justify-between text-xs sm:text-sm bg-green-50 p-2 rounded-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <span className="text-green-700 font-medium">الخصم ({discount.code})</span>
                    <span className="font-bold text-green-700">
                      -{discountAmount.toFixed(2)} جنيه
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span className="text-[#8B7355]/70">رسوم التوصيل</span>
                  {loadingShippingFees ? (
                    <Loader2 className="animate-spin text-[#C4A57B]" size={16} />
                  ) : (
                    <span className="font-semibold text-[#8B7355]">
                      {shippingFee.toFixed(2)} جنيه
                    </span>
                  )}
                </div>
                {selectedGovernorate && (
                  <p className="text-[10px] sm:text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    🚚 التوصيل خلال: {selectedGovernorate.deliveryTime}
                  </p>
                )}
                <div className="flex justify-between items-center pt-2 sm:pt-3 border-t-2 border-[#E5DCC5]">
                  <span className="text-xl sm:text-2xl font-black text-[#D4AF37]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {total.toFixed(2)} جنيه
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    الإجمالي
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 lg:order-1 bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border-2 border-[#E5DCC5]"
          >
            {errorShippingFees && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl text-center">
                <p className="text-red-600 text-xs sm:text-sm mb-2 sm:mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>{errorShippingFees}</p>
                <button
                  type="button"
                  onClick={fetchShippingFees}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl text-right focus:outline-none transition-colors text-sm sm:text-base ${errors.fullName
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-[#E5DCC5] focus:border-[#D4AF37]'
                    }`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  disabled={isSubmitting}
                />
                {errors.fullName && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 text-right font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl text-right focus:outline-none transition-colors text-sm sm:text-base ${errors.phone
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-[#E5DCC5] focus:border-[#D4AF37]'
                    }`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 text-right font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  العنوان التفصيلي *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl text-right focus:outline-none resize-none transition-colors text-sm sm:text-base ${errors.address
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-[#E5DCC5] focus:border-[#D4AF37]'
                    }`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  disabled={isSubmitting}
                />
                {errors.address && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 text-right font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Governorate */}
              <div>
                <label className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  المحافظة *
                </label>
                {loadingShippingFees ? (
                  <div className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl bg-[#FAF9F6] flex items-center justify-end">
                    <span className="text-xs sm:text-sm text-[#8B7355]/70 ml-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      جاري جلب المحافظات...
                    </span>
                    <Loader2
                      className="animate-spin text-[#C4A57B]"
                      size={16}
                    />
                  </div>
                ) : (
                  <select
                    value={formData.governorate}
                    onChange={(e) =>
                      handleInputChange('governorate', e.target.value)
                    }
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl text-right focus:outline-none transition-colors text-sm sm:text-base ${errors.governorate
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-[#E5DCC5] focus:border-[#D4AF37]'
                      }`}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                    dir="rtl"
                    disabled={isSubmitting}
                  >
                    <option value="">اختر المحافظة...</option>
                    {shippingFees.map((gov) => (
                      <option key={gov.id} value={gov.governorate}>
                        {gov.governorate} - {gov.fee} جنيه
                      </option>
                    ))}
                  </select>
                )}
                {errors.governorate && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 text-right font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {errors.governorate}
                  </p>
                )}
              </div>

              {/* Discount Code */}
              <div>
                <label className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  كود الخصم
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.discountCode}
                    onChange={(e) =>
                      handleInputChange('discountCode', e.target.value)
                    }
                    placeholder="أدخل الكود"
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl text-right focus:outline-none transition-colors text-sm sm:text-base ${errorDiscount
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-[#E5DCC5] focus:border-[#D4AF37]'
                      }`}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                    disabled={loadingDiscount || isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={loadingDiscount || isSubmitting}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-sm sm:text-base ${loadingDiscount || isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#D4AF37] text-white hover:bg-[#C49F27]'
                      }`}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    {loadingDiscount ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      'تطبيق'
                    )}
                  </button>
                </div>
                {errorDiscount && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 text-right font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {errorDiscount}
                  </p>
                )}
                {discount && (
                  <p className="text-green-600 text-xs sm:text-sm mt-1 text-right font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    ✓ تم تطبيق كود {discount.code}: خصم{' '}
                    {discount.amount.toFixed(2)} جنيه
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-right text-[#8B7355] font-bold mb-3 text-sm sm:text-base flex items-center justify-end gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span>طريقة الدفع *</span>
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                </label>

                {/* InstaPay Option */}
                <label className="flex items-center justify-end gap-3 p-3 sm:p-4 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl cursor-pointer hover:bg-[#FAF9F6] transition-colors mb-3">
                  <div className="text-right flex-1">
                    <div className="text-[#8B7355] font-medium text-sm sm:text-base flex items-center gap-2 justify-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <span>InstaPay</span>
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <p className="text-xs text-[#8B7355]/70 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      التحويل على: <span className="font-semibold">saramostapha@instapay</span>
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="instapay"
                    checked={formData.paymentMethod === 'instapay'}
                    onChange={(e) =>
                      handleInputChange('paymentMethod', e.target.value)
                    }
                    className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]"
                    disabled={isSubmitting}
                  />
                </label>

                {/* Vodafone Cash Option */}
                <label className="flex items-center justify-end gap-3 p-3 sm:p-4 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl cursor-pointer hover:bg-[#FAF9F6] transition-colors">
                  <div className="text-right flex-1">
                    <div className="text-[#8B7355] font-medium text-sm sm:text-base flex items-center gap-2 justify-end" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <span>Vodafone Cash</span>
                      <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <p className="text-xs text-[#8B7355]/70 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      التحويل على: <span className="font-semibold">01021964426</span>
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vodafonecash"
                    checked={formData.paymentMethod === 'vodafonecash'}
                    onChange={(e) =>
                      handleInputChange('paymentMethod', e.target.value)
                    }
                    className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]"
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              {/* Sender Details */}
              <div>
                <label className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {formData.paymentMethod === 'vodafonecash'
                    ? 'رقم الموبايل الذي تم التحويل منه *'
                    : 'بيانات المُحوِّل (رقم الموبايل أو عنوان InstaPay) *'
                  }
                </label>
                <input
                  type="text"
                  value={formData.senderDetails}
                  onChange={(e) => handleInputChange('senderDetails', e.target.value)}
                  placeholder={formData.paymentMethod === 'vodafonecash' ? '01xxxxxxxxx' : 'yourname@instapay أو 01xxxxxxxxx'}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg sm:rounded-xl text-right focus:outline-none transition-colors text-sm sm:text-base ${errors.senderDetails
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-[#E5DCC5] focus:border-[#D4AF37]'
                    }`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  disabled={isSubmitting}
                />
                {errors.senderDetails && (
                  <p className="text-red-600 text-xs sm:text-sm mt-1 text-right font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {errors.senderDetails}
                  </p>
                )}
              </div>

              {/* Payment Proof Upload */}
              <div>
                <label className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  رفع صورة إثبات الدفع (اختياري)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData(prev => ({ ...prev, paymentProofImage: file }));
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl text-right focus:border-[#D4AF37] focus:outline-none text-sm sm:text-base"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-[#8B7355]/70 mt-1 text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  رفع لقطة شاشة للتحويل يساعد في سرعة تأكيد الطلب
                </p>
              </div>

              {/* Notes renamed to Payment Notes */}
              <div>
                <label className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  ملاحظات حول الدفع
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[#E5DCC5] rounded-lg sm:rounded-xl text-right focus:border-[#D4AF37] focus:outline-none resize-none text-sm sm:text-base"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  placeholder="أي ملاحظات إضافية حول عملية الدفع..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  loadingShippingFees ||
                  state.cart.length === 0 ||
                  !selectedGovernorate
                }
                className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${isSubmitting ||
                  loadingShippingFees ||
                  state.cart.length === 0 ||
                  !selectedGovernorate
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-primary-green hover:bg-primary-green-dark text-black'
                  }`}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>جاري تأكيد الطلب...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>تأكيد الطلب</span>
                  </>
                )}
              </button>

              {!selectedGovernorate && formData.governorate && (
                <p className="text-red-600 text-xs sm:text-sm mt-2 text-center font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  يرجى اختيار محافظة متوفرة لتحديد رسوم التوصيل.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
