"use client";

import React, { useState, useEffect } from 'react';
import { Materia, getSubjects } from '@/lib/api/subjects';
import { Usuario, getUsers } from '@/lib/api/users';
import { BulkEnrollmentPayload } from '@/lib/api/curso_alumnos';

export interface CourseEnrollmentFormProps {
  type: "create" | "update"; // Aunque para bulk, 'create' es lo más relevante
  data?: any; // No se usa directamente para la creación masiva, pero se mantiene por la prop genérica
  onSubmit: (formData: BulkEnrollmentPayload) => void;
  onClose: () => void;
}

const CourseEnrollmentForm: React.FC<CourseEnrollmentFormProps> = ({ onSubmit, onClose }) => {
  const [materiaId, setMateriaId] = useState<number | ''>('');
  const [selectedAlumnoIds, setSelectedAlumnoIds] = useState<number[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [alumnos, setAlumnos] = useState<Usuario[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      setErrorData(null);
      try {
        const fetchedMaterias = await getSubjects();
        setMaterias(fetchedMaterias);

        const fetchedAlumnos = await getUsers({ rol: 'alumno' });
        setAlumnos(fetchedAlumnos);
      } catch (err: any) {
        console.error("Error al cargar datos para el formulario:", err);
        setErrorData(err.message || "Error desconocido al cargar datos.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleAlumnoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const alumnoId = Number(e.target.value);
    if (e.target.checked) {
      setSelectedAlumnoIds((prev) => [...prev, alumnoId]);
    } else {
      setSelectedAlumnoIds((prev) => prev.filter((id) => id !== alumnoId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!materiaId || selectedAlumnoIds.length === 0) {
      alert("Por favor, seleccione una materia y al menos un alumno.");
      return;
    }

    const formData: BulkEnrollmentPayload = {
      materia_id: Number(materiaId),
      alumno_ids: selectedAlumnoIds,
    };

    onSubmit(formData);
    onClose();
  };

  if (loadingData) {
    return <p className="text-center p-4">Cargando datos...</p>;
  }

  if (errorData) {
    return <p className="text-center p-4 text-red-500">Error: {errorData}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-center">Inscribir Alumnos a Materia</h2>

      <div>
        <label htmlFor="materia" className="block text-sm font-medium text-gray-700">Materia:</label>
        <select
          id="materia"
          value={materiaId}
          onChange={(e) => setMateriaId(Number(e.target.value))}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        >
          <option value="">Seleccione una materia</option>
          {materias.map((materia) => (
            <option key={materia.id} value={materia.id}>
              {materia.nombre} ({materia.nivel.nombre})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Alumnos:</label>
        <div className="border border-gray-300 rounded-md p-2 max-h-60 overflow-y-auto">
          {alumnos.length === 0 ? (
            <p className="text-gray-500">No hay alumnos disponibles.</p>
          ) : (
            alumnos.map((alumno) => (
              <div key={alumno.id} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  id={`alumno-${alumno.id}`}
                  value={alumno.id}
                  checked={selectedAlumnoIds.includes(alumno.id)}
                  onChange={handleAlumnoChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`alumno-${alumno.id}`} className="ml-2 text-sm text-gray-900">
                  {alumno.first_name} {alumno.last_name} ({alumno.username})
                </label>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        type="submit"
        className="bg-lamaSky text-white py-2 px-4 rounded-md border-none w-max self-center mt-4"
      >
        Inscribir Alumnos
      </button>
    </form>
  );
};

export default CourseEnrollmentForm;