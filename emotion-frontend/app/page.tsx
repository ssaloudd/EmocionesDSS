'use client';

import { useEffect, useState } from 'react';

type ResumenData = {
  total_alumnos: number;
  total_profesores: number;
  total_materias: number;
};

export default function Dashboard() {
  const [data, setData] = useState<ResumenData | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/resumen-admin')
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Resumen General</h1>
      {data ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 shadow rounded">
            <h2 className="text-xl font-semibold">Alumnos</h2>
            <p className="text-3xl">{data.total_alumnos}</p>
          </div>
          <div className="bg-white p-6 shadow rounded">
            <h2 className="text-xl font-semibold">Profesores</h2>
            <p className="text-3xl">{data.total_profesores}</p>
          </div>
          <div className="bg-white p-6 shadow rounded">
            <h2 className="text-xl font-semibold">Materias</h2>
            <p className="text-3xl">{data.total_materias}</p>
          </div>
        </div>
      ) : (
        <p>Cargando...</p>
      )}
    </div>
  );
}
