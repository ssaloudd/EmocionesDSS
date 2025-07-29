// Update the import path if 'lib/data.ts' is located elsewhere, e.g.:
import { role } from "../lib/data";
// Or create 'lib/data.ts' with the following content if it does not exist:
// export const role = "admin"; // or dynamically set based on your app logic
import Image from "next/image";
import Link from "next/link";
import { title } from "process";

const menuItems = [
  {
    title: "MENU GENERAL",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/dashboard/admin",
        visible: ["admin"],
      },
      {
        icon: "/nivel.png",
        label: "Niveles",
        href: "/dashboard/list/niveles/",
        visible: ["admin", "docente"],
      },
      {
        icon: "/materias.png",
        label: "Materias",
        href: "/dashboard/list/subjects/",
        visible: ["admin", "docente", "alumno"],
      },
      {
        icon: "/result.png",
        label: "Calificaciones",
        href: "/dashboard/list/calificaciones/",
        visible: ["admin", "docente", "alumno"],
      },
      {
        icon: "/teacher.png",
        label: "Docentes",
        href: "/dashboard/list/teachers",
        visible: ["admin", "docente"],
      },
      {
        icon: "/student.png",
        label: "Alumnos",
        href: "/dashboard/list/students",
        visible: ["admin", "docente"],
      },
    ],
  },
  {
    title: "CURSOS",
    items: [
      {
        icon: "/claseDoc.png",
        label: "Cursos de Docentes",
        href: "/dashboard/list/course-assignments",
        visible: ["admin", "docente"],
      },
      {
        icon: "/claseAlu.png",
        label: "Cursos de Alumnos",
        href: "/dashboard/list/course-enrollments",
        visible: ["admin", "docente"],
      },
    ],
  },
  {
    title: "OTROS",
    items: [
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "docente", "alumno"],
      },
    ],
  },
];

const Menu = () => {
  return (
    <div className="mt-4 text-sm">
      {menuItems.map((i) => (
        <div className="flex flex-col gap-2" key={i.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {i.title}
          </span>
          {i.items.map((item) => {
            if (item.visible.includes(role)) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
