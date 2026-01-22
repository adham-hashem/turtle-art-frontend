import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Tag, Loader2, Copy, AlertCircle, Sparkles, Gift, Percent } from 'lucide-react';

// Define interfaces
interface OfferItem {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  category: number;
  discountPercentage: number;
  originalPrice: number;
  salePrice: number;
  startDate: string;
  endDate: string;
  isFeatured: boolean;
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

interface ApiResponse<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const OffersPage: React.FC = () => {
  const navigate = useNavigate();

  // State for offers
  const [offerItems, setOfferItems] = useState<OfferItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [errorOffers, setErrorOffers] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // State for discount codes
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loadingDiscountCodes, setLoadingDiscountCodes] = useState(true);
  const [errorDiscountCodes, setErrorDiscountCodes] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Helper function to check if token is valid
  const isTokenValid = (): boolean => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  };

  // Helper function to handle authentication errors
  const handleAuthError = () => {
    setAuthError(true);
    localStorage.removeItem('jwt_token');
  };

  // Public API request (no authentication required)
  const makePublicRequest = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    return response;
  };

  // Enhanced fetch function with better error handling
  const makeAuthenticatedRequest = async (url: string, requireAuth: boolean = true) => {
    const token = localStorage.getItem('jwt_token');
    
    if (requireAuth && !token) {
      throw new Error('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.status === 401) {
      handleAuthError();
      throw new Error('انتهت صلاحية جلسة التصفح. يرجى تسجيل الدخول مرة أخرى.');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    return response;
  };

  // Fetch offers (public endpoint - no authentication required)
  const fetchOffers = useCallback(async (pageNumber: number) => {
    setLoadingOffers(true);
    setErrorOffers(null);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      
      const response = await makePublicRequest(
        `${apiUrl}/api/offers?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`
      );
      
      const data: ApiResponse<OfferItem> = await response.json();
      setOfferItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalItems || 0);
      setCurrentPage(data.pageNumber || pageNumber);
    } catch (err) {
      try {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          const authResponse = await makeAuthenticatedRequest(
            `${apiUrl}/api/offers?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`,
            false
          );
          const data: ApiResponse<OfferItem> = await authResponse.json();
          setOfferItems(data.items || []);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalItems || 0);
          setCurrentPage(data.pageNumber || pageNumber);
        } else {
          throw err;
        }
      } catch (authErr) {
        setErrorOffers(err instanceof Error ? err.message : 'Failed to fetch offers');
      }
    } finally {
      setLoadingOffers(false);
    }
  }, []);

  // Fetch discount codes with fallback for unauthenticated users
  const fetchDiscountCodes = useCallback(async () => {
    setLoadingDiscountCodes(true);
    setErrorDiscountCodes(null);
    
    if (!isTokenValid()) {
      setLoadingDiscountCodes(false);
      setErrorDiscountCodes('يرجى تسجيل الدخول لعرض أكواد الخصم');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await makeAuthenticatedRequest(
        `${apiUrl}/api/discount-codes?pageNumber=1&pageSize=${PAGE_SIZE}`,
        true
      );

      const data: ApiResponse<DiscountCode> = await response.json();
      setDiscountCodes(data.items || []);
    } catch (err) {
      setErrorDiscountCodes(err instanceof Error ? err.message : 'Failed to fetch discount codes');
    } finally {
      setLoadingDiscountCodes(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchOffers(1);
    fetchDiscountCodes();
  }, [fetchOffers, fetchDiscountCodes]);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      fetchOffers(pageNumber);
      window.scrollTo(0, 0);
    }
  };

  const handleExploreOffer = (offerId: string) => {
    navigate(`/offers/${offerId}`);
  };

  // Copy discount code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-wrap justify-center items-center gap-2 mt-6 sm:mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-purple-700 hover:bg-purple-50 border-2 border-purple-200'
          }`}
        >
          السابق
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 rounded-lg bg-white text-purple-700 hover:bg-purple-50 border-2 border-purple-200 text-sm sm:text-base font-medium"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-lg text-sm sm:text-base font-bold transition-colors ${
              page === currentPage
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 hover:bg-purple-50 border-2 border-purple-200'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 rounded-lg bg-white text-purple-700 hover:bg-purple-50 border-2 border-purple-200 text-sm sm:text-base font-medium"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
            currentPage === totalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-purple-700 hover:bg-purple-50 border-2 border-purple-200'
          }`}
        >
          التالي
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-purple-50 py-4 sm:py-6 md:py-8" dir="rtl">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-purple-700 hover:text-purple-900 mb-4 sm:mb-6 transition-colors font-medium text-sm sm:text-base"
        >
          <ArrowRight size={20} />
          <span>العودة للرئيسية</span>
        </Link>

        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Gift className="text-red-500 w-7 h-7 sm:w-8 sm:h-8" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-900">العروض الخاصة</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
            اكتشفي أفضل العروض والخصومات على مجموعة مختارة من منتجاتنا المميزة
          </p>
          {totalCount > 0 && (
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              عدد العروض: {totalCount} عرض
            </p>
          )}
        </div>

        {/* Authentication Error Alert */}
        {authError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
              <div className="flex-1">
                <h3 className="text-red-800 font-bold text-sm sm:text-base">انتهت صلاحية جلسة التصفح</h3>
                <p className="text-red-600 text-xs sm:text-sm mt-1">
                  يرجى تسجيل الدخول مرة أخرى للوصول إلى جميع الميزات
                </p>
                <button
                  onClick={handleLogin}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-semibold"
                >
                  تسجيل الدخول
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discount Codes Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 border-2 border-red-200 shadow-lg">
          <h2 className="text-lg sm:text-xl font-bold text-red-700 mb-3 sm:mb-4 text-center flex items-center justify-center gap-2">
            <Percent className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>أكواد الخصم المتاحة</span>
          </h2>
          {loadingDiscountCodes ? (
            <div className="flex justify-center items-center py-6 sm:py-8">
              <Loader2 className="animate-spin text-red-600 w-6 h-6 sm:w-8 sm:h-8" />
              <span className="mr-2 sm:mr-3 text-gray-600 text-sm sm:text-base">جاري تحميل أكواد الخصم...</span>
            </div>
          ) : errorDiscountCodes ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">{errorDiscountCodes}</p>
              {!authError && (
                <button
                  onClick={() => fetchDiscountCodes()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base font-semibold"
                >
                  إعادة المحاولة
                </button>
              )}
              {authError && (
                <button
                  onClick={handleLogin}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base font-semibold"
                >
                  تسجيل الدخول
                </button>
              )}
            </div>
          ) : discountCodes.length === 0 ? (
            <p className="text-center text-gray-600 py-4 text-sm sm:text-base">لا توجد أكواد خصم متاحة حالياً</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {discountCodes.map((code) => (
                <div
                  key={code.id}
                  className="bg-red-50 p-3 sm:p-4 rounded-xl border-2 border-red-200 text-center relative group hover:shadow-lg transition-all"
                >
                  <div className="text-base sm:text-lg font-black text-red-600 mb-2">{code.code}</div>
                  <div className="text-xs sm:text-sm text-gray-700">
                    {code.percentageValue
                      ? `خصم ${code.percentageValue}%${code.maxDiscountAmount ? ` (حد أقصى: ${code.maxDiscountAmount} ج)` : ''}`
                      : `خصم ثابت ${code.fixedValue} ج`}
                    {code.minOrderAmount > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        الحد الأدنى: {code.minOrderAmount} ج
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      ساري حتى: {new Date(code.endDate).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(code.code)}
                    className={`absolute top-2 left-2 transition-all p-1.5 sm:p-2 rounded-full ${
                      copiedCode === code.code
                        ? 'bg-green-500 text-white'
                        : 'bg-white hover:bg-red-100 text-red-600 opacity-0 group-hover:opacity-100'
                    }`}
                    title="نسخ الكود"
                  >
                    <Copy size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offers Section */}
        {loadingOffers && (
          <div className="flex justify-center items-center py-12 sm:py-16">
            <Loader2 className="animate-spin text-purple-600 w-10 h-10 sm:w-12 sm:h-12" />
            <span className="mr-3 text-gray-600 text-sm sm:text-base">جاري تحميل العروض...</span>
          </div>
        )}

        {errorOffers && (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-purple-100">
            <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-3 sm:mb-4">حدث خطأ في تحميل العروض</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{errorOffers}</p>
            <button
              onClick={() => fetchOffers(currentPage)}
              className="bg-purple-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-purple-700 transition-colors font-bold text-sm sm:text-base shadow-lg"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {!loadingOffers && !errorOffers && offerItems.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-purple-100">
            <div className="text-5xl sm:text-6xl mb-4">🏷️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-purple-900 mb-3 sm:mb-4">لا توجد عروض حالياً</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">تابعونا للحصول على أحدث العروض والخصومات</p>
            <button
              onClick={() => navigate('/')}
              className="bg-purple-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-purple-700 transition-colors font-bold text-sm sm:text-base shadow-lg"
            >
              العودة للرئيسية
            </button>
          </div>
        )}

        {!loadingOffers && !errorOffers && offerItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {offerItems.map(offer => (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 border-2 border-purple-100 hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden h-40 sm:h-48">
                    <img
                      src={offer.imagePath}
                      alt={offer.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-black">
                      -{offer.discountPercentage}%
                    </div>
                    {offer.isFeatured && (
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-amber-500 text-white px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>مميز</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 flex flex-col flex-grow">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-purple-900 mb-1 sm:mb-2 line-clamp-2">
                      {offer.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                      {offer.description}
                    </p>

                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg sm:text-xl font-black text-red-600">
                            {offer.salePrice.toFixed(2)} ج
                          </span>
                          {offer.originalPrice > offer.salePrice && (
                            <span className="text-xs sm:text-sm text-gray-400 line-through">
                              {offer.originalPrice.toFixed(2)} ج
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3 space-y-0.5">
                        <div>يبدأ: {new Date(offer.startDate).toLocaleDateString('ar-EG')}</div>
                        <div>ينتهي: {new Date(offer.endDate).toLocaleDateString('ar-EG')}</div>
                      </div>

                      <button
                        className="w-full bg-purple-600 text-white py-2 sm:py-2.5 px-4 rounded-lg sm:rounded-xl hover:bg-purple-700 transition-all font-bold text-xs sm:text-sm shadow-md hover:shadow-lg"
                        onClick={() => handleExploreOffer(offer.id)}
                      >
                        استكشف العرض
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default OffersPage;
