"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getCursoAlumnos,
  deleteCursoAlumno,
  bulkEnrollStudents,
  CursoAlumno,
  BulkEnrollmentPayload,
} from "@/lib/api/curso_alumnos";

import FormModal from "@/components/FormModal";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

const role = "admin"; // Simulación del rol para desarrollo

import Image from "next/image";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons"; // Icono para inscripciones

// Definición de las columnas para la tabla de inscripciones
const columns = [
  { header: "ID", accessor: "id" },
  { header: "Alumno", accessor: "alumno.first_name" }, // Acceder al nombre del alumno
  { header: "Materia", accessor: "materia.nombre" }, // Acceder al nombre de la materia
  { header: "Nivel de Materia", accessor: "materia.nivel.nombre" }, // Acceder al nivel de la materia
  { header: "Fecha Inscripción", accessor: "fecha_inscripcion" },
  { header: "Acciones", accessor: "action" },
];

const CourseEnrollmentsListPage = () => {
  const [allEnrollments, setAllEnrollments] = useState<CursoAlumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAllEnrollments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCursoAlumnos();
      setAllEnrollments(data);
    } catch (err: any) {
      console.error("Error al cargar inscripciones:", err);
      setError(err.message || "Error desconocido al cargar inscripciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEnrollments();
  }, [fetchAllEnrollments]);

  const paginatedEnrollments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allEnrollments.slice(startIndex, endIndex);
  }, [allEnrollments, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(allEnrollments.length / itemsPerPage);
  }, [allEnrollments.length, itemsPerPage]);

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta inscripción?")) {
      try {
        await deleteCursoAlumno(id);
        fetchAllEnrollments();
        alert("Inscripción eliminada exitosamente!");
      } catch (err: any) {
        console.error("Error al eliminar inscripción:", err);
        alert(`Error al eliminar inscripción: ${err.message}`);
      }
    }
  };

  // Función para manejar la inscripción masiva
  const handleBulkEnrollmentSubmit = async (formData: BulkEnrollmentPayload) => {
    try {
      const response = await bulkEnrollStudents(formData);
      fetchAllEnrollments(); // Refresca la lista completa
      if (response.errors && response.errors.length > 0) {
        alert(`Inscripción masiva completada con algunos errores:\n${response.errors.join('\n')}`);
      } else {
        alert(`Inscripción masiva completada: ${response.created_count} nuevas inscripciones.`);
      }
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Error en inscripción masiva:", err);
      alert(`Error en inscripción masiva: ${err.message}`);
    }
  };

  const renderRow = (item: CursoAlumno) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{item.id}</td>
      {/* Accede a los nombres de alumno y materia a través de los objetos anidados */}
      <td className="p-4">{item.alumno ? `${item.alumno.first_name} ${item.alumno.last_name}` : 'N/A'}</td>
      <td className="p-4">{item.materia ? item.materia.nombre : 'N/A'}</td>
      <td className="p-4">{item.materia?.nivel ? item.materia.nivel.nombre : 'N/A'}</td>
      <td className="p-4">{item.fecha_inscripcion}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
              {/* Para inscripciones, la edición individual no es común, solo eliminación */}
              <FormModal<CursoAlumno, BulkEnrollmentPayload> // Tipos genéricos
                table="course-enrollment" // Nombre de la tabla para el formulario
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
        Cargando inscripciones...
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
        <h1 className="hidden md:block text-lg font-semibold">Inscripciones de Alumnos</h1>
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
              <FormModal<any, BulkEnrollmentPayload> // Para creación masiva, data no es relevante
                table="course-enrollment" // Nombre de la tabla para el formulario
                type="create"
                onSubmit={handleBulkEnrollmentSubmit}
              />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table
        columns={columns}
        renderRow={renderRow}
        rows={paginatedEnrollments}
        title="Lista de Inscripciones"
        icon={faUserPlus}
        loading={loading}
        onRefresh={fetchAllEnrollments}
        currentPage={currentPage}
        totalItems={allEnrollments.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        flagPagination={true}
      />
    </div>
  );
};

export default CourseEnrollmentsListPage;