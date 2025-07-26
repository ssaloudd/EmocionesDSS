const API_URL = "http://localhost:8000/api";

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
  const res = await fetch(`${API_URL}/sesiones-actividad/${id}/`);
  if (!res.ok) {
    throw new Error(`Error al obtener sesión de actividad: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Crea una nueva sesión de actividad.
 * @param payload Los datos para crear la sesión.
 * @returns Una promesa que resuelve a la nueva SesionActividad creada.
 */
export async function createSesionActividad(payload: CreateSesionActividadPayload): Promise<SesionActividad> {
  const res = await fetch(`${API_URL}/sesiones-actividad/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al crear sesión de actividad: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Finaliza una sesión de actividad.
 * @param id El ID de la sesión a finalizar.
 * @returns Una promesa que resuelve a la SesionActividad actualizada.
 */
export async function endSesionActividad(id: number): Promise<SesionActividad> {
  const res = await fetch(`${API_URL}/sesiones-actividad/${id}/end_session/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // Aunque no envíe body, es buena práctica
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al finalizar sesión de actividad: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
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
  const res = await fetch(`${API_URL}/emocion-detection/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al enviar frame de emoción: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}