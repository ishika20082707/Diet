import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalCalories: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  deliveryFee: number;
  grandTotal: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  removeItem: (cartKey: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'verdant_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, activeSubscription } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.cartKey === item.cartKey);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const updateQuantity = (cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartKey);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity } : i))
    );
  };

  const removeItem = (cartKey: string) => {
    setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
  };

  const clearCart = () => {
    setItems([]);
  };

  const summary = useMemo(() => {
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const totalCalories = items.reduce((s, i) => s + i.calories * i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    const activePlan =
      activeSubscription?.status === 'active'
        ? activeSubscription.plan
        : user?.plan || null;

    const discountPercent = activePlan ? activePlan.discountPercent : 0;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const freeDelivery =
      Boolean(activePlan?.freeDelivery) || afterDiscount >= 799 || subtotal === 0;
    const deliveryFee = freeDelivery ? 0 : 35;
    const grandTotal = afterDiscount + deliveryFee;

    return {
      totalItems,
      totalCalories,
      subtotal,
      discountPercent,
      discountAmount,
      deliveryFee,
      grandTotal,
    };
  }, [items, user, activeSubscription]);

  return (
    <CartContext.Provider
      value={{
        items,
        ...summary,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
