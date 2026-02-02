// src/types/index.ts
export interface ProductImage {
  id: string;
  imagePath: string;
  isMain: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;        // السعر الجديد
  oldPrice?: number;    // السعر القديم
  discount?: number;    // قيمة الخصم
  isSoldOut?: boolean;
  image: string;
}
س

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