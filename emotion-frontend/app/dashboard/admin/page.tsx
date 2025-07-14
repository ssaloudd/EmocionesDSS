import CountChart from "@/components/CountChart";
import EventCalendar from "@/components/EventCalendar";
import UserCard from "@/components/UserCard";

const AdminPage = () => {
  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-3/3 flex flex-col gap-8">
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="Alumnos" />
          <UserCard type="Docentes" />
          <UserCard type="Materias" />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="w-full lg:w-3/3 h-[450px]">
          <CountChart />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
