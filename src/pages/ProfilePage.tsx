import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Loader,
  User,
  Mail,
  MapPin,
  Phone,
  Home,
  CheckCircle,
  XCircle,
  Shield,
  Sparkles
} from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://elshal.runasp.net';

const ProfilePage = () => {
  const { user, isAuthenticated, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    FullName: '',
    Email: '',
    Address: '',
    Governorate: '',
    PhoneNumber: '',
    IsEmailVerified: false,
    IsProfileComplete: false,
    Roles: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('accessToken');
        if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
          throw new Error('يرجى تسجيل الدخول أولاً');
        }

        const response = await fetch(`${apiUrl}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'فشل في جلب بيانات الملف الشخصي');
        }

        const data = await response.json();
        setProfile({
          FullName: data.fullName || '',
          Email: data.email || '',
          Address: data.address || '',
          Governorate: data.governorate || '',
          PhoneNumber: data.phoneNumber || '',
          IsEmailVerified: data.isEmailVerified || false,
          IsProfileComplete: data.isProfileComplete || false,
          Roles: Array.isArray(data.roles) ? data.roles : [],
        });
      } catch (err) {
        setError(err.message || 'حدث خطأ أثناء جلب بيانات الملف الشخصي. حاول مرة أخرى لاحقاً.');
        if (err.message === 'يرجى تسجيل الدخول أولاً') {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (success) setSuccess(null);
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
        throw new Error('يرجى تسجيل الدخول أولاً');
      }

      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          FullName: profile.FullName,
          Address: profile.Address,
          Governorate: profile.Governorate,
          PhoneNumber: profile.PhoneNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل في تحديث الملف الشخصي');
      }

      const data = await response.json();
      setSuccess(data.message || 'تم تحديث الملف الشخصي بنجاح');

      updateUserProfile({
        name: profile.FullName,
        address: profile.Address,
        governorate: profile.Governorate,
        phoneNumber: profile.PhoneNumber,
      });

      setProfile((prev) => ({
        ...prev,
        IsProfileComplete: !!(profile.FullName && profile.Address && profile.Governorate && profile.PhoneNumber),
      }));
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحديث الملف الشخصي. حاول مرة أخرى لاحقاً.');
      if (err.message === 'يرجى تسجيل الدخول أولاً') {
        navigate('/login');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 pt-20" dir="rtl">
        <div className="text-center py-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gray-100 rounded-full p-4">
              <User className="h-12 w-12 text-black animate-bounce" />
            </div>
          </div>
          <p className="text-black font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>جاري تحميل البيانات...</p>
          <p className="text-gray-500 text-sm mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>انتظر لحظة 👤</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 sm:py-12 md:py-16 pt-24 px-3 sm:px-4" dir="rtl">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full mb-4 border-2 border-gray-100">
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-2 flex items-center justify-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-black" />
            <span>الملف الشخصي</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            إدارة معلوماتك الشخصية
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 md:p-8 lg:p-12 border border-gray-200">
          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 rounded-xl sm:rounded-2xl border border-red-200 animate-fade-in">
              <p className="text-red-600 text-center font-medium text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-xl sm:rounded-2xl border border-green-200 animate-fade-in">
              <p className="text-green-600 text-center font-medium text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-right text-black font-bold mb-2 text-sm sm:text-base flex items-center justify-end gap-2" htmlFor="FullName" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span>الاسم الكامل</span>
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </label>
                <input
                  id="FullName"
                  type="text"
                  name="FullName"
                  value={profile.FullName}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-50 text-right border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm sm:text-base text-black"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  placeholder="أدخل الاسم الكامل"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-right text-black font-bold mb-2 text-sm sm:text-base flex items-center justify-end gap-2" htmlFor="Email" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span>البريد الإلكتروني</span>
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </label>
                <input
                  id="Email"
                  type="email"
                  value={profile.Email}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-100 text-right border border-gray-200 text-gray-500 cursor-not-allowed text-sm sm:text-base"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  disabled
                  readOnly
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-right text-black font-bold mb-2 text-sm sm:text-base flex items-center justify-end gap-2" htmlFor="Address" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span>العنوان</span>
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </label>
                <input
                  id="Address"
                  type="text"
                  name="Address"
                  value={profile.Address}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-50 text-right border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm sm:text-base text-black"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  placeholder="أدخل العنوان"
                  disabled={submitting}
                />
              </div>

              {/* Governorate */}
              <div>
                <label className="block text-right text-black font-bold mb-2 text-sm sm:text-base flex items-center justify-end gap-2" htmlFor="Governorate" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span>المحافظة</span>
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </label>
                <input
                  id="Governorate"
                  type="text"
                  name="Governorate"
                  value={profile.Governorate}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-50 text-right border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm sm:text-base text-black"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  placeholder="أدخل المحافظة"
                  disabled={submitting}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-right text-black font-bold mb-2 text-sm sm:text-base flex items-center justify-end gap-2" htmlFor="PhoneNumber" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <span>رقم الهاتف</span>
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </label>
                <input
                  id="PhoneNumber"
                  type="tel"
                  name="PhoneNumber"
                  value={profile.PhoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-50 text-right border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm sm:text-base text-black"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  placeholder="01xxxxxxxxx"
                  disabled={submitting}
                />
              </div>

              {/* Email Verification Status */}
              <div>
                <label className="block text-right text-black font-bold mb-2 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  حالة التحقق من البريد
                </label>
                <div className="text-right">
                  {profile.IsEmailVerified ? (
                    <span className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-3 sm:px-4 py-2 rounded-lg border-2 border-green-200 font-semibold text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      تم التحقق
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-3 sm:px-4 py-2 rounded-lg border-2 border-red-200 font-semibold text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      لم يتم التحقق
                    </span>
                  )}
                </div>
              </div>

              {/* Profile Completion Status */}
              <div>
                <label className="block text-right text-black font-bold mb-2 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  حالة الملف الشخصي
                </label>
                <div className="text-right">
                  {profile.IsProfileComplete ? (
                    <span className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-3 sm:px-4 py-2 rounded-lg border-2 border-green-200 font-semibold text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      مكتمل
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-amber-600 bg-amber-50 px-3 sm:px-4 py-2 rounded-lg border-2 border-amber-200 font-semibold text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      غير مكتمل
                    </span>
                  )}
                </div>
              </div>

              {/* Roles */}
              {profile.Roles.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-right text-black font-bold mb-2 text-sm sm:text-base flex items-center justify-end gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <span>الأدوار</span>
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  </label>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {profile.Roles.map((role, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border border-gray-300"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 sm:pt-6">
              <button
                type="submit"
                className="w-full btn-success px-6 sm:px-10 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base md:text-lg flex items-center justify-center gap-2"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>جارٍ التحديث...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>تحديث الملف الشخصي</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-400" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              🔒 بياناتك آمنة ومحمية
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
