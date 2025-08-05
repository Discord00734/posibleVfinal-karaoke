from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_, desc, asc
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import uuid
import base64
import json
import os
from decimal import Decimal

# Importar todos los módulos del sistema
from database import get_db, test_connection, engine
from models import *
from schemas import *
from auth import *

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

# Inicializar FastAPI
app = FastAPI(
    title="Karaoke Sensō API",
    description="Sistema de gestión para competencia de karaoke",
    version="2.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# ENDPOINTS DE SALUD Y AUTENTICACIÓN
# =============================================================================

@app.get("/")
async def root():
    return {"message": "Karaoke Sensō API v2.0 - Panel de Administración"}

@app.get("/api/health")
async def health_check():
    db_status = test_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": "connected" if db_status else "disconnected",
        "version": "2.0.0"
    }

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Endpoint de login para administradores"""
    user = authenticate_user(db, login_data.correo, login_data.contraseña)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

# =============================================================================
# ENDPOINTS DE GESTIÓN DE INSCRIPCIONES
# =============================================================================

@app.get("/api/admin/inscripciones", response_model=List[Inscripcion])
async def get_inscripciones_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    estatus: Optional[EstatusInscripcion] = None,
    categoria: Optional[CategoriaParticipante] = None,
    sede_id: Optional[int] = None,
    search: Optional[str] = None,
    current_user: Usuario = Depends(get_current_admin_or_jurado_user),
    db: Session = Depends(get_db)
):
    """Obtener todas las inscripciones con filtros para administradores"""
    query = db.query(Inscripcion).options(joinedload(Inscripcion.sede_obj))
    
    # Aplicar filtros
    if estatus:
        query = query.filter(Inscripcion.estatus == estatus)
    if categoria:
        query = query.filter(Inscripcion.categoria == categoria)
    if sede_id:
        query = query.filter(Inscripcion.sede_id == sede_id)
    if search:
        query = query.filter(
            or_(
                Inscripcion.nombre_completo.contains(search),
                Inscripcion.nombre_artistico.contains(search),
                Inscripcion.telefono.contains(search),
                Inscripcion.correo.contains(search)
            )
        )
    
    inscripciones = query.order_by(desc(Inscripcion.fecha_inscripcion)).offset(skip).limit(limit).all()
    return inscripciones

@app.put("/api/admin/inscripciones/{inscripcion_id}/estatus")
async def actualizar_estatus_inscripcion(
    inscripcion_id: str,
    estatus_data: dict,
    current_user: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Aprobar o rechazar una inscripción"""
    inscripcion = db.query(Inscripcion).filter(Inscripcion.id == inscripcion_id).first()
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    nuevo_estatus = estatus_data.get("estatus")
    observaciones = estatus_data.get("observaciones", "")
    
    if nuevo_estatus not in ["aprobado", "rechazado", "pendiente"]:
        raise HTTPException(status_code=400, detail="Estatus inválido")
    
    # Guardar datos anteriores para auditoría
    datos_anteriores = {
        "estatus": inscripcion.estatus,
        "observaciones": inscripcion.observaciones
    }
    
    # Actualizar inscripción
    inscripcion.estatus = nuevo_estatus
    inscripcion.observaciones = observaciones
    inscripcion.fecha_actualizacion = datetime.utcnow()
    
    # Crear evento de auditoría
    evento = EventoSistema(
        usuario_id=current_user.id,
        accion=f"Cambio de estatus de inscripción a {nuevo_estatus}",
        tabla_afectada="inscripciones",
        registro_id=inscripcion_id,
        datos_anteriores=datos_anteriores,
        datos_nuevos={"estatus": nuevo_estatus, "observaciones": observaciones}
    )
    db.add(evento)
    
    db.commit()
    db.refresh(inscripcion)
    
    return {"message": f"Inscripción {nuevo_estatus} exitosamente", "inscripcion": inscripcion}

