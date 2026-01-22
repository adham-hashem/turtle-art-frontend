// src/types/index.ts
export interface ProductImage {
  id: string;
  imagePath: string;
  isMain: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  description: string;
  createdAt: string; // From API response
  category: number; // From API response
  sizes: string[];
  colors: string[];
  images: ProductImage[]; // Updated to match API response
  inStock: boolean; // Required by ProductCard and AppContext
  isOffer?: boolean; // Optional, used by ProductCard
  originalPrice?: number; // Optional, used by ProductCard
}

export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  size?: string;
  color?: string;
  images?: {
    id: string;
    imagePath: string;
    isMain: boolean;
  }[];
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