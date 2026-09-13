import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/users/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('ew_token');
      localStorage.removeItem('ew_cart');
      window.dispatchEvent(new Event('cart-clear'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handlePageShow = (e) => {
      if (e.persisted) {
        checkAuth();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [checkAuth]);

  const login = useCallback(async (username, password) => {
    const res = await api.post('/users/login', { username, password });
    setUser(res.data.user);
    localStorage.setItem('isLoggedIn', 'true');
    if (res.data.token) {
      localStorage.setItem('ew_token', res.data.token);
    }
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('ew_token');
    localStorage.removeItem('ew_cart');
    window.dispatchEvent(new Event('cart-clear'));
    try {
      await api.post('/users/logout');
    } catch {
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, checkAuth }), [user, loading, login, logout, checkAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

//ambil data AuthContext tanpa import useContext tiap komponen
export const useAuth = () => useContext(AuthContext);