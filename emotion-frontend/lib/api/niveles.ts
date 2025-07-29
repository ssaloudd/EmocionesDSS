import { authenticatedFetch } from './authenticated-api'; // Importa la nueva función

export interface Nivel {
  id: number;
  nombre: string;
}

export interface CreateUpdateNivelPayload {
  nombre: string;
}

/**
 * Obtiene todos los niveles desde la API.
 * @returns Una promesa que resuelve a un array de objetos Nivel.
 */
export async function getNiveles(): Promise<Nivel[]> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  return authenticatedFetch<Nivel[]>('/api/niveles/');
}

/**
 * Crea un nuevo Nivel.
 * @param nivel Los datos de Nivel a crear.
 * @returns Una promesa que resuelve a nuevo Nivel creado.
 */
export async function createNivel(nivel: CreateUpdateNivelPayload): Promise<Nivel> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  return authenticatedFetch<Nivel>('/api/niveles/', {
    method: "POST",
    // authenticatedFetch ya establece 'Content-Type': 'application/json' por defecto
    body: JSON.stringify(nivel),
  });
}

/**
 * Actualiza una Nivel existente.
 * @param id El ID de la Nivel a actualizar.
 * @param nivel Los datos actualizados de la Nivel.
 * @returns Una promesa que resuelve a la Nivel actualizada.
 */
export async function updateNivel(id: number, nivel: CreateUpdateNivelPayload): Promise<Nivel> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  return authenticatedFetch<Nivel>(`/api/niveles/${id}/`, {
    method: "PUT", // O "PATCH" para actualización parcial
    // authenticatedFetch ya establece 'Content-Type': 'application/json' por defecto
    body: JSON.stringify(nivel),
  });
}

/**
 * Elimina una Nivel.
 * @param id El ID de la Nivel a eliminar.
 * @returns Una promesa que resuelve a true si la eliminación fue exitosa.
 */
export async function deleteNivel(id: number): Promise<boolean> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  await authenticatedFetch<void>(`/api/niveles/${id}/`, { // authenticatedFetch devuelve Promise<T>
    method: "DELETE",
  });
  return true; // Si authenticatedFetch no lanzó un error, la eliminación fue exitosa
}
