// Define la URL base de API de Django
const API_URL = "http://localhost:8000/api";

// Interfaz para el objeto Materia tal como lo devuelve Django MateriaSerializer con depth=1
// 'nivel' será un objeto anidado con 'id' y 'nombre'
export interface Materia {
  id: number;
  nombre: string;
  nrc: string;
  descripcion: string;
  nivel: {
    id: number;
    nombre: string;
  };
}

// Interfaz para los datos que se envían al crear/actualizar una Materia
// Para 'nivel', se espera solo el ID del Nivel
export interface CreateUpdateMateriaPayload {
  nombre: string;
  nrc: string;
  descripcion: string;
  nivel: number; // Aquí se envía solo el ID del nivel
}

/**
 * Obtiene todas las materias desde la API.
 * @returns Una promesa que resuelve a un array de objetos Materia.
 */
export async function getSubjects(): Promise<Materia[]> {
  // Usar backticks (`) para la interpolación de cadenas
  const res = await fetch(`${API_URL}/materias/`);
  if (!res.ok) {
    throw new Error(`Error al obtener materias: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Crea una nueva materia.
 * @param subject Los datos de la materia a crear.
 * @returns Una promesa que resuelve a la nueva Materia creada.
 */
export async function createSubject(subject: CreateUpdateMateriaPayload): Promise<Materia> {
  const res = await fetch(`${API_URL}/materias/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subject),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al crear materia: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Actualiza una materia existente.
 * @param id El ID de la materia a actualizar.
 * @param subject Los datos actualizados de la materia.
 * @returns Una promesa que resuelve a la Materia actualizada.
 */
export async function updateSubject(id: number, subject: CreateUpdateMateriaPayload): Promise<Materia> {
  const res = await fetch(`${API_URL}/materias/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subject),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al actualizar materia: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Elimina una materia.
 * @param id El ID de la materia a eliminar.
 * @returns Una promesa que resuelve a true si la eliminación fue exitosa.
 */
export async function deleteSubject(id: number): Promise<boolean> {
  const res = await fetch(`${API_URL}/materias/${id}/`, {
    method: "DELETE",
  });
  // Para DELETE, res.ok es suficiente para saber si fue exitoso (status 204 No Content)
  if (!res.ok) {
    throw new Error(`Error al eliminar materia: ${res.statusText}`);
  }
  return res.ok;
}