"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from 'next/link';
import {
  getSubjects,
  deleteSubject,
  createSubject,
  updateSubject,
  Materia, // Importa la interfaz Materia
  CreateUpdateMateriaPayload // Importa la interfaz para el payload
} from "@/lib/api/subjects";

import FormModal from "@/components/FormModal";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";

const role = "admin"; // Simulación del rol para desarrollo

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faEye } from "@fortawesome/free-solid-svg-icons";

// Definición de las columnas para la tabla
const columns = [
  { header: "ID", accessor: "id" },
  { header: "Nombre", accessor: "nombre" },
  { header: "NRC", accessor: "nrc" },
  { header: "Descripción", accessor: "descripcion" },
  { header: "Nivel", accessor: "nivel.nombre" },
  { header: "Acciones", accessor: "action" },
];

const SubjectListPage = () => {
  const [allSubjects, setAllSubjects] = useState<Materia[]>([]); // Almacena TODAS las materias
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para la paginación en el frontend
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Función para cargar las materias desde la API
  // Usamos useCallback para memoizar la función y evitar re-creaciones innecesarias
  const fetchAllSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubjects(); // Esta función trae todas las materias
      setAllSubjects(data);
      console.log("Materias cargadas:", data);
    } catch (err: any) {
      console.error("Error al cargar materias:", err);
      setError(err.message || "Error desconocido al cargar materias.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto para cargar las materias al montar el componente
  useEffect(() => {
    fetchAllSubjects();
  }, [fetchAllSubjects]);

  // Lógica de paginación en el frontend
  // Calcula los ítems para la página actual
  const paginatedSubjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allSubjects.slice(startIndex, endIndex);
  }, [allSubjects, currentPage, itemsPerPage]);

  // Calcula el total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(allSubjects.length / itemsPerPage);
  }, [allSubjects.length, itemsPerPage]);

  // Función para manejar la eliminación de una materia
  const handleDelete = async (id: number) => {
    // Usar un modal de confirmación en FormModal, no alert/confirm directamente aquí
    try {
      await deleteSubject(id);
      fetchAllSubjects(); // Refresca la lista completa después de la eliminación
      alert("Materia eliminada exitosamente!");
    } catch (err: any) {
      console.error("Error al eliminar materia:", err);
      alert(`Error al eliminar materia: ${err.message}`);
    }
  };

  // Función para manejar la creación o actualización (pasada al FormModal)
  const handleFormSubmit = async (type: 'create' | 'update', formData: CreateUpdateMateriaPayload, id?: number) => {
    try {
      if (type === 'create') {
        await createSubject(formData);
        alert("Materia creada exitosamente!");
      } else if (type === 'update' && id) {
        await updateSubject(id, formData);
        alert("Materia actualizada exitosamente!");
      }
      fetchAllSubjects(); // Refresca la lista completa después de la operación
      setCurrentPage(1); // Opcional: ir a la primera página después de crear/actualizar
    } catch (err: any) {
      console.error(`Error al ${type} materia:`, err);
      alert(`Error al ${type} materia: ${err.message}`);
    }
  };

  const renderRow = (item: Materia) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">{item.id}</td>
      <td className="flex items-center gap-4 p-4">{item.nombre}</td>
      <td className="p-4">{item.nrc}</td>
      <td className="p-4">{item.descripcion}</td>
      <td className="p-4">{item.nivel ? item.nivel.nombre : 'N/A'}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/list/subjects/${item.id}/actividades`} passHref>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors">
              <FontAwesomeIcon icon={faEye} size="sm" />
            </button>
          </Link>
          {role === "admin" && (
            <>
              <FormModal<Materia, CreateUpdateMateriaPayload>
                table="subject"
                type="update"
                data={item}
                onSubmit={(formData) => handleFormSubmit('update', formData, item.id)}
              />
              <FormModal<Materia, CreateUpdateMateriaPayload>
                table="subject"
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

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center">
        Cargando materias...
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
        <h1 className="hidden md:block text-lg font-semibold">Materias</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              // FormModal para crear:
              // - 'onSubmit' es el callback que FormModal usará para enviar los datos
              <FormModal<Materia, CreateUpdateMateriaPayload>
                table="subject"
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
        rows={paginatedSubjects} // Pasa solo los datos de la página actual
        title="Lista de Materias"
        icon={faBook} // Icono de ejemplo
        loading={loading}
        onRefresh={fetchAllSubjects} // Pasa la función para refrescar
        currentPage={currentPage}
        totalItems={allSubjects.length} // Total de ítems es la longitud de TODAS las materias
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        flagPagination={true}
      />
    </div>
  );
};

export default SubjectListPage;
