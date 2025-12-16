// /context/CartProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@supabase/supabase-js";

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
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  sideCartOpen: boolean;
  toggleSideCart: () => void;
  /** true briefly after any cart change – use for icon animation */
  cartJustUpdated: boolean;
  /** true while syncing cart to Supabase (if logged in) */
  isSyncing: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "printly_cart_v1";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [sideCartOpen, setSideCartOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [cartJustUpdated, setCartJustUpdated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ---- Hydrate from localStorage once on mount ----
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined"
        ? window.localStorage.getItem(LOCAL_STORAGE_KEY)
        : null;
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load cart from localStorage", err);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  // ---- Persist to localStorage whenever items change ----
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (err) {
      console.error("Failed to save cart to localStorage", err);
    }
  }, [items, hasHydrated]);

  // ---- Trigger brief "cart updated" animation ----
  useEffect(() => {
    if (!hasHydrated) return;
    if (items.length === 0) return; // don't animate clearing at load

    setCartJustUpdated(true);
    const timeout = window.setTimeout(() => {
      setCartJustUpdated(false);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [items, hasHydrated]);

  // ---- Sync to Supabase if a user is logged in ----
  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    async function syncCart() {
      try {
        setIsSyncing(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.warn("Supabase getUser error (cart sync):", userError.message);
          return;
        }

        if (!user || cancelled) return;

        const { error } = await supabase.from("carts").upsert({
          user_id: user.id,
          items,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.warn("Supabase upsert carts error:", error.message);
        }
      } catch (err) {
        console.error("Unexpected cart sync error:", err);
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    }

    // debounce a bit so we don't spam Supabase
    const timeout = window.setTimeout(syncCart, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [items, hasHydrated]);

  const addItem: CartContextType["addItem"] = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: i.quantity + (item.quantity ?? 1),
              }
            : i
        );
      }

      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity ?? 1,
        },
      ];
    });

    setSideCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const increaseQuantity = (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  };

  const decreaseQuantity = (id: string) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const toggleSideCart = () => {
    setSideCartOpen((prev) => !prev);
  };

  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value: CartContextType = {
    items,
    count,
    total,
    addItem,
    removeItem,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    sideCartOpen,
    toggleSideCart,
    cartJustUpdated,
    isSyncing,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
