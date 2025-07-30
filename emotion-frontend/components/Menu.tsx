"use client"; // Este componente debe ser de cliente para usar el hook useAuth

import Image from "next/image";
import Link from "next/link";
import { useAuth } from '@/lib/context/AuthContext'; // Importa el hook de autenticación

// Define los elementos del menú con sus roles de visibilidad
const menuItems = [
  {
    title: "MENU GENERAL",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/dashboard/admin", // Podrías redirigir a /dashboard/alumno o /dashboard/docente según el rol
        visible: ["admin", "docente", "alumno"], // Todos pueden ver su home, pero la ruta puede variar
      },
      {
        icon: "/nivel.png",
        label: "Niveles",
        href: "/dashboard/list/niveles/",
        visible: ["admin"],
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
        visible: ["admin"], // Solo administradores pueden listar docentes
      },
      {
        icon: "/student.png",
        label: "Alumnos",
        href: "/dashboard/list/students",
        visible: ["admin"], // Solo administradores pueden listar alumnos
      },
    ],
  },
  {
    title: "CURSOS",
    items: [
      {
        icon: "/claseDoc.png",
        label: "Asignaciones de Docentes", // Nombre más claro
        href: "/dashboard/list/course-assignments",
        visible: ["admin", "docente", "alumno"],
      },
      {
        icon: "/claseAlu.png",
        label: "Inscripciones de Alumnos", // Nombre más claro
        href: "/dashboard/list/course-enrollments",
        visible: ["admin", "docente", "alumno"],
      },
    ],
  },
  {
    title: "OTROS",
    items: [
      {
        icon: "/logout.png",
        label: "Cerrar Sesión", // Nombre más claro
        href: "/logout", // Esta ruta debería manejar el logout
        visible: ["admin", "docente", "alumno"],
      },
    ],
  },
];

const Menu = () => {
  const { user, isAuthenticated, isLoading } = useAuth(); // Obtiene el usuario y su estado de autenticación

  if (isLoading) {
    return (
      <div className="mt-4 text-sm text-center text-gray-500">
        Cargando menú...
      </div>
    );
  }

  // Si no está autenticado, no muestra el menú (la redirección ya la maneja AuthContext)
  if (!isAuthenticated || !user) {
    return null; 
  }

  const currentUserRole = user.rol; // Obtiene el rol del usuario logueado

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((category) => (
        <div className="flex flex-col gap-2" key={category.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {category.title}
          </span>
          {category.items.map((item) => {
            // Verifica si el rol del usuario actual está incluido en los roles visibles para este ítem
            if (item.visible.includes(currentUserRole)) {
              // Lógica especial para el "Home" para redirigir según el rol
              let itemHref = item.href;
              if (item.label === "Home") {
                if (currentUserRole === 'admin') {
                  itemHref = "/dashboard/admin";
                } else if (currentUserRole === 'docente') {
                  itemHref = "/dashboard/docente";
                } else if (currentUserRole === 'alumno') {
                  itemHref = "/dashboard/alumno";
                }
              }

              return (
                <Link
                  href={itemHref}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
            return null; // No renderiza el ítem si el rol no es visible
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
