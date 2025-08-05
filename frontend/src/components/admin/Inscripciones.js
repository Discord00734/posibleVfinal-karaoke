import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar
} from 'lucide-react';

const Inscripciones = () => {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchInscripciones();
  }, [filterEstatus, filterCategoria]);

  const fetchInscripciones = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterEstatus) params.estatus = filterEstatus;
      if (filterCategoria) params.categoria = filterCategoria;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/inscripciones`, { params });
      setInscripciones(response.data);
    } catch (error) {
      console.error('Error fetching inscripciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (inscripcionId, newStatus, observaciones = '') => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/admin/inscripciones/${inscripcionId}/estatus`, {
        estatus: newStatus,
        observaciones
      });
      
      // Actualizar la lista
      fetchInscripciones();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estatus');
    }
  };

  const getStatusBadge = (estatus) => {
    const statusConfig = {
      'pendiente': { bg: 'bg-yellow-400/20', border: 'border-yellow-400/30', text: 'text-yellow-400', icon: Clock },
      'aprobado': { bg: 'bg-green-400/20', border: 'border-green-400/30', text: 'text-green-400', icon: CheckCircle },
      'rechazado': { bg: 'bg-red-400/20', border: 'border-red-400/30', text: 'text-red-400', icon: XCircle }
    };

    const config = statusConfig[estatus] || statusConfig['pendiente'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.border} ${config.text} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {estatus.charAt(0).toUpperCase() + estatus.slice(1)}
      </span>
    );
  };

  const filteredInscripciones = inscripciones.filter(inscripcion =>
    inscripcion.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inscripcion.nombre_artistico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inscripcion.telefono.includes(searchTerm) ||
    (inscripcion.correo && inscripcion.correo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">Inscripciones</h1>
          <p className="text-gray-400">Gestionar participantes del concurso</p>
        </div>
        <div className="mt-4 md:mt-0 text-sm text-gray-400">
          Total: {inscripciones.length} inscripciones
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filterEstatus}
            onChange={(e) => setFilterEstatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">Todos los estatus</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">Todas las categorías</option>
            <option value="KOE SAN">KOE SAN</option>
            <option value="KOE SAI">KOE SAI</option>
            <option value="TSUKAMU KOE">TSUKAMU KOE</option>
          </select>

          <button
            onClick={fetchInscripciones}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors font-medium"
          >
            <Filter className="w-4 h-4 inline mr-2" />
            Filtrar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Participante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Estatus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredInscripciones.map((inscripcion) => (
                <tr key={inscripcion.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{inscripcion.nombre_completo}</div>
                      <div className="text-sm text-gray-400">"{inscripcion.nombre_artistico}"</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-300">
                        <Phone className="w-3 h-3 mr-1" />
                        {inscripcion.telefono}
                      </div>
                      {inscripcion.correo && (
                        <div className="flex items-center text-sm text-gray-400">
                          <Mail className="w-3 h-3 mr-1" />
                          {inscripcion.correo}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-400/20 text-blue-400 rounded-full">
                      {inscripcion.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-300">
                      <MapPin className="w-3 h-3 mr-1" />
                      {inscripcion.municipio}
                    </div>
                    {inscripcion.sede && (
                      <div className="text-xs text-gray-400">{inscripcion.sede}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(inscripcion.estatus)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(inscripcion.fecha_inscripcion).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedInscripcion(inscripcion);
                          setShowModal(true);
                        }}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {inscripcion.estatus === 'pendiente' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(inscripcion.id, 'aprobado')}
                            className="p-1 text-green-400 hover:text-green-300 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(inscripcion.id, 'rechazado')}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedInscripcion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-yellow-400">Detalles de Inscripción</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Información personal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Completo</label>
                    <p className="text-white">{selectedInscripcion.nombre_completo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Artístico</label>
                    <p className="text-white">"{selectedInscripcion.nombre_artistico}"</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
                    <p className="text-white">{selectedInscripcion.telefono}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Correo</label>
                    <p className="text-white">{selectedInscripcion.correo || 'No proporcionado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Categoría</label>
                    <p className="text-white">{selectedInscripcion.categoria}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Municipio</label>
                    <p className="text-white">{selectedInscripcion.municipio}</p>
                  </div>
                </div>

                {/* Estatus */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Estatus Actual</label>
                  {getStatusBadge(selectedInscripcion.estatus)}
                </div>

                {/* Observaciones */}
                {selectedInscripcion.observaciones && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Observaciones</label>
                    <p className="text-white bg-gray-700 p-3 rounded-lg">{selectedInscripcion.observaciones}</p>
                  </div>
                )}

                {/* Acciones */}
                {selectedInscripcion.estatus === 'pendiente' && (
                  <div className="flex space-x-4 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleStatusChange(selectedInscripcion.id, 'aprobado', 'Aprobado desde el panel de administración')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-2" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedInscripcion.id, 'rechazado', 'Rechazado desde el panel de administración')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4 inline mr-2" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inscripciones;