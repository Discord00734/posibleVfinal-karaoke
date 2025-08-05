#!/usr/bin/env python3
"""
Script para migrar datos de MongoDB a MySQL
"""
import asyncio
import pymongo
import mysql.connector
import uuid
from datetime import datetime
import os

async def migrate_data():
    """Migrar inscripciones de MongoDB a MySQL"""
    
    # Conexión a MongoDB
    try:
        mongo_client = pymongo.MongoClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
        mongo_db = mongo_client.karaoke_senso
        print("✅ Conectado a MongoDB")
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return
    
    # Conexión a MySQL
    try:
        mysql_conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='karaoke_senso'
        )
        mysql_cursor = mysql_conn.cursor()
        print("✅ Conectado a MySQL")
    except Exception as e:
        print(f"❌ Error conectando a MySQL: {e}")
        return
    
    # Obtener inscripciones de MongoDB
    try:
        inscripciones_mongo = list(mongo_db.inscripciones.find({}))
        print(f"📋 Encontradas {len(inscripciones_mongo)} inscripciones en MongoDB")
    except Exception as e:
        print(f"❌ Error obteniendo inscripciones de MongoDB: {e}")
        return
    
    # Migrar inscripciones a MySQL
    migrated_count = 0
    for inscripcion in inscripciones_mongo:
        try:
            # Usar el ID existente o generar uno nuevo
            inscripcion_id = inscripcion.get('id', str(uuid.uuid4()))
            
            # Preparar datos
            insert_query = """
            INSERT INTO inscripciones (
                id, nombre_completo, nombre_artistico, telefono, correo, 
                categoria, municipio, sede, estatus, fecha_inscripcion,
                comprobante_pago
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                nombre_completo = VALUES(nombre_completo),
                nombre_artistico = VALUES(nombre_artistico),
                telefono = VALUES(telefono)
            """
            
            # Valores para inserción
            values = (
                inscripcion_id,
                inscripcion.get('nombre_completo', ''),
                inscripcion.get('nombre_artistico', ''),
                inscripcion.get('telefono', ''),
                inscripcion.get('correo'),
                inscripcion.get('categoria', 'KOE SAN'),
                inscripcion.get('municipio', ''),
                inscripcion.get('sede', ''),
                inscripcion.get('estado', 'pendiente'),  # estado -> estatus
                inscripcion.get('fecha_inscripcion', datetime.now()),
                inscripcion.get('comprobante_pago')
            )
            
            mysql_cursor.execute(insert_query, values)
            migrated_count += 1
            
        except Exception as e:
            print(f"⚠️ Error migrando inscripción {inscripcion.get('id', 'sin_id')}: {e}")
            continue
    
    # Confirmar cambios
    mysql_conn.commit()
    print(f"✅ Migradas {migrated_count} inscripciones exitosamente")
    
    # Cerrar conexiones
    mysql_cursor.close()
    mysql_conn.close()
    mongo_client.close()
    
    print("🎉 Migración completada")

if __name__ == "__main__":
    asyncio.run(migrate_data())