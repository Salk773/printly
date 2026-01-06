"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category_id?: string | null;
}

interface ComparisonContextType {
  items: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  clearComparison: () => void;
  isInComparison: (id: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(
  undefined
);

const MAX_COMPARISON = 4;

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  const addProduct = (product: Product) => {
    setItems((prev) => {
      if (prev.length >= MAX_COMPARISON) {
        return prev; // Don't add if at max
      }
      if (prev.find((p) => p.id === product.id)) {
        return prev; // Don't add if already exists
      }
      return [...prev, product];
    });
  };

  const removeProduct = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const clearComparison = () => {
    setItems([]);
  };

  const isInComparison = (id: string) => {
    return items.some((p) => p.id === id);
  };

  return (
    <ComparisonContext.Provider
      value={{
        items,
        addProduct,
        removeProduct,
        clearComparison,
        isInComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx) {
    throw new Error(
      "useComparison must be used within ComparisonProvider"
    );
  }
  return ctx;
}

