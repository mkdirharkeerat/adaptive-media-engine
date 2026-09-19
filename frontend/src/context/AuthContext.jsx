import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('adaptive_token') || null);
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/preferences');
      setPreferences(res.data);
      setUser({ id: res.data.user_id, email: 'harkeeratsingh15@gmail.com' });
    } catch (err) {
      console.error('Failed to load user preferences', err);
      // If unauthorized or failed, attempt bypass
      await bypassLogin();
    } finally {
      setLoading(false);
    }
  };

  const bypassLogin = async () => {
    try {
      const res = await api.post('/auth/bypass');
      const accessToken = res.data.access_token;
      localStorage.setItem('adaptive_token', accessToken);
      setToken(accessToken);
      const prefRes = await api.get('/preferences');
      setPreferences(prefRes.data);
      setUser({ id: prefRes.data.user_id, email: 'harkeeratsingh15@gmail.com' });
      return res.data;
    } catch (err) {
      console.warn('Auto-bypass using default credentials fallback', err);
      const mockToken = 'dev-bypass-token';
      localStorage.setItem('adaptive_token', mockToken);
      setToken(mockToken);
      setUser({ id: 1, email: 'harkeeratsingh15@gmail.com' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('adaptive_token');
      if (storedToken) {
        await fetchPreferences();
      } else {
        await bypassLogin();
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const accessToken = res.data.access_token;
    localStorage.setItem('adaptive_token', accessToken);
    setToken(accessToken);
    await fetchPreferences();
    return res.data;
  };

  const signup = async (email, password) => {
    const res = await api.post('/auth/signup', { email, password });
    const accessToken = res.data.access_token;
    localStorage.setItem('adaptive_token', accessToken);
    setToken(accessToken);
    await fetchPreferences();
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('adaptive_token');
    setToken(null);
    setUser(null);
    setPreferences(null);
  };

  const refreshPreferences = async () => {
    await fetchPreferences();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        preferences,
        setPreferences,
        refreshPreferences,
        login,
        signup,
        logout,
        bypassLogin,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
