// lib/api/calificaciones.ts

import { authenticatedFetch } from './authenticated-api'; // Importa la utilidad de fetch autenticado
import { SesionActividad } from './sesiones_actividad'; // Para el objeto SesionActividad anidado
import { Usuario } from './users';     // Para el objeto Usuario anidado

// Interfaz para la lectura de Calificacion
// Refleja la estructura que devuelve el backend con objetos anidados para sesion y docente.
export interface Calificacion {
  id: number;
  sesion: SesionActividad; // Objeto SesionActividad completo
  docente: Usuario;       // Objeto Usuario completo (rol: 'docente')
  nota: number;
  observaciones: string | null; // Puede ser null
  fecha_calificacion: string; // Formato ISO string (ej. "YYYY-MM-DD")
}

// Interfaz para la escritura de Calificacion (creación)
// Espera IDs para las relaciones ForeignKey y los campos editables.
export interface CreateCalificacionPayload {
  sesion: number;    // ID de la SesionActividad
  docente: number;   // ID del Usuario con rol 'docente'
  nota: number;
  observaciones?: string | null; // Opcional, ya que puede ser null en el modelo
}

// Interfaz para la actualización de Calificacion
// Permite actualizar solo los campos que se espera que cambien.
export interface UpdateCalificacionPayload {
  nota?: number;
  observaciones?: string | null;
  // Generalmente, 'sesion' y 'docente' no se actualizan después de la creación.
  // Si tu backend lo permite, podrías incluirlos como 'number'.
}

/**
 * Obtiene todas las calificaciones desde la API.
 * @returns Una promesa que resuelve a un array de objetos Calificacion.
 */
export async function getCalificaciones(): Promise<Calificacion[]> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  return authenticatedFetch<Calificacion[]>('/api/calificaciones/');
}

/**
 * Obtiene una calificación por su ID.
 * @param id El ID de la calificación.
 * @returns Una promesa que resuelve a un objeto Calificacion.
 */
export async function getCalificacionById(id: number): Promise<Calificacion> {
  return authenticatedFetch<Calificacion>(`/api/calificaciones/${id}/`);
}

/**
 * Crea una nueva calificación.
 * @param payload Los datos para crear la calificación.
 * @returns Una promesa que resuelve a la nueva Calificacion creada.
 */
export async function createCalificacion(payload: CreateCalificacionPayload): Promise<Calificacion> {
  return authenticatedFetch<Calificacion>('/api/calificaciones/', {
    method: "POST",
    // authenticatedFetch ya establece 'Content-Type': 'application/json'
    body: JSON.stringify(payload),
  });
}

/**
 * Actualiza una calificación existente.
 * @param id El ID de la calificación a actualizar.
 * @param payload Los datos actualizados de la calificación.
 * @returns Una promesa que resuelve a la Calificacion actualizada.
 */
export async function updateCalificacion(id: number, payload: UpdateCalificacionPayload): Promise<Calificacion> {
  return authenticatedFetch<Calificacion>(`/api/calificaciones/${id}/`, {
    method: "PATCH", // Usa PATCH para actualizaciones parciales
    body: JSON.stringify(payload),
  });
}

/**
 * Elimina una calificación.
 * @param id El ID de la calificación a eliminar.
 * @returns Una promesa que resuelve a true si la eliminación fue exitosa.
 */
export async function deleteCalificacion(id: number): Promise<boolean> {
  // Para DELETE, el backend suele devolver 204 No Content, por lo que no hay JSON.
  // authenticatedFetch lanzará un error si la respuesta no es 2xx.
  await authenticatedFetch<void>(`/api/calificaciones/${id}/`, {
    method: "DELETE",
  });
  return true; // Si no hay error, se considera exitoso
}
