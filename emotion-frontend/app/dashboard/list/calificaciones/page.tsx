"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getCalificaciones,
  deleteCalificacion,
  createCalificacion,
  updateCalificacion,
  Calificacion,
  CreateCalificacionPayload,
  UpdateCalificacionPayload,
} from "@/lib/api/calificaciones";
import { getAllSesionesActividad, SesionActividad } from "@/lib/api/sesiones_actividad"; // Para el formulario
import { getUsers, Usuario } from "@/lib/api/users"; // Para el formulario

import FormModal from "@/components/FormModal";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

// --- IMPORTACIÓN CLAVE: El hook useAuth ---
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation'; // Para redirigir

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGraduationCap } from "@fortawesome/free-solid-svg-icons"; // Icono para calificaciones

// Definición de las columnas para la tabla de calificaciones
const columns = [
  { header: "ID", accessor: "id" },
  { header: "Alumno", accessor: "sesion.alumno.first_name" }, // Acceder al nombre del alumno de la sesión
  { header: "Materia", accessor: "sesion.actividad.materia.nombre" }, // Acceder a la materia de la actividad de la sesión
  { header: "Actividad", accessor: "sesion.actividad.nombre" }, // Acceder al nombre de la actividad de la sesión
  { header: "Docente", accessor: "docente.first_name" }, // Acceder al nombre del docente
  { header: "Nota", accessor: "nota" },
  { header: "Observaciones", accessor: "observaciones" },
  { header: "Fecha Calificación", accessor: "fecha_calificacion" },
  { header: "Acciones", accessor: "action" },
];

