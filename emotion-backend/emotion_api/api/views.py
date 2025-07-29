# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny # Importa permisos

from .ml_model.detector import detectar_emocion

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
    CursoAlumnoSerializer,
    CursoDocenteSerializer,
    ActividadSerializer,
    SesionActividadSerializer,
    AnalisisEmocionSerializer,
    CalificacionSerializer
)

import base64
import cv2
import numpy as np
from datetime import datetime
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
    serializer_class = CursoAlumnoSerializer
    # permission_classes = [IsAuthenticated]

    # Filtrar para que un alumno solo vea sus propios cursos
    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.rol == 'alumno':
            return CursoAlumno.objects.filter(alumno=self.request.user)
        return super().get_queryset()

# ViewSet para la relación CursoDocente
class CursoDocenteViewSet(viewsets.ModelViewSet):
    queryset = CursoDocente.objects.all()
    serializer_class = CursoDocenteSerializer
    # permission_classes = [IsAuthenticated]

    # Filtrar para que un docente solo vea sus propios cursos
    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.rol == 'docente':
            return CursoDocente.objects.filter(docente=self.request.user)

# ViewSet para el modelo Actividad
class ActividadViewSet(viewsets.ModelViewSet):
    queryset = Actividad.objects.all()
    serializer_class = ActividadSerializer
    # permission_classes = [IsAuthenticated]

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
    parser_classes = [MultiPartParser]
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No se proporcionó imagen', 'detected': False},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            file = request.FILES['image']
            img_array = np.frombuffer(file.read(), np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            
            if img is None:
                return Response(
                    {'error': 'Imagen no válida', 'detected': False},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = detectar_emocion(img)
            
            if not result.get('detected', False):
                return Response({
                    'detected': False,
                    'message': result.get('message', 'Detección fallida'),
                    'error': result.get('error')
                }, status=status.HTTP_200_OK)
            
            return Response({
                'detected': True,
                'emotion': result['emotion'],
                'confidence': round(result['confidence'], 4),
                'all_emotions': result['all_emotions'],
                'face_box': result['face_box']
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Error interno: {str(e)}', 'detected': False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )