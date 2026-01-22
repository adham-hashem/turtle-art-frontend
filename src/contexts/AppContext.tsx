import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Product, CartItem, Customer, Order, Admin } from '../types';
import { sampleProducts } from '../data/sampleProducts';

interface AppState {
  products: Product[];
  cart: CartItem[];
  customer: Customer | null;
  admin: Admin | null;
  orders: Order[];
  isAdminLoggedIn: boolean;
  isCustomerLoggedIn: boolean;
}

type AppAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'CLEAR_CART' }
  | { type: 'LOGIN_CUSTOMER'; payload: Customer }
  | { type: 'LOGIN_ADMIN'; payload: Admin }
  | { type: 'LOGOUT_CUSTOMER' }
  | { type: 'LOGOUT_ADMIN' }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: 'confirmed' | 'shipped' | 'delivered' } };

const initializeState = (): AppState => {
  const savedCart = localStorage.getItem('cart');
  return {
    products: sampleProducts,
    cart: savedCart ? JSON.parse(savedCart) : [],
    customer: null,
    admin: null,
    orders: [],
    isAdminLoggedIn: false,
    isCustomerLoggedIn: false,
  };
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(
        item =>
          item.product.id === action.payload.product.id &&
          item.selectedSize === action.payload.selectedSize &&
          item.selectedColor === action.payload.selectedColor &&
          item.customization_text === action.payload.customization_text
      );

      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product.id === action.payload.product.id &&
            item.selectedSize === action.payload.selectedSize &&
            item.selectedColor === action.payload.selectedColor &&
            item.customization_text === action.payload.customization_text
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }

      return {
        ...state,
        cart: [...state.cart, action.payload],
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.product.id !== action.payload),
      };

    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case 'SET_CART':
      return {
        ...state,
        cart: action.payload,
      };

    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
      };

    case 'LOGIN_CUSTOMER':
      return {
        ...state,
        customer: action.payload,
        isCustomerLoggedIn: true,
      };

    case 'LOGIN_ADMIN':
      return {
        ...state,
        admin: action.payload,
        isAdminLoggedIn: true,
      };

    case 'LOGOUT_CUSTOMER':
      return {
        ...state,
        customer: null,
        isCustomerLoggedIn: false,
      };

    case 'LOGOUT_ADMIN':
      return {
        ...state,
        admin: null,
        isAdminLoggedIn: false,
      };

    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload],
      };

    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(product =>
          product.id === action.payload.id ? action.payload : product
        ),
      };

    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(product => product.id !== action.payload),
      };

    case 'ADD_ORDER':
      return {
        ...state,
        orders: [...state.orders, action.payload],
      };

    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        ),
      };

    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Cart helper methods
  addToCart: (product: Product, quantity: number, selectedSize?: string, selectedColor?: string, customization?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initializeState());

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.cart));
  }, [state.cart]);

  // Cart helper methods
  const addToCart = (
    product: Product,
    quantity: number,
    selectedSize?: string,
    selectedColor?: string,
    customization?: string
  ) => {
    const cartItem: CartItem = {
      product,
      quantity,
      selectedSize,
      selectedColor,
      customization_text: customization,
    };
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getTotalAmount = () => {
    return state.cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return state.cart.reduce((count, item) => count + item.quantity, 0);
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getItemCount,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
