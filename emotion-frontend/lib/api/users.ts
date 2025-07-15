const API_URL = "http://localhost:8000/api";

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
  // No incluyas la contraseña aquí por seguridad
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
  password?: string; // La contraseña es opcional para actualizaciones
}

/**
 * Obtiene usuarios desde la API, opcionalmente filtrando por rol.
 * @param params Objeto con parámetros de consulta (ej. { rol: 'docente' }).
 * @returns Una promesa que resuelve a un array de objetos Usuario.
 */
export async function getUsers(params?: { rol?: 'alumno' | 'docente' | 'admin' }): Promise<Usuario[]> {
  let url = `${API_URL}/usuarios/`;
  if (params?.rol) {
    url += `?rol=${params.rol}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error al obtener usuarios: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Crea un nuevo usuario.
 * @param user Los datos del usuario a crear.
 * @returns Una promesa que resuelve al nuevo Usuario creado.
 */
export async function createUser(user: CreateUpdateUsuarioPayload): Promise<Usuario> {
  const res = await fetch(`${API_URL}/usuarios/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al crear usuario: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Actualiza un usuario existente.
 * @param id El ID del usuario a actualizar.
 * @param user Los datos actualizados del usuario.
 * @returns Una promesa que resuelve al Usuario actualizado.
 */
export async function updateUser(id: number, user: CreateUpdateUsuarioPayload): Promise<Usuario> {
  const res = await fetch(`${API_URL}/usuarios/${id}/`, {
    method: "PUT", // O PATCH para actualización parcial
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Error al actualizar usuario: ${res.statusText} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

/**
 * Elimina un usuario.
 * @param id El ID del usuario a eliminar.
 * @returns Una promesa que resuelve a true si la eliminación fue exitosa.
 */
export async function deleteUser(id: number): Promise<boolean> {
  const res = await fetch(`${API_URL}/usuarios/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Error al eliminar usuario: ${res.statusText}`);
  }
  return res.ok;
}