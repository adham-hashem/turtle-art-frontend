// src/pages/CustomOrders.tsx

import { useMemo, useState } from 'react';
import {
  Upload,
  CreditCard,
  Sparkles,
  CheckCircle,
  Gift,
  Heart,
  ArrowRight,
  User,
  Phone,
  MapPin,
  MessageSquareText,
  Image as ImageIcon,
  Palette,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Backend: PaymentMethod? (nullable)
// We will send number when chosen, otherwise don't send it at all.
type PaymentMethod = 0 | 1 | 2;

interface PaymentMethodOption {
  label: string;
  icon: string;
  value: PaymentMethod;
}

interface CustomOrderForm {
  // Required by backend
  requiredText: string;
  preferredColors: string; // comma-separated
  designImage: File | null;
  imagePreview: string | null;

  // Optional
  notes: string;
  customerName: string;
  customerPhone: string;
  additionalPhone: string;
  address: string;

  // Optional payment
  paymentMethod: PaymentMethod | null;
}

const normalizeDigitsToEnglish = (value: string) => {
  const ar = '٠١٢٣٤٥٦٧٨٩';
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  let out = value;

  out = out.replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)));
  out = out.replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));

  return out;
};

const normalizePhone = (value: string) => {
  const englishDigits = normalizeDigitsToEnglish(value);
  return englishDigits.replace(/\D/g, '').slice(0, 11);
};

// Backend regex: ^01[0-2,5]\d{8}$ (same as you used before)
const isValidEgyptPhone = (value: string) => /^01[0125][0-9]{8}$/.test(value);

