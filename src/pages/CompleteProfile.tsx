import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader, UserCircle, MapPin, Phone, Home, Sparkles } from 'lucide-react';

// All 27 Egyptian Governorates
const GOVERNORATES = [
  { value: "1", label: "القاهرة" },
  { value: "2", label: "الإسكندرية" },
  { value: "3", label: "بورسعيد" },
  { value: "4", label: "السويس" },
  { value: "5", label: "الإسماعيلية" },
  { value: "6", label: "دمياط" },
  { value: "7", label: "الدقهلية" },
  { value: "8", label: "الشرقية" },
  { value: "9", label: "القليوبية" },
  { value: "10", label: "كفر الشيخ" },
  { value: "11", label: "الغربية" },
  { value: "12", label: "المنوفية" },
  { value: "13", label: "البحيرة" },
  { value: "14", label: "الجيزة" },
  { value: "15", label: "بني سويف" },
  { value: "16", label: "الفيوم" },
  { value: "17", label: "المنيا" },
  { value: "18", label: "أسيوط" },
  { value: "19", label: "سوهاج" },
  { value: "20", label: "قنا" },
  { value: "21", label: "أسوان" },
  { value: "22", label: "مطروح" },
  { value: "23", label: "الوادي الجديد" },
  { value: "24", label: "البحر الأحمر" },
  { value: "25", label: "شمال سيناء" },
  { value: "26", label: "جنوب سيناء" },
  { value: "27", label: "الأقصر" }
];

const CompleteProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    governorate: '',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://elshal.runasp.net';
        const response = await fetch(`${apiUrl}/api/users/profile-status`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (!response.ok) {
          throw new Error('فشل في التحقق من حالة الملف الشخصي');
        }
        const data = await response.json();
        if (data.isProfileComplete) {
          navigate('/');
        }
      } catch (err) {
        setError('حدث خطأ أثناء التحقق من حالة الملف الشخصي');
      }
    };
    checkProfileStatus();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.governorate === "0") {
      setError('يرجى اختيار محافظة صالحة');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://elshal.runasp.net';
      const response = await fetch(`${apiUrl}/api/users/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إكمال الملف الشخصي');
      }

      updateUserProfile({
        name: formData.fullName,
        address: formData.address,
        governorate: formData.governorate,
        phoneNumber: formData.phoneNumber,
      });

      setSuccess('تم إكمال الملف الشخصي بنجاح');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إكمال الملف الشخصي. حاول مرة أخرى لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] py-6 sm:py-12 md:py-16 px-3 sm:px-4 pt-24" dir="rtl">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] rounded-full mb-4 shadow-lg">
            <UserCircle className="w-8 h-8 sm:w-10 sm:h-10 text-[#8B7355]" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#8B7355] mb-2 flex items-center justify-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4AF37]" />
            <span>إكمال الملف الشخصي</span>
          </h1>
          <p className="text-sm sm:text-base text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            يرجى إكمال بياناتك للمتابعة
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border-2 border-[#E5DCC5]">
          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 rounded-xl sm:rounded-2xl border-2 border-red-200">
              <p className="text-red-600 text-center font-medium text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-xl sm:rounded-2xl border-2 border-green-200">
              <p className="text-green-600 text-center font-medium text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* Full Name */}
            <div>
              <label 
                htmlFor="fullName" 
                className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base flex items-center justify-end gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <span>الاسم الكامل</span>
                <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-[#FAF9F6] text-right border-2 border-[#E5DCC5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                placeholder="أدخل الاسم الكامل"
                disabled={loading}
              />
            </div>

            {/* Address */}
            <div>
              <label 
                htmlFor="address" 
                className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base flex items-center justify-end gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <span>العنوان</span>
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-[#FAF9F6] text-right border-2 border-[#E5DCC5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                placeholder="أدخل العنوان"
                disabled={loading}
              />
            </div>

            {/* Governorate */}
            <div>
              <label 
                htmlFor="governorate" 
                className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base flex items-center justify-end gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <span>المحافظة</span>
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
              </label>
              <select
                id="governorate"
                name="governorate"
                value={formData.governorate}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-[#FAF9F6] text-right border-2 border-[#E5DCC5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                disabled={loading}
                dir="rtl"
              >
                <option value="0">اختر المحافظة...</option>
                {GOVERNORATES.map((gov) => (
                  <option key={gov.value} value={gov.value}>
                    {gov.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label 
                htmlFor="phoneNumber" 
                className="block text-right text-[#8B7355] font-bold mb-2 text-sm sm:text-base flex items-center justify-end gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <span>رقم الهاتف</span>
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-[#FAF9F6] text-right border-2 border-[#E5DCC5] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                placeholder="01xxxxxxxxx"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#8B7355] to-[#A67C52] text-white py-3 sm:py-3.5 md:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl hover:from-[#6B5644] hover:to-[#8B6644] transition-all font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg flex items-center justify-center gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>جارٍ الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>إكمال الملف الشخصي</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-[#8B7355]/70" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              🔒 بياناتك آمنة ومحمية
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
