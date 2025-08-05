import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  MapPin, 
  Trophy, 
  Video, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const fetchEstadisticas = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/estadisticas`);
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error fetching estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Inscritos',
      value: estadisticas?.total_inscritos || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%'
    },
    {
      title: 'Sedes Activas',
      value: estadisticas?.total_sedes || 0,
      icon: MapPin,
      color: 'from-green-500 to-green-600',
      change: '+3%'
    },
    {
      title: 'Rondas Programadas',
      value: estadisticas?.total_rondas || 0,
      icon: Trophy,
      color: 'from-yellow-500 to-yellow-600',
      change: '+8%'
    },
    {
      title: 'Videos Subidos',
      value: estadisticas?.videos_subidos || 0,
      icon: Video,
      color: 'from-purple-500 to-purple-600',
      change: '+25%'
    }
  ];

  const statusCards = [
    {
      title: 'Pendientes',
      value: estadisticas?.inscritos_pendientes || 0,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10 border-yellow-400/20'
    },
    {
      title: 'Aprobados',
      value: estadisticas?.inscritos_aprobados || 0,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10 border-green-400/20'
    },
    {
      title: 'Rechazados',
      value: estadisticas?.inscritos_rechazados || 0,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10 border-red-400/20'
    }
  ];

  // Preparar datos para gráficas
  const categoriaData = Object.entries(estadisticas?.inscritos_por_categoria || {}).map(([key, value]) => ({
    name: key,
    value: value
  }));

  const sedeData = Object.entries(estadisticas?.inscritos_por_sede || {}).map(([key, value]) => ({
    name: key.length > 15 ? key.substring(0, 15) + '...' : key,
    value: value
  }));

  const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#F97316'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Dashboard</h1>
          <p className="text-gray-400">Resumen general del sistema</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <TrendingUp className="w-4 h-4" />
          <span>Actualizado hace {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-green-400 text-sm mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} border p-6 rounded-xl`}>
              <div className="flex items-center">
                <Icon className={`w-8 h-8 ${stat.color} mr-4`} />
                <div>
                  <p className="text-gray-300 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inscripciones por Sede */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Inscripciones por Sede</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sedeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#FFFFFF'
                }} 
              />
              <Bar dataKey="value" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inscripciones por Categoría */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Inscripciones por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoriaData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoriaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#FFFFFF'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg p-4 transition-colors">
            <Users className="w-8 h-8 text-blue-400 mb-2" />
            <p className="font-medium text-white">Revisar Inscripciones</p>
            <p className="text-sm text-gray-400">Pendientes: {estadisticas?.inscritos_pendientes || 0}</p>
          </button>
          
          <button className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 rounded-lg p-4 transition-colors">
            <Video className="w-8 h-8 text-purple-400 mb-2" />
            <p className="font-medium text-white">Revisar Videos</p>
            <p className="text-sm text-gray-400">Sin revisar: {(estadisticas?.videos_subidos || 0) - (estadisticas?.videos_aprobados || 0)}</p>
          </button>
          
          <button className="bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 rounded-lg p-4 transition-colors">
            <Award className="w-8 h-8 text-green-400 mb-2" />
            <p className="font-medium text-white">Cargar Resultados</p>
            <p className="text-sm text-gray-400">Próximas rondas</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;