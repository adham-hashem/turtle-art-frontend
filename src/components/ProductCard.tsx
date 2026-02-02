import React from 'react';
import { Eye, ShoppingBag, Sparkles } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  images: { imagePath: string }[];
  colors: string[];
  sizes: string[];
};

const apiUrl = import.meta.env.VITE_API_BASE_URL;

interface ProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

// Map color names to visual colors
const getColorHex = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'أسود': '#1f2937',
    'أبيض': '#f9fafb',
    'بني': '#1A3F2F',
    'بيج': '#ffffff',
    'رمادي': '#6b7280',
    'black': '#1f2937',
    'white': '#f9fafb',
    'brown': '#1A3F2F',
    'gray': '#6b7280',
    'blue': '#1A3F2F',
    'red': '#1A3F2F',
    'green': '#1A3F2F',
  };

  return colorMap[colorName.trim().toLowerCase()] || '#e5e7eb';
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewProduct,
}) => {
  const handleCardClick = () => {
    onViewProduct(product);
  };

  const primaryImagePath = product.images[0]?.imagePath || '';
  const resolvedImageSrc = primaryImagePath
    ? primaryImagePath.startsWith('http')
      ? primaryImagePath
      : `${apiUrl}${primaryImagePath}`
    : '';

  const hasDiscount =
    product.originalPrice && product.price < product.originalPrice;

  const discountValue = hasDiscount
    ? product.originalPrice! - product.price
    : 0;

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer group"
    >
      {/* Image */}
      <div className="relative bg-gray-50 overflow-hidden">
        <img
          src={resolvedImageSrc}
          alt={product.name}
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            t.src = 'https://placehold.co/600x400?text=Product';
          }}
          className="w-full h-56 object-contain group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            Save {discountValue} EGP
          </span>
        )}

        {/* Sold Out */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-black text-white px-4 py-2 rounded text-sm">
              Sold Out
            </span>
          </div>
        )}

        {/* Hover */}
        <div className="hidden md:flex absolute inset-0 opacity-0 group-hover:opacity-100 items-end justify-center pb-6 transition">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProduct(product);
            }}
            className="bg-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow"
          >
            <Eye size={18} />
            عرض التفاصيل
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Name */}
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-base text-right line-clamp-2">
            {product.name}
          </h3>
          <span className="text-xs bg-gray-100 border px-2 py-1 rounded font-bold">
            {product.code}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-700 line-clamp-2 text-right">
          {product.description}
        </p>

        {/* Price – Sticka */}
        <div className="flex items-center justify-end gap-2">
          <span className="text-lg font-bold text-black">
            {product.price} جنيه
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {product.originalPrice} جنيه
            </span>
          )}
        </div>

        {/* Colors */}
        {product.colors.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1">
              <Sparkles size={12} />
              الألوان
            </span>
            <div className="flex gap-1">
              {product.colors.slice(0, 4).map((c, i) => (
                <span
                  key={i}
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: getColorHex(c) }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sizes */}
        {product.sizes.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {product.sizes.slice(0, 3).map((s, i) => (
              <span
                key={i}
                className="text-xs border px-2 py-1 rounded"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard; 