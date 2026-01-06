"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthProvider";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface RecentlyViewedContextType {
  items: Product[];
  addProduct: (product: Product) => void;
  clearHistory: () => void;
}

const RecentlyViewedContext = createContext<
  RecentlyViewedContextType | undefined
>(undefined);

const STORAGE_KEY = "printly_recently_viewed";
const MAX_ITEMS = 20;

export function RecentlyViewedProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Error loading recently viewed:", error);
    }
  };

  const saveToStorage = (newItems: Product[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (error) {
      console.error("Error saving recently viewed:", error);
    }
  };

  const addProduct = (product: Product) => {
    setItems((prev) => {
      // Remove if already exists
      const filtered = prev.filter((item) => item.id !== product.id);
      // Add to beginning
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      saveToStorage(updated);
      return updated;
    });
  };

  const clearHistory = () => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <RecentlyViewedContext.Provider
      value={{ items, addProduct, clearHistory }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) {
    throw new Error(
      "useRecentlyViewed must be used within RecentlyViewedProvider"
    );
  }
  return ctx;
}

