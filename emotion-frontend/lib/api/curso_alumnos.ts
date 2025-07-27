const API_URL = "http://localhost:8000/api";

// Importar interfaces necesarias de otros módulos
import { Materia } from './subjects'; // Para el objeto Materia anidado
import { Usuario } from './users';   // Para el objeto Usuario anidado

// Interfaz para la lectura de CursoAlumno (viene del backend con objetos anidados)
export interface CursoAlumno {
  id: number;
  alumno: Usuario; // Objeto Usuario completo
  materia: Materia; // Objeto Materia completo
  fecha_inscripcion: string; // La fecha como string (ej. "YYYY-MM-DD")
}

// Interfaz para la escritura de CursoAlumno (espera IDs)
export interface CreateCursoAlumnoPayload {
  alumno: number; // Solo el ID del alumno
  materia: number; // Solo el ID de la materia
}

// Interfaz para la operación de inscripción masiva
export interface BulkEnrollmentPayload {
  materia_id: number;
  alumno_ids: number[]; // Lista de IDs de alumnos
}

/**
 * Obtiene todas las inscripciones de cursos.
 * @returns Una promesa que resuelve a un array de objetos CursoAlumno.
 */
export async function getCursoAlumnos(): Promise<CursoAlumno[]> {
  const res = await fetch(`${API_URL}/curso-alumnos/`);
  if (!res.ok) {
    throw new Error(`Error al obtener inscripciones de alumnos: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Crea una nueva inscripción de curso para un alumno.
 * (Aunque usaremos más el bulk, esta es para casos individuales)
 * @param payload Los datos de la inscripción a crear.
 * @returns Una promesa que resuelve a la nueva inscripción creada.
 */
export async function createCursoAlumno(payload: CreateCursoAlumnoPayload): Promise<CursoAlumno> {
  const res = await fetch(`${API_URL}/curso-alumnos/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al crear inscripción: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Elimina una inscripción de curso.
 * @param id El ID de la inscripción a eliminar.
 * @returns Una promesa que resuelve a true si la eliminación fue exitosa.
 */
export async function deleteCursoAlumno(id: number): Promise<boolean> {
  const res = await fetch(`${API_URL}/curso-alumnos/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Error al eliminar inscripción: ${res.statusText}`);
  }
  return res.ok;
}

/**
 * Realiza una inscripción masiva de alumnos a una materia.
 * @param payload Los datos para la inscripción masiva (materia_id, alumno_ids).
 * @returns Una promesa que resuelve a la respuesta del backend.
 */
export async function bulkEnrollStudents(payload: BulkEnrollmentPayload): Promise<any> {
  const res = await fetch(`${API_URL}/curso-alumnos/bulk_enroll/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error en inscripción masiva: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}