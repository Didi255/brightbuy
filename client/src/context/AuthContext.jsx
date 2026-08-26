/**
 * Auth context — OWNER: M1.
 * TODO(M1): persist the user across reloads, expose register(), and add a
 * ProtectedRoute component that redirects guests to /login (REQ-4.5).
 */
import { createContext, useContext, useState } from 'react';
import { api, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isStaff: user?.userType === 'staff' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
