-- Crear base de datos para Karaoke Sensō
CREATE DATABASE IF NOT EXISTS karaoke_senso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE karaoke_senso;

-- Tabla de usuarios (administradores, jurados, participantes)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    rol ENUM('admin', 'jurado', 'participante') NOT NULL DEFAULT 'participante',
    contraseña VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de sedes
CREATE TABLE sedes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_sede VARCHAR(255) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    direccion TEXT,
    responsable VARCHAR(255),
    telefono VARCHAR(20),
    correo VARCHAR(255),
    capacidad INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de inscripciones (migración de MongoDB)  
CREATE TABLE inscripciones (
    id VARCHAR(36) PRIMARY KEY, -- UUID para compatibilidad
    nombre_completo VARCHAR(255) NOT NULL,
    nombre_artistico VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    correo VARCHAR(255),
    categoria ENUM('KOE SAN', 'KOE SAI', 'TSUKAMU KOE') NOT NULL DEFAULT 'KOE SAN',
    municipio VARCHAR(100) NOT NULL,
    sede_id INT,
    sede VARCHAR(255), -- Campo temporal para migración
    estatus ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    observaciones TEXT,
    comprobante_pago TEXT, -- Base64 del comprobante
    FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL
);

-- Tabla de rondas/eventos
CREATE TABLE rondas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    sede_id INT NOT NULL,
    tipo ENUM('clasificatoria', 'interseccion', 'interciudad', 'interestatal', 'internacional') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE
);

-- Tabla de resultados por ronda
CREATE TABLE resultados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscrito_id VARCHAR(36) NOT NULL,
    ronda_id INT NOT NULL,
    puntaje DECIMAL(5,2) DEFAULT 0.00,
    posicion INT,
    clasificado BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inscrito_id) REFERENCES inscripciones(id) ON DELETE CASCADE,
    FOREIGN KEY (ronda_id) REFERENCES rondas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_inscrito_ronda (inscrito_id, ronda_id)
);

-- Tabla de videos subidos
CREATE TABLE videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscrito_id VARCHAR(36) NOT NULL,
    titulo VARCHAR(255),
    descripcion TEXT,
    url_video VARCHAR(500),
    video_data LONGTEXT, -- Base64 del video si se sube directamente
    duracion INT, -- Duración en segundos
    formato VARCHAR(10), -- mp4, avi, mov
    tamaño_mb DECIMAL(8,2),
    aprobado BOOLEAN DEFAULT FALSE,
    destacado BOOLEAN DEFAULT FALSE,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_revision TIMESTAMP NULL,
    observaciones TEXT,
    FOREIGN KEY (inscrito_id) REFERENCES inscripciones(id) ON DELETE CASCADE
);

-- Tabla de eventos/logs del sistema
CREATE TABLE eventos_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    accion VARCHAR(255) NOT NULL,
    tabla_afectada VARCHAR(100),
    registro_id VARCHAR(36),
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, correo, rol, contraseña) VALUES 
('Administrador', 'admin@karaokesenso.com', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewGwUQKPjOtP7j.O'); -- admin123

-- Insertar algunas sedes de ejemplo
INSERT INTO sedes (nombre_sede, estado, municipio, direccion, responsable, telefono) VALUES 
('Centro Cultural Querétaro', 'Querétaro', 'Querétaro', 'Centro Histórico, Querétaro', 'Juan Pérez', '442-123-4567'),
('Auditorio Municipal León', 'Guanajuato', 'León', 'Centro de León, Gto', 'María García', '477-123-4567'),
('Teatro Morelos', 'Michoacán', 'Morelia', 'Centro Histórico Morelia', 'Carlos López', '443-123-4567');

-- Crear índices para optimizar consultas
CREATE INDEX idx_inscripciones_estatus ON inscripciones(estatus);
CREATE INDEX idx_inscripciones_categoria ON inscripciones(categoria);
CREATE INDEX idx_inscripciones_sede ON inscripciones(sede_id);
CREATE INDEX idx_inscripciones_fecha ON inscripciones(fecha_inscripcion);
CREATE INDEX idx_resultados_ronda ON resultados(ronda_id);
CREATE INDEX idx_resultados_inscrito ON resultados(inscrito_id);
CREATE INDEX idx_videos_aprobado ON videos(aprobado);
CREATE INDEX idx_videos_destacado ON videos(destacado);
CREATE INDEX idx_eventos_fecha ON eventos_sistema(fecha_evento);