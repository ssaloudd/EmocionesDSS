"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from 'next/navigation'; // Para obtener el ID de la materia de la URL
import Link from 'next/link'; // Para el botón de "Realizar Actividad"

import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  Actividad,
  CreateUpdateActividadPayload,
} from "@/lib/api/actividades";

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

// --- IMPORTACIÓN CLAVE: El hook useAuth ---
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation'; // Para redirigir

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTasks, faPlayCircle } from "@fortawesome/free-solid-svg-icons"; // Iconos para actividades

// Definición de las columnas para la tabla de actividades
const columns = [
  { header: "ID", accessor: "id" },
  { header: "Nombre", accessor: "nombre" },
  { header: "Descripción", accessor: "descripcion" },
  { header: "Fecha Inicio", accessor: "fecha_inicio" },
  { header: "Duración Análisis (min)", accessor: "duracion_analisis_minutos" },
  { header: "Acciones", accessor: "action" },
];

interface ActivitiesPageProps {
  params: { materiaId: string }; 
}

const SubjectActivitiesListPage: React.FC<ActivitiesPageProps> = () => {
  const params = useParams();
  const materiaId = params.materiaId ? parseInt(params.materiaId as string) : null; 

  // --- USO CLAVE: Obtener el estado de autenticación del contexto ---
  const { user, isAuthenticated, isLoading, hasRole, logout } = useAuth();
  const router = useRouter(); // Instancia del router para redirecciones

  const [allActivities, setAllActivities] = useState<Actividad[]>([]);
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
    // No hay una redirección estricta por rol aquí, ya que todos los roles autenticados
    // pueden ver esta página (aunque con datos filtrados por el backend).
  }, [isLoading, isAuthenticated, router]);


  const fetchAllActivities = useCallback(async () => {
    if (!materiaId) {
      setError("ID de materia no proporcionado.");
      setLoading(false);
      return;
    }
    // Solo intentar cargar actividades si el usuario está autenticado
    if (!isAuthenticated || isLoading) {
      return;
    }

    setLoading(true); // Iniciar carga de datos de la tabla
    setError(null);
    try {
      // getActivities(materiaId) ya filtra por rol en el backend
      const data = await getActivities(materiaId); 
      setAllActivities(data);
    } catch (err: any) {
      console.error("Error al cargar actividades:", err);
      // Si el error es un 403 (Forbidden) o 401 (Unauthorized), podría significar que el usuario no tiene permiso
      if (err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError("Acceso denegado. No tienes permiso para ver estas actividades.");
      } else {
        setError(err.message || "Error desconocido al cargar actividades.");
      }
    } finally {
      setLoading(false); // Finalizar carga de datos de la tabla
    }
  }, [materiaId, isAuthenticated, isLoading]); // Depende de materiaId, isAuthenticated, isLoading

  useEffect(() => {
    // Solo cargar actividades si el usuario está autenticado y no está en carga inicial
    if (isAuthenticated && !isLoading) {
      fetchAllActivities();
    }
  }, [isAuthenticated, isLoading, fetchAllActivities]); // Dependencias

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allActivities.slice(startIndex, endIndex);
  }, [allActivities, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(allActivities.length / itemsPerPage);
  }, [allActivities.length, itemsPerPage]);

  const handleDelete = async (id: number) => {
    // Solo permitir eliminar si el usuario es admin o docente
    if (!hasRole(['admin', 'docente'])) {
      alert("No tienes permiso para eliminar actividades.");
      return;
    }
    if (!confirm("¿Estás seguro de que quieres eliminar esta actividad?")) return;

    try {
      await deleteActivity(id);
      fetchAllActivities();
      alert("Actividad eliminada exitosamente!");
    } catch (err: any) {
      console.error("Error al eliminar actividad:", err);
      alert(`Error al eliminar actividad: ${err.message}`);
    }
  };

  const handleFormSubmit = async (type: 'create' | 'update', formData: CreateUpdateActividadPayload, id?: number) => {
    // Solo permitir crear/actualizar si el usuario es admin o docente
    if (!hasRole(['admin', 'docente'])) {
      alert("No tienes permiso para crear o actualizar actividades.");
      return;
    }
    if (!materiaId) {
      alert("No se puede crear/actualizar actividad sin un ID de materia.");
      return;
    }
    // Asegurarse de que el materiaId del payload coincida con el de la URL
    formData.materia = materiaId; 

    try {
      if (type === 'create') {
        await createActivity(formData);
        alert("Actividad creada exitosamente!");
      } else if (type === 'update' && id) {
        await updateActivity(id, formData);
        alert("Actividad actualizada exitosamente!");
      }
      fetchAllActivities();
      setCurrentPage(1);
    } catch (err: any) {
      console.error(`Error al ${type} actividad:`, err);
      alert(`Error al ${type} actividad: ${err.message}`);
    }
  };

  const renderRow = (item: Actividad) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{item.id}</td>
      <td className="p-4">{item.nombre}</td>
      <td className="p-4">{item.descripcion}</td>
      <td className="p-4">{new Date(item.fecha_inicio).toLocaleString()}</td>
      <td className="p-4">{item.duracion_analisis_minutos}</td>
      <td>
        <div className="flex items-center gap-2">
          {/* El botón "Realizar Actividad" es visible para todos los roles autenticados */}
          <Link href={`/dashboard/list/subjects/${materiaId}/actividades/${item.id}/realizar`} passHref>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              <FontAwesomeIcon icon={faPlayCircle} size="sm" />
            </button>
          </Link>

          {/* --- CONTROL DE VISIBILIDAD BASADO EN ROL: EDITAR Y ELIMINAR --- */}
          {hasRole(['admin', 'docente']) && ( // Solo admins y docentes pueden editar y eliminar actividades
            <>
              <FormModal<Actividad, CreateUpdateActividadPayload>
                table="activity" // Asegúrate de que tu FormModal pueda manejar 'activity'
                type="update"
                data={item}
                // materiaId es necesario para el formulario de actividad si lo usas para preseleccionar
                materiaId={materiaId || undefined} 
                onSubmit={(formData) => handleFormSubmit('update', formData, item.id)}
              />
              <FormModal<Actividad, CreateUpdateActividadPayload>
                table="activity" // Asegúrate de que tu FormModal pueda manejar 'activity'
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
    if (page >= 1 && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!materiaId) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center text-red-500">
        Error: ID de materia no válido en la URL.
      </div>
    );
  }

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
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Actividades de Materia {materiaId}</h1>
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
            {hasRole(['admin', 'docente']) && ( // Solo admins y docentes pueden ver el botón de crear actividad
              <FormModal<Actividad, CreateUpdateActividadPayload>
                table="activity" // Asegúrate de que tu FormModal pueda manejar 'activity'
                type="create"
                materiaId={materiaId || undefined} // Pasa el ID de la materia al formulario de creación
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
        rows={paginatedActivities}
        title="Lista de Actividades"
        icon={faTasks}
        loading={loading}
        onRefresh={fetchAllActivities}
        currentPage={currentPage}
        totalItems={allActivities.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        flagPagination={true}
      />
    </div>
  );
};

export default SubjectActivitiesListPage;
