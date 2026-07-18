import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('adaptive_token') || null);
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchPreferences();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/preferences');
      setPreferences(res.data);
      setUser({ id: res.data.user_id });
    } catch (err) {
      console.error('Failed to load user preferences', err);
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken) => {
    localStorage.setItem('adaptive_token', newToken);
    setToken(newToken);
    fetchPreferences();
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
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
