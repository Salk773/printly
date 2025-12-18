"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

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

  sideCartOpen: boolean;
  toggleSideCart: () => void;

  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;

  cartJustUpdated: boolean;
  isSyncing: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "printly_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  const [sideCartOpen, setSideCartOpen] = useState(false);

  const isCartOpen = sideCartOpen;
  const openCart = () => setSideCartOpen(true);
  const closeCart = () => setSideCartOpen(false);
  const toggleSideCart = () => setSideCartOpen((prev) => !prev);

  const [cartJustUpdated, setCartJustUpdated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  /* ---------- LOAD LOCAL STORAGE ---------- */
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem(LOCAL_STORAGE_KEY)
          : null;

      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  /* ---------- SAVE LOCAL STORAGE ---------- */
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hasHydrated]);

  /* ---------- CART ICON ANIMATION ---------- */
  useEffect(() => {
    if (!hasHydrated || items.length === 0) return;
    setCartJustUpdated(true);
    const t = setTimeout(() => setCartJustUpdated(false), 300);
    return () => clearTimeout(t);
  }, [items, hasHydrated]);

  /* ---------- OPTIONAL SUPABASE SYNC ---------- */
  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    const sync = async () => {
      setIsSyncing(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || cancelled) return;

        await supabase.from("carts").upsert({
          user_id: user.id,
          items,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.log("Cart sync skipped:", err);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    const t = setTimeout(sync, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [items, hasHydrated]);

  /* ---------- CART LOGIC ---------- */
  const addItem = (
    item: Omit<CartItem, "quantity"> & { quantity?: number }
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
    setSideCartOpen(true);
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const increaseQuantity = (id: string) =>
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity + 1 } : i
      )
    );

  const decreaseQuantity = (id: string) =>
    setItems((prev) =>
      prev
        .map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );

  const clearCart = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

  const value = useMemo(
    () => ({
      items,
      count,
      total,

      sideCartOpen,
      toggleSideCart,

      isCartOpen,
      openCart,
      closeCart,

      addItem,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      clearCart,

      cartJustUpdated,
      isSyncing,
    }),
    [items, count, total, sideCartOpen, cartJustUpdated, isSyncing]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
