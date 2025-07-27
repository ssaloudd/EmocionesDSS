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

const role = "admin"; // Simulación del rol para desarrollo

import Image from "next/image";
import { faBook } from "@fortawesome/free-solid-svg-icons";

// Definición de las columnas para la tabla
const columns = [
  { header: "ID", accessor: "id" },
  { header: "Nombre", accessor: "nombre" },
  { header: "Acciones", accessor: "action" },
];

const NivelListPage = () => {
  const [allNiveles, setAllNiveles] = useState<Nivel[]>([]); // Almacena TODAS las Niveles
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para la paginación en el frontend
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Función para cargar las Niveles desde la API
  // Usamos useCallback para memoizar la función y evitar re-creaciones innecesarias
  const fetchAllNiveles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNiveles(); // Esta función trae todas las Niveles
      setAllNiveles(data);
      console.log("Niveles cargados:", data);
    } catch (err: any) {
      console.error("Error al cargar niveles:", err);
      setError(err.message || "Error desconocido al cargar niveles.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto para cargar las Niveles al montar el componente
  useEffect(() => {
    fetchAllNiveles();
  }, [fetchAllNiveles]);

  // Lógica de paginación en el frontend
  // Calcula los ítems para la página actual
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
    // Usar un modal de confirmación en FormModal, no alert/confirm directamente aquí
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
          {role === "admin" && (
            <>
              <FormModal<Nivel, CreateUpdateNivelPayload>
                table="nivel"
                type="update"
                data={item}
                onSubmit={(formData) => handleFormSubmit('update', formData, item.id)}
              />
              <FormModal<Nivel, CreateUpdateNivelPayload>
                table="nivel"
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
        Cargando niveles...
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
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              // FormModal para crear:
              // - 'onSubmit' es el callback que FormModal usará para enviar los datos
              <FormModal<Nivel, CreateUpdateNivelPayload>
                table="nivel"
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
