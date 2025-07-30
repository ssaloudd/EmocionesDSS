from django.shortcuts import render
from django.conf import settings
from django.db import IntegrityError # Importa IntegrityError para manejar duplicados
from django.utils import timezone # ¡IMPORTA ESTO para manejar zonas horarias!
from django.db.models import Q # Importa Q para consultas complejas

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny # Importa permisos
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from tensorflow.keras.models import load_model

# Importaciones para autenticación
from django.contrib.auth import authenticate, login # Importa authenticate y login
from rest_framework.authtoken.models import Token # Importa el modelo Token

from .permissions import IsAdmin, IsDocente, IsAlumno, IsAdminOrReadSelf, CalificacionPermissions

from .models import (
    Usuario,
    Nivel,
    Materia,
    CursoAlumno,
    CursoDocente,
    Actividad,
    SesionActividad,
    AnalisisEmocion,
    Calificacion
)

from .serializers import (
    UsuarioSerializer,
    NivelSerializer,
    MateriaWriteSerializer,
    MateriaReadSerializer,
    CursoAlumnoReadSerializer,
    CursoAlumnoWriteSerializer,
    BulkEnrollmentSerializer,
    CursoDocenteReadSerializer,
    CursoDocenteWriteSerializer,
    BulkAssignmentSerializer,
    ActividadWriteSerializer,
    ActividadReadSerializer,
    SesionActividadWriteSerializer,
    SesionActividadReadSerializer,
    AnalisisEmocionWriteSerializer,
    AnalisisEmocionReadSerializer,
    CalificacionWriteSerializer, # Importa el serializador de escritura
    CalificacionReadSerializer,   # Importa el serializador de lectura
    EmotionFrameSerializer
)

import os
import base64
import cv2
import numpy as np
from datetime import datetime
from .serializers import EmotionFrameSerializer
from .ml_model.detector import detectar_emocion

# --- Vistas para el Dashboard de Administración (Resúmenes) ---

# Vista para el resumen general del administrador
# Se usa @permission_classes para restringir el acceso
@api_view(['GET'])
@permission_classes([IsAdmin]) 
def resumen_admin(request):
    # Se puede añadir lógica para verificar si el usuario tiene rol 'admin'
    # if not request.user.is_authenticated or request.user.rol != 'admin':
    #     return Response({"detail": "No tienes permiso para acceder a este recurso."}, status=status.HTTP_403_FORBIDDEN)

    total_alumnos = Usuario.objects.filter(rol='alumno').count()
    total_profesores = Usuario.objects.filter(rol='docente').count()
    total_materias = Materia.objects.count()
    total_actividades = Actividad.objects.count()
    total_sesiones_completadas = SesionActividad.objects.count() # O podrías filtrar por un estado 'completada'

    return Response({
        "total_alumnos": total_alumnos,
        "total_profesores": total_profesores,
        "total_materias": total_materias,
        "total_actividades": total_actividades,
        "total_sesiones_completadas": total_sesiones_completadas,
    })

# --- ViewSets para operaciones CRUD de Modelos ---

# ViewSet para el modelo Usuario
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    # Permisos: Solo administradores pueden listar/crear/actualizar/eliminar usuarios
    permission_classes = [IsAuthenticated, IsAdminOrReadSelf] 

    def get_queryset(self):
        queryset = Usuario.objects.all()
        # Permite a los usuarios ver su propio perfil, pero a los admins ver todos.
        # Obtener el parámetro 'rol' de la URL de la solicitud (ej. /api/usuarios/?rol=docente)
        rol = self.request.query_params.get('rol', None)
        if rol is not None:
            # Filtrar el queryset si se proporciona un rol
            queryset = queryset.filter(rol=rol)

        # Si no es admin, solo puede ver su propio perfil (ya manejado por IsAdminOrReadSelf.has_object_permission)
        # pero para la lista, si no es admin, no debería ver a otros.
        if not self.request.user.rol == 'admin' and self.action == 'list':
            queryset = queryset.filter(id=self.request.user.id)
        return queryset
    
    def perform_create(self, serializer):
        # Al crear un usuario, asegúrate de hashear la contraseña
        user = serializer.save()
        user.set_password(user.password) # El password viene en texto plano del serializer
        user.save()

    def perform_update(self, serializer):
        # Al actualizar un usuario, si se envía una contraseña, hashearla
        password = serializer.validated_data.get('password', None)
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()

