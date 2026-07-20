// src/hooks/useProductStore.ts
import { useState, useEffect, useCallback } from "react";
import { defaultProducts, type Product } from "@/data/products";
import { fetchProductsFromCloud } from "@/config/storage";

export interface CartItem {
  product: Product;
  quantity: number;
}

export function useProductStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Load products from Azure Blob (or fallback to local)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cloud = await fetchProductsFromCloud();
      if (!cancelled) {
        setProducts(cloud && cloud.length > 0 ? cloud : defaultProducts);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bakery-cart");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updated = [...prev, { product, quantity: 1 }];
      }
      localStorage.setItem("bakery-cart", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);
      localStorage.setItem("bakery-cart", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => {
        const updated = prev.filter((item) => item.product.id !== productId);
        localStorage.setItem("bakery-cart", JSON.stringify(updated));
        return updated;
      });
      return;
    }
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      localStorage.setItem("bakery-cart", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem("bakery-cart");
  }, []);

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.offerPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    products,
    loading,
    filteredProducts,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
  };
}