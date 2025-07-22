from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny # Importa permisos
from rest_framework.authentication import SessionAuthentication, BasicAuthentication

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
    CursoAlumnoReadSerializer,  # Nuevo serializador de lectura
    CursoAlumnoWriteSerializer, # Nuevo serializador de escritura
    BulkEnrollmentSerializer,    # Nuevo serializador para bulk
    CursoDocenteReadSerializer,  # Nuevo serializador de lectura
    CursoDocenteWriteSerializer, # Nuevo serializador de escritura
    BulkAssignmentSerializer,    # Nuevo serializador para bulk
    ActividadWriteSerializer, # Importa el serializador de escritura
    ActividadReadSerializer,  # Importa el serializador de lectura
    SesionActividadSerializer,
    AnalisisEmocionSerializer,
    CalificacionSerializer
)

import base64
import cv2
import numpy as np
from datetime import datetime
from django.db import IntegrityError # Importa IntegrityError para manejar duplicados
from .ml_model.detector import detectar_emocion


# --- Vistas para el Dashboard de Administración (Resúmenes) ---

# Vista para el resumen general del administrador
# Se usa @permission_classes para restringir el acceso
@api_view(['GET'])
#@permission_classes([IsAuthenticated]) # Solo usuarios autenticados pueden acceder
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
    # permission_classes = [IsAdminUser] # Requiere que el usuario sea staff o superuser

    def get_queryset(self):
        queryset = Usuario.objects.all()
        # Permite a los usuarios ver su propio perfil, pero a los admins ver todos.
        # Obtener el parámetro 'rol' de la URL de la solicitud (ej. /api/usuarios/?rol=docente)
        rol = self.request.query_params.get('rol', None)
        if rol is not None:
            # Filtrar el queryset si se proporciona un rol
            queryset = queryset.filter(rol=rol)
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
    # Ejemplo de permisos: Solo usuarios autenticados pueden ver, solo admins pueden modificar
    # permission_classes = [IsAuthenticated] # Para lectura
    # def get_permissions(self):
    #     if self.action in ['create', 'update', 'partial_update', 'destroy']:
    #         self.permission_classes = [IsAdminUser]
    #     return super().get_permissions()

# ViewSet para el modelo Materia
class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    # permission_classes = [IsAuthenticated]
    # o...
    #authentication_classes = [] 
    #permission_classes = [AllowAny]
    def get_serializer_class(self):
        # Si la solicitud es GET (para listar o recuperar), usa MateriaReadSerializer
        if self.action in ['list', 'retrieve']:
            return MateriaReadSerializer
        # Para POST, PUT, PATCH (crear, actualizar), usa MateriaWriteSerializer
        return MateriaWriteSerializer



