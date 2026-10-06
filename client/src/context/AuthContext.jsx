/**
 * Auth context — OWNER: M1.
 * Persists the authenticated user across reloads and exposes
 * login, register, logout, and authentication state.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('bb_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('bb_user');
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bb_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bb_user');
    }
  }, [user]);

  async function register(input) {
    const res = await api.post('/auth/register', input);

    setToken(res.token);
    setUser(res.user);

    return res.user;
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', {
      email,
      password,
    });

    setToken(res.token);
    setUser(res.user);

    return res.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        register,
        login,
        logout,
        isAuthenticated: Boolean(user),
        isStaff: user?.userType === 'staff',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);