from django.contrib import admin

# Register your models here.
from django.contrib.auth.admin import UserAdmin # Importa UserAdmin para personalizar el modelo Usuario
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

# Registra tus modelos aquí.

# Personalización para el modelo Usuario
# Esto es importante porque Usuario hereda de AbstractUser y tiene campos personalizados.
# UserAdmin es la clase de administración por defecto para el modelo de usuario de Django.
# Necesitamos extenderla para mostrar nuestros campos personalizados.
class CustomUserAdmin(UserAdmin):
    # Añade tus campos personalizados a los fieldsets existentes
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('genero', 'CI', 'rol')}),
    )
    # Añade tus campos personalizados a la lista de columnas que se muestran en la tabla
    list_display = UserAdmin.list_display + ('genero', 'CI', 'rol')
    # Permite buscar por CI y rol
    search_fields = UserAdmin.search_fields + ('CI', 'rol')
    # Permite filtrar por rol y género
    list_filter = UserAdmin.list_filter + ('rol', 'genero')

# Registra el modelo Usuario con tu clase de administración personalizada
admin.site.register(Usuario, CustomUserAdmin)

# Registra los demás modelos directamente
admin.site.register(Nivel)
admin.site.register(Materia)
admin.site.register(CursoAlumno)
admin.site.register(CursoDocente)
admin.site.register(Actividad)
admin.site.register(SesionActividad)
admin.site.register(AnalisisEmocion)
admin.site.register(Calificacion)