@app.put("/api/admin/inscripciones/{inscripcion_id}", response_model=Inscripcion)
async def actualizar_inscripcion(
    inscripcion_id: str,
    inscripcion_data: InscripcionUpdate,
    current_user: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Actualizar datos de una inscripción"""
    inscripcion = db.query(Inscripcion).filter(Inscripcion.id == inscripcion_id).first()
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Actualizar campos
    for campo, valor in inscripcion_data.dict(exclude_unset=True).items():
        setattr(inscripcion, campo, valor)
    
    inscripcion.fecha_actualizacion = datetime.utcnow()
    
    db.commit()
    db.refresh(inscripcion)
    
    return inscripcion

# =============================================================================
# ENDPOINTS DE GESTIÓN DE SEDES
# =============================================================================

@app.get("/api/admin/sedes", response_model=List[Sede])
async def get_sedes_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    activo: Optional[bool] = None,
    estado: Optional[str] = None,
    current_user: Usuario = Depends(get_current_admin_or_jurado_user),
    db: Session = Depends(get_db)
):
    """Obtener todas las sedes"""
    query = db.query(Sede)
    
    if activo is not None:
        query = query.filter(Sede.activo == activo)
    if estado:
        query = query.filter(Sede.estado.contains(estado))
    
    sedes = query.order_by(Sede.nombre_sede).offset(skip).limit(limit).all()
    return sedes

@app.post("/api/admin/sedes", response_model=Sede)
async def crear_sede(
    sede_data: SedeCreate,
    current_user: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Crear nueva sede"""
    sede = Sede(**sede_data.dict())
    db.add(sede)
    
    # Crear evento de auditoría
    evento = EventoSistema(
        usuario_id=current_user.id,
        accion="Creación de sede",
        tabla_afectada="sedes",
        datos_nuevos=sede_data.dict()
    )
    db.add(evento)
    
    db.commit()
    db.refresh(sede)
    
    return sede

@app.put("/api/admin/sedes/{sede_id}", response_model=Sede)
async def actualizar_sede(
    sede_id: int,
    sede_data: SedeUpdate,
    current_user: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Actualizar sede existente"""
    sede = db.query(Sede).filter(Sede.id == sede_id).first()
    if not sede:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    
    # Guardar datos anteriores
    datos_anteriores = {campo: getattr(sede, campo) for campo in sede_data.dict(exclude_unset=True).keys()}
    
    # Actualizar campos
    for campo, valor in sede_data.dict(exclude_unset=True).items():
        setattr(sede, campo, valor)
    
    sede.fecha_actualizacion = datetime.utcnow()
    
    # Crear evento de auditoría  
    evento = EventoSistema(
        usuario_id=current_user.id,
        accion="Actualización de sede",
        tabla_afectada="sedes",
        registro_id=str(sede_id),
        datos_anteriores=datos_anteriores,
        datos_nuevos=sede_data.dict(exclude_unset=True)
    )
    db.add(evento)
    
    db.commit()
    db.refresh(sede)
    
    return sede

@app.delete("/api/admin/sedes/{sede_id}")
async def eliminar_sede(
    sede_id: int,
    current_user: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Eliminar sede (soft delete)"""
    sede = db.query(Sede).filter(Sede.id == sede_id).first()
    if not sede:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    
    # Verificar si tiene inscripciones activas
    inscripciones_activas = db.query(Inscripcion).filter(
        Inscripcion.sede_id == sede_id,
        Inscripcion.estatus.in_(["pendiente", "aprobado"])
    ).count()
    
    if inscripciones_activas > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"No se puede eliminar la sede. Tiene {inscripciones_activas} inscripciones activas."
        )
    
    sede.activo = False
    sede.fecha_actualizacion = datetime.utcnow()
    
    # Crear evento de auditoría
    evento = EventoSistema(
        usuario_id=current_user.id,
        accion="Eliminación de sede",
        tabla_afectada="sedes",
        registro_id=str(sede_id)
    )
    db.add(evento)
    
    db.commit()
    
    return {"message": "Sede eliminada exitosamente"}

# =============================================================================
# ENDPOINTS DE GESTIÓN DE RONDAS
# =============================================================================

@app.get("/api/admin/rondas", response_model=List[Ronda])
async def get_rondas_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    sede_id: Optional[int] = None,
    tipo: Optional[TipoRonda] = None,
    activo: Optional[bool] = None,
    current_user: Usuario = Depends(get_current_admin_or_jurado_user),
    db: Session = Depends(get_db)
):
    """Obtener todas las rondas"""
    query = db.query(Ronda).options(joinedload(Ronda.sede))
    
    if sede_id:
        query = query.filter(Ronda.sede_id == sede_id)
    if tipo:
        query = query.filter(Ronda.tipo == tipo)
    if activo is not None:
        query = query.filter(Ronda.activo == activo)
    
    rondas = query.order_by(desc(Ronda.fecha)).offset(skip).limit(limit).all()
    return rondas

