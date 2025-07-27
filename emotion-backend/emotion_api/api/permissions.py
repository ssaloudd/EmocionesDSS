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