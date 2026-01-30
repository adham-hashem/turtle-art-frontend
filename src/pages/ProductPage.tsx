// src/pages/ProductPage.tsx
// ✅ UPDATED (copy-paste ready)
// Fixes & improvements:
// - Safe image URL handling (no double apiUrl, handles http/absolute, missing images)
// - Handles sizes/colors optionally (renders selectors only if exist)
// - Prevents crash when sizes/colors/images are empty
// - Uses accessToken (consistent with your other pages)
// - Keeps instant-page restore state support (location.state.fromInstantPage)
// - Better error messages + restricted states
// - Adds basic price/offer badge safely

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  ShoppingCart,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Sparkles,
  ShoppingBag,
  Heart,
  Star,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface ProductImage {
  imagePath: string;
  id: string;
  isMain: boolean;
}

interface ProductExtension {
  id: string;
  productId: string;
  name: string;
  additionalPrice: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  originalPrice?: number;
  createdAt: string;

  // may differ across endpoints; keep optional to avoid runtime issues
  category?: number | string;
  season?: number | string;
  type?: number | string;

  isHidden: boolean;
  isAvailable: boolean;

  sizes: string[];
  colors: string[];
  images: ProductImage[];
  extensions?: ProductExtension[];

  rowVersion?: string;
}

