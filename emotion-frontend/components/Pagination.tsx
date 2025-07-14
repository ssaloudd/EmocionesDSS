"use client";

import React from 'react';
// import "./components.css"; // Asegúrate de que este CSS esté importado o sus estilos se migren a Tailwind

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const maxPagesToShow = 5;
  let startPage, endPage;

  if (totalPages <= maxPagesToShow) {
    // Mostrar todas las páginas si hay menos o igual a maxPagesToShow
    startPage = 1;
    endPage = totalPages;
  } else {
    // Calcular el rango de páginas a mostrar
    const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
    const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;

    if (currentPage <= maxPagesBeforeCurrentPage) {
      // Mostrar las primeras páginas
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
      // Mostrar las últimas páginas
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      // Mostrar un rango de páginas centrado en la página actual
      startPage = currentPage - maxPagesBeforeCurrentPage;
      endPage = currentPage + maxPagesAfterCurrentPage;
    }
  }

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );

  return (
    <div className="pagination-container p-4 flex items-center justify-between text-gray-500">
      <div className="flex items-center gap-2 text-sm">
        {/* Botón para ir a la primera página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 transition-colors"
        >
          &laquo;
        </button>
        {/* Botón para ir a la página anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 transition-colors"
        >
          &lt;
        </button>

        {/* Mostrar "1" y ellipsis si no estamos cerca del inicio */}
        {startPage > 1 && (
          <button 
            className="px-2 rounded-sm py-2 px-4 bg-slate-200 hover:bg-slate-300 transition-colors" 
            onClick={() => onPageChange(1)}
          >
            1
          </button>
        )}
        {startPage > 2 && <span className="pagination-ellipsis px-2">...</span>}

        {/* Renderizar los números de página */}
        {pages.map((page) => (
          <button
            key={page}
            className={`py-2 px-4 rounded-md text-xs font-semibold transition-colors ${
              page === currentPage ? "bg-lamaYellow text-black" : "bg-slate-200 hover:bg-slate-300"
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {/* Mostrar ellipsis y el último número de página si no estamos cerca del final */}
        {endPage < totalPages - 1 && (
          <span className="pagination-ellipsis px-2">...</span>
        )}
        {endPage < totalPages && (
          <button
            className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold hover:bg-slate-300 transition-colors"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        )}

        {/* Botón para ir a la página siguiente */}
        <button
          className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 transition-colors"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>
        {/* Botón para ir a la última página */}
        <button
          className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 transition-colors"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          &raquo;
        </button>
      </div>
    </div>
  );
};

export default Pagination;