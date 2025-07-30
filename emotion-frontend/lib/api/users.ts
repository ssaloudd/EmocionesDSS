import { authenticatedFetch } from './authenticated-api'; // Import the new authenticated fetch utility

// Interfaz para el objeto Usuario tal como lo devuelve tu Django UsuarioSerializer
export interface Usuario {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  genero: string;
  CI: string;
  rol: 'alumno' | 'docente' | 'admin';
  // Do not include password here for security
}

// Interfaz para los datos que se envían al crear/actualizar un Usuario
export interface CreateUpdateUsuarioPayload {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  genero: string;
  CI: string;
  rol: 'alumno' | 'docente' | 'admin';
  password?: string; // Password is optional for updates
}

/**
 * Gets users from the API, optionally filtering by role.
 * @param params Object with query parameters (e.g., { rol: 'docente' }).
 * @returns A promise that resolves to an array of Usuario objects.
 */
export async function getUsers(params?: { rol?: 'alumno' | 'docente' | 'admin' }): Promise<Usuario[]> {
  let endpoint = '/api/usuarios/';
  if (params?.rol) {
    endpoint += `?rol=${params.rol}`;
  }
  // Use authenticatedFetch to include the token and handle the base URL
  return authenticatedFetch<Usuario[]>(endpoint);
}

/**
 * Creates a new user.
 * @param user The user data to create.
 * @returns A promise that resolves to the newly created Usuario.
 */
export async function createUser(user: CreateUpdateUsuarioPayload): Promise<Usuario> {
  // Use authenticatedFetch to include the token and handle the base URL
  return authenticatedFetch<Usuario>('/api/usuarios/', {
    method: "POST",
    // authenticatedFetch already sets 'Content-Type': 'application/json' by default
    body: JSON.stringify(user),
  });
}

/**
 * Updates an existing user.
 * @param id The ID of the user to update.
 * @param user The updated user data.
 * @returns A promise that resolves to the updated Usuario.
 */
export async function updateUser(id: number, user: CreateUpdateUsuarioPayload): Promise<Usuario> {
  // Use authenticatedFetch to include the token and handle the base URL
  return authenticatedFetch<Usuario>(`/api/usuarios/${id}/`, {
    method: "PUT", // Or "PATCH" for partial updates
    // authenticatedFetch already sets 'Content-Type': 'application/json' by default
    body: JSON.stringify(user),
  });
}

/**
 * Deletes a user.
 * @param id The ID of the user to delete.
 * @returns A promise that resolves to true if the deletion was successful.
 */
export async function deleteUser(id: number): Promise<boolean> {
  // Use authenticatedFetch to include the token and handle the base URL
  await authenticatedFetch<void>(`/api/usuarios/${id}/`, { // authenticatedFetch returns Promise<T>
    method: "DELETE",
  });
  return true; // If authenticatedFetch did not throw an error, the deletion was successful
}
