import { API_BASE_URL } from './config'; // Asegúrate de que API_BASE_URL esté definido

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
    // Si no hay token, lanzar un error para que la aplicación lo maneje (ej. redirigir al login)
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
    // Si la respuesta no es exitosa (ej. 401, 403, 404, 500)
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    const errorMessage = errorData.detail || errorData.message || `Error: ${response.status} ${response.statusText}`;
    console.error(`Error en la solicitud a ${endpoint}:`, errorMessage, errorData);
    throw new Error(`Error al obtener ${endpoint}: ${errorMessage}`);
  }

  // Devolver el JSON parseado si la respuesta es exitosa
  return response.json() as Promise<T>;
}