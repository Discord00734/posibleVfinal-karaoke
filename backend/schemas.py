from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from models import RolUsuario, EstatusInscripcion, CategoriaParticipante, TipoRonda

# Esquemas para Usuario
class UsuarioBase(BaseModel):
    nombre: str
    correo: EmailStr
    rol: RolUsuario = RolUsuario.participante
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    contraseña: str

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[EmailStr] = None
    rol: Optional[RolUsuario] = None
    activo: Optional[bool] = None
    contraseña: Optional[str] = None

class Usuario(UsuarioBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    
    class Config:
        from_attributes = True

# Esquemas para Login
class LoginRequest(BaseModel):
    correo: str
    contraseña: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Usuario

# Esquemas para Sede  
class SedeBase(BaseModel):
    nombre_sede: str
    estado: str
    municipio: str
    direccion: Optional[str] = None
    responsable: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[EmailStr] = None
    capacidad: int = 0
    activo: bool = True

class SedeCreate(SedeBase):
    pass

class SedeUpdate(BaseModel):
    nombre_sede: Optional[str] = None
    estado: Optional[str] = None
    municipio: Optional[str] = None
    direccion: Optional[str] = None
    responsable: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[EmailStr] = None
    capacidad: Optional[int] = None
    activo: Optional[bool] = None

class Sede(SedeBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    
    class Config:
        from_attributes = True

# Esquemas para Inscripción
class InscripcionBase(BaseModel):
    nombre_completo: str
    nombre_artistico: str
    telefono: str
    correo: Optional[EmailStr] = None
    categoria: CategoriaParticipante = CategoriaParticipante.KOE_SAN
    municipio: str
    sede_id: Optional[int] = None
    sede: Optional[str] = None

class InscripcionCreate(InscripcionBase):
    pass

class InscripcionUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    nombre_artistico: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[EmailStr] = None
    categoria: Optional[CategoriaParticipante] = None
    municipio: Optional[str] = None
    sede_id: Optional[int] = None
    estatus: Optional[EstatusInscripcion] = None
    observaciones: Optional[str] = None

class Inscripcion(InscripcionBase):
    id: str
    estatus: EstatusInscripcion
    fecha_inscripcion: datetime
    fecha_actualizacion: datetime
    observaciones: Optional[str] = None
    sede_obj: Optional[Sede] = None
    
    class Config:
        from_attributes = True

# Esquemas para Ronda
class RondaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    fecha: datetime
    sede_id: int
    tipo: TipoRonda
    activo: bool = True

class RondaCreate(RondaBase):
    pass

class RondaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fecha: Optional[datetime] = None
    sede_id: Optional[int] = None
    tipo: Optional[TipoRonda] = None
    activo: Optional[bool] = None

class Ronda(RondaBase):
    id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    sede: Optional[Sede] = None
    
    class Config:
        from_attributes = True

# Esquemas para Resultado
class ResultadoBase(BaseModel):
    inscrito_id: str
    ronda_id: int
    puntaje: Decimal = Decimal("0.00")
    posicion: Optional[int] = None
    clasificado: bool = False
    observaciones: Optional[str] = None

class ResultadoCreate(ResultadoBase):
    pass

class ResultadoUpdate(BaseModel):
    puntaje: Optional[Decimal] = None
    posicion: Optional[int] = None
    clasificado: Optional[bool] = None
    observaciones: Optional[str] = None

class Resultado(ResultadoBase):
    id: int
    fecha_evaluacion: datetime
    fecha_actualizacion: datetime
    inscrito: Optional[Inscripcion] = None
    ronda: Optional[Ronda] = None
    
    class Config:
        from_attributes = True

# Esquemas para Video
class VideoBase(BaseModel):
    inscrito_id: str
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    url_video: Optional[str] = None
    duracion: Optional[int] = None
    formato: Optional[str] = None
    tamaño_mb: Optional[Decimal] = None

class VideoCreate(VideoBase):
    video_data: Optional[str] = None  # Base64

class VideoUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    aprobado: Optional[bool] = None
    destacado: Optional[bool] = None
    observaciones: Optional[str] = None

class Video(VideoBase):
    id: int
    aprobado: bool
    destacado: bool
    fecha_subida: datetime
    fecha_revision: Optional[datetime] = None
    observaciones: Optional[str] = None
    inscrito: Optional[Inscripcion] = None
    
    class Config:
        from_attributes = True

# Esquemas para Estadísticas
class EstadisticasResponse(BaseModel):
    total_inscritos: int
    total_sedes: int
    total_rondas: int
    inscritos_pendientes: int
    inscritos_aprobados: int
    inscritos_rechazados: int
    videos_subidos: int
    videos_aprobados: int
    inscritos_por_categoria: dict
    inscritos_por_sede: dict
    inscritos_por_municipio: dict