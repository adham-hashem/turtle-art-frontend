// src/pages/InstantPage.tsx
// ✅ Updated to match the NEW backend conventions used in your other pages:
// - Uses accessToken (localStorage/sessionStorage) instead of jwt_token
// - Uses /api/products with isInstant=true (and fallback to /api/products/instant if your backend still supports it)
// - Does NOT send Authorization header if no token exists (public browsing supported)
// - Normalizes image URLs (prefix apiUrl if backend returns "/uploads/..")
// - Stronger response validation + safe mapping defaults
// - Keeps scroll restore behavior

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Cake, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

interface ApiResponse {
  items: Product[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

interface InstantRestoreState {
  scrollY: number;
  pageNumber: number;
}

const InstantPage: React.FC = () => {
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

  const getAuthToken = () => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  const buildAuthHeaders = () => {
    const token = getAuthToken();
    // NEW backend: allow public fetch (no token) for browsing pages
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeImagePath = (path: any) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${apiUrl}${path}`;
    return path;
  };

  const mapProduct = (item: any): Product => {
    // Map images (support old/new shapes)
    const rawImages = Array.isArray(item?.images) ? item.images : [];
    const images = rawImages
      .map((img: any) => {
        // backend sometimes returns { imagePath, isMain, id } or string urls
        if (typeof img === 'string') return { id: img, imagePath: normalizeImagePath(img), isMain: false };
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
        ? (typeof item.originalPrice === 'number' ? item.originalPrice : Number(item.originalPrice))
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
      isInstant: item?.isInstant !== undefined ? Boolean(item.isInstant) : true, // instant page => default true
      isFeatured: item?.isFeatured !== undefined ? Boolean(item.isFeatured) : false,
      isBreakfast: item?.isBreakfast !== undefined ? Boolean(item.isBreakfast) : false,

      // Many projects keep these computed fields in Product type
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

      // NEW backend preferred endpoint (filter flag)
      const primaryUrl = `${apiUrl}/api/products?pageNumber=${page}&pageSize=10&isInstant=true`;

      // Fallback endpoint (older style)
      const fallbackUrl = `${apiUrl}/api/products/instant?pageNumber=${page}&pageSize=10`;

      const tryFetch = async (url: string) => {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            ...buildAuthHeaders(),
          },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          const err = new Error(`HTTP ${res.status}: ${text || res.statusText}`);
          (err as any).status = res.status;
          throw err;
        }

        // Some backends return JSON but wrong header; be tolerant
        const text = await res.text();
        try {
          return JSON.parse(text) as ApiResponse;
        } catch {
          throw new Error('Invalid response format: Expected JSON');
        }
      };

      let data: ApiResponse | null = null;

      try {
        data = await tryFetch(primaryUrl);
      } catch (e: any) {
        // If the new filter endpoint not supported, try old one
        const status = e?.status;
        if (status === 404 || (typeof e?.message === 'string' && e.message.includes('404'))) {
          data = await tryFetch(fallbackUrl);
        } else {
          throw e;
        }
      }

      if (!data || !Array.isArray(data.items)) {
        throw new Error('Invalid response format: items is not an array');
      }

      const mapped = data.items.map(mapProduct);

      setProducts(mapped);
      setTotalPages(Number(data.totalPages || 1));
      setPageNumber(Number(data.pageNumber || page));
    } catch (err) {
      console.error('Error fetching instant products:', err);
      setError(err instanceof Error ? err.message : 'Error fetching products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load + restore
  useEffect(() => {
    const state = (location.state as any)?.fromInstantPage as InstantRestoreState | undefined;

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

  // Restore scroll after data loaded
  useEffect(() => {
    if (restoreScroll !== null && !loading && products.length > 0) {
      const timer = setTimeout(() => {
        window.scrollTo(0, restoreScroll);
        setRestoreScroll(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, products, restoreScroll]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== pageNumber) {
      window.scrollTo(0, 0);
      fetchProducts(page);
    }
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) {
      window.scrollTo(0, 0);
      fetchProducts(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      window.scrollTo(0, 0);
      fetchProducts(pageNumber + 1);
    }
  };

  const handleViewProduct = (product: Product) => {
    navigate(`/product/${product.id}`, {
      state: {
        product,
        fromInstantPage: {
          scrollY: window.scrollY,
          pageNumber,
        },
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
      payload: {
        product,
        quantity: 1,
        selectedSize: '',
        selectedColor: '',
      },
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
      <div className="flex justify-center items-center space-x-2 mt-8 space-x-reverse">
        <button
          onClick={handlePrevPage}
          disabled={pageNumber === 1 || loading}
          className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={20} />
          <span className="mr-1">السابق</span>
        </button>

        <div className="flex space-x-1 space-x-reverse">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page as number)}
                  disabled={loading}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pageNumber === page
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                  } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={handleNextPage}
          disabled={pageNumber === totalPages || loading}
          className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <span className="ml-1">التالي</span>
          <ChevronLeft size={20} />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-pink-50 to-white py-8">
      <div className="container mx-auto px-4">
        <Link
          to="/"
          className="flex items-center space-x-reverse space-x-2 text-gray-600 hover:text-pink-600 mb-6 transition-colors"
        >
          <ArrowRight size={20} />
          <span>العودة للرئيسية</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-amber-500" />
            <Cake className="h-10 w-10 text-pink-500" />
            <Sparkles className="h-8 w-8 text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-purple-900 mb-3">تورتات فورية</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            حلويات جاهزة الآن - اطلب واستلم في نفس الحين! تورتات مبهجة بألوان وتصاميم شخصيات محبوبة، مثالية لأعياد الميلاد والمناسبات الخاصة
          </p>
        </div>

        {loading && products.length === 0 ? (
          <div className="text-center py-12">
            <Cake className="h-16 w-16 text-pink-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">جار تحميل التورتات...</h2>
            <p className="text-gray-600">برجاء الانتظار حتى يتم تحميل جميع التورتات الفورية.</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
            <p className="text-gray-600 mb-6">حدث خطأ أثناء جلب التورتات الفورية. حاول مرة أخرى لاحقاً.</p>
            <button
              onClick={() => fetchProducts(pageNumber)}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧁</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">لا توجد تورتات فورية حالياً</h2>
            <p className="text-gray-600 mb-6">نعمل على إضافة تورتات فورية جديدة ومميزة قريباً، تابعنا دائماً.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              العودة للرئيسية
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewProduct={handleViewProduct}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default InstantPage;
