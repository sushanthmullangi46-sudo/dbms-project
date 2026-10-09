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
          if (res) {
            const userData = {
              userId: res.user_id || res.userId || res.user?.id,
              fullName: res.full_name || res.fullName || res.user?.fullName,
              email: res.email || res.user?.email,
              roleName: res.role || res.roleName || res.user?.roleName,
              role: res.role || res.roleName || res.user?.roleName,
              phone: res.phone || res.user?.phone
            };
            setUser(userData);
            localStorage.setItem('udr_user', JSON.stringify(userData));
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
    const token = res.access_token || res.token;
    if (token) {
      const userData = {
        userId: res.user_id || res.userId || res.user?.id || 1,
        fullName: res.full_name || res.fullName || res.user?.fullName || email.split('@')[0],
        email: res.email || res.user?.email || email,
        roleName: res.role || res.roleName || res.user?.roleName || 'DISASTER_OFFICER',
        role: res.role || res.roleName || res.user?.roleName || 'DISASTER_OFFICER'
      };
      localStorage.setItem('udr_token', token);
      localStorage.setItem('udr_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error(res.detail || res.message || 'Authentication failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const token = res.access_token || res.token;
    if (token) {
      const registeredUser = {
        userId: res.user_id || 1,
        fullName: res.full_name,
        email: res.email,
        roleName: res.role,
        role: res.role
      };
      localStorage.setItem('udr_token', token);
      localStorage.setItem('udr_user', JSON.stringify(registeredUser));
      setUser(registeredUser);
      return registeredUser;
    }
    return res;
  };

  const logout = async () => {
    localStorage.removeItem('udr_token');
    localStorage.removeItem('udr_user');
    setUser(null);
    window.location.hash = '#/login';
  };

  const isCitizen = user?.roleName === 'CITIZEN';
  const isOfficer = user?.roleName === 'DISASTER_OFFICER' || user?.roleName === 'COMMAND_CENTER';
  const isCoordinator = user?.roleName === 'COORDINATOR' || user?.roleName === 'RESOURCE_PROVIDER';
  const isResponder = user?.roleName === 'FIELD_RESPONDER';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isCitizen,
      isOfficer,
      isCoordinator,
      isResponder,
      isCommandCenter: isOfficer,
      isProvider: isCoordinator
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
