import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

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

  const logout = () => {
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
