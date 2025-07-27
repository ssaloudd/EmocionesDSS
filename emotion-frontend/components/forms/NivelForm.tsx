"use client";

import React, { useState, useEffect } from "react";
import { Nivel, CreateUpdateNivelPayload } from "@/lib/api/niveles";

export interface NivelFormProps {
  type: "create" | "update";
  data?: Nivel; // Para el caso de actualización, el objeto Nivel existente
  onSubmit: (formData: CreateUpdateNivelPayload) => void; // Callback para enviar los datos al padre
  onClose: () => void; // Callback para cerrar el modal
}

const NivelForm: React.FC<NivelFormProps> = ({
  type,
  data,
  onSubmit,
  onClose,
}) => {
  const [nombre, setNombre] = useState(data?.nombre || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!nombre) {
      alert("Por favor, complete el campo obligatorio.");
      return;
    }

    const formData: CreateUpdateNivelPayload = {
      nombre,
    };

    onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-center">
        {type === "create"
          ? "Crear Nuevo Nivel"
          : `Actualizar Nivel: ${data?.nombre}`}
      </h2>

      <div>
        <label
          htmlFor="nombre"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre de Nivel:
        </label>
        <input
          type="text"
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-lamaSky text-white py-2 px-4 rounded-md border-none w-max self-center mt-4"
      >
        {type === "create" ? "Crear Nivel" : "Actualizar Nivel"}
      </button>
    </form>
  );
};

export default NivelForm;
