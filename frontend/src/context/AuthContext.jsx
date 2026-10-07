import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('udr_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('udr_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('udr_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('udr_token');
          localStorage.removeItem('udr_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.token) {
      localStorage.setItem('udr_token', res.token);
      localStorage.setItem('udr_user', JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Authentication failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('udr_token');
      localStorage.removeItem('udr_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isCommandCenter = user?.roleName === 'COMMAND_CENTER';
  const isResponder = user?.roleName === 'FIELD_RESPONDER';
  const isProvider = user?.roleName === 'RESOURCE_PROVIDER';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isCommandCenter,
      isResponder,
      isProvider
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
