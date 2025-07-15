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

const role = "admin";

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
  const [allTeachers, setAllTeachers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAllTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers({ rol: 'docente' });
      setAllTeachers(data);
    } catch (err: any) {
      console.error("Error al cargar docentes:", err);
      setError(err.message || "Error desconocido al cargar docentes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTeachers();
  }, [fetchAllTeachers]);

  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allTeachers.slice(startIndex, endIndex);
  }, [allTeachers, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(allTeachers.length / itemsPerPage);
  }, [allTeachers.length, itemsPerPage]);

  const handleDelete = async (id: number) => {
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
      formData.rol = 'docente';

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
          {role === "admin" && (
            <>
              {/* Aquí especificamos los tipos genéricos para FormModal */}
              <FormModal<Usuario, CreateUpdateUsuarioPayload>
                table="user"
                type="update"
                data={item}
                onSubmit={(formData) => handleFormSubmit('update', formData, item.id)}
              />
              <FormModal<Usuario, CreateUpdateUsuarioPayload>
                table="user"
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
        Cargando docentes...
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
            {role === "admin" && (
              <FormModal<Usuario, CreateUpdateUsuarioPayload>
                table="teacher"
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