@app.post("/api/admin/rondas", response_model=Ronda)
async def crear_ronda(
    ronda_data: RondaCreate,
    current_user: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Crear nueva ronda"""
    # Verificar que la sede existe
    sede = db.query(Sede).filter(Sede.id == ronda_data.sede_id).first()
    if not sede:
        raise HTTPException(status_code=404, detail="Sede no encontrada")
    
    ronda = Ronda(**ronda_data.dict())
    db.add(ronda)
    
    # Crear evento de auditoría
    evento = EventoSistema(
        usuario_id=current_user.id,
        accion="Creación de ronda",
        tabla_afectada="rondas",
        datos_nuevos=ronda_data.dict()
    )
    db.add(evento)
    
    db.commit()
    db.refresh(ronda)
    
    return ronda

# =============================================================================
# ENDPOINTS DE GESTIÓN DE RESULTADOS
# =============================================================================

@app.get("/api/admin/resultados", response_model=List[Resultado])
async def get_resultados_admin(
    ronda_id: Optional[int] = None,
    inscrito_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: Usuario = Depends(get_current_admin_or_jurado_user),
    db: Session = Depends(get_db)
):
    """Obtener resultados con filtros"""
    query = db.query(Resultado).options(
        joinedload(Resultado.inscrito),
        joinedload(Resultado.ronda)
    )
    
    if ronda_id:
        query = query.filter(Resultado.ronda_id == ronda_id)
    if inscrito_id:
        query = query.filter(Resultado.inscrito_id == inscrito_id)
    
    resultados = query.order_by(desc(Resultado.puntaje)).offset(skip).limit(limit).all()
    return resultados

@app.post("/api/admin/resultados", response_model=Resultado)
async def crear_resultado(
    resultado_data: ResultadoCreate,
    current_user: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Crear o actualizar resultado de participante en ronda"""
    # Verificar que no existe ya un resultado para este inscrito en esta ronda
    resultado_existente = db.query(Resultado).filter(
        Resultado.inscrito_id == resultado_data.inscrito_id,
        Resultado.ronda_id == resultado_data.ronda_id
    ).first()
    
    if resultado_existente:
        # Actualizar resultado existente
        for campo, valor in resultado_data.dict().items():
            setattr(resultado_existente, campo, valor)
        
        resultado_existente.fecha_actualizacion = datetime.utcnow()
        db.commit()
        db.refresh(resultado_existente)
        
        return resultado_existente
    else:
        # Crear nuevo resultado
        resultado = Resultado(**resultado_data.dict())
        db.add(resultado)
        
        # Crear evento de auditoría
        evento = EventoSistema(
            usuario_id=current_user.id,
            accion="Creación de resultado",
            tabla_afectada="resultados",
            datos_nuevos=resultado_data.dict()
        )
        db.add(evento)
        
        db.commit()
        db.refresh(resultado)
        
        return resultado

@app.post("/api/admin/resultados/bulk")
async def cargar_resultados_bulk(
    resultados_data: List[ResultadoCreate],
    current_user: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Cargar resultados en lote para una ronda"""
    resultados_creados = []
    resultados_actualizados = []
    
    for resultado_data in resultados_data:
        # Verificar si ya existe
        resultado_existente = db.query(Resultado).filter(
            Resultado.inscrito_id == resultado_data.inscrito_id,
            Resultado.ronda_id == resultado_data.ronda_id
        ).first()
        
        if resultado_existente:
            # Actualizar existente
            for campo, valor in resultado_data.dict().items():
                setattr(resultado_existente, campo, valor)
            resultado_existente.fecha_actualizacion = datetime.utcnow()
            resultados_actualizados.append(resultado_existente)
        else:
            # Crear nuevo
            resultado = Resultado(**resultado_data.dict())
            db.add(resultado)
            resultados_creados.append(resultado)
    
    # Crear evento de auditoría
    evento = EventoSistema(
        usuario_id=current_user.id,
        accion=f"Carga masiva de resultados: {len(resultados_creados)} creados, {len(resultados_actualizados)} actualizados",
        tabla_afectada="resultados"
    )
    db.add(evento)
    
    db.commit()
    
    return {
        "message": "Resultados cargados exitosamente",
        "creados": len(resultados_creados),
        "actualizados": len(resultados_actualizados)
    }

# =============================================================================
# ENDPOINTS DE GESTIÓN DE VIDEOS
# =============================================================================

@app.get("/api/admin/videos", response_model=List[Video])
async def get_videos_admin(
    aprobado: Optional[bool] = None,
    destacado: Optional[bool] = None,
    inscrito_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: Usuario = Depends(get_current_admin_or_jurado_user),
    db: Session = Depends(get_db)
):
    """Obtener videos con filtros"""
    query = db.query(Video).options(joinedload(Video.inscrito))
    
    if aprobado is not None:
        query = query.filter(Video.aprobado == aprobado)
    if destacado is not None:
        query = query.filter(Video.destacado == destacado)
    if inscrito_id:
        query = query.filter(Video.inscrito_id == inscrito_id)
    
    videos = query.order_by(desc(Video.fecha_subida)).offset(skip).limit(limit).all()
    return videos

@app.put("/api/admin/videos/{video_id}/revision")
async def revisar_video(
    video_id: int,
    revision_data: dict,
    current_user: Usuario = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Aprobar, rechazar o marcar como destacado un video"""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    # Actualizar campos de revisión
    if "aprobado" in revision_data:
        video.aprobado = revision_data["aprobado"]
    if "destacado" in revision_data:
        video.destacado = revision_data["destacado"]
    if "observaciones" in revision_data:
        video.observaciones = revision_data["observaciones"]
    
    video.fecha_revision = datetime.utcnow()
    
    # Crear evento de auditoría
    evento = EventoSistema(
        usuario_id=current_user.id,
        accion="Revisión de video",
        tabla_afectada="videos",
        registro_id=str(video_id),
        datos_nuevos=revision_data
    )
    db.add(evento)
    
    db.commit()
    db.refresh(video)
    
    return {"message": "Video revisado exitosamente", "video": video}

# =============================================================================
# ENDPOINTS DE REPORTES Y ESTADÍSTICAS
# =============================================================================

@app.get("/api/admin/estadisticas", response_model=EstadisticasResponse)
async def get_estadisticas_admin(
    current_user: Usuario = Depends(get_current_admin_or_jurado_user),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas completas del sistema"""
    
    # Conteos básicos
    total_inscritos = db.query(Inscripcion).count()
    total_sedes = db.query(Sede).filter(Sede.activo == True).count()
    total_rondas = db.query(Ronda).filter(Ronda.activo == True).count()
    
    # Conteos por estatus
    inscritos_pendientes = db.query(Inscripcion).filter(Inscripcion.estatus == "pendiente").count()
    inscritos_aprobados = db.query(Inscripcion).filter(Inscripcion.estatus == "aprobado").count()
    inscritos_rechazados = db.query(Inscripcion).filter(Inscripcion.estatus == "rechazado").count()
    
    # Videos
    videos_subidos = db.query(Video).count()
    videos_aprobados = db.query(Video).filter(Video.aprobado == True).count()
    
    # Inscritos por categoría
    inscritos_por_categoria = {}
    categorias = db.query(Inscripcion.categoria, func.count(Inscripcion.id)).group_by(Inscripcion.categoria).all()
    for categoria, count in categorias:
        inscritos_por_categoria[categoria.value] = count
    
    # Inscritos por sede
    inscritos_por_sede = {}
    sedes_query = db.query(
        Sede.nombre_sede, 
        func.count(Inscripcion.id)
    ).outerjoin(Inscripcion).group_by(Sede.id, Sede.nombre_sede).all()
    
    for sede_nombre, count in sedes_query:
        inscritos_por_sede[sede_nombre] = count
    
    # Inscritos por municipio
    inscritos_por_municipio = {}
    municipios = db.query(Inscripcion.municipio, func.count(Inscripcion.id)).group_by(Inscripcion.municipio).all()
    for municipio, count in municipios:
        inscritos_por_municipio[municipio] = count
    
    return EstadisticasResponse(
        total_inscritos=total_inscritos,
        total_sedes=total_sedes,
        total_rondas=total_rondas,
        inscritos_pendientes=inscritos_pendientes,
        inscritos_aprobados=inscritos_aprobados,
        inscritos_rechazados=inscritos_rechazados,
        videos_subidos=videos_subidos,
        videos_aprobados=videos_aprobados,
        inscritos_por_categoria=inscritos_por_categoria,
        inscritos_por_sede=inscritos_por_sede,
        inscritos_por_municipio=inscritos_por_municipio
    )

# =============================================================================
# ENDPOINTS PÚBLICOS (LANDING PAGE) - MANTENER COMPATIBILIDAD
# =============================================================================

@app.post("/api/inscripciones")
async def crear_inscripcion_publica(inscripcion: InscripcionCreate, db: Session = Depends(get_db)):
    """Crear nueva inscripción desde la landing page"""
    # Generar UUID para la inscripción
    inscripcion_id = str(uuid.uuid4())
    
    # Crear objeto de inscripción
    nueva_inscripcion = Inscripcion(
        id=inscripcion_id,
        **inscripcion.dict()
    )
    
    db.add(nueva_inscripcion)
    db.commit()
    db.refresh(nueva_inscripcion)
    
    return {"message": "Inscripción creada exitosamente", "id": inscripcion_id}

@app.get("/api/estadisticas")
async def get_estadisticas_publicas(db: Session = Depends(get_db)):
    """Estadísticas públicas para la landing page"""
    total_inscritos = db.query(Inscripcion).count()
    total_municipios = db.query(func.count(func.distinct(Inscripcion.municipio))).scalar()
    
    # Simular votos para mantener compatibilidad
    total_votos = total_inscritos * 150  # Simulación
    
    return {
        "total_inscritos": total_inscritos,
        "total_municipios": total_municipios,
        "total_votos": total_votos
    }

@app.post("/api/inscripciones/{inscripcion_id}/comprobante")
async def subir_comprobante(
    inscripcion_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Subir comprobante de pago"""
    inscripcion = db.query(Inscripcion).filter(Inscripcion.id == inscripcion_id).first()
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Leer archivo y convertir a base64
    contents = await file.read()
    encoded_file = base64.b64encode(contents).decode()
    
    # Guardar en la inscripción
    inscripcion.comprobante_pago = f"data:{file.content_type};base64,{encoded_file}"
    db.commit()
    
    return {"message": "Comprobante subido exitosamente"}

@app.post("/api/inscripciones/{inscripcion_id}/video")
async def subir_video(
    inscripcion_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Subir video de participante"""
    inscripcion = db.query(Inscripcion).filter(Inscripcion.id == inscripcion_id).first()
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Validar tamaño (50MB máximo)
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    
    if size_mb > 50:
        raise HTTPException(status_code=413, detail="Archivo muy grande. Máximo 50MB.")
    
    # Convertir a base64
    encoded_file = base64.b64encode(contents).decode()
    
    # Crear registro de video
    video = Video(
        inscrito_id=inscripcion_id,
        titulo=f"Video de {inscripcion.nombre_artistico}",
        formato=file.filename.split('.')[-1] if '.' in file.filename else 'mp4',
        tamaño_mb=Decimal(str(round(size_mb, 2))),
        video_data=f"data:{file.content_type};base64,{encoded_file}"
    )
    
    db.add(video)
    db.commit()
    
    return {"message": "Video subido exitosamente"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)