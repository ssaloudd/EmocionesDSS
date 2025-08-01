"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getNiveles,
  deleteNivel,
  createNivel,
  updateNivel,
  Nivel, // Importa la interfaz Nivel
  CreateUpdateNivelPayload // Importa la interfaz para el payload
} from "@/lib/api/niveles";

import FormModal from "@/components/FormModal";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

// --- IMPORTACIÓN CLAVE: El hook useAuth ---
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation'; // Para redirigir

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons"; // Icono de ejemplo (puedes cambiarlo por algo más apropiado para niveles)

// Definición de las columnas para la tabla
const columns = [
  { header: "ID", accessor: "id" },
  { header: "Nombre", accessor: "nombre" },
  { header: "Acciones", accessor: "action" },
];

const NivelListPage = () => {
  // --- USO CLAVE: Obtener el estado de autenticación del contexto ---
  const { user, isAuthenticated, isLoading, hasRole, logout } = useAuth();
  const router = useRouter(); // Instancia del router para redirecciones

  const [allNiveles, setAllNiveles] = useState<Nivel[]>([]); // Almacena TODAS las Niveles
  const [loading, setLoading] = useState(true); // Estado de carga para los datos de la tabla
  const [error, setError] = useState<string | null>(null);

  // Estados para la paginación en el frontend
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
    // Según tus requisitos: Solo admins pueden hacer CRUD en Niveles.
    // Esto significa que solo los admins deberían ver esta página.
    if (!hasRole('admin')) {
      console.log("DEBUG: Acceso denegado. Redirigiendo a /dashboard.");
      router.push('/dashboard'); // O a una página de "acceso denegado"
      return;
    }
  }, [isLoading, isAuthenticated, hasRole, router]);


  // Función para cargar las Niveles desde la API
  const fetchAllNiveles = useCallback(async () => {
    // Solo intentar cargar niveles si el usuario está autenticado Y es admin
    if (!isAuthenticated || isLoading || !hasRole('admin')) {
      return;
    }

    setLoading(true); // Iniciar carga de datos de la tabla
    setError(null);
    try {
      const data = await getNiveles(); // Esta función trae todas las Niveles
      setAllNiveles(data);
      console.log("Niveles cargados:", data);
    } catch (err: any) {
      console.error("Error al cargar niveles:", err);
      // Si el error es un 403 (Forbidden) o 401 (Unauthorized), podría significar que el usuario no tiene permiso
      if (err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError("Acceso denegado. No tienes permiso para ver esta lista de niveles.");
      } else {
        setError(err.message || "Error desconocido al cargar niveles.");
      }
    } finally {
      setLoading(false); // Finalizar carga de datos de la tabla
    }
  }, [isAuthenticated, isLoading, hasRole]); // Depende de isAuthenticated, isLoading, y hasRole

  // Efecto para cargar las Niveles al montar el componente, o cuando el estado de autenticación cambie
  useEffect(() => {
    // Solo cargar niveles si el usuario está autenticado Y es admin, y no está en carga inicial
    if (isAuthenticated && !isLoading && hasRole('admin')) {
      fetchAllNiveles();
    }
  }, [isAuthenticated, isLoading, hasRole, fetchAllNiveles]); // Dependencias

  // Lógica de paginación en el frontend
  const paginatedNiveles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allNiveles.slice(startIndex, endIndex);
  }, [allNiveles, currentPage, itemsPerPage]);

  // Calcula el total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(allNiveles.length / itemsPerPage);
  }, [allNiveles.length, itemsPerPage]);

  // Función para manejar la eliminación de una Nivel
  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este nivel?")) return; // Usar un modal en FormModal

    try {
      await deleteNivel(id);
      fetchAllNiveles(); // Refresca la lista completa después de la eliminación
      alert("Nivel eliminado exitosamente!");
    } catch (err: any) {
      console.error("Error al eliminar nivel:", err);
      alert(`Error al eliminar nivel: ${err.message}`);
    }
  };

  // Función para manejar la creación o actualización (pasada al FormModal)
  const handleFormSubmit = async (type: 'create' | 'update', formData: CreateUpdateNivelPayload, id?: number) => {
    try {
      if (type === 'create') {
        await createNivel(formData);
        alert("Nivel creado exitosamente!");
      } else if (type === 'update' && id) {
        await updateNivel(id, formData);
        alert("Nivel actualizado exitosamente!");
      }
      fetchAllNiveles(); // Refresca la lista completa después de la operación
      setCurrentPage(1); // Opcional: ir a la primera página después de crear/actualizar
    } catch (err: any) {
      console.error(`Error al ${type} nivel:`, err);
      alert(`Error al ${type} nivel: ${err.message}`);
    }
  };

  const renderRow = (item: Nivel) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{item.id}</td>
      <td className="flex items-center gap-4 p-4">{item.nombre}</td>
      <td>
        <div className="flex items-center gap-2">
          {/* --- CONTROL DE VISIBILIDAD BASADO EN ROL: EDITAR Y ELIMINAR --- */}
          {hasRole('admin') && ( // Solo admins pueden editar y eliminar niveles
            <>
              <FormModal<Nivel, CreateUpdateNivelPayload>
                table="nivel" // Asegúrate de que tu FormModal pueda manejar 'nivel'
                type="update"
                data={item}
                onSubmit={(formData) => handleFormSubmit('update', formData, item.id)}
              />
              <FormModal<Nivel, CreateUpdateNivelPayload>
                table="nivel" // Asegúrate de que tu FormModal pueda manejar 'nivel'
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

  // Función para manejar el cambio de página
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
        Acceso denegado. Solo administradores pueden ver la lista de niveles.
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
        <h1 className="hidden md:block text-lg font-semibold">Niveles</h1>
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
            {hasRole('admin') && ( // Solo admins pueden ver el botón de crear nivel
              <FormModal<Nivel, CreateUpdateNivelPayload>
                table="nivel" // Asegúrate de que tu FormModal pueda manejar 'nivel'
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
        rows={paginatedNiveles} // Pasa solo los datos de la página actual
        title="Lista de Niveles"
        icon={faBook} // Icono de ejemplo
        loading={loading}
        onRefresh={fetchAllNiveles} // Pasa la función para refrescar
        currentPage={currentPage}
        totalItems={allNiveles.length} // Total de ítems es la longitud de TODAS los niveles
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        flagPagination={true}
      />
    </div>
  );
};

export default NivelListPage;
