from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Permiso personalizado para permitir acceso solo a usuarios con rol 'admin'.
    """
    def has_permission(self, request, view):
        # Permite acceso si el usuario está autenticado y su rol es 'admin'
        return request.user and request.user.is_authenticated and request.user.rol == 'admin'

class IsDocente(permissions.BasePermission):
    """
    Permiso personalizado para permitir acceso solo a usuarios con rol 'docente' o 'admin'.
    """
    def has_permission(self, request, view):
        # Permite acceso si el usuario está autenticado y su rol es 'docente' o 'admin'
        return request.user and request.user.is_authenticated and request.user.rol in ['docente', 'admin']

class IsAlumno(permissions.BasePermission):
    """
    Permiso personalizado para permitir acceso solo a usuarios con rol 'alumno' o 'admin'.
    """
    def has_permission(self, request, view):
        # Permite acceso si el usuario está autenticado y su rol es 'alumno' o 'admin'
        return request.user and request.user.is_authenticated and request.user.rol in ['alumno', 'admin']

class IsAdminOrReadSelf(permissions.BasePermission):
    """
    Permiso para que los administradores puedan listar/ver todos los usuarios,
    y otros usuarios solo puedan ver su propio perfil (solo lectura para sí mismos).
    """
    def has_permission(self, request, view):
        # Los administradores tienen permiso completo
        if request.user and request.user.is_authenticated and request.user.rol == 'admin':
            return True
        
        # Para otras acciones (POST, PUT, DELETE), si no eres admin, no tienes permiso
        if view.action in ['create', 'update', 'partial_update', 'destroy']:
            return False
            
        # Para acciones de lectura (list, retrieve), si no eres admin, solo puedes acceder a tu propio perfil
        if view.action in ['list', 'retrieve']:
            return request.user and request.user.is_authenticated
        
        return False # Denegar cualquier otra cosa

    def has_object_permission(self, request, view, obj):
        # Los administradores tienen permiso sobre cualquier objeto
        if request.user and request.user.is_authenticated and request.user.rol == 'admin':
            return True
        
        # Un usuario solo puede ver/editar su propio perfil
        if request.user and request.user.is_authenticated and obj == request.user:
            return True
        
        return False # Denegar el resto
    
class CalificacionPermissions(permissions.BasePermission):
    """
    Permiso personalizado para el modelo Calificacion:
    - Admin y Docente: Acceso completo (lectura y escritura).
    - Alumno: Solo acceso de lectura (GET, HEAD, OPTIONS).
    """
    def has_permission(self, request, view):
        # El usuario debe estar autenticado para cualquier operación de Calificacion
        if not request.user or not request.user.is_authenticated:
            return False

        # Los roles 'admin' y 'docente' tienen acceso CRUD completo
        if request.user.rol in ['admin', 'docente']:
            return True
        
        # El rol 'alumno' solo tiene acceso de lectura (métodos seguros)
        if request.user.rol == 'alumno':
            return request.method in permissions.SAFE_METHODS # SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')

        return False # Denegar por defecto a cualquier otro rol o si no cumple las condiciones

    def has_object_permission(self, request, view, obj):
        # Permisos a nivel de objeto para Calificacion
        user = request.user

        # Los administradores tienen acceso completo a cualquier objeto
        if user.rol == 'admin':
            return True

        # Los docentes pueden leer cualquier calificación (ya manejado por has_permission/get_queryset)
        # Para operaciones de escritura (PUT, PATCH, DELETE), un docente solo puede modificar/eliminar
        # las calificaciones que él mismo ha creado.
        if user.rol == 'docente':
            if request.method in permissions.SAFE_METHODS: # Operaciones de lectura
                return True # El docente puede leer este objeto específico
            else: # Operaciones de escritura (PUT, PATCH, DELETE)
                return obj.docente == user # El docente solo puede modificar/eliminar sus propias calificaciones

        # Los alumnos solo pueden leer (manejado por has_permission) y solo sus propias calificaciones
        # (manejado por get_queryset). No hay permisos de escritura a nivel de objeto para alumnos.
        if user.rol == 'alumno':
            return request.method in permissions.SAFE_METHODS and obj.sesion.alumno == user

        return False # Denegar por defecto