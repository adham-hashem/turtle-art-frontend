// src/pages/AllProductsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const apiUrl = import.meta.env.VITE_API_BASE_URL;

// Adjust these fields if your backend differs
type ProductImage = {
  id?: string;
  imagePath?: string;
  isMain?: boolean;
};

type Product = {
  id: string;
  code?: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  createdAt?: string;
  images?: ProductImage[];
  isHidden?: boolean;
  isAvailable?: boolean;
  isInstant?: boolean;
};

type ApiResponse = {
  items: Product[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

function getMainImage(images?: ProductImage[]) {
  if (!images?.length) return null;
  const main = images.find((i) => i.isMain) || images[0];
  return main?.imagePath ?? null;
}

function toAbsoluteImageUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  // If your backend returns "/uploads/...", this makes it absolute using VITE_API_BASE_URL
  return `${apiUrl}${path}`;
}

export default function AllProductsPage() {
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
        const res = await fetch(
          `${apiUrl}/api/products?pageNumber=${pageNumber}&pageSize=${pageSize}`
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Request failed: ${res.status}`);
        }

        const data: ApiResponse = await res.json();

        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
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

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-extrabold text-[#8B7355]"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            {title}
          </h1>
          <p
            className="text-[#8B7355]/80 mt-1"
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
            className="px-4 py-2 rounded-xl border-2 border-[#E5DCC5] bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#D4AF37] transition"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            السابق
          </button>

          <div
            className="text-[#8B7355] font-bold"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            صفحة {pageNumber} / {totalPages}
          </div>

          <button
            disabled={!canNext || loading}
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl border-2 border-[#E5DCC5] bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#D4AF37] transition"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            التالي
          </button>
        </div>

        {/* States */}
        {loading && (
          <div
            className="text-center py-10 text-[#8B7355]"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            جاري تحميل المنتجات...
          </div>
        )}

        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-xl p-4">
            <p
              className="text-red-600 font-bold"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              حصل خطأ أثناء تحميل المنتجات
            </p>
            <p className="text-red-500 mt-1">{error}</p>

            <button
              onClick={() => setPageNumber((p) => p)} // trigger refetch by re-setting state (or you can add a `refreshKey`)
              className="mt-3 px-4 py-2 rounded-xl bg-[#D4AF37] text-white font-bold"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div
            className="text-center py-10 text-[#8B7355]"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            لا توجد منتجات حالياً.
          </div>
        )}

        {/* Grid */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((p) => {
              const img = toAbsoluteImageUrl(getMainImage(p.images));
              return (
                <div
                  key={p.id}
                  className="bg-white/90 backdrop-blur-sm border-2 border-[#E5DCC5] rounded-2xl shadow-lg overflow-hidden hover:border-[#D4AF37] transition"
                >
                  <div className="aspect-[4/3] bg-[#FAF9F6] overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8B7355]/60">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3
                      className="font-extrabold text-[#8B7355] line-clamp-1"
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                      title={p.name}
                    >
                      {p.name}
                    </h3>

                    {p.description && (
                      <p
                        className="text-sm text-[#8B7355]/75 mt-1 line-clamp-2"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                        title={p.description}
                      >
                        {p.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div
                        className="font-extrabold text-[#D4AF37]"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        {p.price} ج
                      </div>

                      {/* Optional: if you have product details route */}
                      <Link
                        to={`/product/${p.id}`}
                        className="text-sm font-bold text-[#8B7355] hover:text-[#D4AF37] transition"
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      >
                        التفاصيل
                      </Link>
                    </div>

                    {/* Optional badges */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.isAvailable === false && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                          غير متاح
                        </span>
                      )}
                      {p.isHidden && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                          مخفي
                        </span>
                      )}
                      {p.isInstant && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                          جاهز للتسليم
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
