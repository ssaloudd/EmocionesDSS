"use client";

import React, { useState, useEffect } from 'react';
import { Actividad, CreateUpdateActividadPayload } from '@/lib/api/actividades';
// No necesitamos cargar materias aquí, ya que el materiaId viene como prop

export interface ActivityFormProps {
  type: "create" | "update";
  data?: Actividad; // Para el caso de actualización
  materiaId?: number; // El ID de la materia a la que pertenece la actividad
  onSubmit: (formData: CreateUpdateActividadPayload) => void;
  onClose: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ type, data, materiaId, onSubmit, onClose }) => {
  const [nombre, setNombre] = useState(data?.nombre || '');
  const [descripcion, setDescripcion] = useState(data?.descripcion || '');
  // Formatear fecha_inicio para el input datetime-local
  const defaultFechaInicio = data?.fecha_inicio ? new Date(data.fecha_inicio).toISOString().slice(0, 16) : '';
  const [fechaInicio, setFechaInicio] = useState(defaultFechaInicio);
  const [duracionAnalisisMinutos, setDuracionAnalisisMinutos] = useState(data?.duracion_analisis_minutos || 30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !descripcion || !fechaInicio || !duracionAnalisisMinutos) {
      alert("Por favor, complete todos los campos.");
      return;
    }
    if (materiaId === undefined) {
      alert("Error: El ID de la materia no está disponible. No se puede crear/actualizar la actividad.");
      return;
    }

    const formData: CreateUpdateActividadPayload = {
      materia: materiaId, // Asignar el materiaId que viene de las props
      nombre,
      descripcion,
      fecha_inicio: fechaInicio, // Ya está en formato ISO string
      duracion_analisis_minutos: Number(duracionAnalisisMinutos),
    };

    onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-center">
        {type === "create" ? "Crear Nueva Actividad" : `Actualizar Actividad: ${data?.nombre}`}
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
        <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700">Fecha y Hora de Inicio:</label>
        <input
          type="datetime-local"
          id="fecha_inicio"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="duracion_analisis_minutos" className="block text-sm font-medium text-gray-700">Duración Análisis (minutos):</label>
        <input
          type="number"
          id="duracion_analisis_minutos"
          value={duracionAnalisisMinutos}
          onChange={(e) => setDuracionAnalisisMinutos(Number(e.target.value))}
          min="1"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      <button
        type="submit"
        className="bg-lamaSky text-white py-2 px-4 rounded-md border-none w-max self-center mt-4"
      >
        {type === "create" ? "Crear Actividad" : "Actualizar Actividad"}
      </button>
    </form>
  );
};

export default ActivityForm;