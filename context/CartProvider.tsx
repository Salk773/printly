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

  /** Drawer state */
  sideCartOpen: boolean;
  toggleSideCart: () => void;

  /** Old naming preserved for compatibility */
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;

  /** Cart logic */
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;

  /** Animation trigger for Navbar */
  cartJustUpdated: boolean;

  /** Background sync (safe even without auth) */
  isSyncing: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "printly_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  /** Drawer */
  const [sideCartOpen, setSideCartOpen] = useState(false);

  /** Backwards-compatibility with older code */
  const isCartOpen = sideCartOpen;
  const openCart = () => setSideCartOpen(true);
  const closeCart = () => setSideCartOpen(false);
  const toggleSideCart = () => setSideCartOpen((prev) => !prev);

  /** Animations */
  const [cartJustUpdated, setCartJustUpdated] = useState(false);

  /** Sync state */
  const [isSyncing, setIsSyncing] = useState(false);

  // ---------------------------------------------
  // 🟣 Load from localStorage
  // ---------------------------------------------
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

  // ---------------------------------------------
  // 🟣 Save to localStorage
  // ---------------------------------------------
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hasHydrated]);

  // ---------------------------------------------
  // 🟣 Animate cart icon on updates
  // ---------------------------------------------
  useEffect(() => {
    if (!hasHydrated) return;
    if (items.length === 0) return;

    setCartJustUpdated(true);
    const t = setTimeout(() => setCartJustUpdated(false), 300);
    return () => clearTimeout(t);
  }, [items, hasHydrated]);

  // ---------------------------------------------
  // 🟣 Optional Supabase sync (only works if logged in)
  // ---------------------------------------------
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
        console.log("Cart sync skipped / unavailable:", err);
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

  // ---------------------------------------------
  // 🟣 Cart logic (preserved)
  // ---------------------------------------------
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

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

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
