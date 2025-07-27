"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getCursoDocentes,
  deleteCursoDocente,
  bulkAssignTeachers,
  CursoDocente,
  BulkAssignmentPayload,
} from "@/lib/api/curso_docentes";

import FormModal from "@/components/FormModal";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

const role = "admin"; // Simulación del rol para desarrollo

import Image from "next/image";
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
  const [allAssignments, setAllAssignments] = useState<CursoDocente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAllAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCursoDocentes();
      setAllAssignments(data);
    } catch (err: any) {
      console.error("Error al cargar asignaciones:", err);
      setError(err.message || "Error desconocido al cargar asignaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAssignments();
  }, [fetchAllAssignments]);

  const paginatedAssignments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allAssignments.slice(startIndex, endIndex);
  }, [allAssignments, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(allAssignments.length / itemsPerPage);
  }, [allAssignments.length, itemsPerPage]);

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta asignación?")) {
      try {
        await deleteCursoDocente(id);
        fetchAllAssignments();
        alert("Asignación eliminada exitosamente!");
      } catch (err: any) {
        console.error("Error al eliminar asignación:", err);
        alert(`Error al eliminar asignación: ${err.message}`);
      }
    }
  };

  // Función para manejar la asignación masiva
  const handleBulkAssignmentSubmit = async (formData: BulkAssignmentPayload) => {
    try {
      const response = await bulkAssignTeachers(formData);
      fetchAllAssignments(); // Refresca la lista completa
      if (response.errors && response.errors.length > 0) {
        alert(`Asignación masiva completada con algunos errores:\n${response.errors.join('\n')}`);
      } else {
        alert(`Asignación masiva completada: ${response.created_count} nuevas asignaciones.`);
      }
      setCurrentPage(1);
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
      {/* Accede a los nombres de docente y materia a través de los objetos anidados */}
      <td className="p-4">{item.docente ? `${item.docente.first_name} ${item.docente.last_name}` : 'N/A'}</td>
      <td className="p-4">{item.materia ? item.materia.nombre : 'N/A'}</td>
      <td className="p-4">{item.materia?.nivel ? item.materia.nivel.nombre : 'N/A'}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              {/* Para asignaciones, la edición individual no es común, solo eliminación */}
              <FormModal<CursoDocente, BulkAssignmentPayload> // Tipos genéricos
                table="course-assignment" // Nombre de la tabla para el formulario
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

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center">
        Cargando asignaciones...
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
            {role === "admin" && (
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