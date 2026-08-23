import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '../data/products';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
}

interface CartContextValue {
  cart: CartItem[];
  wishlist: string[]; // product IDs
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  promoCode: string | null;
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  savedAddresses: SavedAddress[];
  addSavedAddress: (addr: Omit<SavedAddress, 'id'>) => void;
  updateSavedAddress: (id: string, updates: Omit<SavedAddress, 'id'>) => void;
  deleteSavedAddress: (id: string) => void;
  selectedAddress: SavedAddress | null;
  setSelectedAddress: (addr: SavedAddress) => void;
}

const defaultAddresses: SavedAddress[] = [
  {
    id: 'addr-1',
    name: 'Karthik (Home)',
    phone: '9876543210',
    address: 'Door 4-12, SVN Colony, Main Road',
    city: 'Guntur',
    pincode: '522001',
    isDefault: true,
  },
  {
    id: 'addr-2',
    name: 'Karthik (Office)',
    phone: '9876543210',
    address: 'Plot 45, Tech Hub, Benz Circle',
    city: 'Vijayawada',
    pincode: '520001',
  },
];

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('dt_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('dt_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    const saved = localStorage.getItem('dt_addresses');
    return saved ? JSON.parse(saved) : defaultAddresses;
  });
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(
    savedAddresses[0] ?? null
  );

  useEffect(() => {
    localStorage.setItem('dt_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('dt_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('dt_addresses', JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode(null);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const applyPromoCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'SWIFT10' || clean === 'NOVAKART10' || clean === 'FESTIVE10' || clean === 'WELCOME10') {
      setPromoCode(clean);
      return true;
    }
    return false;
  };

  const removePromoCode = () => setPromoCode(null);

  const addSavedAddress = (addr: Omit<SavedAddress, 'id'>) => {
    const newAddr: SavedAddress = { ...addr, id: `addr-${Date.now()}` };
    setSavedAddresses((prev) => [...prev, newAddr]);
    setSelectedAddress(newAddr);
  };

  const updateSavedAddress = (id: string, updates: Omit<SavedAddress, 'id'>) => {
    setSavedAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...updates, id } : a))
    );
    // Keep selectedAddress in sync
    setSelectedAddress((prev) => (prev?.id === id ? { ...updates, id } : prev));
  };

  const deleteSavedAddress = (id: string) => {
    setSavedAddresses((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      // If we deleted the selected address, select the first remaining one
      setSelectedAddress((sel) => {
        if (sel?.id === id) return remaining[0] ?? null;
        return sel;
      });
      return remaining;
    });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = promoCode ? Math.round(subtotal * 0.1) : 0;
  const totalAmount = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        totalItems,
        subtotal,
        discount,
        totalAmount,
        promoCode,
        applyPromoCode,
        removePromoCode,
        savedAddresses,
        addSavedAddress,
        updateSavedAddress,
        deleteSavedAddress,
        selectedAddress,
        setSelectedAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
