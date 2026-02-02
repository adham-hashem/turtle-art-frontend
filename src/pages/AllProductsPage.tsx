// src/pages/AllProductsPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

const apiUrl = import.meta.env.VITE_API_BASE_URL;

type ApiResponse = {
  items: Product[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export default function AllProductsPage() {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [items, setItems] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPrev = pageNumber > 1;
  const canNext = pageNumber < totalPages;

  const title = useMemo(() => 'كل المنتجات', []);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('jwt_token') || 'jwt_token';

        const res = await fetch(
          `${apiUrl}/api/products?pageNumber=${pageNumber}&pageSize=${pageSize}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Request failed: ${res.status}`);
        }

        const data: ApiResponse = await res.json();

        if (!cancelled) {
          // Map the products to match the Product type
          const mappedProducts: Product[] = data.items.map((item) => ({
            id: item.id,
            name: item.name || '',
            code: item.code || '',
            price: item.price || 0,
            originalPrice: item.originalPrice || undefined,
            description: item.description || '',
            createdAt: item.createdAt || new Date().toISOString(),

            images: Array.isArray(item.images) ? item.images : [],
            sizes: Array.isArray(item.sizes) ? item.sizes : [],
            colors: Array.isArray(item.colors) ? item.colors : [],

            isHidden: item.isHidden !== undefined ? item.isHidden : false,
            isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
            isInstant: item.isInstant !== undefined ? item.isInstant : false,
            isFeatured: item.isFeatured !== undefined ? item.isFeatured : false,

            inStock: item.isAvailable !== undefined ? item.isAvailable : true,
            isOffer: item.originalPrice !== undefined && item.originalPrice > item.price ? true : false,

            rating: item.rating !== undefined ? item.rating : 0,
            salesCount: item.salesCount !== undefined ? item.salesCount : 0,

            category: item.category || undefined,
            type: item.type || undefined,
            season: item.season || undefined,
          }));

          setItems(mappedProducts);
          setTotalPages(data.totalPages ?? 1);
          setTotalItems(data.totalItems ?? 0);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleViewProduct = (product: Product) => {
    navigate(`/product/${product.id}`, {
      state: {
        product,
      },
    });
  };

  const handleAddToCart = (product: Product) => {
    if (!product || !product.inStock) return;

    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    const hasColors = Array.isArray(product.colors) && product.colors.length > 0;

    if (hasSizes || hasColors) {
      handleViewProduct(product);
    } else {
      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          product,
          quantity: 1,
          selectedSize: hasSizes ? product.sizes[0] : '',
          selectedColor: hasColors ? product.colors[0] : '',
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-soft-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-extrabold text-black"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {title}
          </h1>
          <p
            className="text-black mt-1"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            إجمالي المنتجات: {totalItems}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            disabled={!canPrev || loading}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            className="btn-secondary px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            السابق
          </button>

          <div
            className="text-black font-bold"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            صفحة {pageNumber} / {totalPages}
          </div>

          <button
            disabled={!canNext || loading}
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
            className="btn-secondary px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            التالي
          </button>
        </div>

        {/* States */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-green mb-4"></div>
            <p className="text-xl text-black font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              جار التحميل...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20 max-w-2xl mx-auto">
            <div className="text-6xl mb-6">⚠️</div>
            <p className="text-2xl text-red-600 font-bold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {error}
            </p>
            <p className="text-black mb-8 text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              حدث خطأ أثناء جلب المنتجات. يرجى التأكد من اتصالك أو معاودة المحاولة.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary px-6 py-3 rounded-full"
            >
              <span style={{ fontFamily: 'Tajawal, sans-serif' }}>إعادة المحاولة</span>
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">📦</div>
            <p className="text-2xl text-black font-bold mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              لا توجد منتجات للعرض حالياً
            </p>
            <p className="text-black text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              نحن نعمل على إضافة مجموعة جديدة ومميزة من الحقائب قريباً!
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {items.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <ProductCard product={product} onViewProduct={handleViewProduct} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
