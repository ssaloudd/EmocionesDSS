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

const role = "admin"; // Simulación del rol para desarrollo

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
  // CAMBIO CLAVE AQUÍ: Ahora espera 'materiaId' en lugar de 'id'
  params: { materiaId: string }; 
}

const SubjectActivitiesListPage: React.FC<ActivitiesPageProps> = () => {
  const params = useParams();
  // CAMBIO CLAVE AQUÍ: Accede a 'params.materiaId'
  const materiaId = params.materiaId ? parseInt(params.materiaId as string) : null; 

  const [allActivities, setAllActivities] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAllActivities = useCallback(async () => {
    if (!materiaId) {
      setError("ID de materia no proporcionado.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getActivities(materiaId); // Filtra por materiaId
      setAllActivities(data);
    } catch (err: any) {
      console.error("Error al cargar actividades:", err);
      setError(err.message || "Error desconocido al cargar actividades.");
    } finally {
      setLoading(false);
    }
  }, [materiaId]); // Depende de materiaId

  useEffect(() => {
    fetchAllActivities();
  }, [fetchAllActivities]);

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allActivities.slice(startIndex, endIndex);
  }, [allActivities, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(allActivities.length / itemsPerPage);
  }, [allActivities.length, itemsPerPage]);

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta actividad?")) {
      try {
        await deleteActivity(id);
        fetchAllActivities();
        alert("Actividad eliminada exitosamente!");
      } catch (err: any) {
        console.error("Error al eliminar actividad:", err);
        alert(`Error al eliminar actividad: ${err.message}`);
      }
    }
  };

  const handleFormSubmit = async (type: 'create' | 'update', formData: CreateUpdateActividadPayload, id?: number) => {
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
          <Link href={`/dashboard/list/subjects/${materiaId}/actividades/${item.id}/realizar`} passHref>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              <FontAwesomeIcon icon={faPlayCircle} size="sm" />
            </button>
          </Link>

          {(role === "admin" || role === "docente") && (
            <>
              <FormModal<Actividad, CreateUpdateActividadPayload>
                table="activity"
                type="update"
                data={item}
                materiaId={materiaId || 0} // Asegurarse de pasar el materiaId
                onSubmit={(formData) => handleFormSubmit('update', formData, item.id)}
              />
              <FormModal<Actividad, CreateUpdateActividadPayload>
                table="activity"
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

  if (!materiaId) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center text-red-500">
        Error: ID de materia no válido en la URL.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center">
        Cargando actividades...
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
            {(role === "admin" || role === "docente") && (
              <FormModal<Actividad, CreateUpdateActividadPayload>
                table="activity"
                type="create"
                materiaId={materiaId} // Pasa el ID de la materia al formulario de creación
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
