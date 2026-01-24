// src/pages/ProductsByTypePage.tsx

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { BottomNav } from '../components/BottomNav';

interface ApiResponse {
  items: Product[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

interface RestoreState {
  scrollY: number;
  pageNumber: number;
}

export type ProductsByTypeConfig = {
  // UI
  titleAr: string;
  subtitleAr: string;
  theme?: string;

  // API endpoint segment (e.g. "kids-bags" => /api/products/kids-bags)
  legacySegment: string;

  // Routing state key for restore
  restoreStateKey: string;

  // BottomNav highlight key
  bottomNavKey?: 'home' | 'kids-bags' | 'women-bags' | 'giveaways' | 'cart';

  // ✅ ADD THESE: Back button customization
  backButtonUrl?: string;      // Default: '/'
  backButtonText?: string;     // Default: 'العودة للرئيسية'
};

type Props = {
  config: ProductsByTypeConfig;
};

const ProductsByTypePage: React.FC<Props> = ({ config }) => {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const [products, setProducts] = useState<Product[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [restoreScroll, setRestoreScroll] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState<string>(config.bottomNavKey || 'home');

  const getAuthToken = () =>
    localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  const buildAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeImagePath = (path: any) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${apiUrl}${path}`;
    return path;
  };

  const mapProduct = (item: any): Product => {
    const rawImages = Array.isArray(item?.images) ? item.images : [];
    const images = rawImages
      .map((img: any) => {
        if (typeof img === 'string') {
          return { id: img, imagePath: normalizeImagePath(img), isMain: false };
        }
        return {
          id: img?.id ?? crypto.randomUUID(),
          imagePath: normalizeImagePath(img?.imagePath ?? img?.url ?? ''),
          isMain: Boolean(img?.isMain),
        };
      })
      .filter((x: any) => x.imagePath);

    const sizes = Array.isArray(item?.sizes) ? item.sizes : [];
    const colors = Array.isArray(item?.colors) ? item.colors : [];

    const price = typeof item?.price === 'number' ? item.price : Number(item?.price || 0);
    const originalPrice =
      item?.originalPrice !== undefined && item?.originalPrice !== null
        ? typeof item.originalPrice === 'number'
          ? item.originalPrice
          : Number(item.originalPrice)
        : undefined;

    const isAvailable = item?.isAvailable !== undefined ? Boolean(item.isAvailable) : true;

    return {
      ...item,
      id: item?.id ?? '',
      name: item?.name ?? '',
      code: item?.code ?? '',
      price,
      originalPrice,
      description: item?.description ?? '',
      createdAt: item?.createdAt ?? new Date().toISOString(),

      images,
      sizes,
      colors,

      isHidden: item?.isHidden !== undefined ? Boolean(item.isHidden) : false,
      isAvailable,
      isInstant: item?.isInstant !== undefined ? Boolean(item.isInstant) : false,
      isFeatured: item?.isFeatured !== undefined ? Boolean(item.isFeatured) : false,
      isBreakfast: item?.isBreakfast !== undefined ? Boolean(item.isBreakfast) : false,

      inStock: isAvailable,
      isOffer: originalPrice !== undefined && originalPrice > price,

      rating: item?.rating !== undefined ? Number(item.rating) : 0,
      salesCount: item?.salesCount !== undefined ? Number(item.salesCount) : 0,

      category: item?.category ?? undefined,
      type: item?.type ?? undefined,
      season: item?.season ?? undefined,
    } as Product;
  };

  const fetchProducts = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const pageSize = 10;
      // ✅ FIXED: Use legacySegment directly (e.g., /api/products/kids-bags)
      const url = `${apiUrl}/api/products/${config.legacySegment}?pageNumber=${page}&pageSize=${pageSize}`;

      const res = await fetch(url, { headers: { ...buildAuthHeaders() } });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      const data: ApiResponse = await res.json();

      if (!data || !Array.isArray(data.items)) {
        throw new Error('Invalid response format: items is not an array');
      }

      setProducts(data.items.map(mapProduct));
      setTotalPages(Number(data.totalPages || 1));
      setPageNumber(Number(data.pageNumber || page));
    } catch (err) {
      console.error('Error fetching products by type:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل المنتجات');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load + restore
  useEffect(() => {
    const state = (location.state as any)?.[config.restoreStateKey] as RestoreState | undefined;

    if (state) {
      setPageNumber(state.pageNumber);
      setRestoreScroll(state.scrollY);
      fetchProducts(state.pageNumber);
    } else {
      window.scrollTo(0, 0);
      fetchProducts(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore scroll
  useEffect(() => {
    if (restoreScroll !== null && !loading && products.length > 0) {
      const t = setTimeout(() => {
        window.scrollTo(0, restoreScroll);
        setRestoreScroll(null);
      }, 100);
      return () => clearTimeout(t);
    }
  }, [loading, products, restoreScroll]);

  const handleViewProduct = (product: Product) => {
    navigate(`/product/${product.id}`, {
      state: {
        product,
        [config.restoreStateKey]: { scrollY: window.scrollY, pageNumber },
      },
    });
  };

  const handleAddToCart = (product: Product) => {
    if (!product || !product.inStock) return;

    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    const hasColors = Array.isArray(product.colors) && product.colors.length > 0;

    if (hasSizes || hasColors) {
      handleViewProduct(product);
      return;
    }

    dispatch({
      type: 'ADD_TO_CART',
      payload: { product, quantity: 1, selectedSize: '', selectedColor: '' },
    });
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, pageNumber - 2);
      let end = Math.min(totalPages, pageNumber + 2);

      if (end - start < maxPagesToShow - 1) {
        if (start === 1) end = Math.min(totalPages, start + maxPagesToShow - 1);
        else start = Math.max(1, end - maxPagesToShow + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pageNumbers = getPageNumbers();

    return (
      <div className="flex justify-center items-center space-x-2 mt-8 space-x-reverse pb-4">
        <button
          onClick={() => pageNumber > 1 && fetchProducts(pageNumber - 1)}
          disabled={pageNumber === 1 || loading}
          className="flex items-center px-3 py-2 bg-white/90 border-2 border-[#E5DCC5] rounded-xl hover:border-[#D4AF37] hover:shadow-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <ChevronRight size={20} />
          <span className="mr-1">السابق</span>
        </button>

        <div className="flex space-x-1 space-x-reverse">
          {pageNumbers.map((p, idx) => (
            <React.Fragment key={idx}>
              {p === '...' ? (
                <span className="px-3 py-2 text-[#8B7355]/60">...</span>
              ) : (
                <button
                  onClick={() => fetchProducts(p as number)}
                  disabled={loading}
                  className={`px-3 py-2 rounded-xl transition-all border-2 ${
                    pageNumber === p
                      ? 'bg-[#D4AF37] text-white border-[#D4AF37] shadow-lg'
                      : 'bg-white/90 text-[#8B7355] border-[#E5DCC5] hover:border-[#D4AF37] hover:shadow-md'
                  } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {p}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => pageNumber < totalPages && fetchProducts(pageNumber + 1)}
          disabled={pageNumber === totalPages || loading}
          className="flex items-center px-3 py-2 bg-white/90 border-2 border-[#E5DCC5] rounded-xl hover:border-[#D4AF37] hover:shadow-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <span className="ml-1">التالي</span>
          <ChevronLeft size={20} />
        </button>
      </div>
    );
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    switch (page) {
      case 'home':
        navigate('/');
        break;
      case 'kids-bags':
        navigate('/kids-bags');
        break;
      case 'women-bags':
        navigate('/girls-bags');
        break;
      case 'giveaways':
        navigate('/giveaways');
        break;
      case 'cart':
        navigate('/cart');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F5DC] pt-20 pb-20"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Back */}
        <Link
          to={config.backButtonUrl || '/'}
          className="flex items-center space-x-reverse space-x-2 text-[#8B7355] hover:text-[#D4AF37] mb-6 transition-colors font-medium"
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          <ArrowRight size={20} />
          <span>{config.backButtonText || 'العودة للرئيسية'}</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full shadow-xl border-2 border-[#E5DCC5] mb-4">
            <span className="text-3xl">👜</span>
          </div>

          <h1
            className="text-3xl font-bold text-[#8B7355] mb-2"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {config.titleAr}
          </h1>
          <p
            className="text-[#8B7355]/70 max-w-2xl mx-auto"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {config.subtitleAr}
          </p>
        </div>

        {/* Content */}
        {loading && products.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#D4AF37] mb-4"></div>
            <p className="text-xl text-[#8B7355] font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              جار التحميل...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-20 max-w-2xl mx-auto">
            <div className="text-6xl mb-6">⚠️</div>
            <p className="text-2xl text-red-600 font-bold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {error}
            </p>
            <p className="text-[#8B7355]/70 mb-8 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              حدث خطأ أثناء جلب المنتجات. يرجى معاودة المحاولة.
            </p>
            <button
              onClick={() => fetchProducts(pageNumber)}
              className="px-6 py-2 bg-white/90 backdrop-blur-sm rounded-full text-[#8B7355] font-bold hover:bg-[#D4AF37] hover:text-white transition-all duration-300 shadow-lg transform hover:scale-105"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              إعادة المحاولة
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">📦</div>
            <p className="text-2xl text-[#8B7355] font-bold mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              لا توجد منتجات للعرض حالياً
            </p>
            <p className="text-[#8B7355]/70 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              نحن نعمل على إضافة منتجات جديدة قريباً!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border border-[#E5DCC5] hover:border-[#D4AF37] overflow-hidden"
                >
                  <ProductCard product={p} onViewProduct={handleViewProduct} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>

            {renderPagination()}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
};

export default ProductsByTypePage;