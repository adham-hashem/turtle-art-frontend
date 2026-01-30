import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowRight, Sparkles, Heart, ShoppingBag, Search, MessageCircle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-6 sm:py-8 px-3 sm:px-4 pt-20 relative overflow-hidden" dir="rtl">
      {/* Background Decorations - Hidden on small mobile */}
      <div className="hidden sm:block absolute top-10 left-10 text-gray-200 animate-bounce">
        <ShoppingBag className="h-8 w-8 sm:h-12 sm:w-12" />
      </div>
      <div className="hidden sm:block absolute top-20 right-16 text-gray-300 animate-pulse">
        <Sparkles className="h-6 w-6 sm:h-10 sm:w-10" />
      </div>
      <div className="hidden md:block absolute bottom-20 left-16 text-gray-200 animate-pulse">
        <Heart className="h-6 w-6 sm:h-8 sm:w-8 fill-current" />
      </div>
      <div className="hidden md:block absolute bottom-32 right-10 text-gray-300 animate-bounce">
        <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10" />
      </div>
      <div className="hidden lg:block absolute top-1/2 left-5 text-gray-100 opacity-50">
        <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16" />
      </div>
      <div className="hidden lg:block absolute top-1/3 right-5 text-gray-100 opacity-50">
        <Heart className="h-8 w-8 sm:h-12 sm:w-12 fill-current" />
      </div>

      <div className="container mx-auto relative z-10 max-w-2xl">
        <div className="text-center">
          {/* Main Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 md:p-8 border border-gray-200">
            {/* Logo */}
            <div className="mb-4 sm:mb-6">
              <div className="relative inline-block">
                <div className="absolute -inset-2 bg-gray-100 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <img
                  src="/turtle_art_logo.jpeg"
                  alt="Turtle Art"
                  className="relative h-16 w-16 sm:h-20 sm:w-20 mx-auto rounded-full object-cover shadow-xl border-4 border-white"
                />
              </div>
            </div>

            {/* 404 Illustration */}
            <div className="relative mb-4 sm:mb-6">
              <div className="text-6xl sm:text-7xl md:text-8xl font-black text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                404
              </div>
              <div className="absolute -top-1 sm:-top-2 right-1/4 animate-bounce">
                <span className="text-2xl sm:text-3xl">👜</span>
              </div>
              <div className="absolute -bottom-1 sm:-bottom-2 left-1/4 animate-bounce" style={{ animationDelay: '75ms' }}>
                <span className="text-xl sm:text-2xl">🎒</span>
              </div>
            </div>

            {/* Sad Icon */}
            <div className="mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full">
                <span className="text-4xl sm:text-5xl">😢</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-black mb-2 sm:mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              أوبس! الصفحة غير موجودة
            </h2>

            <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 leading-relaxed px-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              يبدو أن هذه الصفحة اختفت مثل حقيبة أحلامك! 👜
              <br />
              لا تقلق، يمكنك العودة واستكشاف مجموعتنا الرائعة.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <Link
                to="/"
                className="w-full bg-primary-green text-black py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl hover:bg-primary-green-dark transition-all shadow-lg hover:shadow-xl font-bold flex items-center justify-center gap-2 text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <ShoppingBag size={18} className="sm:hidden" />
                <ShoppingBag size={20} className="hidden sm:block" />
                العودة للرئيسية
              </Link>

              <Link
                to="/products"
                className="w-full bg-green-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl hover:bg-green-600 transition-all shadow-lg hover:shadow-xl font-bold flex items-center justify-center gap-2 text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
                <span>تصفح المنتجات</span>
              </Link>

              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-100 text-black py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl hover:bg-gray-200 transition-all font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                <span>العودة للخلف</span>
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-4 sm:mt-6 md:mt-8 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <h3 className="font-bold text-black text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                هل تبحث عن شيء معين؟
              </h3>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              يمكنك تصفح أقسام الموقع أو التواصل معنا مباشرة
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                to="/"
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black border border-gray-200 rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                الرئيسية
              </Link>
              <Link
                to="/products"
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black border border-gray-200 rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                المنتجات
              </Link>
              <Link
                to="/cart"
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black border border-gray-200 rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                السلة
              </Link>
              <Link
                to="/my-orders"
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black border border-gray-200 rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-100 transition-colors"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                طلباتي
              </Link>
            </div>
          </div>

          {/* Contact WhatsApp */}
          <div className="mt-4 sm:mt-6">
            <a
              href="https://wa.me/201000070653?text=مرحباً، أحتاج مساعدة"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold transition-colors text-sm sm:text-base bg-green-50 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-green-100"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>تواصل معنا عبر واتساب</span>
            </a>
          </div>

          {/* Fun Message */}
          <div className="mt-6 sm:mt-8">
            <p className="text-gray-400 text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              لا تحزن! كل المشاكل تُحل بحقيبة جديدة 👜✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
