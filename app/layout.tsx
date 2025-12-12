"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from "react";

export type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image: string;
};

type WishlistContextType = {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const toggleWishlist = (item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.some((w) => w.id === item.id);
      if (exists) {
        return prev.filter((w) => w.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const isInWishlist = (id: string) => items.some((w) => w.id === id);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((w) => w.id !== id));

  const clearWishlist = () => setItems([]);

  const value = useMemo(
    () => ({
      items,
      toggleWishlist,
      isInWishlist,
      removeItem,
      clearWishlist,
    }),
    [items]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
