// src/types/index.ts
export interface ProductImage {
  id: string;
  imagePath: string;
  isMain: boolean;
}

export interface ProductExtension {
  id: string;
  productId: string;
  name: string;
  additionalPrice: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  description: string;
  createdAt: string; // From API response
  category?: number; // From API response - optional
  sizes: string[];
  colors: string[];
  images: ProductImage[]; // Updated to match API response
  extensions?: ProductExtension[]; // Product extensions (e.g., gift wrapping, personalization)
  inStock: boolean; // Required by ProductCard and AppContext
  isOffer: boolean; // Used by ProductCard
  originalPrice?: number; // Optional, used by ProductCard
  isHidden?: boolean; // Product visibility flag
  isAvailable?: boolean; // Product availability flag
  isInstant?: boolean; // Quick delivery flag
  isFeatured?: boolean; // Featured product flag
  rating: number; // Product rating (0-5)
  priority?: number; // Display priority (higher shows first), default 0
  salesCount: number; // Number of sales
  type?: any; // Product type
  season?: any; // Product season
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  customization_text?: string;
}

export interface Customer {
  id: string;
  name: string;
  // ... other customer properties
}

export interface Order {
  id: string;
  status: 'confirmed' | 'shipped' | 'delivered';
  // ... other order properties
}

export interface Admin {
  id: string;
  name: string;
  // ... other admin properties
}