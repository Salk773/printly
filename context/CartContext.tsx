"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from "react";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------
export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number;

  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;

  /* Drawer control */
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

// ---------------------------------------------------------
const CartContext = createContext<CartContextType | undefined>(undefined);

// ---------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Add item or increase quantity
  const addItem = (
    item: Omit<CartItem, "quantity"> & { quantity?: number }
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const qtyToAdd = item.quantity ?? 1;

      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + qtyToAdd }
            : i
        );
      }

      return [...prev, { ...item, quantity: qtyToAdd }];
    });

    // Automatically open drawer when item added
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      addItem,
      removeItem,
      clearCart,
      isOpen,
      openCart,
      closeCart,
    }),
    [items, count, total, isOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ---------------------------------------------------------
// HOOK
// ---------------------------------------------------------
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
