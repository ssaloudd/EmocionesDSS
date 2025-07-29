"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getUsers,
  deleteUser,
  createUser,
  updateUser,
  Usuario,
  CreateUpdateUsuarioPayload,
} from "@/lib/api/users";

// Importa el FormModal genérico
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

// --- IMPORTACIÓN CLAVE: El hook useAuth ---
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation'; // Para redirigir

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboardTeacher } from "@fortawesome/free-solid-svg-icons";

const columns = [
  { header: "ID", accessor: "id" },
  { header: "Nombre de Usuario", accessor: "username" },
  { header: "Nombre", accessor: "first_name" },
  { header: "Apellido", accessor: "last_name" },
  { header: "Email", accessor: "email" },
  { header: "Género", accessor: "genero" },
  { header: "CI", accessor: "CI" },
  { header: "Acciones", accessor: "action" },
];

const TeacherListPage = () => {
  // --- USO CLAVE: Obtener el estado de autenticación del contexto ---
  const { user, isAuthenticated, isLoading, hasRole, logout } = useAuth();
  const router = useRouter(); // Instancia del router para redirecciones

  const [allTeachers, setAllTeachers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true); // Estado de carga para los datos de la tabla
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- LÓGICA CLAVE: Redirección y control de acceso ---
  useEffect(() => {
    if (isLoading) {
      // Si aún estamos cargando el estado de autenticación, no hacemos nada
      return;
    }
    if (!isAuthenticated) {
      // Si no está autenticado, redirigir a la página de login
      console.log("DEBUG: Usuario no autenticado, redirigiendo a /login");
      router.push('/login');
      return;
    }
    // Según tus requisitos: "En la tabla Usuarios solo puede hacer CRUD el usuario de rol admin."
    // Esto significa que solo los admins deberían ver esta página.
    if (!hasRole('admin')) {
      console.log("DEBUG: Acceso denegado. Redirigiendo a /dashboard.");
      router.push('/dashboard'); // O a una página de "acceso denegado"
      return;
    }
  }, [isLoading, isAuthenticated, hasRole, router]);


  const fetchAllTeachers = useCallback(async () => {
    // Solo intentar cargar docentes si el usuario está autenticado Y es admin
    if (!isAuthenticated || isLoading || !hasRole('admin')) {
      return;
    }

    setLoading(true); // Iniciar carga de datos de la tabla
    setError(null);
    try {
      // getUsers({ rol: 'docente' }) ya filtra por rol en el backend
      const data = await getUsers({ rol: 'docente' });
      setAllTeachers(data);
    } catch (err: any) {
      console.error("Error al cargar docentes:", err);
      // Si el error es un 403 (Forbidden) o 401 (Unauthorized), podría significar que el usuario no tiene permiso
      if (err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError("Acceso denegado. No tienes permiso para ver esta lista de docentes.");
      } else {
        setError(err.message || "Error desconocido al cargar docentes.");
      }
    } finally {
      setLoading(false); // Finalizar carga de datos de la tabla
    }
  }, [isAuthenticated, isLoading, hasRole]); // Depende de isAuthenticated, isLoading, y hasRole

  useEffect(() => {
    // Solo cargar docentes si el usuario está autenticado Y es admin, y no está en carga inicial
    if (isAuthenticated && !isLoading && hasRole('admin')) {
      fetchAllTeachers();
    }
  }, [isAuthenticated, isLoading, hasRole, fetchAllTeachers]); // Dependencias

  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allTeachers.slice(startIndex, endIndex);
  }, [allTeachers, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(allTeachers.length / itemsPerPage);
  }, [allTeachers.length, itemsPerPage]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este docente?")) return;
    try {
      await deleteUser(id);
      fetchAllTeachers();
      alert("Docente eliminado exitosamente!");
    } catch (err: any) {
      console.error("Error al eliminar docente:", err);
      alert(`Error al eliminar docente: ${err.message}`);
    }
  };

  // El tipo de formData aquí es CreateUpdateUsuarioPayload
  const handleFormSubmit = async (type: 'create' | 'update', formData: CreateUpdateUsuarioPayload, id?: number) => {
    try {
      formData.rol = 'docente'; // Asegura que el rol siempre sea 'docente' al crear/actualizar desde esta página

      if (type === 'create') {
        await createUser(formData);
        alert("Docente creado exitosamente!");
      } else if (type === 'update' && id) {
        await updateUser(id, formData);
        alert("Docente actualizado exitosamente!");
      }
      fetchAllTeachers();
      setCurrentPage(1);
    } catch (err: any) {
      console.error(`Error al ${type} docente:`, err);
      alert(`Error al ${type} docente: ${err.message}`);
    }
  };

  const renderRow = (item: Usuario) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{item.id}</td>
      <td className="p-4">{item.username}</td>
      <td className="p-4">{item.first_name}</td>
      <td className="p-4">{item.last_name}</td>
      <td className="p-4">{item.email}</td>
      <td className="p-4">{item.genero}</td>
      <td className="p-4">{item.CI}</td>
      <td>
        <div className="flex items-center gap-2">
          {/* --- CONTROL DE VISIBILIDAD BASADO EN ROL: EDITAR Y ELIMINAR --- */}
          {hasRole('admin') && ( // Solo admins pueden editar y eliminar docentes
            <>
              {/* Aquí especificamos los tipos genéricos para FormModal */}
              <FormModal<Usuario, CreateUpdateUsuarioPayload>
                table="user" // Usamos 'user' para el UserForm genérico
                type="update"
                data={item}
                onSubmit={(formData) => handleFormSubmit('update', formData, item.id)}
              />
              <FormModal<Usuario, CreateUpdateUsuarioPayload>
                table="user" // Usamos 'user' para el UserForm genérico
                type="delete"
                id={item.id}
                onConfirm={() => handleDelete(item.id)}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // --- Renderizado condicional basado en el estado de autenticación y carga ---
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center">
        Cargando autenticación...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Ya se redirigió a /login
  }

  if (!hasRole('admin')) {
    // Ya se redirigió a /dashboard, pero esto es un fallback visual si por alguna razón no lo hace
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center text-red-500">
        Acceso denegado. Solo administradores pueden ver la lista de docentes.
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Docentes</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            {/* --- CONTROL DE VISIBILIDAD BASADO EN ROL: CREAR --- */}
            {hasRole('admin') && ( // Solo admins pueden ver el botón de crear docente
              <FormModal<Usuario, CreateUpdateUsuarioPayload>
                table="user" // Usamos 'user' para el UserForm genérico
                type="create"
                onSubmit={(formData) => handleFormSubmit('create', formData)}
              />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table
        columns={columns}
        renderRow={renderRow}
        rows={paginatedTeachers}
        title="Lista de Docentes"
        icon={faChalkboardTeacher}
        loading={loading}
        onRefresh={fetchAllTeachers}
        currentPage={currentPage}
        totalItems={allTeachers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        flagPagination={true}
      />
    </div>
  );
};

export default TeacherListPage;
