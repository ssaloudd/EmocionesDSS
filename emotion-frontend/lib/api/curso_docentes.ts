import { authenticatedFetch } from './authenticated-api'; // Import the new authenticated fetch utility

// Import necessary interfaces from other modules
import { Materia } from './subjects'; // For the nested Materia object
import { Usuario } from './users';    // For the nested Usuario object

// Interface for reading CursoDocente (comes from the backend with nested objects)
export interface CursoDocente {
  id: number;
  docente: Usuario; // Complete Usuario object
  materia: Materia; // Complete Materia object
}

// Interface for writing CursoDocente (expects IDs)
export interface CreateCursoDocentePayload {
  docente: number; // Only the ID of the teacher
  materia: number; // Only the ID of the subject
}

// Interface for the bulk assignment operation
export interface BulkAssignmentPayload {
  materia_id: number;
  docente_ids: number[]; // List of teacher IDs
}

/**
 * Gets all course assignments for teachers.
 * @returns A promise that resolves to an array of CursoDocente objects.
 */
export async function getCursoDocentes(): Promise<CursoDocente[]> {
  // Use authenticatedFetch to include the token and handle the base URL
  return authenticatedFetch<CursoDocente[]>('/api/curso-docentes/');
}

/**
 * Creates a new course assignment for a teacher.
 * (Although bulk assignment will be used more, this is for individual cases)
 * @param payload The data for the assignment to create.
 * @returns A promise that resolves to the newly created assignment.
 */
export async function createCursoDocente(payload: CreateCursoDocentePayload): Promise<CursoDocente> {
  // Use authenticatedFetch to include the token and handle the base URL
  return authenticatedFetch<CursoDocente>('/api/curso-docentes/', {
    method: "POST",
    // authenticatedFetch already sets 'Content-Type': 'application/json' by default
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a course assignment.
 * @param id The ID of the assignment to delete.
 * @returns A promise that resolves to true if the deletion was successful.
 */
export async function deleteCursoDocente(id: number): Promise<boolean> {
  // Use authenticatedFetch to include the token and handle the base URL
  await authenticatedFetch<void>(`/api/curso-docentes/${id}/`, { // authenticatedFetch returns Promise<T>
    method: "DELETE",
  });
  return true; // If authenticatedFetch did not throw an error, the deletion was successful
}

/**
 * Performs a bulk assignment of teachers to a subject.
 * @param payload The data for the bulk assignment (materia_id, docente_ids).
 * @returns A promise that resolves to the backend's response.
 */
export async function bulkAssignTeachers(payload: BulkAssignmentPayload): Promise<any> {
  // Use authenticatedFetch to include the token and handle the base URL
  return authenticatedFetch<any>('/api/curso-docentes/bulk_assign/', {
    method: "POST",
    // authenticatedFetch already sets 'Content-Type': 'application/json' by default
    body: JSON.stringify(payload),
  });
}
