/**
 * CartContext — manages cart state across the app
 * OWNER: Slice C (Vidura)
 *
 * Provides:
 *  - cartItemCount for the navbar badge
 *  - cart data for the cart page
 *  - addItem, updateItem, removeItem methods
 *  - session token management for guest carts
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

function getSessionToken() {
  let token = localStorage.getItem('bb_cart_session');
  if (!token) {
    token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    localStorage.setItem('bb_cart_session', token);
  }
  return token;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const itemCount = cart?.itemCount || 0;

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = {};
      if (!user) {
        headers['X-Cart-Session'] = getSessionToken();
      }
      const data = await api.get('/cart');
      setCart(data);
    } catch (err) {
      // 404 = no cart yet, that's fine
      if (err.status !== 404) {
        setError(err);
      }
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addItem = useCallback(async (variantId, quantity = 1) => {
    try {
      setError(null);
      const data = await api.post('/cart/items', { variantId, quantity });
      setCart(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const updateItem = useCallback(async (itemId, quantity) => {
    try {
      setError(null);
      const data = await api.patch(`/cart/items/${itemId}`, { quantity });
      setCart(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const removeItem = useCallback(async (itemId) => {
    try {
      setError(null);
      const data = await api.del(`/cart/items/${itemId}`);
      setCart(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  const clearCartState = useCallback(() => {
    setCart(null);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        loading,
        error,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearCartState,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
