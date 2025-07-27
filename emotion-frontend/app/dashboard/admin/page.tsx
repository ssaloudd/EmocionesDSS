'use client';

import CountChart from "@/components/CountChart";
import EventCalendar from "@/components/EventCalendar";
import UserCard from "@/components/UserCard";
import { useEffect, useState } from 'react';

type ResumenData = {
  total_alumnos: number;
  total_profesores: number;
  total_materias: number;
};

const AdminPage = () => {
  const [data, setData] = useState<ResumenData | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/resumen-admin")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-3/3 flex flex-col gap-8">
        {/* USER CARDS */}
        {data ? (
          <div className="flex gap-4 justify-between flex-wrap">
            <UserCard type="Alumnos" cantidad={data.total_alumnos} />
            <UserCard type="Docentes" cantidad={data.total_alumnos} />
            <UserCard type="Materias" cantidad={data.total_materias} />
          </div>
        ) : (
          <p>Cargando...</p>
        )}
        {/* MIDDLE CHARTS */}
        <div className="w-full lg:w-3/3 h-[450px]">
          <CountChart />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
