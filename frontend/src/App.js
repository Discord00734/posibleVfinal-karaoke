import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLogin from "./components/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./components/admin/Dashboard";
import Inscripciones from "./components/admin/Inscripciones";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configurar axios
axios.defaults.baseURL = BACKEND_URL;

// Componente de Landing Page original
function LandingPage() {
  const [estadisticas, setEstadisticas] = React.useState({
    total_inscritos: 0,
    total_municipios: 0,
    total_votos: 0
  });
  const [formularioVisible, setFormularioVisible] = React.useState(false);
  const [inscripcion, setInscripcion] = React.useState({
    nombre_completo: '',
    nombre_artistico: '',
    telefono: '',
    correo: '',
    categoria: 'KOE SAN',
    municipio: '',
    sede: ''
  });
  const [enviando, setEnviando] = React.useState(false);
  const [mensaje, setMensaje] = React.useState('');

  // Cargar estadísticas al iniciar
  React.useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const response = await axios.get(`${API}/estadisticas`);
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const manejarCambioFormulario = (e) => {
    setInscripcion({
      ...inscripcion,
      [e.target.name]: e.target.value
    });
  };

  const enviarInscripcion = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje('');

    try {
      await axios.post(`${API}/inscripciones`, inscripcion);
      setMensaje('¡Inscripción exitosa! Revisa tu correo para más información.');
      setInscripcion({
        nombre_completo: '',
        nombre_artistico: '',
        telefono: '',
        correo: '',
        categoria: 'KOE SAN',
        municipio: '',
        sede: ''
      });
      setFormularioVisible(false);
      cargarEstadisticas(); // Actualizar estadísticas
    } catch (error) {
      setMensaje('Error al enviar inscripción. Por favor intenta nuevamente.');
      console.error('Error:', error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="App">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="logo-container">
              {/* Espacio reservado para logo oficial - se agregará después */}
              <div className="official-logo-placeholder">
                <div className="logo-upload-area">
                  <div className="logo-placeholder-icon">🎤</div>
                  <p className="logo-placeholder-text">LOGO OFICIAL</p>
                  <p className="logo-placeholder-subtitle">Karaoke Sensō</p>
                </div>
                <img 
                  src="/logo-senso.png" 
                  alt="Karaoke Sensō Logo Oficial"
                  className="official-logo"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.querySelector('.logo-upload-area').style.display = 'flex';
                  }}
                />
              </div>
              <h1 className="hero-title">KARAOKE SENSŌ</h1>
              <p className="hero-subtitle">戦争</p>
            </div>
            <h2 className="hero-slogan">
              "Una declaración de guerra contra todo aquello que nos deshumaniza."
            </h2>
            <button 
              className="btn-inscribirse"
              onClick={() => setFormularioVisible(!formularioVisible)}
            >
              INSCRÍBETE AHORA
            </button>
          </div>
        </div>
      </section>

      {/* Qué es Karaoke Sensō */}
      <section className="que-es-senso">
        <div className="container">
          <div className="senso-content">
            <h2 className="section-title">¿QUÉ ES KARAOKE SENSŌ?</h2>
            <div className="manifiesto">
              <div className="frase-principal">
                <h3>"TU VOZ ES EL ARMA"</h3>
              </div>
              <div className="descripcion">
                <p>
                  Karaoke Sensō no es solo una competencia, es un <strong>campo de batalla emocional</strong> 
                  donde cada participante lucha por su lugar en la historia del entretenimiento.
                </p>
                <p>
                  Una experiencia que trasciende el simple acto de cantar, transformándose en una 
                  declaración de identidad, resistencia y pasión por la música.
                </p>
              </div>
              <div className="caracteristicas">
                <div className="caracteristica">
                  <h4>CAMPO DE BATALLA</h4>
                  <p>Cada escenario es un territorio a conquistar</p>
                </div>
                <div className="caracteristica">
                  <h4>TU VOZ ES EL ARMA</h4>
                  <p>La herramienta más poderosa para la victoria</p>
                </div>
                <div className="caracteristica">
                  <h4>GUERRA EMOCIONAL</h4>
                  <p>Conecta con la audiencia a nivel profundo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías y Rondas */}
      <section className="categorias-rondas">
        <div className="container">
          <h2 className="section-title">CATEGORÍAS DE GUERREROS</h2>
          <div className="categorias-grid">
            <div className="categoria-card">
              <div className="categoria-icon">🎤</div>
              <h3>KOE SAN</h3>
              <p>Inscritos - Los valientes que dan el primer paso</p>
              <div className="categoria-detalle">Participantes registrados en el sistema</div>
            </div>
            <div className="categoria-card">
              <div className="categoria-icon">🏆</div>
              <h3>KOE SAI</h3>
              <p>Ganadores de sede - Los conquistadores locales</p>
              <div className="categoria-detalle">Victoriosos en sus territorios</div>
            </div>
            <div className="categoria-card">
              <div className="categoria-icon">👑</div>
              <h3>TSUKAMU KOE</h3>
              <p>Ganador de ciudad - El emperador vocal</p>
              <div className="categoria-detalle">El máximo nivel alcanzable</div>
            </div>
          </div>

          <h3 className="rondas-title">RONDAS DE BATALLA</h3>
          <div className="rondas-list">
            <div className="ronda-item">
              <span className="ronda-badge">01</span>
              <span>Ronda Oficial - Clasificatorias locales</span>
            </div>
            <div className="ronda-item">
              <span className="ronda-badge">02</span>
              <span>Intersección - Enfrentamientos zonales</span>
            </div>
            <div className="ronda-item">
              <span className="ronda-badge">03</span>
              <span>Interciudad - Batalla entre ciudades</span>
            </div>
            <div className="ronda-item">
              <span className="ronda-badge">04</span>
              <span>Interestatal - Guerra estatal</span>
            </div>
            <div className="ronda-item">
              <span className="ronda-badge">05</span>
              <span>Internacional - La guerra final</span>
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas en tiempo real */}
      <section className="estadisticas">
        <div className="container">
          <h2 className="section-title">ESTADO DE LA GUERRA</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{estadisticas.total_inscritos}</div>
              <div className="stat-label">GUERREROS INSCRITOS</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{estadisticas.total_municipios}</div>
              <div className="stat-label">TERRITORIOS ACTIVOS</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{estadisticas.total_votos}</div>
              <div className="stat-label">VOTOS REGISTRADOS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de Inscripción */}
      {formularioVisible && (
        <section className="inscripcion-overlay">
          <div className="inscripcion-modal">
            <div className="modal-header">
              <h2>ÚNETE A LA GUERRA</h2>
              <button 
                className="btn-cerrar"
                onClick={() => setFormularioVisible(false)}
              >
                ✕
              </button>
            </div>
            
            {mensaje && (
              <div className={`mensaje ${mensaje.includes('exitosa') ? 'exito' : 'error'}`}>
                {mensaje}
              </div>
            )}

            <form onSubmit={enviarInscripcion} className="inscripcion-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input
                    type="text"
                    name="nombre_completo"
                    value={inscripcion.nombre_completo}
                    onChange={manejarCambioFormulario}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nombre Artístico *</label>
                  <input
                    type="text"
                    name="nombre_artistico"
                    value={inscripcion.nombre_artistico}
                    onChange={manejarCambioFormulario}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={inscripcion.telefono}
                    onChange={manejarCambioFormulario}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    name="correo"
                    value={inscripcion.correo}
                    onChange={manejarCambioFormulario}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Categoría *</label>
                  <select
                    name="categoria"
                    value={inscripcion.categoria}
                    onChange={manejarCambioFormulario}
                    required
                  >
                    <option value="KOE SAN">KOE SAN (Inscrito)</option>
                    <option value="KOE SAI">KOE SAI (Ganador de sede)</option>
                    <option value="TSUKAMU KOE">TSUKAMU KOE (Ganador de ciudad)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Municipio *</label>
                  <input
                    type="text"
                    name="municipio"
                    value={inscripcion.municipio}
                    onChange={manejarCambioFormulario}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Sede *</label>
                <input
                  type="text"
                  name="sede"
                  value={inscripcion.sede}
                  onChange={manejarCambioFormulario}
                  required
                />
              </div>

              <div className="costo-info">
                <p><strong>Costo de inscripción: $300 MXN</strong></p>
                <p>Incluye participación en todas las rondas clasificatorias y acceso al sistema de votación.</p>
              </div>

              <button 
                type="submit" 
                className="btn-enviar-inscripcion"
                disabled={enviando}
              >
                {enviando ? 'ENVIANDO...' : 'CONFIRMAR INSCRIPCIÓN'}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Slider de Marcas */}
      <section className="marcas-slider">
        <div className="container">
          <h2 className="section-title">ALIADOS EN LA GUERRA</h2>
          <div className="marcas-container">
            <a href="#" className="marca-item" data-marca="pva">
              <div className="marca-logo-container">
                <div className="logo-upload-area">
                  <div className="logo-placeholder-icon">🏢</div>
                  <p className="logo-placeholder-mini">LOGO</p>
                </div>
                <img 
                  src="/logos/pva-logo.png" 
                  alt="PVA Logo"
                  className="marca-logo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.querySelector('.logo-upload-area').style.display = 'flex';
                  }}
                />
                <div className="marca-logo-text">PVA</div>
              </div>
              <div className="marca-name">PVA</div>
              <p className="marca-description">Aliado estratégico</p>
            </a>
            
            <a href="#" className="marca-item" data-marca="impactos-digitales">
              <div className="marca-logo-container">
                <div className="logo-upload-area">
                  <div className="logo-placeholder-icon">💻</div>
                  <p className="logo-placeholder-mini">LOGO</p>
                </div>
                <img 
                  src="/logos/impactos-digitales-logo.png" 
                  alt="Impactos Digitales Logo"
                  className="marca-logo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.querySelector('.logo-upload-area').style.display = 'flex';
                  }}
                />
                <div className="marca-logo-text">IMPACTOS DIGITALES</div>
              </div>
              <div className="marca-name">IMPACTOS DIGITALES</div>
              <p className="marca-description">Partner digital</p>
            </a>
            
            <a href="#" className="marca-item" data-marca="club-leones">
              <div className="marca-logo-container">
                <div className="logo-upload-area">
                  <div className="logo-placeholder-icon">🦁</div>
                  <p className="logo-placeholder-mini">LOGO</p>
                </div>
                <img 
                  src="/logos/club-leones-logo.png" 
                  alt="Club de Leones Logo"
                  className="marca-logo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.querySelector('.logo-upload-area').style.display = 'flex';
                  }}
                />
                <div className="marca-logo-text">CLUB DE LEONES</div>
              </div>
              <div className="marca-name">CLUB DE LEONES</div>
              <p className="marca-description">Organización social</p>
            </a>
            
            <a href="#" className="marca-item" data-marca="radio-uaq">
              <div className="marca-logo-container">
                <div className="logo-upload-area">
                  <div className="logo-placeholder-icon">📻</div>
                  <p className="logo-placeholder-mini">LOGO</p>
                </div>
                <img 
                  src="/logos/radio-uaq-logo.png" 
                  alt="Radio UAQ Logo"
                  className="marca-logo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.querySelector('.logo-upload-area').style.display = 'flex';
                  }}
                />
                <div className="marca-logo-text">RADIO UAQ</div>
              </div>
              <div className="marca-name">RADIO UAQ</div>
              <p className="marca-description">Media partner</p>
            </a>
            
            <a href="#" className="marca-item" data-marca="cij">
              <div className="marca-logo-container">
                <div className="logo-upload-area">
                  <div className="logo-placeholder-icon">🏛️</div>
                  <p className="logo-placeholder-mini">LOGO</p>
                </div>
                <img 
                  src="/logos/cij-logo.png" 
                  alt="CIJ Logo"
                  className="marca-logo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.querySelector('.logo-upload-area').style.display = 'flex';
                  }}
                />
                <div className="marca-logo-text">CIJ</div>
              </div>
              <div className="marca-name">CIJ</div>
              <p className="marca-description">Instituto colaborador</p>
            </a>
          </div>
        </div>
      </section>

      {/* Subida de Video */}
      <section className="subida-video">
        <div className="container">
          <div className="video-content">
            <h2 className="section-title">HAZ QUE TU VOZ SE ESCUCHE</h2>
            <p className="video-descripcion">
              Sube tu video de combate y demuestra por qué mereces ser el próximo KOE SAI
            </p>
            <div className="video-info">
              <p>🎥 Formato: MP4, AVI, MOV</p>
              <p>📏 Tamaño máximo: 50MB</p>
              <p>⏱️ Duración recomendada: 3-5 minutos</p>
            </div>
            <button className="btn-subir-video">
              SUBIR VIDEO DE GUERRA
            </button>
          </div>
        </div>
      </section>

      {/* Ubicación / Mapa */}
      <section className="ubicacion">
        <div className="container">
          <h2 className="section-title">TERRITORIOS DE BATALLA</h2>
          <div className="mapa-container">
            <div className="mapa-placeholder">
              <p>🗺️ Mapa interactivo de sedes</p>
              <p>En desarrollo - Se integrará Google Maps</p>
            </div>
            <div className="sedes-info">
              <h3>Próximas Batallas</h3>
              <div className="sede-item">
                <div className="sede-fecha">15 ENE</div>
                <div className="sede-detalle">
                  <h4>Centro Cultural - Querétaro</h4>
                  <p>Ronda clasificatoria zona centro</p>
                </div>
              </div>
              <div className="sede-item">
                <div className="sede-fecha">22 ENE</div>
                <div className="sede-detalle">
                  <h4>Auditorio Municipal - León</h4>
                  <p>Intersección regional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="contacto">
        <div className="container">
          <h2 className="section-title">CENTRO DE COMANDO</h2>
          <div className="contacto-grid">
            <div className="contacto-item">
              <div className="contacto-icon">📱</div>
              <h3>WhatsApp</h3>
              <a href="https://wa.me/524421079651" target="_blank" rel="noopener noreferrer">
                442 107 9651
              </a>
            </div>
            <div className="contacto-item">
              <div className="contacto-icon">✉️</div>
              <h3>Correo</h3>
              <a href="mailto:karaokesenso@gmail.com">
                karaokesenso@gmail.com
              </a>
            </div>
            <div className="contacto-item">
              <div className="contacto-icon">🌐</div>
              <h3>Redes Sociales</h3>
              <div className="redes-sociales">
                <a href="https://facebook.com/karaokesenso" target="_blank" rel="noopener noreferrer" className="red-social facebook">
                  <svg className="red-social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>
                <a href="https://instagram.com/karaokesenso" target="_blank" rel="noopener noreferrer" className="red-social instagram">
                  <svg className="red-social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </a>
                <a href="https://tiktok.com/@karaokesenso" target="_blank" rel="noopener noreferrer" className="red-social tiktok">
                  <svg className="red-social-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <span>TikTok</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <h3>KARAOKE SENSŌ</h3>
              <p>"La guerra que unirá a México a través de la música"</p>
            </div>
            <div className="footer-info">
              <p>&copy; 2025 Karaoke Sensō. Todos los derechos reservados.</p>
              <p>Sistema desarrollado para la competencia más grande de México</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Componente principal con router
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Ruta pública - Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Rutas de administración */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Panel de administración protegido */}
          <Route 
            path="/admin/panel" 
            element={
              <ProtectedRoute requiredRole="jurado">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard por defecto */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inscripciones" element={<Inscripciones />} />
            
            {/* Placeholder routes - se implementarán después */}
            <Route path="sedes" element={<div className="text-white text-center p-8">Gestión de Sedes - En desarrollo</div>} />
            <Route path="rondas" element={<div className="text-white text-center p-8">Gestión de Rondas - En desarrollo</div>} />
            <Route path="resultados" element={<div className="text-white text-center p-8">Carga de Resultados - En desarrollo</div>} />
            <Route path="videos" element={<div className="text-white text-center p-8">Control de Videos - En desarrollo</div>} />
            <Route path="reportes" element={<div className="text-white text-center p-8">Reportes y Estadísticas - En desarrollo</div>} />
          </Route>
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;