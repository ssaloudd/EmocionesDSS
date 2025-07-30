// lib/api/authenticated-api.ts

import { API_BASE_URL } from './config';

/**
 * Realiza una solicitud fetch añadiendo automáticamente el token de autenticación del usuario.
 * @param endpoint El endpoint relativo de la API (ej. '/api/materias/').
 * @param options Opciones estándar de fetch (method, headers, body, etc.).
 * @returns La respuesta de la promesa fetch.
 * @throws Error si no hay token de autenticación o si la respuesta de la API no es exitosa.
 */
export async function authenticatedFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('authToken');

  if (!token) {
    console.error("Error: No hay token de autenticación disponible.");
    throw new Error('Unauthorized: No authentication token found.');
  }

  const headers = {
    ...options?.headers, // Mantener cualquier encabezado existente
    'Authorization': `Token ${token}`, // Añadir el encabezado de autorización
    'Content-Type': 'application/json', // Por defecto, enviar JSON
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = null;
    let responseText = '';
    try {
      responseText = await response.text(); // Primero, intentar obtener el texto crudo de la respuesta
      errorData = JSON.parse(responseText); // Luego, intentar parsearlo como JSON
    } catch (e) {
      // Si no se puede parsear como JSON, es probable que sea una respuesta de texto plano o vacía
      console.warn("Could not parse error response as JSON:", e);
      errorData = { message: responseText || response.statusText || 'Unknown error' }; // Fallback
    }

    let errorMessage = `Error: ${response.status} ${response.statusText}`;

    if (errorData) {
      // Log the full parsed error data for debugging
      console.error("Raw error data from backend (parsed):", errorData); 
      errorMessage = errorData.detail 
                     || errorData.message 
                     || (errorData.non_field_errors && errorData.non_field_errors.join(', '))
                     // Añade más campos de error específicos de DRF si los esperas (ej. para validación de campos)
                     || (errorData.actividad && `Actividad: ${errorData.actividad.join(', ')}`) 
                     || (errorData.alumno && `Alumno: ${errorData.alumno.join(', ')}`) 
                     || JSON.stringify(errorData); // Fallback a stringify si es un objeto complejo
    } else if (responseText) {
      // Log the raw text if it wasn't JSON
      console.error("Raw error data from backend (text):", responseText); 
      errorMessage = responseText;
    }
    
    console.error(`Error in request to ${endpoint}:`, errorMessage);
    throw new Error(`Error al obtener ${endpoint}: ${errorMessage}`);
  }

  // Devolver el JSON parseado si la respuesta es exitosa
  return response.json() as Promise<T>;
}
