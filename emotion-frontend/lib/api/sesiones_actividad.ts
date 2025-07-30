// lib/api/sesiones_actividad.ts

// No es necesario definir API_URL aquí si authenticatedFetch ya lo usa internamente
import { authenticatedFetch } from './authenticated-api'; // Importa la utilidad de fetch autenticado
import { Actividad } from './actividades'; // Para el objeto Actividad anidado
import { Usuario } from './users';     // Para el objeto Usuario anidado

// Interfaz para la lectura de SesionActividad
export interface SesionActividad {
  id: number;
  actividad: Actividad; // Objeto Actividad completo
  alumno: Usuario;     // Objeto Usuario completo
  fecha_hora_inicio_real: string; // ISO string
  fecha_hora_fin_real: string | null; // ISO string o null
}

// Interfaz para la escritura de SesionActividad (creación)
export interface CreateSesionActividadPayload {
  actividad: number; // ID de la actividad
  alumno: number;    // ID del alumno
}

/**
 * Obtiene una sesión de actividad por su ID.
 * @param id El ID de la sesión.
 * @returns Una promesa que resuelve a un objeto SesionActividad.
 */
export async function getSesionActividad(id: number): Promise<SesionActividad> {
  // CAMBIO CLAVE AQUÍ: Solo la ruta relativa
  return authenticatedFetch<SesionActividad>(`/api/sesiones-actividad/${id}/`);
}

/**
 * Obtiene TODAS las sesiones de actividad.
 * @returns Una promesa que resuelve a un array de objetos SesionActividad.
 */
export async function getAllSesionesActividad(): Promise<SesionActividad[]> {
  // CAMBIO CLAVE AQUÍ: Solo la ruta relativa
  return authenticatedFetch<SesionActividad[]>(`/api/sesiones-actividad/`);
}


/**
 * Crea una nueva sesión de actividad.
 * @param payload Los datos para crear la sesión.
 * @returns Una promesa que resuelve a la nueva SesionActividad creada.
 */
export async function createSesionActividad(payload: CreateSesionActividadPayload): Promise<SesionActividad> {
  // CAMBIO CLAVE AQUÍ: Solo la ruta relativa
  const res = await authenticatedFetch<SesionActividad>(`/api/sesiones-actividad/`, {
    method: "POST",
    // authenticatedFetch ya establece 'Content-Type': 'application/json'
    body: JSON.stringify(payload),
  });
  return res; // authenticatedFetch ya maneja el res.json() y errores
}

/**
 * Finaliza una sesión de actividad.
 * @param id El ID de la sesión a finalizar.
 * @returns Una promesa que resuelve a la SesionActividad actualizada.
 */
export async function endSesionActividad(id: number): Promise<SesionActividad> {
  // CAMBIO CLAVE AQUÍ: Solo la ruta relativa
  const res = await authenticatedFetch<SesionActividad>(`/api/sesiones-actividad/${id}/end_session/`, {
    method: "POST",
    // authenticatedFetch ya establece 'Content-Type': 'application/json'
  });
  return res; // authenticatedFetch ya maneja el res.json() y errores
}

/**
 * Envía un frame de video para análisis de emoción.
 * @param sesionId El ID de la sesión de actividad.
 * @param frameBase64 El frame de imagen codificado en Base64.
 * @param momentoSegundo El momento en segundos de la sesión.
 * @returns Una promesa que resuelve a la respuesta del análisis.
 */
export async function sendEmotionFrame(sesionId: number, frameBase64: string, momentoSegundo: number): Promise<any> {
  const payload = {
    sesion_id: sesionId,
    frame_base64: frameBase64,
    momento_segundo: momentoSegundo,
  };
  // CAMBIO CLAVE AQUÍ: Solo la ruta relativa
  const res = await authenticatedFetch<any>(`/api/emocion-detection/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res; // authenticatedFetch ya maneja el res.json() y errores
}
