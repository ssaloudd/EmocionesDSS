const API_URL = "http://localhost:8000/api";

import { Materia } from './subjects'; // Para el objeto Materia anidado

// Interfaz para la lectura de Actividad
export interface Actividad {
  id: number;
  materia: Materia; // Objeto Materia completo
  nombre: string;
  descripcion: string;
  fecha_inicio: string; // Formato ISO 8601 (ej. "2023-10-27T10:00:00Z")
  duracion_analisis_minutos: number;
}

// Interfaz para la escritura de Actividad (espera IDs para relaciones)
export interface CreateUpdateActividadPayload {
  materia: number; // Solo el ID de la materia
  nombre: string;
  descripcion: string;
  fecha_inicio: string; // Formato ISO 8601
  duracion_analisis_minutos: number;
}

/**
 * Obtiene actividades desde la API, opcionalmente filtrando por ID de materia.
 * @param materiaId Opcional. Si se proporciona, filtra las actividades por esta materia.
 * @returns Una promesa que resuelve a un array de objetos Actividad.
 */
export async function getActivities(materiaId?: number): Promise<Actividad[]> {
  let url = `${API_URL}/actividades/`;
  if (materiaId) {
    url += `?materia=${materiaId}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al obtener actividades: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Crea una nueva actividad.
 * @param payload Los datos de la actividad a crear.
 * @returns Una promesa que resuelve a la nueva Actividad creada.
 */
export async function createActivity(payload: CreateUpdateActividadPayload): Promise<Actividad> {
  const res = await fetch(`${API_URL}/actividades/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al crear actividad: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Actualiza una actividad existente.
 * @param id El ID de la actividad a actualizar.
 * @param payload Los datos actualizados de la actividad.
 * @returns Una promesa que resuelve a la Actividad actualizada.
 */
export async function updateActivity(id: number, payload: CreateUpdateActividadPayload): Promise<Actividad> {
  const res = await fetch(`${API_URL}/actividades/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al actualizar actividad: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Elimina una actividad.
 * @param id El ID de la actividad a eliminar.
 * @returns Una promesa que resuelve a true si la eliminación fue exitosa.
 */
export async function deleteActivity(id: number): Promise<boolean> {
  const res = await fetch(`${API_URL}/actividades/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Error al eliminar actividad: ${res.statusText}`);
  }
  return res.ok;
}