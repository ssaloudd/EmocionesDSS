"use client";

import Image from "next/image";
import { useAuth } from '@/lib/context/AuthContext'; // Importa el hook de autenticación
import { useEffect } from 'react';

const DocentePage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Puedes añadir lógica aquí si quieres cargar datos específicos del docente
  // o redirigir si el usuario no es un docente.

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <p className="text-lg text-gray-700">Cargando perfil de docente...</p>
      </div>
    );
  }

  // Si no está autenticado o no es docente, podrías redirigir
  // Aunque la redirección principal se hará en AuthContext, es buena práctica tener un fallback.
  if (!isAuthenticated || user?.rol !== 'docente') {
    // Esto es un fallback, la redirección principal ocurre en el AuthContext
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
        <p className="text-lg text-gray-700">No tienes permiso para ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-3xl font-bold text-lamaPurple mb-6 text-center">
                ¡Bienvenido, {user?.first_name || 'Docente'}!
            </h1>
            <p className="text-lg text-gray-700 mb-8 text-center">
                Aquí podrás gestionar tus cursos, actividades y calificaciones.
            </p>
            <div className="w-48 h-48 relative"> {/* Tamaño mediano para el logo */}
                <Image
                src="/logo.png" // Asegúrate de que esta ruta sea correcta para tu logo
                alt="Logo de la Aplicación"
                layout="fill" // Permite que la imagen llene el contenedor
                objectFit="contain" // Mantiene la relación de aspecto
                className="rounded-lg shadow-lg"
                />
            </div>
        </div>
    </div>
  );
};

export default DocentePage;
