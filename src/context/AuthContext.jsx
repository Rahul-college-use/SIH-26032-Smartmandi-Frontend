import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';
import api from '../api/api';
import { socket } from '../api/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // 1. Initial LocalStorage Restoration
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      }
    } catch (err) {
      console.error('Failed to parse auth data from localStorage', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Axios Request & Response Interceptors (Production Standard)
  useLayoutEffect(() => {
    // Request Interceptor: Har request me fresh token attach karein
    const reqInterceptor = api.interceptors.request.use((config) => {
      const currentToken = token || localStorage.getItem('token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    });

    // Response Interceptor: Token expire (401 Unauthorized) hone par auto-logout
    const resInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expire ya invalid ho gaya
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqInterceptor);
      api.interceptors.response.eject(resInterceptor);
    };
  }, [token]);

  // 3. Login Handler
  const login = (authToken, userData) => {
    try {
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);

      // Socket room connect / auth emit
      if (socket && socket.connected) {
        socket.auth = { token: authToken };
      }
    } catch (err) {
      console.error('Failed to save auth state', err);
    }
  };

  // 4. Logout Handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);

    // Socket disconnect/reconnect safely
    if (socket && socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  };

  // 5. Safe Profile Update
  const updateUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...updatedData };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        role: user?.role || null,
        login,
        logout,
        updateUser
      }}
    >
      {loading ? (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-500">Loading SmartMandi...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};