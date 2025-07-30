"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getCursoDocentes,
  deleteCursoDocente,
  bulkAssignTeachers,
  CursoDocente,
  BulkAssignmentPayload,
} from "@/lib/api/curso_docentes";
import { getUsers, Usuario } from "@/lib/api/users"; // Para obtener docentes disponibles en el modal
import { getSubjects, Materia } from "@/lib/api/subjects"; // Para obtener materias disponibles en el modal

import FormModal from "@/components/FormModal";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

// --- IMPORTACIÓN CLAVE: El hook useAuth ---
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation'; // Para redirigir

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboard } from "@fortawesome/free-solid-svg-icons"; // Icono para asignaciones

// Definición de las columnas para la tabla de asignaciones
const columns = [
  { header: "ID", accessor: "id" },
  { header: "Docente", accessor: "docente.first_name" }, // Acceder al nombre del docente
  { header: "Materia", accessor: "materia.nombre" }, // Acceder al nombre de la materia
  { header: "Nivel de Materia", accessor: "materia.nivel.nombre" }, // Acceder al nivel de la materia
  { header: "Acciones", accessor: "action" },
];

const CourseAssignmentsListPage = () => {
  // --- USO CLAVE: Obtener el estado de autenticación del contexto ---
  const { user, isAuthenticated, isLoading, hasRole, logout } = useAuth();
  const router = useRouter(); // Instancia del router para redirecciones

  const [allAssignments, setAllAssignments] = useState<CursoDocente[]>([]);
  const [loading, setLoading] = useState(true); // Estado de carga para los datos de la tabla
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para el modal de asignación masiva
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [availableDocentes, setAvailableDocentes] = useState<Usuario[]>([]);
  const [availableMaterias, setAvailableMaterias] = useState<Materia[]>([]);


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
    // Para esta página, todos los roles autenticados pueden verla (pero con datos filtrados)
    // Si quisieras restringirla a solo admin/docente, añadirías:
    // if (!hasRole(['admin', 'docente'])) {
    //   router.push('/dashboard'); // O a una página de "acceso denegado"
    //   return;
    // }
  }, [isLoading, isAuthenticated, router]); // hasRole no es una dependencia aquí si todos los autenticados pueden acceder


  const fetchAllAssignments = useCallback(async () => {
    // Solo intentar cargar asignaciones si el usuario está autenticado
    if (!isAuthenticated || isLoading) {
      return;
    }

    setLoading(true); // Iniciar carga de datos de la tabla
    setError(null);
    try {
      // getCursoDocentes() ya filtra por rol en el backend
      const data = await getCursoDocentes();
      setAllAssignments(data);
    } catch (err: any) {
      console.error("Error al cargar asignaciones:", err);
      // Si el error es un 403 (Forbidden) o 401 (Unauthorized), podría significar que el usuario no tiene permiso
      if (err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError("Acceso denegado. No tienes permiso para ver estas asignaciones.");
      } else {
        setError(err.message || "Error desconocido al cargar asignaciones.");
      }
    } finally {
      setLoading(false); // Finalizar carga de datos de la tabla
    }
  }, [isAuthenticated, isLoading]); // Depende de isAuthenticated y isLoading


  const fetchAvailableDataForModal = useCallback(async () => {
    // Solo cargar datos para el modal si el usuario es admin (quien puede hacer asignación masiva)
    if (!hasRole('admin')) {
      return;
    }
    try {
      const docentes = await getUsers({ rol: 'docente' });
      setAvailableDocentes(docentes);
      const materias = await getSubjects();
      setAvailableMaterias(materias);
    } catch (err: any) {
      console.error("Error al cargar datos para asignación masiva:", err);
      // No establecer error global, solo para el modal si fuera necesario
    }
  }, [hasRole]);


  useEffect(() => {
    // Cargar asignaciones al montar o cuando el estado de autenticación cambie
    if (isAuthenticated && !isLoading) {
      fetchAllAssignments();
    }
    // Cargar datos para el modal solo si el usuario es admin
    if (isAuthenticated && !isLoading && hasRole('admin')) {
      fetchAvailableDataForModal();
    }
  }, [isAuthenticated, isLoading, fetchAllAssignments, hasRole, fetchAvailableDataForModal]); // Dependencias

  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allAssignments.slice(startIndex, endIndex);
  }, [allAssignments, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(allAssignments.length / itemsPerPage);
  }, [allAssignments.length, itemsPerPage]);

  const handleDelete = async (id: number) => {
    // Solo permitir eliminar si el usuario es admin
    if (!hasRole('admin')) {
      alert("No tienes permiso para eliminar asignaciones.");
      return;
    }
    if (!confirm("¿Estás seguro de que quieres eliminar esta asignación?")) return;

    try {
      await deleteCursoDocente(id);
      fetchAllAssignments();
      alert("Asignación eliminada exitosamente!");
    } catch (err: any) {
      console.error("Error al eliminar asignación:", err);
      alert(`Error al eliminar asignación: ${err.message}`);
    }
  };

  // Función para manejar la asignación masiva
  const handleBulkAssignmentSubmit = async (formData: BulkAssignmentPayload) => {
    // Solo permitir asignación masiva si el usuario es admin
    if (!hasRole('admin')) {
      alert("No tienes permiso para realizar asignaciones masivas.");
      return;
    }
    try {
      const response = await bulkAssignTeachers(formData);
      fetchAllAssignments(); // Refresca la lista completa
      if (response.errors && response.errors.length > 0) {
        alert(`Asignación masiva completada con algunos errores:\n${response.errors.join('\n')}`);
      } else {
        alert(`Asignación masiva completada: ${response.created_count} nuevas asignaciones.`);
      }
      setCurrentPage(1);
      setIsBulkAssignModalOpen(false); // Cerrar el modal después de la operación
    } catch (err: any) {
      console.error("Error en asignación masiva:", err);
      alert(`Error en asignación masiva: ${err.message}`);
    }
  };

  const renderRow = (item: CursoDocente) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{item.id}</td>
      <td className="p-4">{item.docente ? `${item.docente.first_name} ${item.docente.last_name}` : 'N/A'}</td>
      <td className="p-4">{item.materia ? item.materia.nombre : 'N/A'}</td>
      <td className="p-4">{item.materia?.nivel ? item.materia.nivel.nombre : 'N/A'}</td>
      <td>
        <div className="flex items-center gap-2">
          {hasRole('admin') && ( // Solo admins pueden eliminar asignaciones
            <FormModal<CursoDocente, BulkAssignmentPayload> // Tipos genéricos
              table="course-assignment" // Nombre de la tabla para el formulario
              type="delete"
              id={item.id}
              onConfirm={() => handleDelete(item.id)}
            />
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

  // Si el usuario está autenticado pero no tiene un rol permitido para ver la página,
  // aunque el backend filtre, es mejor redirigir si la página completa no es relevante.
  // Según tu requisito, docentes y alumnos pueden ver sus asignaciones, así que no hay redirección aquí.

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
        <h1 className="hidden md:block text-lg font-semibold">Asignaciones de Docentes</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="Filter" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="Sort" width={14} height={14} />
            </button>
            {hasRole('admin') && ( // Solo admins pueden ver el botón de asignación masiva
              <FormModal<any, BulkAssignmentPayload> // Para creación masiva, data no es relevante
                table="course-assignment" // Nombre de la tabla para el formulario
                type="create"
                onSubmit={handleBulkAssignmentSubmit}
              />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table
        columns={columns}
        renderRow={renderRow}
        rows={paginatedAssignments}
        title="Lista de Asignaciones"
        icon={faChalkboard}
        loading={loading}
        onRefresh={fetchAllAssignments}
        currentPage={currentPage}
        totalItems={allAssignments.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        flagPagination={true}
      />
    </div>
  );
};

export default CourseAssignmentsListPage;
