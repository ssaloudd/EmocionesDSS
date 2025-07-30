import { authenticatedFetch } from './authenticated-api'; // Import the new authenticated fetch utility
import { Materia } from './subjects'; // For the nested Materia object

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
  let endpoint = '/api/actividades/';
  if (materiaId) {
    endpoint += `?materia=${materiaId}`;
  }
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  return authenticatedFetch<Actividad[]>(endpoint);
}

/**
 * Crea una nueva actividad.
 * @param payload Los datos de la actividad a crear.
 * @returns Una promesa que resuelve a la nueva Actividad creada.
 */
export async function createActivity(payload: CreateUpdateActividadPayload): Promise<Actividad> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  return authenticatedFetch<Actividad>('/api/actividades/', {
    method: "POST",
    // authenticatedFetch ya establece 'Content-Type': 'application/json' por defecto
    body: JSON.stringify(payload),
  });
}

/**
 * Actualiza una actividad existente.
 * @param id El ID de la actividad a actualizar.
 * @param payload Los datos actualizados de la actividad.
 * @returns Una promesa que resuelve a la Actividad actualizada.
 */
export async function updateActivity(id: number, payload: CreateUpdateActividadPayload): Promise<Actividad> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  return authenticatedFetch<Actividad>(`/api/actividades/${id}/`, {
    method: "PUT", // O "PATCH" para actualización parcial
    // authenticatedFetch ya establece 'Content-Type': 'application/json' por defecto
    body: JSON.stringify(payload),
  });
}

/**
 * Elimina una actividad.
 * @param id El ID de la actividad a eliminar.
 * @returns Una promesa que resuelve a true si la eliminación fue exitosa.
 */
export async function deleteActivity(id: number): Promise<boolean> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  await authenticatedFetch<void>(`/api/actividades/${id}/`, { // authenticatedFetch devuelve Promise<T>
    method: "DELETE",
  });
  return true; // Si authenticatedFetch no lanzó un error, la eliminación fue exitosa
}
