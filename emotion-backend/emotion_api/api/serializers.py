from rest_framework import serializers

from .models import Materia, Nivel, Usuario, CursoAlumno, CursoDocente, Actividad, SesionActividad, AnalisisEmocion, Calificacion

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'genero',
            'CI',
            'rol'
        ]

class NivelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nivel
        fields = '__all__'

# --- Serializadores de Materia (Separados para Lectura y Escritura) ---

# Serializador para la escritura de Materia (POST, PUT, PATCH)
# Espera el ID del Nivel para la relación ForeignKey
class MateriaWriteSerializer(serializers.ModelSerializer):
    nivel = serializers.PrimaryKeyRelatedField(queryset=Nivel.objects.all())

    class Meta:
        model = Materia
        fields = '__all__'

# Serializador para la lectura de Materia (GET)
# Anida el objeto Nivel completo usando NivelSerializer
class MateriaReadSerializer(serializers.ModelSerializer):
    nivel = NivelSerializer() # Aquí anidamos el serializador de Nivel

    class Meta:
        model = Materia
        fields = '__all__'


class CursoAlumnoSerializer(serializers.ModelSerializer):
    # Para la lectura, ver los detalles del alumno y la materia.
    alumno = UsuarioSerializer(read_only=True)
    materia = MateriaReadSerializer(read_only=True)

    class Meta:
        model = CursoAlumno
        fields = '__all__'

class CursoDocenteSerializer(serializers.ModelSerializer):
    docente = UsuarioSerializer(read_only=True)
    materia = MateriaReadSerializer(read_only=True)

    class Meta:
        model = CursoDocente
        fields = '__all__'

class ActividadSerializer(serializers.ModelSerializer):
    materia = MateriaReadSerializer(read_only=True) # Anida los detalles de la materia

    class Meta:
        model = Actividad
        fields = '__all__'

class SesionActividadSerializer(serializers.ModelSerializer):
    actividad = ActividadSerializer(read_only=True) # Anida los detalles de la actividad
    alumno = UsuarioSerializer(read_only=True)     # Anida los detalles del alumno

    class Meta:
        model = SesionActividad
        fields = '__all__'

class AnalisisEmocionSerializer(serializers.ModelSerializer):
    sesion = SesionActividadSerializer(read_only=True) # Anida los detalles de la sesión de actividad

    class Meta:
        model = AnalisisEmocion
        fields = '__all__'

class CalificacionSerializer(serializers.ModelSerializer):
    sesion = SesionActividadSerializer(read_only=True) # Anida los detalles de la sesión
    docente = UsuarioSerializer(read_only=True)     # Anida los detalles del docente

    class Meta:
        model = Calificacion
        fields = '__all__'