# ViewSet para el modelo Nivel
class NivelViewSet(viewsets.ModelViewSet):
    queryset = Nivel.objects.all()
    serializer_class = NivelSerializer
    # Solo administradores pueden crear/modificar niveles
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdmin]
        else: # Para 'list', 'retrieve'
            #self.permission_classes = [IsAuthenticated] # O [AllowAny] si quieres que sean públicos para lectura
            self.permission_classes = [IsAdmin] # Solo admins pueden leer también
        return super().get_permissions()

# ViewSet para el modelo Materia
class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    
    def get_serializer_class(self):
        # Si la solicitud es GET (para listar o recuperar), usa MateriaReadSerializer
        if self.action in ['list', 'retrieve']:
            return MateriaReadSerializer
        # Para POST, PUT, PATCH (crear, actualizar), usa MateriaWriteSerializer
        return MateriaWriteSerializer
    
     # --- PERMISOS ACTUALIZADOS PARA MATERIA ---
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdmin] # Solo admin puede CRUD
        else: # 'list', 'retrieve'
            self.permission_classes = [IsAuthenticated] # Todos los autenticados pueden leer (filtrado por queryset)
        return super().get_permissions()

    # --- QUERYSET ACTUALIZADO PARA MATERIA ---
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_authenticated:
            if user.rol == 'admin':
                # Admin ve todas las materias
                return queryset
            elif user.rol == 'docente':
                # Docente ve solo las materias a las que está asignado
                materias_impartidas_ids = CursoDocente.objects.filter(docente=user).values_list('materia__id', flat=True)
                queryset = queryset.filter(id__in=materias_impartidas_ids)
            elif user.rol == 'alumno':
                # Alumno ve solo las materias en las que está inscrito
                materias_inscritas_ids = CursoAlumno.objects.filter(alumno=user).values_list('materia__id', flat=True)
                queryset = queryset.filter(id__in=materias_inscritas_ids)
            else:
                # Otros roles (si los hubiera) o roles sin definir no ven nada
                queryset = Materia.objects.none()
        else:
            # Usuarios no autenticados no ven nada
            queryset = Materia.objects.none()
            
        # Si se pasa un parámetro 'materia' en la URL, se aplica un filtro adicional
        # Esto es útil si quieres, por ejemplo, /api/materias/?materia=1 para buscar una específica
        # dentro de las que ya tiene permiso de ver.
        materia_id_param = self.request.query_params.get('materia', None)
        if materia_id_param is not None:
            queryset = queryset.filter(id=materia_id_param)

        return queryset



# ViewSet para la relación CursoAlumno
class CursoAlumnoViewSet(viewsets.ModelViewSet):
    queryset = CursoAlumno.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return CursoAlumnoReadSerializer
        # Para las acciones de creación/actualización normales, usa el serializador de escritura
        if self.action in ['create', 'update', 'partial_update']:
            return CursoAlumnoWriteSerializer
        # Para la acción 'bulk_enroll', usa su serializador específico
        if self.action == 'bulk_enroll':
            return BulkEnrollmentSerializer
        return CursoAlumnoReadSerializer # Fallback

    # Permisos: Admin CRUD. Docente/Alumno solo lectura de sus asociados.
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_enroll']:
            self.permission_classes = [IsAdmin] # Solo admin puede CRUD o bulk_enroll
        else: # 'list', 'retrieve'
            self.permission_classes = [IsAuthenticated] # Docentes y Alumnos autenticados pueden leer
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_authenticated and not user.rol == 'admin':
            if user.rol == 'alumno':
                # Alumno solo ve sus propias inscripciones
                queryset = queryset.filter(alumno=user)
            elif user.rol == 'docente':
                # Docente ve inscripciones de alumnos en sus materias
                # Materias que el docente imparte
                materias_impartidas = Materia.objects.filter(cursodocente__docente=user)
                queryset = queryset.filter(materia__in=materias_impartidas)
        return queryset

    # Acción personalizada para inscripción masiva de alumnos
    # URL: /api/curso-alumnos/bulk_enroll/
    @action(detail=False, methods=['post'])
    def bulk_enroll(self, request):
        serializer = BulkEnrollmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        materia_id = serializer.validated_data['materia_id']
        alumno_ids = serializer.validated_data['alumno_ids']

        # Obtener la materia y los alumnos
        materia = Materia.objects.get(id=materia_id)
        alumnos = Usuario.objects.filter(id__in=alumno_ids, rol='alumno')

        created_enrollments = []
        errors = []

        for alumno in alumnos:
            try:
                # Crear o obtener la inscripción si ya existe
                curso_alumno, created = CursoAlumno.objects.get_or_create(
                    alumno=alumno,
                    materia=materia,
                    defaults={'fecha_inscripcion': datetime.now().date()} # Default si se crea
                )
                if created:
                    created_enrollments.append(curso_alumno)
                else:
                    errors.append(f"El alumno {alumno.first_name} {alumno.last_name} ya está inscrito en esta materia.")
            except IntegrityError:
                errors.append(f"Error de integridad al inscribir al alumno {alumno.first_name} {alumno.last_name}.")
            except Exception as e:
                errors.append(f"Error inesperado al inscribir al alumno {alumno.first_name} {alumno.last_name}: {str(e)}.")

        if created_enrollments:
            # Serializar las inscripciones creadas/actualizadas para la respuesta
            response_serializer = CursoAlumnoReadSerializer(created_enrollments, many=True)
            return Response({
                "message": "Operación de inscripción masiva completada.",
                "created_count": len(created_enrollments),
                "errors": errors,
                "enrollments": response_serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "message": "No se crearon nuevas inscripciones.",
                "errors": errors
            }, status=status.HTTP_400_BAD_REQUEST)


