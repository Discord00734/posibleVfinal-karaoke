import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configurar axios con el token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verificar token al cargar
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Aquí podrías hacer una llamada para verificar el token
          // Por ahora simplemente marcamos como autenticado si hay token
          const userData = JSON.parse(localStorage.getItem('user') || 'null');
          if (userData) {
            setUser(userData);
          }
        } catch (error) {
          console.error('Error verificando autenticación:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (correo, contraseña) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/auth/login`,
        { correo, contraseña }
      );

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Error de autenticación'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAdmin = () => {
    return user?.rol === 'admin';
  };

  const isJurado = () => {
    return user?.rol === 'jurado';
  };

  const canAccess = (requiredRole) => {
    if (!user) return false;
    if (requiredRole === 'admin') return user.rol === 'admin';
    if (requiredRole === 'jurado') return ['admin', 'jurado'].includes(user.rol);
    return true;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin,
    isJurado,
    canAccess,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};