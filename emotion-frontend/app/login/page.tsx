"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api/auth'; // Importa la función de login que acabamos de crear

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    setLoading(true);
    setError(null); // Limpiar errores previos

    try {
      const data = await login(username, password);
      console.log('Login exitoso:', data);

      // --- PASO CLAVE 1: Almacenar el token y los datos del usuario ---
      // Usaremos localStorage por ahora. Para mayor seguridad en producción, considera cookies HTTP-only.
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify({
        id: data.user_id,
        username: data.username,
        email: data.email,
        rol: data.rol,
        // Puedes guardar más datos de data.user_data si lo necesitas
      }));

      // --- PASO CLAVE 2: Redirigir al usuario según su rol ---
      // Puedes personalizar esto. Por ejemplo:
      if (data.rol === 'admin') {
        router.push('/dashboard/admin'); // Redirigir a un dashboard de admin
      } else if (data.rol === 'docente') {
        router.push('/dashboard/docente'); // Redirigir a un dashboard de docente
      } else if (data.rol === 'alumno') {
        router.push('/dashboard/list/subjects'); // Redirigir al dashboard de materias para alumnos
      } else {
        router.push('/'); // Redirigir a una página por defecto si el rol no es reconocido
      }

    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      setError(err.message || 'Ocurrió un error desconocido al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
              Nombre de Usuario:
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Contraseña:
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}