export default function CustomOrders() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const paymentMethods: PaymentMethodOption[] = useMemo(
    () => [
      { value: 0, label: 'كاش', icon: '💵' },
      { value: 1, label: 'فودافون كاش', icon: '📱' },
      { value: 2, label: 'إنستا باي', icon: '🏦' },
    ],
    []
  );

  const [formData, setFormData] = useState<CustomOrderForm>({
    // required
    requiredText: '',
    preferredColors: '',
    designImage: null,
    imagePreview: null,

    // optional
    notes: '',
    customerName: '',
    customerPhone: '',
    additionalPhone: '',
    address: '',

    paymentMethod: null,
  });

  const getAuthToken = () => {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  };

  const handleFileUpload = (file: File | null) => {
    if (!file) {
      setFormData((p) => ({ ...p, designImage: null, imagePreview: null }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((p) => ({
        ...p,
        designImage: file,
        imagePreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    // Backend requires: DesignImage + RequiredText + PreferredColors
    if (!formData.designImage) {
      alert('رفع التصميم مطلوب (صورة مرجعية)');
      return false;
    }
    if (!formData.requiredText.trim()) {
      alert('النص المطلوب مطلوب');
      return false;
    }
    if (formData.requiredText.trim().length > 200) {
      alert('النص المطلوب يجب ألا يتجاوز 200 حرف');
      return false;
    }
    if (!formData.preferredColors.trim()) {
      alert('الألوان المفضلة مطلوبة');
      return false;
    }
    if (formData.preferredColors.trim().length > 200) {
      alert('الألوان المفضلة يجب ألا تتجاوز 200 حرف');
      return false;
    }
    if (formData.notes.trim().length > 1000) {
      alert('الملاحظات يجب أن لا تتجاوز 1000 حرف');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const name = formData.customerName.trim();
    const phone = normalizePhone(formData.customerPhone);
    const addPhone = formData.additionalPhone ? normalizePhone(formData.additionalPhone) : '';

    if (!name) {
      alert('الاسم مطلوب');
      return false;
    }
    if (name.length < 2 || name.length > 100) {
      alert('الاسم يجب أن يكون بين 2 و 100 حرف');
      return false;
    }

    if (!isValidEgyptPhone(phone)) {
      alert('رقم الهاتف غير صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)');
      return false;
    }

    if (addPhone && !isValidEgyptPhone(addPhone)) {
      alert('رقم الهاتف الإضافي غير صحيح');
      return false;
    }

    if (formData.address.trim().length > 500) {
      alert('العنوان يجب أن لا يتجاوز 500 حرف');
      return false;
    }

    return true;
  };

  const postOrder = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    // Validate required backend fields one more time
    if (!validateStep1() || !validateStep2()) return;

    const normalizedPhone = normalizePhone(formData.customerPhone);
    const normalizedAdditionalPhone = formData.additionalPhone ? normalizePhone(formData.additionalPhone) : '';

    const fd = new FormData();

    // Required (CreateCustomOrderDto)
    fd.append('CustomerName', formData.customerName.trim());
    fd.append('CustomerPhone', normalizedPhone);

    // REQUIRED: DesignImage
    if (formData.designImage) {
      fd.append('DesignImage', formData.designImage);
    }

    // REQUIRED
    fd.append('RequiredText', formData.requiredText.trim());
    fd.append('PreferredColors', formData.preferredColors.trim());

    // Optional
    if (normalizedAdditionalPhone) fd.append('AdditionalPhone', normalizedAdditionalPhone);
    if (formData.address.trim()) fd.append('Address', formData.address.trim());
    if (formData.notes.trim()) fd.append('Notes', formData.notes.trim());

    // Optional payment (nullable)
    if (formData.paymentMethod !== null) {
      fd.append('PaymentMethod', String(formData.paymentMethod));
    }

    // Controller route: api/CustomOrders
    const url = `${apiUrl}/api/CustomOrders`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: fd,
    });

    if (res.ok) {
      const result = await res.json().catch(() => ({}));
      setOrderId(result.id ?? null);
      setOrderNumber(result.orderNumber ?? null);
      setOrderComplete(true);
      return;
    }

    const lastErr = await res.text().catch(() => '');

    try {
      const parsed = JSON.parse(lastErr);
      throw new Error(parsed?.message || parsed?.error || 'فشل في إنشاء الطلب');
    } catch {
      throw new Error(lastErr || 'فشل في إنشاء الطلب');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await postOrder();
    } catch (error) {
      console.error('Error creating custom order:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء الطلب. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Success Screen
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-[#E5DCC5]">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-xl opacity-25 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-xl">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            تم استلام طلبك بنجاح!
          </h1>
          <p className="text-[#8B7355]/70 mb-6" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            سيتم التواصل معك قريباً لتأكيد التفاصيل والسعر
          </p>

          <div className="bg-[#FAF9F6] rounded-2xl p-4 mb-6 border-2 border-[#E5DCC5]">
            <p className="text-sm text-[#8B7355]/70 mb-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              رقم الطلب
            </p>
            <p className="text-2xl font-black text-[#D4AF37]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {orderNumber || orderId}
            </p>
          </div>

          <div className="bg-[#F5F5DC] rounded-2xl p-4 mb-6 text-right border-2 border-[#E5DCC5]">
            <h3 className="font-bold text-[#8B7355] mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              ملخص الطلب
            </h3>

            <div className="space-y-2 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <div className="flex justify-between">
                <span className="text-[#8B7355]/80">{formData.customerName}</span>
                <span className="font-medium text-[#8B7355]">الاسم</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#8B7355]/80">{formData.customerPhone}</span>
                <span className="font-medium text-[#8B7355]">الهاتف</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#8B7355]/80 line-clamp-2">{formData.requiredText}</span>
                <span className="font-medium text-[#8B7355]">النص</span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#8B7355]/80 line-clamp-2">{formData.preferredColors}</span>
                <span className="font-medium text-[#8B7355]">الألوان</span>
              </div>

              {formData.notes && (
                <div className="flex justify-between">
                  <span className="text-[#8B7355]/80 line-clamp-2">{formData.notes}</span>
                  <span className="font-medium text-[#8B7355]">ملاحظات</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-[#8B7355]/80">{formData.designImage ? 'تم رفع صورة' : '—'}</span>
                <span className="font-medium text-[#8B7355]">التصميم</span>
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white py-4 rounded-2xl font-bold hover:from-[#6B5644] hover:to-[#8B6644] transition-all shadow-lg hover:shadow-xl"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <span>العودة للرئيسية</span>
            <ArrowRight className="h-5 w-5 rotate-180" />
          </Link>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                تفاصيل التصميم
              </h2>
              <p className="text-[#8B7355]/70 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                ارفع صورة مرجعية + اكتب النص المطلوب + اختَر الألوان المفضلة
              </p>
            </div>

            {/* RequiredText */}
            <div>
              <label className="block text-right text-[#8B7355] font-medium mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                النص المطلوب *
              </label>
              <input
                type="text"
                value={formData.requiredText}
                onChange={(e) => setFormData((p) => ({ ...p, requiredText: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-2xl text-right focus:border-[#D4AF37] focus:outline-none transition-colors bg-white"
                placeholder="مثال: سارة محمد"
                maxLength={200}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
              <p className="text-xs text-[#8B7355]/60 text-right mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {formData.requiredText.length}/200
              </p>
            </div>

            {/* PreferredColors */}
            <div>
              <label className="block text-right text-[#8B7355] font-medium mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Palette className="inline h-5 w-5 ml-2" />
                الألوان المفضلة * (اكتبها مفصولة بفواصل)
              </label>
              <input
                type="text"
                value={formData.preferredColors}
                onChange={(e) => setFormData((p) => ({ ...p, preferredColors: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-2xl text-right focus:border-[#D4AF37] focus:outline-none transition-colors bg-white"
                placeholder="مثال: ذهبي, بيج, أبيض"
                maxLength={200}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
              <p className="text-xs text-[#8B7355]/60 text-right mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {formData.preferredColors.length}/200
              </p>
            </div>

            {/* Notes (optional) */}
            <div>
              <label className="block text-right text-[#8B7355] font-medium mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <MessageSquareText className="inline h-5 w-5 ml-2" />
                ملاحظات إضافية (اختياري)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-2xl text-right focus:border-[#D4AF37] focus:outline-none resize-none bg-white"
                placeholder="مثال: خط عربي، مكان الاسم على الغطاء، إضافة رمز صغير..."
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
              <p className="text-xs text-[#8B7355]/60 text-right mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {formData.notes.length}/1000
              </p>
            </div>

            {/* DesignImage REQUIRED */}
            <div>
              <label className="block text-right text-[#8B7355] font-medium mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Upload className="inline h-5 w-5 ml-2" />
                صورة التصميم / مرجع * (مطلوب)
              </label>

              <div
                className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer ${
                  formData.imagePreview
                    ? 'border-green-400 bg-green-50'
                    : 'border-[#E5DCC5] hover:border-[#D4AF37] hover:bg-[#FAF9F6]'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {formData.imagePreview ? (
                  <div>
                    <img src={formData.imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-2xl mx-auto mb-2" />
                    <p className="text-green-600 font-medium text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      ✓ تم رفع الصورة
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((p) => ({ ...p, designImage: null, imagePreview: null }));
                      }}
                      className="text-red-500 text-xs mt-1 hover:underline"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    >
                      إزالة الصورة
                    </button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="h-10 w-10 text-[#C4A57B] mx-auto mb-2" />
                    <p className="text-[#8B7355] font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      اضغط لاختيار صورة
                    </p>
                    <p className="text-sm text-[#8B7355]/70 mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      PNG أو JPG - حتى 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!validateStep1()) return;
                setStep(2);
              }}
              className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white py-4 rounded-2xl text-lg font-bold hover:from-[#6B5644] hover:to-[#8B6644] transition-all shadow-lg hover:shadow-xl"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              التالي ←
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                بيانات التواصل
              </h2>
              <p className="text-[#8B7355]/70 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                أدخل بياناتك للتواصل والتأكيد
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-right text-[#8B7355] font-medium mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <User className="inline h-5 w-5 ml-2" />
                  الاسم بالكامل *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData((p) => ({ ...p, customerName: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-2xl text-right focus:border-[#D4AF37] focus:outline-none bg-white"
                  placeholder="أحمد محمد"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-right text-[#8B7355] font-medium mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <Phone className="inline h-5 w-5 ml-2" />
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={11}
                  pattern="01[0125][0-9]{8}"
                  title="رقم مصري 11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData((p) => ({ ...p, customerPhone: normalizePhone(e.target.value) }))}
                  className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-2xl text-right focus:border-[#D4AF37] focus:outline-none bg-white"
                  placeholder="01xxxxxxxxx"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                />
                <p className="text-xs text-[#8B7355]/60 text-right mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  مثال: 01012345678
                </p>
              </div>
            </div>

            <div>
              <label className="block text-right text-[#8B7355] font-medium mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                رقم هاتف إضافي (اختياري)
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={11}
                value={formData.additionalPhone}
                onChange={(e) => setFormData((p) => ({ ...p, additionalPhone: normalizePhone(e.target.value) }))}
                className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-2xl text-right focus:border-[#D4AF37] focus:outline-none bg-white"
                placeholder="01xxxxxxxxx"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
              <p className="text-xs text-[#8B7355]/60 text-right mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                رقم للتواصل في حالة عدم الرد على الرقم الأساسي
              </p>
            </div>

            <div>
              <label className="block text-right text-[#8B7355] font-medium mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <MapPin className="inline h-5 w-5 ml-2" />
                العنوان (اختياري)
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                rows={2}
                maxLength={500}
                className="w-full px-4 py-3 border-2 border-[#E5DCC5] rounded-2xl text-right focus:border-[#D4AF37] focus:outline-none resize-none bg-white"
                placeholder="المدينة، الشارع، رقم المنزل..."
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
              <p className="text-xs text-[#8B7355]/60 text-right mt-1" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {formData.address.length}/500
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!validateStep2()) return;
                setStep(3);
              }}
              className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white py-4 rounded-2xl text-lg font-bold hover:from-[#6B5644] hover:to-[#8B6644] transition-all shadow-lg hover:shadow-xl"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              التالي ←
            </button>
          </div>
        );

      case 3:
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                مراجعة وتأكيد
              </h2>
              <p className="text-[#8B7355]/70 text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                اختر طريقة الدفع (اختياري) ثم أكد الطلب
              </p>
            </div>

            {/* Payment (optional) */}
            <div>
              <label className="block text-right text-[#8B7355] font-medium mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <CreditCard className="inline h-5 w-5 ml-2" />
                طريقة الدفع (اختياري)
              </label>

              <div className="space-y-2">
                {/* Option: no payment method */}
                <label
                  className={`flex items-center justify-end gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                    formData.paymentMethod === null
                      ? 'border-[#D4AF37] bg-[#FAF9F6]'
                      : 'border-[#E5DCC5] hover:border-[#D4AF37] hover:bg-[#FAF9F6]'
                  }`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <span className="text-[#8B7355] font-bold flex items-center gap-2">
                    <span>✨</span>
                    <span>سأحددها لاحقاً</span>
                  </span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="none"
                    checked={formData.paymentMethod === null}
                    onChange={() => setFormData((p) => ({ ...p, paymentMethod: null }))}
                    className="w-5 h-5 accent-[#D4AF37]"
                  />
                </label>

                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center justify-end gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                      formData.paymentMethod === method.value
                        ? 'border-[#D4AF37] bg-[#FAF9F6]'
                        : 'border-[#E5DCC5] hover:border-[#D4AF37] hover:bg-[#FAF9F6]'
                    }`}
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <span className="text-[#8B7355] font-bold flex items-center gap-2">
                      <span>{method.icon}</span>
                      <span>{method.label}</span>
                    </span>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={String(method.value)}
                      checked={formData.paymentMethod === method.value}
                      onChange={() => setFormData((p) => ({ ...p, paymentMethod: method.value }))}
                      className="w-5 h-5 accent-[#D4AF37]"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] border-2 border-[#E5DCC5] rounded-3xl p-4">
              <h3
                className="font-bold text-[#8B7355] mb-3 text-right flex items-center justify-end gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <span>ملخص الطلب</span>
                <Gift className="h-5 w-5 text-[#D4AF37]" />
              </h3>

              <div className="space-y-2 text-sm text-right" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <div className="flex justify-between">
                  <span className="text-[#8B7355]/80">{formData.customerName || '—'}</span>
                  <span className="text-[#8B7355]/70">الاسم</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B7355]/80">{formData.customerPhone || '—'}</span>
                  <span className="text-[#8B7355]/70">الهاتف</span>
                </div>
                {formData.additionalPhone && (
                  <div className="flex justify-between">
                    <span className="text-[#8B7355]/80">{formData.additionalPhone}</span>
                    <span className="text-[#8B7355]/70">هاتف إضافي</span>
                  </div>
                )}
                {formData.address && (
                  <div className="flex justify-between">
                    <span className="text-[#8B7355]/80 line-clamp-2">{formData.address}</span>
                    <span className="text-[#8B7355]/70">العنوان</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#8B7355]/80 line-clamp-2">{formData.requiredText || '—'}</span>
                  <span className="text-[#8B7355]/70">النص</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B7355]/80 line-clamp-2">{formData.preferredColors || '—'}</span>
                  <span className="text-[#8B7355]/70">الألوان</span>
                </div>
                {formData.notes && (
                  <div className="flex justify-between">
                    <span className="text-[#8B7355]/80 line-clamp-2">{formData.notes}</span>
                    <span className="text-[#8B7355]/70">ملاحظات</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#8B7355]/80">{formData.designImage ? 'تم رفع صورة' : '—'}</span>
                  <span className="text-[#8B7355]/70">التصميم</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B7355]/80">
                    {formData.paymentMethod === null
                      ? 'لاحقاً'
                      : paymentMethods.find((p) => p.value === formData.paymentMethod)?.label || '—'}
                  </span>
                  <span className="text-[#8B7355]/70">الدفع</span>
                </div>
              </div>

              <p className="text-xs text-[#8B7355]/60 text-right mt-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                * يتم تحديد السعر النهائي بعد مراجعة التصميم والتواصل معك
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white py-4 rounded-2xl text-lg font-bold hover:from-[#6B5644] hover:to-[#8B6644] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              {loading ? (
                <>
                  <Sparkles className="h-6 w-6 animate-spin" />
                  <span>جاري إرسال الطلب...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-6 w-6" />
                  <span>تأكيد الطلب</span>
                </>
              )}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC]" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center space-x-reverse space-x-2 text-[#8B7355] hover:text-[#D4AF37] mb-6 transition-colors"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <ArrowRight size={20} />
            <span>العودة للرئيسية</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute -top-2 -right-2 text-[#D4AF37] animate-pulse">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-2 -left-2 text-[#C4A57B] animate-pulse">
                <Heart className="h-6 w-6 fill-current" />
              </div>
              <div className="bg-gradient-to-r from-[#8B7355] to-[#A67C52] rounded-full p-4 shadow-xl">
                <Gift className="h-12 w-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-[#8B7355] mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              تصميم خاص حسب طلبك
            </h1>
            <p className="text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              ارفع التصميم + اكتب النص + حدّد الألوان… وهنرجعلك لتأكيد التفاصيل 👜✨
            </p>
          </div>

          {/* Stepper */}
          <div className="flex justify-center items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all border-2 ${
                    s < step
                      ? 'bg-green-500 text-white border-green-500'
                      : s === step
                      ? 'bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white border-transparent shadow-lg scale-110'
                      : 'bg-white text-[#8B7355]/40 border-[#E5DCC5]'
                  }`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`w-8 h-1 rounded-full mx-1 transition-colors ${s < step ? 'bg-green-500' : 'bg-[#E5DCC5]'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 mb-8 text-xs text-[#8B7355]/60" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <span className={step >= 1 ? 'text-[#8B7355] font-bold' : ''}>التصميم</span>
            <span className={step >= 2 ? 'text-[#8B7355] font-bold' : ''}>البيانات</span>
            <span className={step >= 3 ? 'text-[#8B7355] font-bold' : ''}>التأكيد</span>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-[#E5DCC5]">
            {renderStep()}

            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="w-full mt-4 bg-[#FAF9F6] text-[#8B7355] py-3 rounded-2xl font-bold hover:bg-[#E5DCC5] transition-colors flex items-center justify-center gap-2 border-2 border-[#E5DCC5]"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <ArrowRight className="h-5 w-5" />
                <span>رجوع للخطوة السابقة</span>
              </button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="bg-white/80 rounded-2xl p-4 text-center shadow-md border border-[#E5DCC5]">
              <span className="text-2xl block mb-1">🎨</span>
              <p className="text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                تصميم حسب الطلب
              </p>
            </div>
            <div className="bg-white/80 rounded-2xl p-4 text-center shadow-md border border-[#E5DCC5]">
              <span className="text-2xl block mb-1">🎯</span>
              <p className="text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                تنفيذ بدقة
              </p>
            </div>
            <div className="bg-white/80 rounded-2xl p-4 text-center shadow-md border border-[#E5DCC5]">
              <span className="text-2xl block mb-1">📞</span>
              <p className="text-xs text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                تأكيد سريع
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
