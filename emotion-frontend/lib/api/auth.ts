import { API_BASE_URL } from './config'; // Asegúrate de que API_BASE_URL esté definido aquí o en otro archivo de configuración

// Definir la interfaz para los datos del usuario que se guardarán localmente
export interface UserAuthData {
  id: number;
  username: string;
  email: string;
  rol: string;
  // Puedes añadir más campos de user_data si los necesitas directamente en el estado de autenticación
}

// Definir la interfaz para la respuesta completa del API de login de Django
export interface LoginResponse {
  token: string;
  user_id: number;
  username: string; // string, no string[]
  email: string;
  rol: string;
  user_data: { // Esta es la parte importante que tu versión había omitido
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    genero: string;
    CI: string;
    rol: string;
    // Añade cualquier otro campo que tu UsuarioSerializer devuelva en user_data
  };
}

// Definir la interfaz para los errores de login (como los devuelve DRF)
export interface LoginError {
  detail?: string;
  non_field_errors?: string[];
  username?: string[]; // Puede ser un array de strings para errores de validación
  password?: string[]; // Puede ser un array de strings para errores de validación
  // Añade otros campos de error si tu API los devuelve
}

/**
 * Realiza una solicitud de login al backend de Django.
 * @param username El nombre de usuario.
 * @param password La contraseña.
 * @returns Una promesa que resuelve con los datos del usuario y el token, o rechaza con un error.
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    // Primero, parsear la respuesta JSON sin asumir un tipo específico
    const data = await response.json();

    if (!response.ok) {
      // Si la respuesta no es OK, entonces 'data' es una LoginError
      const errorData: LoginError = data; // Ahora esto es seguro
      const errorMessage = errorData.detail 
                           || errorData.non_field_errors?.join(', ') 
                           || errorData.username?.join(', ') 
                           || errorData.password?.join(', ') 
                           || 'Credenciales inválidas.';
      throw new Error(errorMessage);
    }

    // Si la respuesta es OK, entonces 'data' es una LoginResponse
    return data as LoginResponse; // Castear la respuesta a la interfaz de éxito
  } catch (error) {
    console.error('Error en la función login:', error);
    throw error; // Re-lanzar el error para que el componente que llama lo maneje
  }
}

/**
 * Realiza una solicitud de logout al backend de Django.
 * Requiere el token de autenticación.
 * @param token El token de autenticación del usuario.
 * @returns Una promesa que resuelve si el logout fue exitoso, o rechaza con un error.
 */
export async function logout(token: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`, // Enviar el token en el encabezado Authorization
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al cerrar sesión.');
    }
  } catch (error) {
    console.error('Error en la función logout:', error);
    throw error;
  }
}