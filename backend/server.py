from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime
import shutil
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models for Karaoke System
class Inscripcion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre_completo: str
    nombre_artistico: str
    telefono: str
    correo: Optional[EmailStr] = None
    categoria: str  # KOE SAN, KOE SAI, TSUKAMU KOE
    municipio: str
    sede: str
    comprobante_pago: Optional[str] = None  # base64 encoded image
    estado: str = Field(default="pendiente")  # pendiente, aprobado, rechazado
    fecha_inscripcion: datetime = Field(default_factory=datetime.utcnow)
    video_url: Optional[str] = None
    video_aprobado: bool = Field(default=False)

class InscripcionCreate(BaseModel):
    nombre_completo: str
    nombre_artistico: str
    telefono: str
    correo: Optional[EmailStr] = None
    categoria: str
    municipio: str
    sede: str

class Estadisticas(BaseModel):
    total_inscritos: int
    total_municipios: int
    total_votos: int
    inscritos_por_categoria: dict
    inscritos_por_municipio: dict

class Evento(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    lugar: str
    fecha: datetime
    sede: str
    estado: str = Field(default="abierta")  # abierta, cerrada, finalizada
    descripcion: Optional[str] = None

class EventoCreate(BaseModel):
    nombre: str
    lugar: str
    fecha: datetime
    sede: str
    descripcion: Optional[str] = None

# Karaoke System Routes
@api_router.get("/")
async def root():
    return {"message": "Karaoke Sensō API - Sistema de Competencia de Karaoke"}

# Inscripciones
@api_router.post("/inscripciones", response_model=Inscripcion)
async def crear_inscripcion(inscripcion: InscripcionCreate):
    """Crear nueva inscripción en el sistema"""
    inscripcion_dict = inscripcion.dict()
    inscripcion_obj = Inscripcion(**inscripcion_dict)
    
    # Insertar en la base de datos
    await db.inscripciones.insert_one(inscripcion_obj.dict())
    
    return inscripcion_obj

@api_router.get("/inscripciones", response_model=List[Inscripcion])
async def obtener_inscripciones(limite: int = 100):
    """Obtener todas las inscripciones"""
    inscripciones = await db.inscripciones.find().limit(limite).to_list(limite)
    return [Inscripcion(**inscripcion) for inscripcion in inscripciones]

@api_router.post("/inscripciones/{inscripcion_id}/comprobante")
async def subir_comprobante(inscripcion_id: str, archivo: UploadFile = File(...)):
    """Subir comprobante de pago para una inscripción"""
    try:
        # Validar que sea una imagen
        if not archivo.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen")
        
        # Leer el archivo y convertir a base64
        contenido = await archivo.read()
        comprobante_base64 = base64.b64encode(contenido).decode('utf-8')
        
        # Actualizar la inscripción en la base de datos
        resultado = await db.inscripciones.update_one(
            {"id": inscripcion_id},
            {"$set": {"comprobante_pago": f"data:{archivo.content_type};base64,{comprobante_base64}"}}
        )
        
        if resultado.matched_count == 0:
            raise HTTPException(status_code=404, detail="Inscripción no encontrada")
            
        return {"message": "Comprobante subido exitosamente"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir comprobante: {str(e)}")

# Estadísticas
@api_router.get("/estadisticas", response_model=Estadisticas)
async def obtener_estadisticas():
    """Obtener estadísticas del sistema"""
    try:
        # Contar inscripciones totales
        total_inscritos = await db.inscripciones.count_documents({})
        
        # Obtener inscripciones para análisis
        inscripciones = await db.inscripciones.find().to_list(1000)
        
        # Contar municipios únicos
        municipios_unicos = set(insc.get("municipio", "") for insc in inscripciones)
        total_municipios = len(municipios_unicos)
        
        # Simular votos (para demo)
        total_votos = total_inscritos * 5  # Promedio de 5 votos por inscrito
        
        # Agrupar por categoría
        inscritos_por_categoria = {}
        for insc in inscripciones:
            categoria = insc.get("categoria", "Sin categoría")
            inscritos_por_categoria[categoria] = inscritos_por_categoria.get(categoria, 0) + 1
        
        # Agrupar por municipio
        inscritos_por_municipio = {}
        for insc in inscripciones:
            municipio = insc.get("municipio", "Sin municipio")
            inscritos_por_municipio[municipio] = inscritos_por_municipio.get(municipio, 0) + 1
        
        return Estadisticas(
            total_inscritos=total_inscritos,
            total_municipios=total_municipios,
            total_votos=total_votos,
            inscritos_por_categoria=inscritos_por_categoria,
            inscritos_por_municipio=inscritos_por_municipio
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener estadísticas: {str(e)}")

# Eventos
@api_router.post("/eventos", response_model=Evento)
async def crear_evento(evento: EventoCreate):
    """Crear nuevo evento"""
    evento_dict = evento.dict()
    evento_obj = Evento(**evento_dict)
    await db.eventos.insert_one(evento_obj.dict())
    return evento_obj

@api_router.get("/eventos", response_model=List[Evento])
async def obtener_eventos():
    """Obtener todos los eventos"""
    eventos = await db.eventos.find().to_list(100)
    return [Evento(**evento) for evento in eventos]

# Subir video para inscripción
@api_router.post("/inscripciones/{inscripcion_id}/video")
async def subir_video(inscripcion_id: str, video: UploadFile = File(...)):
    """Subir video para una inscripción (limitado a 50MB)"""
    try:
        # Validar que sea un video
        if not video.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail="Solo se permiten archivos de video")
        
        # Validar tamaño (50MB máximo)
        max_size = 50 * 1024 * 1024  # 50MB en bytes
        contenido = await video.read()
        if len(contenido) > max_size:
            raise HTTPException(status_code=413, detail="El video es demasiado grande. Máximo 50MB")
        
        # Crear directorio para videos si no existe
        video_dir = Path("/app/uploads/videos")
        video_dir.mkdir(parents=True, exist_ok=True)
        
        # Generar nombre único para el archivo
        extension = Path(video.filename).suffix
        nombre_archivo = f"{inscripcion_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{extension}"
        ruta_archivo = video_dir / nombre_archivo
        
        # Guardar archivo
        with open(ruta_archivo, "wb") as buffer:
            buffer.write(contenido)
        
        # Actualizar inscripción con la URL del video
        video_url = f"/uploads/videos/{nombre_archivo}"
        resultado = await db.inscripciones.update_one(
            {"id": inscripcion_id},
            {"$set": {"video_url": video_url, "video_aprobado": False}}
        )
        
        if resultado.matched_count == 0:
            raise HTTPException(status_code=404, detail="Inscripción no encontrada")
            
        return {"message": "Video subido exitosamente", "video_url": video_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir video: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()