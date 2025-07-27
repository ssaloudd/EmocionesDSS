const API_URL = "http://localhost:8000/api";

export interface Nivel {
  id: number;
  nombre: string;
}

export interface CreateUpdateNivelPayload {
  nombre: string;
}

export async function getNiveles(): Promise<Nivel[]> {
  const res = await fetch(`${API_URL}/niveles/`);
  if (!res.ok) {
    throw new Error(`Error al obtener niveles: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Crea un nueva Nivel.
 * @param nivel Los datos de Nivel a crear.
 * @returns Una promesa que resuelve a nuevo Nivel creado.
 */
export async function createNivel(nivel: CreateUpdateNivelPayload): Promise<Nivel> {
  const res = await fetch(`${API_URL}/niveles/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nivel),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al crear nivel: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Actualiza una Nivel existente.
 * @param id El ID de la Nivel a actualizar.
 * @param nivel Los datos actualizados de la Nivel.
 * @returns Una promesa que resuelve a la Nivel actualizada.
 */
export async function updateNivel(id: number, nivel: CreateUpdateNivelPayload): Promise<Nivel> {
  const res = await fetch(`${API_URL}/niveles/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nivel),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al actualizar nivel: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Elimina una Nivel.
 * @param id El ID de la Nivel a eliminar.
 * @returns Una promesa que resuelve a true si la eliminación fue exitosa.
 */
export async function deleteNivel(id: number): Promise<boolean> {
  const res = await fetch(`${API_URL}/niveles/${id}/`, {
    method: "DELETE",
  });
  // Para DELETE, res.ok es suficiente para saber si fue exitoso (status 204 No Content)
  if (!res.ok) {
    throw new Error(`Error al eliminar nivel: ${res.statusText}`);
  }
  return res.ok;
}