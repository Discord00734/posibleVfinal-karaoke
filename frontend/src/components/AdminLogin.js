import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, Eye, EyeOff, Crown } from 'lucide-react';

const AdminLogin = () => {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Redireccionar si ya está autenticado
  if (isAuthenticated) {
    return <Navigate to="/admin/panel" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(correo, contraseña);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 animate-pulse"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-yellow-400/20 p-8">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
              <Crown className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">KARAOKE SENSŌ</h1>
            <p className="text-gray-300 text-sm">Panel de Administración</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Campo de correo */}
            <div className="relative">
              <label htmlFor="correo" className="block text-sm font-medium text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="admin@karaokesenso.com"
                  required
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div className="relative">
              <label htmlFor="contraseña" className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  Accediendo...
                </div>
              ) : (
                'Acceder al Panel'
              )}
            </button>
          </form>

          {/* Info de demo */}
          <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
            <p className="text-yellow-400 text-xs font-medium mb-1">Credenciales de Demo:</p>
            <p className="text-gray-300 text-xs">admin@karaokesenso.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;