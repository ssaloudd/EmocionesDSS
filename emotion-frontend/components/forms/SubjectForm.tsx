"use client";

import React, { useState, useEffect } from 'react';
import { getSubjects, createSubject, updateSubject, Materia, CreateUpdateMateriaPayload } from '@/lib/api/subjects';
import { getNiveles, Nivel } from '@/lib/api/niveles'; // Necesitarás crear este archivo y función
import { useRouter } from 'next/navigation'; // Para posibles redirecciones o refrescos

export interface SubjectFormProps {
  type: "create" | "update";
  data?: Materia;
  onSubmit: (formData: CreateUpdateMateriaPayload) => void; 
  onClose: () => void;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ type, data, onSubmit, onClose }) => {
  const [nombre, setNombre] = useState(data?.nombre || '');
  const [nrc, setNrc] = useState(data?.nrc || '');
  const [descripcion, setDescripcion] = useState(data?.descripcion || '');
  // Para el nivel, si es actualización, usa el ID del nivel anidado. Si no, null o un valor por defecto.
  const [nivelId, setNivelId] = useState<number | ''>(data?.nivel?.id || '');
  const [niveles, setNiveles] = useState<Nivel[]>([]); // Estado para almacenar los niveles disponibles
  const [loadingNiveles, setLoadingNiveles] = useState(true);
  const [errorNiveles, setErrorNiveles] = useState<string | null>(null);

  const router = useRouter(); // Instancia del router de Next.js

  // Cargar los niveles al montar el componente
  useEffect(() => {
    const fetchNiveles = async () => {
      setLoadingNiveles(true);
      setErrorNiveles(null);
      try {
        const data = await getNiveles();
        setNiveles(data);
      } catch (err: any) {
        console.error("Error al cargar niveles:", err);
        setErrorNiveles(err.message || "Error desconocido al cargar niveles.");
      } finally {
        setLoadingNiveles(false);
      }
    };
    fetchNiveles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!nombre || !nrc || !descripcion || !nivelId) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    const formData: CreateUpdateMateriaPayload = {
      nombre,
      nrc,
      descripcion,
      nivel: Number(nivelId), // Asegúrate de que sea un número
    };

    // Llama al callback onSubmit pasado desde el componente padre (SubjectListPage)
    onSubmit(formData);
    onClose(); // Cierra el modal después de enviar
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-center">
        {type === "create" ? "Crear Nueva Materia" : `Actualizar Materia: ${data?.nombre}`}
      </h2>

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre:</label>
        <input
          type="text"
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="nrc" className="block text-sm font-medium text-gray-700">NRC:</label>
        <input
          type="text"
          id="nrc"
          value={nrc}
          onChange={(e) => setNrc(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción:</label>
        <textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        ></textarea>
      </div>

      <div>
        <label htmlFor="nivel" className="block text-sm font-medium text-gray-700">Nivel:</label>
        {loadingNiveles ? (
          <p>Cargando niveles...</p>
        ) : errorNiveles ? (
          <p className="text-red-500">Error al cargar niveles: {errorNiveles}</p>
        ) : (
          <select
            id="nivel"
            value={nivelId}
            onChange={(e) => setNivelId(Number(e.target.value))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          >
            <option value="">Seleccione un nivel</option>
            {niveles.map((nivel) => (
              <option key={nivel.id} value={nivel.id}>
                {nivel.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        type="submit"
        className="bg-lamaSky text-white py-2 px-4 rounded-md border-none w-max self-center mt-4"
      >
        {type === "create" ? "Crear" : "Actualizar"}
      </button>
    </form>
  );
};

export default SubjectForm;