type RestoreState = {
  fromInstantPage?: { scrollY: number; pageNumber: number };
  fromBreakfastPage?: { scrollY: number; pageNumber: number };
  fromFeaturedPage?: { scrollY: number; pageNumber: number };
};

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const ProductPage: React.FC = () => {
  const { dispatch } = useApp();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const restoreState = (location.state as RestoreState | undefined) || undefined;

  const [copied, setCopied] = useState(false);

  const [product, setProduct] = useState<Product | null>(
    (location.state as any)?.product || null
  );

  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState<string | null>(null);

  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const [productRestricted, setProductRestricted] = useState<string | null>(null);

  const productUrl = `${window.location.origin}/product/${id}`;

  // ---------- helpers ----------
  const getAuthToken = () =>
    localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  // const resolveUrl = (path?: string) => {
  //   if (!path) return '';
  //   const cleanPath = path.trim(); // 1. Trim whitespace

  //   // 2. Check for standard absolute URLs
  //   if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;

  //   // 3. Handle accidental leading slash on absolute URLs
  //   if (cleanPath.startsWith('/http://') || cleanPath.startsWith('/https://')) return cleanPath.substring(1);

  //   if (cleanPath.startsWith('data:image')) return cleanPath;

  //   // 4. Handle relative paths
  //   if (cleanPath.startsWith('/')) return `${apiUrl}${cleanPath}`;
  //   return `${apiUrl}/${cleanPath}`;
  // };
  const resolveUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('data:image')) return path;
    if (path.startsWith('/')) return `${apiUrl}${path}`;
    return `${apiUrl}/${path}`;
  };

  const safeImages = useMemo(() => {
    const imgs = Array.isArray(product?.images) ? product!.images : [];
    // normalize any missing paths
    return imgs
      .filter((img) => img && typeof img.imagePath === 'string' && img.imagePath.trim() !== '')
      .map((img) => ({ ...img, imagePath: resolveUrl(img.imagePath) }));
  }, [product]);

  const mainImageIndex = useMemo(() => {
    const idx = safeImages.findIndex((i) => i.isMain);
    return idx >= 0 ? idx : 0;
  }, [safeImages]);

  const hasSizes = Array.isArray(product?.sizes) && (product?.sizes?.length || 0) > 0;
  const hasColors = Array.isArray(product?.colors) && (product?.colors?.length || 0) > 0;
  const hasExtensions = Array.isArray(product?.extensions) && (product?.extensions?.length || 0) > 0;

  // Calculate total price including extensions
  const extensionsTotal = useMemo(() => {
    if (!hasExtensions || selectedExtensions.length === 0) return 0;
    return selectedExtensions.reduce((total, extId) => {
      const ext = product?.extensions?.find(e => e.id === extId);
      return total + (ext?.additionalPrice || 0);
    }, 0);
  }, [selectedExtensions, product?.extensions, hasExtensions]);

  const totalPrice = (product?.price || 0) + extensionsTotal;

  const isPurchaseDisabled =
    addingToCart || !product || product.isHidden || !product.isAvailable || !!productRestricted;

  const isOffer =
    !!product?.originalPrice && product.originalPrice > product.price;

  const discountPercent = useMemo(() => {
    if (!product?.originalPrice || product.originalPrice <= product.price) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }, [product]);

  // ---------- effects ----------
  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }, []);

  useEffect(() => {
    // always start top when entering product page
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!product) return;

    // set restriction message
    if (product.isHidden) setProductRestricted('هذا المنتج غير متاح للعرض حالياً.');
    else if (!product.isAvailable) setProductRestricted('المنتج غير متاح حالياً.');
    else setProductRestricted(null);

    // default selection
    setSelectedSize((Array.isArray(product.sizes) && product.sizes[0]) || '');
    setSelectedColor((Array.isArray(product.colors) && product.colors[0]) || '');

    // default image
    setCurrentImageIndex(mainImageIndex);
  }, [product, mainImageIndex]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (addedToCart) {
      const timer = setTimeout(() => setAddedToCart(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [addedToCart]);

  useEffect(() => {
    if (product || !id) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      setProductRestricted(null);

      try {
        const token = getAuthToken();

        const response = await fetch(`${apiUrl}/api/products/${id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const txt = await response.text().catch(() => '');
          throw new Error(txt || 'لم يتم العثور على المنتج أو لا تملك صلاحية الوصول.');
        }

        const data: Product = await response.json();

        // Normalize arrays to avoid runtime issues
        const normalized: Product = {
          ...data,
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          colors: Array.isArray(data.colors) ? data.colors : [],
          images: Array.isArray(data.images) ? data.images : [],
          isHidden: data.isHidden ?? false,
          isAvailable: data.isAvailable ?? true,
        };

        setProduct(normalized);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل في تحميل المنتج.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, product]);

  // ---------- share ----------
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = productUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product?.name || ''} - ${(product?.price ?? 0).toFixed(2)} جنيه`,
          text: `👜 ${product?.name || ''}`,
          url: productUrl,
        });
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  // ---------- touch for carousel ----------
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    if (safeImages.length <= 1) return;

    const diff = touchStartX - touchEndX;
    const threshold = 35;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        setCurrentImageIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
      } else {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
      }
    }
  };

  // ---------- cart ----------
  const handleAddToCart = async () => {
    if (!product || addingToCart || isPurchaseDisabled) return;

    setAddingToCart(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        alert('يرجى تسجيل الدخول أولاً لإضافة المنتج للسلة');
        navigate('/login');
        return;
      }

      const payload = {
        productId: product.id,
        quantity,
        size: hasSizes ? selectedSize : '',
        color: hasColors ? selectedColor : '',
        selectedExtensions: selectedExtensions.length > 0 ? JSON.stringify(selectedExtensions) : null
      };

      const response = await fetch(`${apiUrl}/api/cart/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        throw new Error(txt || 'فشل في إضافة المنتج إلى السلة');
      }

      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          product,
          quantity,
          selectedSize: hasSizes ? selectedSize : '',
          selectedColor: hasColors ? selectedColor : '',
        },
      });

      setAddedToCart(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة المنتج إلى السلة');
    } finally {
      setAddingToCart(false);
    }
  };

  // ---------- UI messages ----------
  let statusMessage = productRestricted;
  if (!statusMessage && product) {
    statusMessage = 'متوفر وجاهز للطلب الآن! 👜';
  }

  // ---------- Loading ----------
  if (loading) {
    return (
      <div
        className="min-h-screen bg-white flex items-center justify-center px-4 pt-20"
        dir="rtl"
      >
        <div className="text-center py-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gray-100 rounded-full p-4">
              <ShoppingBag className="h-12 w-12 text-black animate-bounce" />
            </div>
          </div>
          <p className="text-black font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            جاري تحميل المنتج...
          </p>
          <p className="text-gray-500 text-sm mt-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            انتظر لحظة 👜
          </p>
        </div>
      </div>
    );
  }

  // ---------- Error / Restricted / Not found ----------
  if (error || !product || productRestricted) {
    return (

      <div
        className="min-h-screen bg-white flex items-center justify-center px-4 py-8 pt-24"
        dir="rtl"
      >
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl text-center w-full max-w-md border border-gray-200">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
          </div>
          <h2
            className="text-xl sm:text-2xl font-bold text-black mb-3"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {error ? 'حدث خطأ' : 'عذراً!'}
          </h2>
          <p
            className="text-gray-500 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {error || productRestricted || 'المنتج غير موجود.'}
          </p>

          <div className="space-y-3">
            <Link
              to="/"
              className="w-full bg-primary-green text-black px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-primary-green-dark font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <ShoppingBag size={20} />
              <span>تصفح المنتجات</span>
            </Link>

            <button
              onClick={() => {
                // go back to where user came from; if none, go home
                if (restoreState?.fromInstantPage || restoreState?.fromBreakfastPage || restoreState?.fromFeaturedPage) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              className="w-full bg-gray-100 text-black px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-gray-200 font-medium transition-all text-sm sm:text-base"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              العودة للخلف
            </button>
          </div>
        </div>
      </div>
    );

  }

  // ---------- Main ----------
  const currentImage = safeImages[currentImageIndex]?.imagePath || '';

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="pt-24 pb-12 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto">
        {/* Back button + Share */}
        <div className="mb-4 sm:mb-6 lg:mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-black hover:text-gray-600 font-medium py-2 transition-colors text-sm sm:text-base"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <ArrowRight size={18} className="sm:hidden ml-2" />
            <ArrowRight size={20} className="hidden sm:block ml-2" />
            <span>العودة</span>
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all font-medium shadow-md text-sm sm:text-base ${copied
              ? 'bg-green-500 text-white shadow-green-300'
              : 'bg-white text-black border border-gray-200 hover:border-black hover:shadow-lg'
              }`}
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {copied ? (
              <>
                <Check size={16} className="sm:hidden" />
                <Check size={18} className="hidden sm:block" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Share2 size={16} className="sm:hidden" />
                <Share2 size={18} className="hidden sm:block" />
                <span className="hidden sm:inline">مشاركة</span>
              </>
            )}
          </button>
        </div>

        {/* Added to Cart Notification */}
        {addedToCart && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div
              className="bg-green-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <Check size={20} className="sm:hidden" />
              <Check size={24} className="hidden sm:block" />
              <span className="font-bold">تمت الإضافة للسلة بنجاح! 👜</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="lg:grid lg:grid-cols-2 lg:gap-0">
            {/* Images */}
            <div className="w-full lg:order-1">
              <div
                className="relative w-full overflow-hidden bg-white aspect-square"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-contain select-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <ShoppingBag className="h-14 w-14 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        لا توجد صور لهذا المنتج
                      </p>
                    </div>
                  </div>
                )}

                {/* Discount Badge */}
                {isOffer && discountPercent > 0 && (
                  <div
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-red-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm shadow-lg"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    خصم {discountPercent}%
                  </div>
                )}

                {/* Desktop arrows */}
                {safeImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1))
                      }
                      className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white text-black p-3 rounded-full hover:bg-gray-100 hover:shadow-xl transition-all shadow-lg border border-gray-100"
                    >
                      <ChevronLeft size={24} />
                    </button>

                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0))
                      }
                      className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white text-black p-3 rounded-full hover:bg-gray-100 hover:shadow-xl transition-all shadow-lg border border-gray-100"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Dots */}
                {safeImages.length > 1 && (
                  <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-sm rounded-full py-1.5 sm:py-2 px-3 sm:px-4 shadow-lg border border-gray-100">
                    {safeImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${currentImageIndex === i ? 'bg-primary-green scale-125' : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {safeImages.length > 1 && (
                <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
                    {safeImages.map((image, i) => (
                      <button
                        key={image.id || i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all shadow-sm hover:shadow-md ${currentImageIndex === i
                          ? 'border-primary-green shadow-lg scale-105'
                          : 'border-white hover:border-gray-300'
                          }`}
                      >
                        <img src={image.imagePath} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-4 sm:space-y-5 lg:space-y-6 lg:order-2">
              {/* Title */}
              <div>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                  <span className="text-black font-medium text-xs sm:text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    من Turtle Art
                  </span>
                </div>

                <h1
                  className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-black leading-tight mb-3 sm:mb-4"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {product.name}
                </h1>

                {product.description && (
                  <p
                    className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    {product.description}
                  </p>
                )}
              </div>

              {/* Code */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <span
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-black text-xs sm:text-sm rounded-full font-medium"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  كود: {product.code}
                </span>
              </div>

              {/* Price */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {Number(totalPrice || 0).toFixed(2)}
                  </span>
                  <span className="text-lg sm:text-xl text-gray-700 font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    جنيه
                  </span>

                  {isOffer && (
                    <span className="text-base sm:text-lg lg:text-xl text-gray-400 line-through font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {Number(product.originalPrice).toFixed(2)} جنيه
                    </span>
                  )}
                </div>

                {/* Show breakdown if extensions selected */}
                {selectedExtensions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      سعر المنتج: {Number(product.price || 0).toFixed(2)} جنيه
                    </p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الإضافات: +{Number(extensionsTotal).toFixed(2)} جنيه
                    </p>
                  </div>
                )}
              </div>

              {/* Size selector */}
              {hasSizes && (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200">
                  <h3 className="font-bold text-black text-base sm:text-lg mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    المقاس
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        disabled={isPurchaseDisabled}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${selectedSize === s
                          ? 'bg-primary-green text-black border-transparent shadow-md'
                          : 'bg-white text-black border-gray-200 hover:border-primary-green'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color selector */}
              {hasColors && (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200">
                  <h3 className="font-bold text-black text-base sm:text-lg mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    اللون
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        disabled={isPurchaseDisabled}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${selectedColor === c
                          ? 'bg-primary-green text-black border-transparent shadow-md'
                          : 'bg-white text-black border-gray-200 hover:border-primary-green'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Extensions selector */}
              {hasExtensions && (
                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-bold text-black text-base sm:text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      الإضافات المتاحة
                    </h3>
                    <span className="text-xs text-black bg-gray-200 px-2 py-1 rounded-full" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      اختياري
                    </span>
                  </div>
                  <div className="space-y-2">
                    {product.extensions!.map((ext) => {
                      const isSelected = selectedExtensions.includes(ext.id);
                      return (
                        <label
                          key={ext.id}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                            ? 'bg-white border-black'
                            : 'bg-white border-gray-200 hover:border-gray-400'
                            } ${isPurchaseDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (isPurchaseDisabled) return;
                                if (e.target.checked) {
                                  setSelectedExtensions([...selectedExtensions, ext.id]);
                                } else {
                                  setSelectedExtensions(selectedExtensions.filter(id => id !== ext.id));
                                }
                              }}
                              disabled={isPurchaseDisabled}
                              className="w-5 h-5 rounded border-2 border-gray-400 text-black focus:ring-2 focus:ring-black"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {ext.name}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-black" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            +{ext.additionalPrice.toFixed(2)} جنيه
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* Quantity */}
              <div className="flex justify-between items-center bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200">
                <h3 className="font-bold text-black text-base sm:text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  الكمية
                </h3>
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isPurchaseDisabled}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white border border-gray-300 rounded-lg sm:rounded-xl font-bold text-lg sm:text-xl text-black shadow-sm hover:shadow-md hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    -
                  </button>
                  <span className="text-xl sm:text-2xl font-black text-black min-w-[2rem] text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isPurchaseDisabled}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white border border-gray-300 rounded-lg sm:rounded-xl font-bold text-lg sm:text-xl text-black shadow-sm hover:shadow-md hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={isPurchaseDisabled}
                className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-xl transition-all flex items-center justify-center gap-2 sm:gap-3 ${addedToCart
                  ? 'bg-green-600 text-white'
                  : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-2xl hover:scale-[1.02]'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                {addingToCart ? (
                  <>
                    <Loader2 size={20} className="sm:hidden animate-spin" />
                    <Loader2 size={24} className="hidden sm:block animate-spin" />
                    <span>جاري الإضافة...</span>
                  </>
                ) : addedToCart ? (
                  <>
                    <Check size={20} className="sm:hidden" />
                    <Check size={24} className="hidden sm:block" />
                    <span>تمت الإضافة ✓</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} className="sm:hidden" />
                    <ShoppingCart size={24} className="hidden sm:block" />
                    <span>أضف للسلة</span>
                  </>
                )}
              </button>

              {/* Status */}
              <div
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl font-medium flex items-center gap-2 sm:gap-3 text-sm sm:text-base ${isPurchaseDisabled
                  ? 'bg-red-50 border-2 border-red-200 text-red-700'
                  : 'bg-green-50 border-2 border-green-200 text-green-700'
                  }`}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                {isPurchaseDisabled ? (
                  <AlertTriangle size={20} className="sm:hidden flex-shrink-0" />
                ) : (
                  <Check size={20} className="sm:hidden text-green-600 flex-shrink-0" />
                )}
                <span>{statusMessage}</span>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                  <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-black mx-auto mb-1" />
                  <p className="text-[10px] sm:text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    جودة عالية
                  </p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-black mx-auto mb-1 fill-current" />
                  <p className="text-[10px] sm:text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    صنع بحب
                  </p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-black mx-auto mb-1 fill-current" />
                  <p className="text-[10px] sm:text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    تصميم مميز
                  </p>
                </div>
              </div>

              {/* Inline error (if any) */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-xl text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-gray-500 mb-3 text-sm sm:text-base" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            هل لديك سؤال عن هذا المنتج؟
          </p>
          <a
            href={`https://wa.me/201000070653?text=${encodeURIComponent(`مرحباً، أريد الاستفسار عن: ${product.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:bg-green-600 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <span>💬</span>
            <span>تواصل معنا عبر واتساب</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