# ViewSet para la relación CursoAlumno
class CursoAlumnoViewSet(viewsets.ModelViewSet):
    queryset = CursoAlumno.objects.all()
    # No definimos serializer_class directamente aquí
    authentication_classes = []
    permission_classes = [AllowAny]

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
    authentication_classes = []
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return CursoDocenteReadSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return CursoDocenteWriteSerializer
        if self.action == 'bulk_assign':
            return BulkAssignmentSerializer
        return CursoDocenteReadSerializer # Fallback

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
        
    # --- PERMISOS TEMPORALES PARA DESARROLLO ---
    authentication_classes = [] 
    permission_classes = [AllowAny] 
    # --- FIN PERMISOS TEMPORALES ---

    def get_serializer_class(self):
        # Si la solicitud es GET (para listar o recuperar), usa ActividadReadSerializer
        if self.action in ['list', 'retrieve']:
            return ActividadReadSerializer
        # Para POST, PUT, PATCH (crear, actualizar), usa ActividadWriteSerializer
        return ActividadWriteSerializer

    def get_queryset(self):
        queryset = Actividad.objects.all()
        
        # Obtener el parámetro 'materia' de la URL de la solicitud (ej. /api/actividades/?materia=1)
        materia_id = self.request.query_params.get('materia', None)
        if materia_id is not None:
            # Filtrar el queryset si se proporciona un ID de materia
            queryset = queryset.filter(materia_id=materia_id)
            
        # Lógica de permisos para el futuro:
        # if self.request.user.is_authenticated:
        #     if self.request.user.rol == 'docente':
        #         # Un docente solo ve actividades de sus materias
        #         materias_docente_ids = CursoDocente.objects.filter(docente=self.request.user).values_list('materia__id', flat=True)
        #         queryset = queryset.filter(materia__id__in=materias_docente_ids)
        #     elif self.request.user.rol == 'alumno':
        #         # Un alumno solo ve actividades de las materias en las que está inscrito
        #         materias_alumno_ids = CursoAlumno.objects.filter(alumno=self.request.user).values_list('materia__id', flat=True)
        #         queryset = queryset.filter(materia__id__in=materias_alumno_ids)
        #     elif self.request.user.rol == 'admin':
        #         # El admin ve todo, no necesita filtro adicional aquí
        #         pass
        # else:
        #     # Si no está autenticado, no ve nada
        #     queryset = Actividad.objects.none()
            
        return queryset

    # Opcional: Sobrescribir perform_create para asegurar que solo docentes/admins creen
    def perform_create(self, serializer):
        # Lógica de permisos para el futuro:
        # if not self.request.user.is_authenticated or self.request.user.rol not in ['docente', 'admin']:
        #     raise PermissionDenied("Solo docentes y administradores pueden crear actividades.")
        
        # Asegurarse de que el usuario que crea la actividad tenga relación con la materia
        # (si es docente, que sea su materia; si es admin, puede crear en cualquiera)
        # Esto es más complejo y se haría con validadores o permisos personalizados.
        serializer.save()



# ViewSet para el modelo SesionActividad
class SesionActividadViewSet(viewsets.ModelViewSet):
    queryset = SesionActividad.objects.all()
    serializer_class = SesionActividadSerializer
    # permission_classes = [IsAuthenticated]

    # Asegurarse de que un alumno solo pueda crear sesiones para sí mismo
    def perform_create(self, serializer):
        if self.request.user.is_authenticated and self.request.user.rol == 'alumno':
            # Asegura que el alumno de la sesión sea el usuario autenticado
            serializer.save(alumno=self.request.user)
        else:
            # Si no es alumno o no está autenticado, maneja el error o permite a admins
            # Aquí, por simplicidad, se permite si no es alumno autenticado (e.g., admin)
            serializer.save()

# ViewSet para el modelo AnalisisEmocion
# Para la recepción en tiempo real de frames, se podría considerar una APIView personalizada.
class AnalisisEmocionViewSet(viewsets.ModelViewSet):
    queryset = AnalisisEmocion.objects.all()
    serializer_class = AnalisisEmocionSerializer
    # permission_classes = [IsAuthenticated]

    # Filtrar para que un alumno solo vea sus propios análisis
    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.rol == 'alumno':
            # Filtra por las sesiones del alumno actual
            return AnalisisEmocion.objects.filter(sesion__alumno=self.request.user)
        return super().get_queryset()


# ViewSet para el modelo Calificacion
class CalificacionViewSet(viewsets.ModelViewSet):
    queryset = Calificacion.objects.all()
    serializer_class = CalificacionSerializer
    # permission_classes = [IsAuthenticated]

    # Filtrar para que un docente solo vea las calificaciones que ha puesto
    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.rol == 'docente':
            return Calificacion.objects.filter(docente=self.request.user)
        return super().get_queryset()


