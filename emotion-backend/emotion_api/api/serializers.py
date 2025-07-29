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



# --- Serializadores de CursoDocente (Minimal para MateriaReadSerializer) ---
# Este serializador es solo para anidar la relación inversa cursodocente_set en MateriaReadSerializer
class CursoDocenteMinimalSerializer(serializers.ModelSerializer):
    # Solo necesitamos el ID del docente para el filtro en el frontend
    docente = serializers.PrimaryKeyRelatedField(read_only=True) 

    class Meta:
        model = CursoDocente
        fields = ['id', 'docente'] # Incluimos el ID de la relación y el ID del docente



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
    # Usamos CursoDocenteMinimalSerializer para evitar la recursión infinita
    cursodocente_set = CursoDocenteMinimalSerializer(many=True, read_only=True) 

    class Meta:
        model = Materia
        fields = '__all__'



# --- Serializadores de CursoAlumno (Separados para Lectura y Escritura) ---

# Serializador para la lectura de CursoAlumno (GET): Anida objetos completos de Alumno (Usuario) y Materia
class CursoAlumnoReadSerializer(serializers.ModelSerializer):
    # Usamos UsuarioSerializer para el alumno
    alumno = UsuarioSerializer(read_only=True) 
    # Usamos MateriaReadSerializer para la materia
    materia = MateriaReadSerializer(read_only=True)

    class Meta:
        model = CursoAlumno
        fields = '__all__'

# Serializador para la escritura de CursoAlumno (POST, PUT, PATCH): Espera IDs para las relaciones FK
class CursoAlumnoWriteSerializer(serializers.ModelSerializer):
    alumno = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.filter(rol='alumno'))
    materia = serializers.PrimaryKeyRelatedField(queryset=Materia.objects.all())

    class Meta:
        model = CursoAlumno
        fields = '__all__'

# Serializador para operación de inscripción masiva de alumnos: Espera ID de materia y una lista de IDs de alumnos
class BulkEnrollmentSerializer(serializers.Serializer):
    materia_id = serializers.IntegerField() # El ID de la materia
    alumno_ids = serializers.ListField(
        child=serializers.IntegerField(), # Una lista de IDs enteros
        min_length=1 # Al menos un alumno debe ser seleccionado
    )

    def validate_materia_id(self, value):
        # Validar que la materia exista
        try:
            Materia.objects.get(id=value)
        except Materia.DoesNotExist:
            raise serializers.ValidationError("La materia especificada no existe.")
        return value
    
    def validate_alumno_ids(self, values):
        # Validar que todos los IDs de alumnos existan y tengan el rol 'alumno'
        existing_alumno_ids = Usuario.objects.filter(id__in=values, rol='alumno').values_list('id', flat=True)
        if len(existing_alumno_ids) != len(values):
            missing_ids = set(values) - set(existing_alumno_ids)
            raise serializers.ValidationError(f"Algunos IDs de alumnos no son válidos o no tienen el rol 'alumno': {list(missing_ids)}")
        return values



# --- Serializadores de CursoDocente (Separados para Lectura y Escritura) ---

# Serializador para la lectura de CursoDocente (GET): Anida objetos completos de Docente (Usuario) y Materia
class CursoDocenteReadSerializer(serializers.ModelSerializer):
    docente = UsuarioSerializer(read_only=True)
    materia = MateriaReadSerializer(read_only=True)

    class Meta:
        model = CursoDocente
        fields = '__all__'

# Serializador para la escritura de CursoDocente (POST, PUT, PATCH): Espera IDs para las relaciones FK
class CursoDocenteWriteSerializer(serializers.ModelSerializer):
    docente = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.filter(rol='docente'))
    materia = serializers.PrimaryKeyRelatedField(queryset=Materia.objects.all())

    class Meta:
        model = CursoDocente
        fields = '__all__'

