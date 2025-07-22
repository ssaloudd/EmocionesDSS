// Update the import path if 'lib/data.ts' is located elsewhere, e.g.:
import { role } from "../lib/data";
// Or create 'lib/data.ts' with the following content if it does not exist:
// export const role = "admin"; // or dynamically set based on your app logic
import Image from "next/image";
import Link from "next/link";
import { title } from "process";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/dashboard/admin",
        visible: ["admin"],
      },
      {
        icon: "/teacher.png",
        label: "Docentes",
        href: "/dashboard/list/teachers",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/student.png",
        label: "Alumnos",
        href: "/dashboard/list/students",
        visible: ["admin", "teacher"],
      },

      /*{
        icon: "/lesson.png",
        label: "Lecciones",
        href: "/list/lessons",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/exam.png",
        label: "Exámenes",
        href: "/list/exams",
        visible: ["admin", "teacher", "alumno"],
      },
      /*{
        icon: "/assignment.png",
        label: "Assignments",
        href: "/list/assignments",
        visible: ["admin", "teacher", "alumno"],
      },*/
      /*{
        icon: "/result.png",
        label: "Resultados",
        href: "/list/results",
        visible: ["admin", "teacher", "alumno"],
      },*/
      /*{
        icon: "/attendance.png",
        label: "Attendance",
        href: "/list/attendance",
        visible: ["admin", "teacher", "student", "parent"],
      },*/
      /*{
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["admin", "teacher", "alumno"],
      },*/
      /*{
        icon: "/message.png",
        label: "Messages",
        href: "/list/messages",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent"],
      },*/
    ],
  },
  {
    title: "CURSOS",
    items: [
      {
        icon: "/nivel.png",
        label: "Niveles",
        href: "/dashboard/list/niveles/",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/materias.png",
        label: "Materias",
        href: "/dashboard/list/subjects/",
        visible: ["admin", "teacher", "student"],
      },
      /*{
        icon: "/class.png",
        label: "Clases",
        href: "/list/classes",
        visible: ["admin", "teacher"],
      },*/
    ],
  },
  {
    title: "OTROS",
    items: [
      /*{
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["admin", "teacher", "student"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "teacher", "student", "parent"],
      },*/
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "teacher", "student"],
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
