// Define la URL base de tu API de Django
// No es necesario definir API_URL aquí si authenticatedFetch ya lo usa internamente
import { authenticatedFetch } from './authenticated-api'; // Importa la nueva función

import { Usuario } from './users'; // Necesitamos la interfaz Usuario para CursoDocenteMinimal

// Minimal interface for CursoDocente when nested in Materia's cursodocente_set
// Solo necesitamos el ID del docente para el filtro en el frontend
export interface CursoDocenteMinimal {
  id: number;
  docente: { id: number }; // Solo el ID del docente
}

// Interfaz para el objeto Materia tal como lo devuelve Django MateriaSerializer con depth=1
export interface Materia {
  id: number;
  nombre: string;
  nrc: string;
  descripcion: string;
  nivel: {
    id: number;
    nombre: string;
  };
  // CAMBIO CLAVE: Añadir la relación inversa cursodocente_set
  // Es opcional porque puede que no siempre esté presente o completamente poblado
  cursodocente_set?: CursoDocenteMinimal[]; 
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
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  return authenticatedFetch<Materia[]>('/api/materias/');
}

/**
 * Crea una nueva materia.
 * @param subject Los datos de la materia a crear.
 * @returns Una promesa que resuelve a la nueva Materia creada.
 */
export async function createSubject(subject: CreateUpdateMateriaPayload): Promise<Materia> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  return authenticatedFetch<Materia>('/api/materias/', {
    method: "POST",
    // authenticatedFetch ya establece 'Content-Type': 'application/json' por defecto
    body: JSON.stringify(subject),
  });
}

/**
 * Actualiza una materia existente.
 * @param id El ID de la materia a actualizar.
 * @param subject Los datos actualizados de la materia.
 * @returns Una promesa que resuelve a la Materia actualizada.
 */
export async function updateSubject(id: number, subject: CreateUpdateMateriaPayload): Promise<Materia> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  return authenticatedFetch<Materia>(`/api/materias/${id}/`, {
    method: "PUT", // O "PATCH" si solo envías campos parciales
    // authenticatedFetch ya establece 'Content-Type': 'application/json' por defecto
    body: JSON.stringify(subject),
  });
}

/**
 * Elimina una materia.
 * @param id El ID de la materia a eliminar.
 * @returns Una promesa que resuelve a true si la eliminación fue exitosa.
 */
export async function deleteSubject(id: number): Promise<boolean> {
  // Usa authenticatedFetch para incluir el token y manejar la URL base
  await authenticatedFetch<void>(`/api/materias/${id}/`, { // authenticatedFetch devuelve Promise<T>
    method: "DELETE",
  });
  return true; // Si authenticatedFetch no lanzó un error, la eliminación fue exitosa
}
