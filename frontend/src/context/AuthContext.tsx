import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import api from '../api/client';

export interface User {
  email: string;
  name: string;
  picture?: string;
}

export interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  login: (jwtToken: string, refreshToken: string) => void;
  logout: () => void;
  updateToken: (newToken: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('refresh_token'));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('jwt_token', token);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      try {
        const payload = jwtDecode<any>(token);
        setUser({
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        });
      } catch (e) {
        console.error("Invalid token format");
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
      }
    } else {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, [token, refreshToken]);

  const login = (jwtToken: string, rToken: string) => {
    setRefreshToken(rToken);
    setToken(jwtToken);
  };

  const updateToken = (newToken: string) => {
    setToken(newToken);
  };

  const logout = async () => {

    if (refreshToken) {
      // Opcional: avisar al backend
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      }).catch(() => {});
    }
    googleLogout();
    setToken(null);
    setRefreshToken(null);

    // Save custom theme, clear local storage to prevent data leaks between accounts, and reload
    const theme = localStorage.getItem('ascension_custom_color');
    localStorage.clear();
    if (theme) localStorage.setItem('ascension_custom_color', theme);
    
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ token, refreshToken, user, login, logout, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
