import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  MapPin, 
  Trophy, 
  BarChart3, 
  Video, 
  LogOut, 
  Menu, 
  X,
  Crown,
  Settings,
  FileText
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    {
      title: 'Inscripciones',
      icon: Users,
      path: '/admin/panel/inscripciones',
      description: 'Gestionar participantes'
    },
    {
      title: 'Sedes',
      icon: MapPin,
      path: '/admin/panel/sedes',
      description: 'Control de ubicaciones'
    },
    {
      title: 'Rondas',
      icon: Trophy,
      path: '/admin/panel/rondas',
      description: 'Gestión de competencias'
    },
    {
      title: 'Resultados',
      icon: FileText,
      path: '/admin/panel/resultados',
      description: 'Cargar calificaciones'
    },
    {
      title: 'Videos',
      icon: Video,
      path: '/admin/panel/videos',
      description: 'Revisión de contenido'
    },
    {
      title: 'Reportes',
      icon: BarChart3,
      path: '/admin/panel/reportes',
      description: 'Estadísticas y análisis'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-black border-b border-yellow-400/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden mr-3 p-2 rounded-lg hover:bg-yellow-400/10 transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-yellow-400 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-yellow-400">KARAOKE SENSŌ</h1>
                <p className="text-sm text-gray-400">Panel de Administración</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.nombre}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.rol}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 fixed md:static inset-y-0 left-0 z-50
          w-64 bg-gradient-to-b from-gray-900 to-black border-r border-yellow-400/20
          transition-transform duration-300 ease-in-out
        `}>
          <nav className="p-4 space-y-2 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center p-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 text-yellow-400' 
                      : 'hover:bg-yellow-400/10 text-gray-300 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs opacity-70">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;