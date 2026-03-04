import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_EVENT_NAME, getAuthSession } from "../utils/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    const session = getAuthSession();
    if (session.role !== "user" || !session.token) {
      setCart({ items: [], subtotal: 0 });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${session.token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch cart");
      setCart(data);
    } catch (_err) {
      setCart({ items: [], subtotal: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    const onAuthChange = () => fetchCart();
    window.addEventListener(AUTH_EVENT_NAME, onAuthChange);
    return () => window.removeEventListener(AUTH_EVENT_NAME, onAuthChange);
  }, []);

  const withAuth = () => {
    const session = getAuthSession();
    if (session.role !== "user" || !session.token) {
      throw new Error("Please login as a user to continue.");
    }
    return session.token;
  };

  const addToCart = async ({ productId, quantity = 1, size = "", color = "" }) => {
    const token = withAuth();
    const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity, size, color })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to add to cart");
    setCart(data);
    return data;
  };

  const updateCartItem = async (itemId, quantity) => {
    const token = withAuth();
    const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ quantity })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update cart");
    setCart(data);
    return data;
  };

  const removeCartItem = async (itemId) => {
    const token = withAuth();
    const response = await fetch(`${API_BASE_URL}/api/cart/items/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to remove cart item");
    setCart(data);
    return data;
  };

  const clearCart = async () => {
    const token = withAuth();
    const response = await fetch(`${API_BASE_URL}/api/cart/clear`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to clear cart");
    setCart(data);
    return data;
  };

  const value = useMemo(
    () => ({
      cart,
      loading,
      fetchCart,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
      itemCount: (cart.items || []).reduce((sum, item) => sum + item.quantity, 0)
    }),
    [cart, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