# ViewSet para la relación CursoDocente
class CursoDocenteViewSet(viewsets.ModelViewSet):
    queryset = CursoDocente.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return CursoDocenteReadSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CursoDocenteWriteSerializer
        if self.action == 'bulk_assign':
            return BulkAssignmentSerializer
        return CursoDocenteReadSerializer # Fallback
    
    # Permisos: Admin CRUD. Docente/Alumno solo lectura de sus asociados.
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_assign']:
            self.permission_classes = [IsAdmin] # Solo admin puede CRUD o bulk_assign
        else: # 'list', 'retrieve'
            self.permission_classes = [IsAuthenticated] # Docentes y Alumnos autenticados pueden leer
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_authenticated and not user.rol == 'admin':
            if user.rol == 'docente':
                # Docente solo ve sus propias asignaciones
                queryset = queryset.filter(docente=user)
            elif user.rol == 'alumno':
                # Alumno ve asignaciones de docentes en sus materias
                # Materias en las que el alumno está inscrito
                materias_inscritas = Materia.objects.filter(cursoalumno__alumno=user)
                queryset = queryset.filter(materia__in=materias_inscritas)
        return queryset

    # Acción personalizada para asignación masiva de docentes
    # URL: /api/curso-docentes/bulk_assign/
    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        serializer = BulkAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        materia_id = serializer.validated_data['materia_id']
        docente_ids = serializer.validated_data['docente_ids']

        materia = Materia.objects.get(id=materia_id)
        docentes = Usuario.objects.filter(id__in=docente_ids, rol='docente')

        created_assignments = []
        errors = []

        for docente in docentes:
            try:
                curso_docente, created = CursoDocente.objects.get_or_create(
                    docente=docente,
                    materia=materia
                )
                if created:
                    created_assignments.append(curso_docente)
                else:
                    errors.append(f"El docente {docente.first_name} {docente.last_name} ya está asignado a esta materia.")
            except IntegrityError:
                errors.append(f"Error de integridad al asignar al docente {docente.first_name} {docente.last_name}.")
            except Exception as e:
                errors.append(f"Error inesperado al asignar al docente {docente.first_name} {docente.last_name}: {str(e)}.")

        if created_assignments:
            response_serializer = CursoDocenteReadSerializer(created_assignments, many=True)
            return Response({
                "message": "Operación de asignación masiva completada.",
                "created_count": len(created_assignments),
                "errors": errors,
                "assignments": response_serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "message": "No se crearon nuevas asignaciones.",
                "errors": errors
            }, status=status.HTTP_400_BAD_REQUEST)