const CalificacionesListPage = () => {
  // --- USO CLAVE: Obtener el estado de autenticación del contexto ---
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter(); // Instancia del router para redirecciones

  const [allCalificaciones, setAllCalificaciones] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true); // Estado de carga para los datos de la tabla
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para el FormModal de Calificación (para crear/actualizar)
  const [availableSesiones, setAvailableSesiones] = useState<SesionActividad[]>([]);
  const [availableDocentes, setAvailableDocentes] = useState<Usuario[]>([]);


  // --- LÓGICA CLAVE: Redirección y control de acceso ---
  useEffect(() => {
    if (isLoading) {
      return; // Esperar a que la autenticación cargue
    }
    if (!isAuthenticated) {
      console.log("DEBUG: Usuario no autenticado, redirigiendo a /login");
      router.push('/login');
      return;
    }
    // No hay una redirección estricta por rol aquí, ya que todos los roles autenticados
    // pueden ver esta página (aunque con datos filtrados por el backend).
  }, [isLoading, isAuthenticated, router]);


  const fetchAllCalificaciones = useCallback(async () => {
    // Solo intentar cargar calificaciones si el usuario está autenticado
    if (!isAuthenticated || isLoading) {
      return;
    }

    setLoading(true); // Iniciar carga de datos de la tabla
    setError(null);
    try {
      // getCalificaciones() ya filtra por rol en el backend
      const data = await getCalificaciones();
      setAllCalificaciones(data);
    } catch (err: any) {
      console.error("Error al cargar calificaciones:", err);
      // Si el error es un 403 (Forbidden) o 401 (Unauthorized), podría significar que el usuario no tiene permiso
      if (err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError("Acceso denegado. No tienes permiso para ver estas calificaciones.");
      } else {
        setError(err.message || "Error desconocido al cargar calificaciones.");
      }
    } finally {
      setLoading(false); // Finalizar carga de datos de la tabla
    }
  }, [isAuthenticated, isLoading]);


  const fetchAvailableDataForModal = useCallback(async () => {
    // Solo cargar datos para el modal si el usuario es admin o docente (quienes pueden hacer CRUD)
    if (!isAuthenticated || isLoading || (!hasRole('admin') && !hasRole('docente'))) {
      return;
    }
    try {
      // CAMBIO CLAVE AQUÍ: Usar getAllSesionesActividad()
      const sesiones = await getAllSesionesActividad(); 
      setAvailableSesiones(sesiones);

      // Obtener solo usuarios con rol 'docente' para el selector de docente
      const docentes = await getUsers({ rol: 'docente' });
      setAvailableDocentes(docentes);
    } catch (err: any) {
      console.error("Error al cargar datos para el formulario de calificación:", err);
      // No establecer error global, solo para el modal si fuera necesario
    }
  }, [isAuthenticated, isLoading, hasRole]);


  useEffect(() => {
    // Cargar calificaciones al montar o cuando el estado de autenticación cambie
    if (isAuthenticated && !isLoading) {
      fetchAllCalificaciones();
      fetchAvailableDataForModal(); // Cargar datos para el modal
    }
  }, [isAuthenticated, isLoading, fetchAllCalificaciones, fetchAvailableDataForModal]); // Dependencias

  const paginatedCalificaciones = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allCalificaciones.slice(startIndex, endIndex);
  }, [allCalificaciones, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(allCalificaciones.length / itemsPerPage);
  }, [allCalificaciones.length, itemsPerPage]);

  const handleDelete = async (id: number) => {
    // Solo permitir eliminar si el usuario es admin o docente
    if (!hasRole(['admin', 'docente'])) {
      alert("No tienes permiso para eliminar calificaciones.");
      return;
    }
    if (!confirm("¿Estás seguro de que quieres eliminar esta calificación?")) return;

    try {
      await deleteCalificacion(id);
      fetchAllCalificaciones();
      alert("Calificación eliminada exitosamente!");
    } catch (err: any) {
      console.error("Error al eliminar calificación:", err);
      alert(`Error al eliminar calificación: ${err.message}`);
    }
  };

  const handleFormSubmit = async (type: 'create' | 'update', formData: CreateCalificacionPayload | UpdateCalificacionPayload, id?: number) => {
    // Solo permitir crear/actualizar si el usuario es admin o docente
    if (!hasRole(['admin', 'docente'])) {
      alert("No tienes permiso para crear o actualizar calificaciones.");
      return;
    }
    try {
      if (type === 'create') {
        await createCalificacion(formData as CreateCalificacionPayload);
        alert("Calificación creada exitosamente!");
      } else if (type === 'update' && id) {
        await updateCalificacion(id, formData as UpdateCalificacionPayload);
        alert("Calificación actualizada exitosamente!");
      }
      fetchAllCalificaciones(); // Refresca la lista completa
      setCurrentPage(1);
    } catch (err: any) {
      console.error(`Error al ${type} calificación:`, err);
      alert(`Error al ${type} calificación: ${err.message}`);
    }
  };

  const renderRow = (item: Calificacion) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{item.id}</td>
      <td className="p-4">{item.sesion?.alumno ? `${item.sesion.alumno.first_name} ${item.sesion.alumno.last_name}` : 'N/A'}</td>
      <td className="p-4">{item.sesion?.actividad?.materia ? item.sesion.actividad.materia.nombre : 'N/A'}</td>
      <td className="p-4">{item.sesion?.actividad ? item.sesion.actividad.nombre : 'N/A'}</td>
      <td className="p-4">{item.docente ? `${item.docente.first_name} ${item.docente.last_name}` : 'N/A'}</td>
      <td className="p-4">{item.nota}</td>
      <td className="p-4">{item.observaciones || 'N/A'}</td>
      <td className="p-4">{item.fecha_calificacion}</td>
      <td>
        <div className="flex items-center gap-2">
          {hasRole(['admin', 'docente']) && ( // Solo admins y docentes pueden editar y eliminar calificaciones
            <>
              <FormModal<Calificacion, UpdateCalificacionPayload>
                table="calificacion" // Nombre de la tabla para el formulario
                type="update"
                data={item}
                onSubmit={(formData) => handleFormSubmit('update', formData, item.id)}
                // Pasa los datos disponibles para los selectores del formulario de calificación
                availableSesiones={availableSesiones}
                availableDocentes={availableDocentes}
              />
              <FormModal<Calificacion, any> // El payload para delete no es relevante
                table="calificacion" // Nombre de la tabla para el formulario
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

  // No hay una redirección estricta por rol aquí, ya que todos los roles autenticados
  // pueden ver esta página (aunque con datos filtrados por el backend).

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
        <h1 className="hidden md:block text-lg font-semibold">Calificaciones</h1>
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
            {hasRole(['admin', 'docente']) && ( // Solo admins y docentes pueden ver el botón de crear calificación
              <FormModal<Calificacion, CreateCalificacionPayload>
                table="calificacion" // Nombre de la tabla para el formulario
                type="create"
                onSubmit={(formData) => handleFormSubmit('create', formData)}
                // Pasa los datos disponibles para los selectores del formulario de calificación
                availableSesiones={availableSesiones}
                availableDocentes={availableDocentes}
              />
            )}
          </div>
        </div>
      </div>
      <Table
        columns={columns}
        renderRow={renderRow}
        rows={paginatedCalificaciones}
        title="Lista de Calificaciones"
        icon={faGraduationCap}
        loading={loading}
        onRefresh={fetchAllCalificaciones}
        currentPage={currentPage}
        totalItems={allCalificaciones.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        flagPagination={true}
      />
    </div>
  );
};

export default CalificacionesListPage;
