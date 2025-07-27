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
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify({
        id: data.user_id,
        username: data.username,
        email: data.email,
        rol: data.rol,
        // Aquí puedes guardar más datos si los necesitas, ej. data.user_data.first_name
      } as UserAuthData)); // Castear a UserAuthData para asegurar consistencia

      setToken(data.token);
      setUser({
        id: data.user_id,
        username: data.username,
        email: data.email,
        rol: data.rol,
      });
      console.log("DEBUG Auth: Login exitoso y datos guardados.");
      // No redirigir aquí, dejar que la página de login lo haga
    } catch (error) {
      console.error("DEBUG Auth: Error durante el login:", error);
      throw error; // Re-lanzar el error para que el componente de login lo maneje
    } finally {
      setIsLoading(false);
    }
  }, []);

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