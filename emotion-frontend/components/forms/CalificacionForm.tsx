    "use client";

    import React, { useState, useEffect } from 'react';
    import { Calificacion, CreateCalificacionPayload, UpdateCalificacionPayload } from '@/lib/api/calificaciones';
    import { SesionActividad } from '@/lib/api/sesiones_actividad';
    import { Usuario } from '@/lib/api/users';
    import { useAuth } from '@/lib/context/AuthContext'; // Para obtener el ID del docente logueado

    // Define la interfaz de props para CalificacionForm
    export interface CalificacionFormProps {
      type: "create" | "update";
      data?: Calificacion; // Para el caso de actualización, el objeto Calificacion existente
      onSubmit: (formData: CreateCalificacionPayload | UpdateCalificacionPayload) => void;
      onClose: () => void;
      availableSesiones: SesionActividad[]; // Lista de sesiones disponibles
      availableDocentes: Usuario[];     // Lista de docentes disponibles
    }

    const CalificacionForm: React.FC<CalificacionFormProps> = ({
      type,
      data,
      onSubmit,
      onClose,
      availableSesiones,
      availableDocentes,
    }) => {
      const { user, hasRole } = useAuth(); // Obtener el usuario logueado y su rol

      const [selectedSesionId, setSelectedSesionId] = useState<number | null>(data?.sesion?.id || null);
      const [selectedDocenteId, setSelectedDocenteId] = useState<number | null>(
        data?.docente?.id !== undefined && data?.docente?.id !== null
        ? data.docente.id
        : hasRole('docente') && user?.id !== undefined && user?.id !== null
        ? user.id
        : null);
      const [nota, setNota] = useState<number | null>(data?.nota || null);
      const [observaciones, setObservaciones] = useState<string>(data?.observaciones || '');
      const [error, setError] = useState<string | null>(null);

      // Si el usuario es docente, preseleccionar su propio ID y deshabilitar el selector
      useEffect(() => {
        if (hasRole('docente') && user?.id) {
          setSelectedDocenteId(user.id);
        }
      }, [hasRole, user]);


      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
        if (!selectedSesionId) {
          setError("Por favor, selecciona una sesión de actividad.");
          return;
        }
        if (!selectedDocenteId) {
          setError("Por favor, selecciona un docente.");
          return;
        }
        if (typeof nota !== 'number' || nota < 0 || nota > 20) { // Asumiendo nota de 0 a 10
          setError("La nota debe ser un número entre 0 y 20.");
          return;
        }

        setError(null);

        if (type === 'create') {
          const formData: CreateCalificacionPayload = {
            sesion: selectedSesionId,
            docente: selectedDocenteId,
            nota: nota, // Asegurarse de que sea un número
            observaciones: observaciones || null,
          };
          onSubmit(formData);
        } else { // type === 'update'
          const formData: UpdateCalificacionPayload = {
            nota: nota,
            observaciones: observaciones || null,
          };
          onSubmit(formData);
        }
        onClose(); // Cierra el modal después de enviar
      };

      return (
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-center">
            {type === "create" ? "Crear Nueva Calificación" : `Actualizar Calificación (ID: ${data?.id})`}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {/* Selector de Sesión (solo para creación, y si el usuario es admin) */}
          {type === 'create' && hasRole('admin') && (
            <div>
              <label htmlFor="sesionSelect" className="block text-sm font-medium text-gray-700">Sesión de Actividad:</label>
              <select
                id="sesionSelect"
                value={selectedSesionId || ''}
                onChange={(e) => setSelectedSesionId(parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="">Selecciona una sesión</option>
                {availableSesiones.map((sesion) => (
                  <option key={sesion.id} value={sesion.id}>
                    {sesion.actividad?.nombre} - {sesion.alumno?.first_name} {sesion.alumno?.last_name} ({sesion.fecha_hora_inicio_real?.substring(0, 10)})
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Si es docente creando, la sesión se asocia a sus actividades/alumnos */}
          {type === 'create' && hasRole('docente') && (
            <div>
              <label htmlFor="sesionSelect" className="block text-sm font-medium text-gray-700">Sesión de Actividad:</label>
              <select
                id="sesionSelect"
                value={selectedSesionId || ''}
                onChange={(e) => setSelectedSesionId(parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              >
                <option value="">Selecciona una sesión</option>
                {availableSesiones
                  .filter(sesion => sesion.actividad?.materia?.cursodocente_set?.some(cd => cd.docente?.id === user?.id)) // Filtra por las materias del docente
                  .map((sesion) => (
                  <option key={sesion.id} value={sesion.id}>
                    {sesion.actividad?.nombre} - {sesion.alumno?.first_name} {sesion.alumno?.last_name} ({sesion.fecha_hora_inicio_real?.substring(0, 10)})
                  </option>
                ))}
              </select>
            </div>
          )}


          {/* Selector de Docente */}
          <div>
            <label htmlFor="docenteSelect" className="block text-sm font-medium text-gray-700">Docente:</label>
            <select
              id="docenteSelect"
              value={selectedDocenteId || ''}
              onChange={(e) => setSelectedDocenteId(parseInt(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
              disabled={hasRole('docente') && type === 'create'} // Deshabilitar si es docente creando (se preselecciona su ID)
            >
              <option value="">Selecciona un docente</option>
              {availableDocentes.map((docente) => (
                <option key={docente.id} value={docente.id}>
                  {docente.first_name} {docente.last_name} ({docente.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="nota" className="block text-sm font-medium text-gray-700">Nota:</label>
            <input
              type="number"
              id="nota"
              value={nota ?? ''}
              onChange={(e) => setNota(e.target.value === null ? null : parseFloat(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              min="0"
              max="10"
              step="0.1"
              required
            />
          </div>

          <div>
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">Observaciones (Opcional):</label>
            <textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            ></textarea>
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

    export default CalificacionForm;
    