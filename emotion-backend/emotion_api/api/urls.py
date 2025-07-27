from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    resumen_admin,
    UsuarioViewSet,
    NivelViewSet,
    MateriaViewSet,
    CursoAlumnoViewSet,
    CursoDocenteViewSet,
    ActividadViewSet,
    SesionActividadViewSet,
    AnalisisEmocionViewSet,
    CalificacionViewSet,
    EmocionDetectionAPIView, # Vista para la detección de emociones
    TestEmotionDetectionView
)

from . import auth_views

router = DefaultRouter()

# Registra cada ViewSet con el router.
# El primer argumento es el prefijo de la URL (ej. 'usuarios' -> /api/usuarios/)
# El segundo argumento es la clase ViewSet
# El tercer argumento (opcional pero recomendado) es el 'base_name' para generar URLs inversas
router.register(r"usuarios", UsuarioViewSet, basename="usuario")
router.register(r"niveles", NivelViewSet, basename="nivel")
router.register(r"materias", MateriaViewSet, basename="materia")
router.register(r"curso-alumnos", CursoAlumnoViewSet, basename="curso-alumno")
router.register(r"curso-docentes", CursoDocenteViewSet, basename="curso-docente")
router.register(r"actividades", ActividadViewSet, basename="actividad")
router.register(r"sesiones-actividad", SesionActividadViewSet, basename="sesion-actividad")
router.register(r"analisis-emocion", AnalisisEmocionViewSet, basename="analisis-emocion")
router.register(r"calificaciones", CalificacionViewSet, basename="calificacion")

# Define las rutas URL para tus vistas personalizadas (no ViewSets)
urlpatterns = [
    path('login/', auth_views.CustomAuthToken.as_view(), name='api_login'),
    path('logout/', auth_views.LogoutView.as_view(), name='api_logout'),
    path('test-detectar-emocion/', TestEmotionDetectionView.as_view(), name='test_detectar_emocion'),
    path('resumen-admin', resumen_admin),
    path('emocion-detection/', EmocionDetectionAPIView.as_view(), name='emocion-detection'),

    # Incluye las URLs generadas por el router
    # Esto debe ir al final para que las rutas específicas no sean sobrescritas
    path('', include(router.urls)),
]