"use client"; // Indica que es un componente de cliente

import React from "react";
// import "./table.css"; // Asegúrate de que este archivo CSS exista y esté configurado
import Pagination from "./Pagination"; // Asegúrate de que la ruta sea correcta
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync } from '@fortawesome/free-solid-svg-icons';

// Define las interfaces para las props
interface TableColumn {
  header: string;
  accessor: string;
  className?: string;
  // Si usas 'render' en las columnas, puedes añadirlo aquí:
  // render?: (item: any) => React.ReactNode;
}

interface TableProps {
  title?: string; // Título opcional para la tabla
  rows?: any[]; // Datos a mostrar (cambiado de 'data' a 'rows' para coincidir con tu ejemplo)
  columns: TableColumn[]; // Definición de las columnas
  renderRow: (item: any, index?: number) => React.ReactNode; // Función para renderizar cada fila
  icon?: any; // Icono opcional (ej. de FontAwesome)
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onRowClick?: (item: any) => void; // Callback para clic en fila
  selectedRow?: any; // Fila seleccionada
  onRefresh: () => void; // Callback para el botón de refrescar
  loading: boolean;
  flagPagination?: boolean; // Bandera para mostrar/ocultar paginación
}

const Table: React.FC<TableProps> = ({
  title,
  rows = [], // Usamos 'rows' en lugar de 'data' para consistencia con tu ejemplo
  columns = [],
  renderRow,
  icon,
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onRowClick,
  selectedRow,
  onRefresh,
  loading,
  flagPagination = true // Por defecto, la paginación está activada
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0"> {/* Añadidos estilos de tu page.tsx */}
      <div className="flex items-center justify-between mb-4"> {/* Flexbox para header */}
        <div className="header-left flex items-center gap-2">
          {icon && (
            <div className="icon-container-table w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <FontAwesomeIcon icon={icon} className="icon text-white" />
            </div>
          )}
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
        </div>
        <FontAwesomeIcon
          icon={faSync}
          className="shortcut-icon-actually cursor-pointer text-gray-600 hover:text-blue-500"
          onClick={onRefresh}
        />
      </div>
      <table className="sales-table w-full border-collapse">
        <thead>
          <tr className="text-left text-gray-500 text-sm border-b border-gray-200">
            {columns.map((col, index) => (
              <th key={col.accessor || index} className={`p-2 ${col.className || ''}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="loader-container p-4 text-center">
              </td>
            </tr>
          ) : rows.length > 0 ? (
            rows.map((item, index) => (
              // renderRow ahora es responsable de renderizar toda la <tr>
              // incluyendo los <td>s y el contenido de cada celda.
              // El onRowClick y selectedRow se manejarán dentro de renderRow si es necesario,
              // o pasaremos el item y el selectedRow a renderRow para que lo maneje.
              <React.Fragment key={item.id || index}>
                {renderRow(item, index)}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="no-data p-4 text-center text-gray-500">No existen datos</td>
            </tr>
          )}
        </tbody>
      </table>
      {!loading && flagPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default Table;