import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  //update object state null saat logout, object user saat login
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      //db ke backend api ke frontend axios ke state react ke komponen bisa akses data user
      const res = await api.get('/users/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  //cek auth saat aplikasi pertama di-load
  useEffect(() => {
    checkAuth();

    //browser nyimpen snapshot halaman pas back/forward
    //biar state auth selalu sinkron sama cookie/server
    const handlePageShow = (e) => {
      if (e.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [checkAuth]);

  const login = async (username, password) => {
    //kirim username dan password ke backend validasi ke set cookie
    //object user dari server ke update state React
    const res = await api.post('/users/login', { username, password });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    setUser(null);
    try {
      await api.post('/users/logout');
    } catch {
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

//ambil data AuthContext tanpa import useContext tiap komponen
export const useAuth = () => useContext(AuthContext);