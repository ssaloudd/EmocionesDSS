import { authenticatedFetch } from './authenticated-api'; // Import the new authenticated fetch utility

// Import necessary interfaces from other modules
import { Materia } from './subjects'; // For the nested Materia object
import { Usuario } from './users';    // For the nested Usuario object

// Interface for reading CursoAlumno (comes from the backend with nested objects)
export interface CursoAlumno {
  id: number;
  alumno: Usuario; // Complete Usuario object
  materia: Materia; // Complete Materia object
  fecha_inscripcion: string; // Date as string (e.g., "YYYY-MM-DD")
}

// Interface for writing CursoAlumno (expects IDs)
export interface CreateCursoAlumnoPayload {
  alumno: number; // Only the ID of the student
  materia: number; // Only the ID of the subject
}

// Interface for the bulk enrollment operation
export interface BulkEnrollmentPayload {
  materia_id: number;
  alumno_ids: number[]; // List of student IDs
}

/**
 * Gets all course enrollments.
 * @returns A promise that resolves to an array of CursoAlumno objects.
 */
export async function getCursoAlumnos(): Promise<CursoAlumno[]> {
  // Use authenticatedFetch to include the token and handle the base URL
  return authenticatedFetch<CursoAlumno[]>('/api/curso-alumnos/');
}

/**
 * Creates a new course enrollment for a student.
 * (Although bulk enrollment will be used more, this is for individual cases)
 * @param payload The data for the enrollment to create.
 * @returns A promise that resolves to the newly created enrollment.
 */
export async function createCursoAlumno(payload: CreateCursoAlumnoPayload): Promise<CursoAlumno> {
  // Use authenticatedFetch to include the token and handle the base URL
  return authenticatedFetch<CursoAlumno>('/api/curso-alumnos/', {
    method: "POST",
    // authenticatedFetch already sets 'Content-Type': 'application/json' by default
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a course enrollment.
 * @param id The ID of the enrollment to delete.
 * @returns A promise that resolves to true if the deletion was successful.
 */
export async function deleteCursoAlumno(id: number): Promise<boolean> {
  // Use authenticatedFetch to include the token and handle the base URL
  await authenticatedFetch<void>(`/api/curso-alumnos/${id}/`, { // authenticatedFetch returns Promise<T>
    method: "DELETE",
  });
  return true; // If authenticatedFetch did not throw an error, the deletion was successful
}

/**
 * Performs a bulk enrollment of students to a subject.
 * @param payload The data for the bulk enrollment (materia_id, alumno_ids).
 * @returns A promise that resolves to the backend's response.
 */
export async function bulkEnrollStudents(payload: BulkEnrollmentPayload): Promise<any> {
  // Use authenticatedFetch to include the token and handle the base URL
  return authenticatedFetch<any>('/api/curso-alumnos/bulk_enroll/', {
    method: "POST",
    // authenticatedFetch already sets 'Content-Type': 'application/json' by default
    body: JSON.stringify(payload),
  });
}
