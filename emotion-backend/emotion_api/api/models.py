from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser

# Roles de usuario
class Usuario(AbstractUser):
    GENEROS = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]
    ROLES = [
        ('alumno', 'Alumno'),
        ('docente', 'Docente'),
        ('admin', 'Administrador'),
    ]
    genero = models.CharField(max_length=1, choices=GENEROS)
    CI = models.CharField(max_length=20, unique=True)
    rol = models.CharField(max_length=10, choices=ROLES)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.rol})"

# Nivel académico (ej: "Séptimo")
class Nivel(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre

# Materia relacionada a un nivel
class Materia(models.Model):
    nivel = models.ForeignKey(Nivel, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    nrc = models.CharField(max_length=10)
    descripcion = models.TextField()

    def __str__(self):
        return self.nombre

# Relación alumnos - materias
class CursoAlumno(models.Model):
    alumno = models.ForeignKey(Usuario, on_delete=models.CASCADE, limit_choices_to={'rol': 'alumno'})
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)
    fecha_inscripcion = models.DateField(auto_now_add=True)

# Relación docentes - materias
class CursoDocente(models.Model):
    docente = models.ForeignKey(Usuario, on_delete=models.CASCADE, limit_choices_to={'rol': 'docente'})
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)

# Actividad programada en una materia
class Actividad(models.Model):
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    fecha_inicio = models.DateTimeField()
    duracion_analisis_minutos = models.PositiveIntegerField(default=30)

    def __str__(self):
        return f"{self.nombre} ({self.materia.nombre})"

# Sesión en la que un alumno realiza una actividad
class SesionActividad(models.Model):
    actividad = models.ForeignKey(Actividad, on_delete=models.CASCADE)
    alumno = models.ForeignKey(Usuario, on_delete=models.CASCADE, limit_choices_to={'rol': 'alumno'})
    fecha_hora_inicio_real = models.DateTimeField()
    #duracion_grabacion_segundos = models.PositiveIntegerField()   SI SE QUIERE GUARDAR GRABACIÓN

# Análisis emocional asociado a una sesión
class AnalisisEmocion(models.Model):
    EMOCIONES = [
        ('enojo', 'Enojo'),
        ('disgusto', 'Disgusto'),
        ('miedo', 'Miedo'),
        ('felicidad', 'Felicidad'),
        ('tristeza', 'Tristeza'),
        ('sorpresa', 'Sorpresa'),
        ('neutral', 'Neutral')
    ]

    sesion = models.ForeignKey(SesionActividad, on_delete=models.CASCADE)
    momento_segundo = models.PositiveIntegerField()
    emocion_predominante = models.CharField(max_length=20, choices=EMOCIONES)
    confianza_emocion = models.FloatField()
    datos_raw_emociones = models.JSONField()

# Calificación dada a una sesión
class Calificacion(models.Model):
    sesion = models.ForeignKey(SesionActividad, on_delete=models.CASCADE)
    docente = models.ForeignKey(Usuario, on_delete=models.CASCADE, limit_choices_to={'rol': 'docente'})
    nota = models.FloatField()
    observaciones = models.TextField(null=True, blank=True)
    fecha_calificacion = models.DateField(auto_now_add=True)