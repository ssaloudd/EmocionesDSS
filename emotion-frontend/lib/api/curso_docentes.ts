const API_URL = "http://localhost:8000/api";

// Importar interfaces necesarias de otros módulos
import { Materia } from './subjects'; // Para el objeto Materia anidado
import { Usuario } from './users';   // Para el objeto Usuario anidado

// Interfaz para la lectura de CursoDocente (viene del backend con objetos anidados)
export interface CursoDocente {
  id: number;
  docente: Usuario; // Objeto Usuario completo
  materia: Materia; // Objeto Materia completo
}

// Interfaz para la escritura de CursoDocente (espera IDs)
export interface CreateCursoDocentePayload {
  docente: number; // Solo el ID del docente
  materia: number; // Solo el ID de la materia
}

// Interfaz para la operación de asignación masiva
export interface BulkAssignmentPayload {
  materia_id: number;
  docente_ids: number[]; // Lista de IDs de docentes
}

/**
 * Obtiene todas las asignaciones de cursos a docentes.
 * @returns Una promesa que resuelve a un array de objetos CursoDocente.
 */
export async function getCursoDocentes(): Promise<CursoDocente[]> {
  const res = await fetch(`${API_URL}/curso-docentes/`);
  if (!res.ok) {
    throw new Error(`Error al obtener asignaciones de docentes: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Crea una nueva asignación de curso para un docente.
 * (Aunque usaremos más el bulk, esta es para casos individuales)
 * @param payload Los datos de la asignación a crear.
 * @returns Una promesa que resuelve a la nueva asignación creada.
 */
export async function createCursoDocente(payload: CreateCursoDocentePayload): Promise<CursoDocente> {
  const res = await fetch(`${API_URL}/curso-docentes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al crear asignación: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Elimina una asignación de curso.
 * @param id El ID de la asignación a eliminar.
 * @returns Una promesa que resuelve a true si la eliminación fue exitosa.
 */
export async function deleteCursoDocente(id: number): Promise<boolean> {
  const res = await fetch(`${API_URL}/curso-docentes/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Error al eliminar asignación: ${res.statusText}`);
  }
  return res.ok;
}

/**
 * Realiza una asignación masiva de docentes a una materia.
 * @param payload Los datos para la asignación masiva (materia_id, docente_ids).
 * @returns Una promesa que resuelve a la respuesta del backend.
 */
export async function bulkAssignTeachers(payload: BulkAssignmentPayload): Promise<any> {
  const res = await fetch(`${API_URL}/curso-docentes/bulk_assign/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error en asignación masiva: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}