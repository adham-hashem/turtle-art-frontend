import React from 'react';
import { ShoppingCart, Eye, ShoppingBag, Heart, Sparkles, Star } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  isOffer: boolean;
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
  const trimmedName = colorName.trim().toLowerCase();

  const colorMap: { [key: string]: string } = {
    // Arabic colors
    'أسود': '#1f2937',
    'أبيض': '#f9fafb',
    'بني': '#78350f',
    'بيج': '#d4c5b0',
    'رمادي': '#6b7280',
    'أزرق': '#3b82f6',
    'أحمر': '#dc2626',
    'أخضر': '#16a34a',
    'أصفر': '#eab308',
    'وردي': '#ec4899',
    'برتقالي': '#f97316',
    'بنفسجي': '#9333ea',
    // English colors
    'black': '#1f2937',
    'white': '#f9fafb',
    'brown': '#78350f',
    'beige': '#d4c5b0',
    'gray': '#6b7280',
    'grey': '#6b7280',
    'blue': '#3b82f6',
    'red': '#dc2626',
    'green': '#16a34a',
    'yellow': '#eab308',
    'pink': '#ec4899',
    'orange': '#f97316',
    'purple': '#9333ea',
  };

  return colorMap[trimmedName] || '#e5e7eb';
};

// Check if color is dark for border contrast
const isColorDark = (colorName: string): boolean => {
  const darkColors = ['أسود', 'black', 'بني', 'brown', 'أزرق', 'blue', 'أحمر', 'red', 'أخضر', 'green', 'بنفسجي', 'purple'];
  return darkColors.includes(colorName.trim().toLowerCase());
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewProduct,
  onAddToCart,
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button[data-action="add-to-cart"]')) {
      return;
    }
    onViewProduct(product);
  };

  const discountPercentage =
    product.originalPrice && product.price < product.originalPrice
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0;

  const primaryImagePath = product.images[0]?.imagePath || '';
  const resolvedImageSrc = primaryImagePath
    ? primaryImagePath.startsWith('http')
      ? primaryImagePath
      : primaryImagePath.startsWith('/')
        ? `${apiUrl}${primaryImagePath}`
        : `${apiUrl}/${primaryImagePath}`
    : '';

  return (
    <div
      className="bg-white rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden transition-all duration-300 group hover:shadow-2xl cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] border-2 border-[#E5DCC5] hover:border-[#D4AF37]"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#FAF9F6] to-[#F5F5DC]">
        <img
          src={resolvedImageSrc}
          alt={product.name}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src =
              'https://placehold.co/600x400/FAF9F6/8B7355?text=👜+Turtle+Art';
          }}
          className="w-full h-48 sm:h-56 md:h-64 object-contain group-hover:scale-110 transition-transform duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1.5 sm:gap-2">
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="bg-red-500 text-white px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-sm font-bold shadow-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              خصم {discountPercentage}%
            </div>
          )}
        </div>

        {/* Stock Status Badge */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-md border-2 border-[#E5DCC5]">
          <ShoppingBag size={16} className="sm:hidden text-[#8B7355]" />
          <ShoppingBag size={20} className="hidden sm:block text-[#8B7355]" />
        </div>

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <span className="bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base shadow-2xl block" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                غير متوفر حالياً
              </span>
            </div>
          </div>
        )}

        {/* Hover Actions - Desktop Only */}
        <div className="hidden md:flex absolute inset-0 bg-gradient-to-b from-[#8B7355]/90 to-[#6B5644]/90 opacity-0 group-hover:opacity-100 transition-all duration-300 items-end justify-center pb-6 gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProduct(product);
            }}
            className="bg-white text-[#8B7355] px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-2xl hover:bg-[#FAF9F6] hover:scale-110 transition-all"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <Eye size={18} />
            <span>عرض التفاصيل</span>
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3">
        {/* Name & Code */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-base sm:text-lg md:text-xl text-[#8B7355] flex-1 text-right leading-tight line-clamp-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {product.name}
          </h3>
          <span className="text-[10px] sm:text-xs text-[#8B7355] bg-[#F5F5DC] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold whitespace-nowrap border border-[#E5DCC5] sm:border-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {product.code}
          </span>
        </div>

        {/* Description */}
        <p className="text-[#8B7355]/70 text-xs sm:text-sm line-clamp-2 text-right leading-relaxed" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          {product.description}
        </p>

        {/* Price Section */}
        <div className="bg-gradient-to-br from-[#F5F5DC] to-[#E5DCC5] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#D4AF37] sm:border-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#D4AF37]" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {product.price}
              </span>
              <span className="text-xs sm:text-sm text-[#8B7355] font-bold" style={{ fontFamily: 'Tajawal, sans-serif' }}>جنيه</span>
              {product.originalPrice && (
                <span className="text-xs sm:text-sm text-gray-400 line-through font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {product.originalPrice}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Colors */}
        {product.colors.length > 0 && (
          <div className="bg-[#FAF9F6] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-[#E5DCC5] sm:border-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-[#8B7355] flex items-center gap-1 sm:gap-1.5" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Sparkles size={12} className="sm:hidden text-[#D4AF37]" />
                <Sparkles size={14} className="hidden sm:block text-[#D4AF37]" />
                الألوان:
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                {product.colors.slice(0, 4).map((color, index) => (
                  <div
                    key={index}
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-lg sm:rounded-xl border-2 sm:border-3 shadow-md transition-all hover:scale-125 hover:rotate-12 cursor-pointer"
                    style={{ 
                      backgroundColor: getColorHex(color),
                      borderColor: isColorDark(color) ? '#ffffff' : '#E5DCC5'
                    }}
                    title={color}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className="text-[10px] sm:text-xs text-[#8B7355] bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl font-bold border border-[#E5DCC5] sm:border-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    +{product.colors.length - 4}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sizes */}
        {product.sizes.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <ShoppingBag size={12} className="sm:hidden text-[#D4AF37]" />
              <ShoppingBag size={14} className="hidden sm:block text-[#D4AF37]" />
              <span className="text-xs sm:text-sm font-bold text-[#8B7355]" style={{ fontFamily: 'Tajawal, sans-serif' }}>المقاسات:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-end">
              {product.sizes.slice(0, 3).map((size, index) => (
                <span
                  key={index}
                  className="text-xs sm:text-sm font-bold bg-[#F5F5DC] text-[#8B7355] px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl border border-[#E5DCC5] sm:border-2 hover:scale-105 transition-transform"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  {size}
                </span>
              ))}
              {product.sizes.length > 3 && (
                <span className="text-xs sm:text-sm text-[#8B7355] bg-[#FAF9F6] px-2 sm:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl font-bold border border-[#E5DCC5] sm:border-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  +{product.sizes.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick Info Footer */}
        {/* <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-[#E5DCC5] sm:border-t-2">
          <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-[#D4AF37] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Heart size={12} className="sm:hidden text-[#D4AF37] fill-[#F5F5DC]" />
            <Heart size={14} className="hidden sm:block text-[#D4AF37] fill-[#F5F5DC]" />
            <span>صنع بحب</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-[#C4A57B] font-medium" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Sparkles size={12} className="sm:hidden text-[#C4A57B]" />
            <Sparkles size={14} className="hidden sm:block text-[#C4A57B]" />
            <span>جودة عالية</span>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default ProductCard;