# ViewSet para el modelo Actividad
class ActividadViewSet(viewsets.ModelViewSet):
    queryset = Actividad.objects.all()
    

    def get_serializer_class(self):
        # Si la solicitud es GET (para listar o recuperar), usa ActividadReadSerializer
        if self.action in ['list', 'retrieve']:
            return ActividadReadSerializer
        # Para POST, PUT, PATCH (crear, actualizar), usa ActividadWriteSerializer
        return ActividadWriteSerializer

    # Permisos: Admin y Docente CRUD. Alumno solo Read.
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsDocente] # Docentes y Admins (por IsDocente) pueden CRUD
        else: # 'list', 'retrieve'
            self.permission_classes = [IsAuthenticated] # Alumnos, Docentes, Admins pueden leer
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.is_authenticated and not user.rol == 'admin':
            if user.rol == 'docente':
                # Docente ve actividades de sus materias
                materias_impartidas = Materia.objects.filter(cursodocente__docente=user)
                queryset = queryset.filter(materia__in=materias_impartidas)
            elif user.rol == 'alumno':
                # Alumno ve actividades de sus materias inscritas
                materias_inscritas = Materia.objects.filter(cursoalumno__alumno=user)
                queryset = queryset.filter(materia__in=materias_inscritas)
        return queryset

    # Opcional: Sobrescribir perform_create para asegurar que solo docentes/admins creen
    def perform_create(self, serializer):
        serializer.save()



