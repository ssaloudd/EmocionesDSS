"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin, logout as apiLogout, LoginResponse, UserAuthData } from '@/lib/api/auth'; // Importa los tipos y funciones

// Definir la interfaz para el contexto de autenticación
interface AuthContextType {
  user: UserAuthData | null; // Usar UserAuthData para el estado del usuario
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: string | string[]) => boolean; // Utilidad para verificar roles
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor de autenticación
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserAuthData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Para manejar el estado de carga inicial
  const router = useRouter();

  // Función para cargar el estado de autenticación desde localStorage
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUserData = localStorage.getItem('userData');

        if (storedToken && storedUserData) {
          const parsedUserData: UserAuthData = JSON.parse(storedUserData); // Usar UserAuthData
          setToken(storedToken);
          setUser(parsedUserData);
          console.log("DEBUG Auth: Datos de usuario cargados desde localStorage.");
        }
      } catch (error) {
        console.error("Error al cargar datos de autenticación desde localStorage:", error);
        // Limpiar datos inválidos si hay un error
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setIsLoading(false); // Finalizar carga inicial
      }
    };

    loadAuthData();
  }, []);

  // Función de login
  const login = useCallback(async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const data: LoginResponse = await apiLogin(username, password); // Llama a la función de API, usa LoginResponse
      
      // --- CAMBIO CLAVE AQUÍ: Extraer datos del usuario de 'data.user_data' ---
      const userDataFromResponse: UserAuthData = {
        id: data.user_id, // El ID del usuario principal
        username: data.username, // El username principal
        email: data.email, // El email principal
        rol: data.rol, // El rol principal
        first_name: data.user_data.first_name, // Extrae de user_data
        last_name: data.user_data.last_name,   // Extrae de user_data
        genero: data.user_data.genero,         // Extrae de user_data
        CI: data.user_data.CI,                 // Extrae de user_data
      };

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(userDataFromResponse)); // Guarda el objeto completo del usuario

      setToken(data.token);
      setUser(userDataFromResponse);
      console.log("DEBUG Auth: Login exitoso y datos guardados.");

      // --- LÓGICA DE REDIRECCIÓN BASADA EN ROL (se mantiene igual) ---
      if (data.rol === 'admin') {
        router.push('/dashboard/admin');
      } else if (data.rol === 'docente') {
        router.push('/dashboard/docente');
      } else if (data.rol === 'alumno') {
        router.push('/dashboard/alumno');
      } else {
        // Redirección por defecto si el rol no coincide o es desconocido
        router.push('/dashboard'); 
      }

      // No redirigir aquí, dejar que la página de login lo haga
    } catch (error) {
      console.error("DEBUG Auth: Error durante el login:", error);
      // Puedes mostrar un mensaje de error al usuario aquí
      alert(`Error: ${(error as Error).message || "Unable to log in with provided credentials."}`);
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      throw error; // Re-lanzar el error para que el componente de login lo maneje
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Función de logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      if (token) {
        await apiLogout(token); // Llama a la función de API
        console.log("DEBUG Auth: Logout exitoso en backend.");
      }
    } catch (error) {
      console.error("DEBUG Auth: Error durante el logout del backend:", error);
      // No lanzar error, solo limpiar el estado local
    } finally {
      // Siempre limpiar el estado local y redirigir, independientemente del éxito del backend
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setToken(null);
      setUser(null);
      setIsLoading(false);
      console.log("DEBUG Auth: Estado de autenticación local limpiado. Redirigiendo a /login.");
      router.push('/login'); // Redirigir a la página de login
    }
  }, [token, router]);

  // Utilidad para verificar roles
  const hasRole = useCallback((roles: string | string[]) => {
    if (!user) return false;
    const userRole = user.rol;
    if (typeof roles === 'string') {
      return userRole === roles || userRole === 'admin'; // Admin siempre tiene acceso
    }
    // Si es un array de roles, verificar si el rol del usuario está en el array o si es admin
    return roles.includes(userRole) || userRole === 'admin';
  }, [user]);

  const isAuthenticated = !!user && !!token;

  const authContextValue = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};