# Serializador para la operación de asignación masiva de docentes: Espera ID de materia y una lista de IDs de docentes
class BulkAssignmentSerializer(serializers.Serializer):
    materia_id = serializers.IntegerField()
    docente_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )

    def validate_materia_id(self, value):
        try:
            Materia.objects.get(id=value)
        except Materia.DoesNotExist:
            raise serializers.ValidationError("La materia especificada no existe.")
        return value
    
    def validate_docente_ids(self, values):
        existing_docente_ids = Usuario.objects.filter(id__in=values, rol='docente').values_list('id', flat=True)
        if len(existing_docente_ids) != len(values):
            missing_ids = set(values) - set(existing_docente_ids)
            raise serializers.ValidationError(f"Algunos IDs de docentes no son válidos o no tienen el rol 'docente': {list(missing_ids)}")
        return values



# --- Serializadores de Actividad ---

# Serializador para escritura de Actividad (POST, PUT, PATCH): Espera ID de la Materia para la relación FK
class ActividadWriteSerializer(serializers.ModelSerializer):
    materia = serializers.PrimaryKeyRelatedField(queryset=Materia.objects.all())

    class Meta:
        model = Actividad
        fields = '__all__'

# Serializador para lectura de Actividad (GET): Anida el objeto Materia completo usando MateriaReadSerializer
class ActividadReadSerializer(serializers.ModelSerializer):
    materia = MateriaReadSerializer() # Anidamos el serializador de Materia para lectura

    class Meta:
        model = Actividad
        fields = '__all__'



# --- Serializadores de SesionActividad ---

# Serializador para escritura de SesionActividad (POST, PUT, PATCH): Espera IDs para las relaciones ForeignKey
class SesionActividadWriteSerializer(serializers.ModelSerializer):
    actividad = serializers.PrimaryKeyRelatedField(queryset=Actividad.objects.all())
    alumno = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.filter(rol='alumno'))

    class Meta:
        model = SesionActividad
        fields = '__all__'
        read_only_fields = ['fecha_hora_inicio_real', 'fecha_hora_fin_real'] # Estos campos se gestionan en el backend

# Serializador para lectura de SesionActividad (GET): Anida objetos completos de Actividad y Alumno
class SesionActividadReadSerializer(serializers.ModelSerializer):
    actividad = ActividadReadSerializer() # Anida el serializador de Actividad para lectura
    alumno = UsuarioSerializer() # Anida el serializador de Usuario para lectura

    class Meta:
        model = SesionActividad
        fields = '__all__'



# --- Serializadores de AnalisisEmocion ---

# Serializador para escritura de AnalisisEmocion (POST, PUT, PATCH): Espera ID de la SesionActividad para la relación ForeignKey
class AnalisisEmocionWriteSerializer(serializers.ModelSerializer):
    sesion = serializers.PrimaryKeyRelatedField(queryset=SesionActividad.objects.all())

    class Meta:
        model = AnalisisEmocion
        fields = '__all__'

# Serializador para lectura de AnalisisEmocion (GET): Anida objeto SesionActividad completo usando SesionActividadReadSerializer
class AnalisisEmocionReadSerializer(serializers.ModelSerializer):
    sesion = SesionActividadReadSerializer() # Anida el serializador de SesionActividad para lectura

    class Meta:
        model = AnalisisEmocion
        fields = '__all__'



# --- Serializadores de Calificacion ---

class CalificacionWriteSerializer(serializers.ModelSerializer):
    sesion = serializers.PrimaryKeyRelatedField(queryset=SesionActividad.objects.all())
    docente = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.filter(rol='docente')) 

    class Meta:
        model = Calificacion
        fields = ['id', 'sesion', 'docente', 'nota', 'observaciones']
        read_only_fields = ['fecha_calificacion'] # 'fecha_calificacion' se gestiona automáticamente

    def validate(self, data):
        return data

# Serializador para la lectura de Calificacion (GET)
# Anida los objetos completos de SesionActividad y Usuario (docente)
class CalificacionReadSerializer(serializers.ModelSerializer):
    sesion = SesionActividadReadSerializer() # Anida el serializador de SesionActividad para lectura
    docente = UsuarioSerializer() # Anida el serializador de Usuario para lectura

    class Meta:
        model = Calificacion
        fields = '__all__'



# Nuevo Serializador para los datos del frame de emoción
class EmotionFrameSerializer(serializers.Serializer):
    sesion_id = serializers.IntegerField()
    frame_base64 = serializers.CharField()
    momento_segundo = serializers.IntegerField()