# ViewSet para el modelo SesionActividad
class SesionActividadViewSet(viewsets.ModelViewSet):
    queryset = SesionActividad.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return SesionActividadReadSerializer # Para lectura
        return SesionActividadWriteSerializer # Para escritura (create, update, partial_update)

    # Permisos: Admin CRUD. Docente/Alumno Create y Read.
    def get_permissions(self):
        if self.action in ['create']:
            self.permission_classes = [IsAuthenticated] # Cualquiera autenticado puede crear una sesión
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdmin] # Solo admin puede modificar/eliminar sesiones
        else: # 'list', 'retrieve', 'end_session'
            self.permission_classes = [IsAuthenticated] # Docentes y Alumnos autenticados pueden leer/finalizar
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_authenticated and not user.rol == 'admin':
            if user.rol == 'alumno':
                # Alumno solo ve sus propias sesiones
                queryset = queryset.filter(alumno=user)
            elif user.rol == 'docente':
                # Docente ve sesiones de actividades en sus materias
                materias_impartidas = Materia.objects.filter(cursodocente__docente=user)
                # Filtra sesiones cuyas actividades pertenecen a las materias del docente
                queryset = queryset.filter(actividad__materia__in=materias_impartidas)
        return queryset

    def perform_create(self, serializer):
        # Al crear una SesionActividad, establece la fecha_hora_inicio_real con timezone.now()
        serializer.save(fecha_hora_inicio_real=timezone.now())

    # Acción personalizada para finalizar una sesión de actividad
    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        try:
            sesion = self.get_object()
            # Permiso adicional: Un alumno solo puede finalizar su propia sesión
            if self.request.user.rol == 'alumno' and sesion.alumno != self.request.user:
                return Response({"detail": "No tienes permiso para finalizar esta sesión."}, status=status.HTTP_403_FORBIDDEN)
            if sesion.fecha_hora_fin_real:
                return Response({"message": "La sesión ya ha sido finalizada."}, status=status.HTTP_400_BAD_REQUEST)
            
            sesion.fecha_hora_fin_real = timezone.now() # Usar timezone.now()
            sesion.save()
            
            serializer = SesionActividadReadSerializer(sesion) # Usar el serializador de lectura para la respuesta
            return Response(serializer.data, status=status.HTTP_200_OK)
        except SesionActividad.DoesNotExist:
            return Response({"error": "Sesión de actividad no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# ViewSet para el modelo AnalisisEmocion
class AnalisisEmocionViewSet(viewsets.ModelViewSet):
    queryset = AnalisisEmocion.objects.all()
    authentication_classes = []
    permission_classes = [AllowAny] # Temporalmente abierto

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return AnalisisEmocionReadSerializer # Para lectura
        return AnalisisEmocionWriteSerializer # Para escritura

    # Permisos: Admin CRUD. Docente solo Read. Alumno no acceso.
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdmin] # Solo admin puede CRUD
        else: # 'list', 'retrieve'
            self.permission_classes = [IsDocente] # Docentes y Admins pueden leer
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_authenticated and not user.rol == 'admin':
            if user.rol == 'docente':
                # Docente ve análisis de sesiones en actividades en sus materias
                materias_impartidas = Materia.objects.filter(cursodocente__docente=user)
                queryset = queryset.filter(sesion__actividad__materia__in=materias_impartidas)
            elif user.rol == 'alumno':
                # Alumno no tiene acceso a esta tabla, el permiso ya lo deniega
                queryset = AnalisisEmocion.objects.none() # Asegurarse de que no vea nada
        return queryset

    def perform_create(self, serializer):
        serializer.save()



# ViewSet para el modelo Calificacion
class CalificacionViewSet(viewsets.ModelViewSet):
    queryset = Calificacion.objects.all()
    # Aplica las clases de permiso personalizadas
    permission_classes = [IsAuthenticated, CalificacionPermissions]
    # No es necesario definir authentication_classes si IsAuthenticated ya está en permission_classes

    def get_serializer_class(self):
        # Usa el serializador de lectura para listar y recuperar (GET)
        if self.action in ['list', 'retrieve']:
            return CalificacionReadSerializer
        # Usa el serializador de escritura para crear, actualizar y actualizar parcialmente (POST, PUT, PATCH)
        return CalificacionWriteSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Calificacion.objects.all() # Queryset base

        if user.is_authenticated:
            if user.rol == 'admin':
                return queryset # El administrador ve todas las calificaciones
            elif user.rol == 'docente':
                # Un docente ve las calificaciones que él mismo ha puesto
                # Y las calificaciones de los alumnos en las materias que él imparte.
                
                # Calificaciones puestas por este docente
                grades_given_by_docente = queryset.filter(docente=user)

                # Calificaciones de alumnos en las materias de este docente
                # 1. Obtener IDs de las materias que el docente imparte
                materias_docente_ids = CursoDocente.objects.filter(docente=user).values_list('materia__id', flat=True)
                # 2. Obtener IDs de los alumnos inscritos en esas materias
                alumnos_en_materias_ids = CursoAlumno.objects.filter(materia__id__in=materias_docente_ids).values_list('alumno__id', flat=True)
                # 3. Obtener IDs de las sesiones de actividad de esos alumnos
                sesiones_alumnos_ids = SesionActividad.objects.filter(alumno__id__in=alumnos_en_materias_ids).values_list('id', flat=True)
                # 4. Filtrar las calificaciones por esas sesiones
                grades_for_their_students = queryset.filter(sesion__id__in=sesiones_alumnos_ids)

                # Combinar ambos querysets y eliminar duplicados
                return (grades_given_by_docente | grades_for_their_students).distinct()

            elif user.rol == 'alumno':
                # Un alumno solo ve las calificaciones de sus propias sesiones
                return queryset.filter(sesion__alumno=user)
        
        return Calificacion.objects.none() # Los usuarios no autenticados no ven nada

    def perform_create(self, serializer):
        # Al crear una calificación, si el usuario autenticado es un docente,
        # asegúrate de que el campo 'docente' de la calificación sea el usuario actual.
        # Si es un admin, el admin puede especificar cualquier docente.
        if self.request.user.rol == 'docente':
            serializer.save(docente=self.request.user)
        else:
            # Si es admin, el serializador ya habrá validado el 'docente' proporcionado
            serializer.save()



# Vista para la Recepción de Datos de Emoción en Tiempo Real
class EmocionDetectionAPIView(APIView):
    parser_classes = [JSONParser] 
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = EmotionFrameSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sesion_id = serializer.validated_data['sesion_id']
        frame_base64 = serializer.validated_data['frame_base64']
        momento_segundo = serializer.validated_data['momento_segundo']

        try:
            sesion = SesionActividad.objects.get(id=sesion_id)
            
            if ',' in frame_base64:
                _, frame_base64 = frame_base64.split(',', 1)
            
            image_bytes = base64.b64decode(frame_base64)
            np_array = np.frombuffer(image_bytes, np.uint8)
            imagen_cv2 = cv2.imdecode(np_array, cv2.IMREAD_COLOR) 

            if imagen_cv2 is None:
                return Response({"error": "No se pudo decodificar la imagen Base64 o es inválida."}, status=status.HTTP_400_BAD_REQUEST)

            # --- LLAMADA AL NUEVO detector.py ---
            emotion_results = detectar_emocion(imagen_cv2)

            # Preparar datos para AnalisisEmocion
            analisis_data = {
                'sesion': sesion.id,
                'momento_segundo': momento_segundo,
                'emocion_predominante': None, # Valor por defecto
                'confianza_emocion': 0.0, # Valor por defecto
                'datos_raw_emociones': {} # Valor por defecto
            }

            if emotion_results and emotion_results.get('detected', False): # Si hubo detección exitosa
                analisis_data['emocion_predominante'] = emotion_results.get('emotion')
                analisis_data['confianza_emocion'] = emotion_results.get('confidence')
                analisis_data['datos_raw_emociones'] = emotion_results.get('all_emotions', {})
                print(f"DEBUG: Rostro detectado y emoción procesada para sesion_id={sesion_id}, momento_segundo={momento_segundo}")
            else: # No hubo detección o hubo un error en el detector
                # Podemos usar un valor específico para 'no_detectado' si tu modelo lo permite
                # o simplemente mantener el valor por defecto de None/0.0
                analisis_data['emocion_predominante'] = 'no_detectado' # Asigna un valor para "no detectado"
                analisis_data['confianza_emocion'] = 0.0
                analisis_data['datos_raw_emociones'] = emotion_results.get('all_emotions', {}) if emotion_results else {} # Intenta obtener all_emotions si result está presente
                
                # Mensaje de depuración más específico
                if emotion_results:
                    print(f"DEBUG: Detección fallida para sesion_id={sesion_id}, momento_segundo={momento_segundo}. Mensaje: {emotion_results.get('message', 'N/A')}, Error: {emotion_results.get('error', 'N/A')}")
                else:
                    print(f"DEBUG: detect_emotion retornó None inesperadamente para sesion_id={sesion_id}, momento_segundo={momento_segundo}")


            # Usar AnalisisEmocionWriteSerializer para guardar
            analisis_serializer = AnalisisEmocionWriteSerializer(data=analisis_data)
            if analisis_serializer.is_valid():
                analisis_serializer.save()
                
                response_data = {
                    "emocion": analisis_data['emocion_predominante'],
                    "confianza": analisis_data['confianza_emocion'],
                    "message": "Análisis de emoción registrado."
                }
                if not (emotion_results and emotion_results.get('detected', False)):
                    response_data["message"] = "Frame recibido, pero no se detectó rostro o hubo un problema."

                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                print(f"ERROR: Errores de validación al guardar AnalisisEmocion: {analisis_serializer.errors}")
                return Response(analisis_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except SesionActividad.DoesNotExist:
            return Response({"error": "Sesión de actividad no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"ERROR: Error interno del servidor en EmocionDetectionAPIView: {str(e)}")
            return Response({"error": f"Error interno del servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# Vista para probar la detección de emociones con una imagen subida
class TestEmotionDetectionView(APIView):
    parser_classes = [MultiPartParser] # Para recibir archivos (imágenes)
    # Temporalmente abierto para pruebas
    authentication_classes = [] 
    permission_classes = [AllowAny] # Usamos [AllowAny] para ser explícitos.

    def post(self, request, *args, **kwargs):
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No image provided', 'detected': False}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Leer imagen desde archivo
            image_bytes = np.asarray(bytearray(file.read()), dtype=np.uint8)
            image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)

            if image is None:
                return Response({'error': 'Could not decode image', 'detected': False}, status=status.HTTP_400_BAD_REQUEST)

            # Llama a detectar_emocion, que ahora devuelve un diccionario con 'detected'
            emotion_results = detectar_emocion(image)

            if not emotion_results or not emotion_results.get('detected', False):
                # Si no se detectó rostro, el modelo no está cargado o 'detected' es False
                return Response({
                    'detected': False,
                    'message': emotion_results.get('message', 'No face detected or model not loaded') if emotion_results else 'Unknown detection error',
                    'error': emotion_results.get('error') if emotion_results else 'No results from detector'
                }, status=status.HTTP_200_OK) # Puedes devolver 200 OK si es un "no detectado" esperado

            # Devuelve la respuesta con los datos extraídos
            return Response({
                'detected': True,
                'emocion': emotion_results['emotion'],
                'confianza': round(emotion_results['confidence'], 4), # Redondear para mejor visualización
                'datos_raw_emociones': emotion_results['all_emotions'],
                'face_box': emotion_results['face_box'] # Puedes incluir esto si es útil para el frontend de prueba
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Captura cualquier error durante el procesamiento
            return Response(
                {'error': f'Internal server error: {str(e)}', 'detected': False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



# --- Nueva Vista para el Login ---
class LoginView(APIView):
    # No se requiere autenticación para acceder a esta vista (es la que la proporciona)
    authentication_classes = []
    permission_classes = [AllowAny] # Permite a cualquier usuario intentar loguearse

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Si el usuario es autenticado, puedes generar o recuperar un token
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'rol': user.rol,
            }, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Unable to log in with provided credentials."}, status=status.HTTP_400_BAD_REQUEST)