# --- Vista para la Recepción de Datos de Emoción en Tiempo Real ---
# Esta es una APIView personalizada para manejar la lógica de ML.
# Se espera que reciba un frame de imagen (base64 o binario) y el ID de la sesión.
class EmocionDetectionAPIView(APIView):
    parser_classes = [JSONParser]
    # permission_classes = [IsAuthenticated] 

    def post(self, request, *args, **kwargs):
        # Asegura que la sesión exista y el usuario tenga permiso para esa sesión
        sesion_id = request.data.get('sesion_id')
        frame_base64 = request.data.get('frame_base64') # Esperamos el frame en base64
        momento_segundo_frontend = request.data.get('momento_segundo') # Opcional: si el frontend calcula esto

        if not sesion_id or not frame_base64:
            return Response({"error": "sesion_id y frame_base64 son requeridos."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sesion = SesionActividad.objects.get(id=sesion_id)

            # Opcional: Verificar que el usuario autenticado sea el alumno de esta sesión
            # if request.user.is_authenticated and sesion.alumno != request.user:
            #     return Response({"error": "No tienes permiso para esta sesión."}, status=status.HTTP_403_FORBIDDEN)

            # 1. Decodificar la imagen Base64
            try:
                # El cliente podría enviar 'data:image/jpeg;base64,...' o solo la parte base64
                if ',' in frame_base64:
                    _, frame_base64 = frame_base64.split(',', 1)
                image_bytes = base64.b64decode(frame_base64)
                np_array = np.frombuffer(image_bytes, np.uint8)
                imagen_cv2 = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

                if imagen_cv2 is None:
                    return Response({"error": "No se pudo decodificar la imagen Base64."}, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                return Response({"error": f"Error al decodificar la imagen: {e}"}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Llamar a la función de detección de emoción
            emotion_results = detectar_emocion(imagen_cv2)

            if emotion_results is None:
                # No se detectó ningún rostro o hubo un error interno en el detector
                return Response({"message": "No se detectó ningún rostro o el modelo no está cargado.", "sesion_id": sesion_id}, status=status.HTTP_200_OK)
                # Puedes elegir devolver un 400 si la ausencia de rostro es un error para tu caso

            # 3. Calcular el momento_segundo
            # Si el frontend envía 'momento_segundo_frontend', úsalo directamente
            if momento_segundo_frontend is not None:
                momento_segundo = int(momento_segundo_frontend)
            else:
                # Si no, calcula el tiempo transcurrido desde el inicio real de la sesión
                tiempo_transcurrido = (datetime.now() - sesion.fecha_hora_inicio_real).total_seconds()
                momento_segundo = int(tiempo_transcurrido)

            # 4. Preparar los datos para el serializador
            analisis_data = {
                'sesion': sesion.id, # Solo el ID de la sesión
                'momento_segundo': momento_segundo,
                'emocion_predominante': emotion_results['emocion_predominante'],
                'confianza_emocion': emotion_results['confianza_emocion'],
                'datos_raw_emociones': emotion_results['datos_raw_emociones']
            }
            
            # 5. Guardar el resultado en la base de datos
            serializer = AnalisisEmocionSerializer(data=analisis_data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except SesionActividad.DoesNotExist:
            return Response({"error": "Sesión de actividad no encontrada."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Captura cualquier otra excepción inesperada
            return Response({"error": f"Error interno del servidor: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






# Vista para probar la detección de emociones con una imagen subida
class TestEmotionDetectionView(APIView):
    parser_classes = [MultiPartParser] # Para recibir archivos (imágenes)
    # Temporalmente abierto para pruebas
    authentication_classes = [] 
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Leer imagen desde archivo
            image_bytes = np.asarray(bytearray(file.read()), dtype=np.uint8)
            image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)

            if image is None:
                return Response({'error': 'Could not decode image'}, status=status.HTTP_400_BAD_REQUEST)

            # Llama a detectar_emocion, que ahora devuelve un diccionario
            emotion_results = detectar_emocion(image)

            if emotion_results is None:
                # Si no se detectó rostro o el modelo no está cargado
                return Response({'message': 'No face detected or model not loaded'}, status=status.HTTP_200_OK)
            
            # Extrae los valores del diccionario
            emocion = emotion_results.get('emocion_predominante')
            confianza = emotion_results.get('confianza_emocion')
            datos_raw = emotion_results.get('datos_raw_emociones') # Opcional, si quieres devolverlo también

            # Devuelve la respuesta con los datos extraídos
            return Response({
                'emocion': emocion,
                'confianza': confianza,
                'datos_raw_emociones': datos_raw # Si quieres que el frontend vea el desglose completo
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # Captura cualquier error durante el procesamiento
            return Response({'error': f'Internal server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)