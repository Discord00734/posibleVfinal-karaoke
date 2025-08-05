from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Decimal, Enum, ForeignKey, JSON
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum
from datetime import datetime
from typing import Optional

# Enums para los campos
class RolUsuario(str, enum.Enum):
    admin = "admin"
    jurado = "jurado"
    participante = "participante"

class EstatusInscripcion(str, enum.Enum):
    pendiente = "pendiente"
    aprobado = "aprobado"
    rechazado = "rechazado"

class CategoriaParticipante(str, enum.Enum):
    KOE_SAN = "KOE SAN"
    KOE_SAI = "KOE SAI"
    TSUKAMU_KOE = "TSUKAMU KOE"

class TipoRonda(str, enum.Enum):
    clasificatoria = "clasificatoria"
    interseccion = "interseccion"
    interciudad = "interciudad"
    interestatal = "interestatal"
    internacional = "internacional"

# Modelo de Usuarios
class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    correo = Column(String(255), unique=True, nullable=False, index=True)
    rol = Column(Enum(RolUsuario), nullable=False, default=RolUsuario.participante)
    contraseña = Column(String(255), nullable=False)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# Modelo de Sedes
class Sede(Base):
    __tablename__ = "sedes"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre_sede = Column(String(255), nullable=False)
    estado = Column(String(100), nullable=False)
    municipio = Column(String(100), nullable=False)
    direccion = Column(Text)
    responsable = Column(String(255))
    telefono = Column(String(20))
    correo = Column(String(255))
    capacidad = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    inscripciones = relationship("Inscripcion", back_populates="sede_obj")
    rondas = relationship("Ronda", back_populates="sede")

# Modelo de Inscripciones
class Inscripcion(Base):
    __tablename__ = "inscripciones"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    nombre_completo = Column(String(255), nullable=False)
    nombre_artistico = Column(String(255), nullable=False)
    telefono = Column(String(20), nullable=False)
    correo = Column(String(255))
    categoria = Column(Enum(CategoriaParticipante), nullable=False, default=CategoriaParticipante.KOE_SAN)
    municipio = Column(String(100), nullable=False)
    sede_id = Column(Integer, ForeignKey("sedes.id"), nullable=True)
    sede = Column(String(255))  # Campo temporal para migración
    estatus = Column(Enum(EstatusInscripcion), nullable=False, default=EstatusInscripcion.pendiente)
    fecha_inscripcion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    observaciones = Column(Text)
    comprobante_pago = Column(LONGTEXT)  # Base64
    
    # Relaciones
    sede_obj = relationship("Sede", back_populates="inscripciones")
    resultados = relationship("Resultado", back_populates="inscrito")
    videos = relationship("Video", back_populates="inscrito")

# Modelo de Rondas
class Ronda(Base):
    __tablename__ = "rondas"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    fecha = Column(DateTime(timezone=True), nullable=False)
    sede_id = Column(Integer, ForeignKey("sedes.id"), nullable=False)
    tipo = Column(Enum(TipoRonda), nullable=False)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    sede = relationship("Sede", back_populates="rondas")
    resultados = relationship("Resultado", back_populates="ronda")

# Modelo de Resultados
class Resultado(Base):
    __tablename__ = "resultados"
    
    id = Column(Integer, primary_key=True, index=True)
    inscrito_id = Column(String(36), ForeignKey("inscripciones.id"), nullable=False)
    ronda_id = Column(Integer, ForeignKey("rondas.id"), nullable=False)
    puntaje = Column(Decimal(5, 2), default=0.00)
    posicion = Column(Integer)
    clasificado = Column(Boolean, default=False)
    observaciones = Column(Text)
    fecha_evaluacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relaciones
    inscrito = relationship("Inscripcion", back_populates="resultados")
    ronda = relationship("Ronda", back_populates="resultados")

# Modelo de Videos
class Video(Base):
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    inscrito_id = Column(String(36), ForeignKey("inscripciones.id"), nullable=False)
    titulo = Column(String(255))
    descripcion = Column(Text)
    url_video = Column(String(500))
    video_data = Column(LONGTEXT)  # Base64
    duracion = Column(Integer)  # segundos
    formato = Column(String(10))
    tamaño_mb = Column(Decimal(8, 2))
    aprobado = Column(Boolean, default=False)
    destacado = Column(Boolean, default=False)
    fecha_subida = Column(DateTime(timezone=True), server_default=func.now())
    fecha_revision = Column(DateTime(timezone=True))
    observaciones = Column(Text)
    
    # Relaciones
    inscrito = relationship("Inscripcion", back_populates="videos")

# Modelo de Eventos del Sistema (para auditoría)
class EventoSistema(Base):
    __tablename__ = "eventos_sistema"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    accion = Column(String(255), nullable=False)
    tabla_afectada = Column(String(100))
    registro_id = Column(String(36))
    datos_anteriores = Column(JSON)
    datos_nuevos = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    fecha_evento = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    usuario = relationship("Usuario")