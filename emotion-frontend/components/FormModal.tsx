"use client";

import React from 'react';
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

// Importa las interfaces necesarias
import { Materia, CreateUpdateMateriaPayload } from '@/lib/api/subjects';
import { Usuario, CreateUpdateUsuarioPayload } from '@/lib/api/users';
import { Nivel, CreateUpdateNivelPayload } from '@/lib/api/niveles';
// Importa los payloads para las operaciones bulk
import { BulkEnrollmentPayload } from '@/lib/api/curso_alumnos';
import { BulkAssignmentPayload } from '@/lib/api/curso_docentes';

// Importa las interfaces de props de los formularios internos
import { SubjectFormProps } from "./forms/SubjectForm";
import { UserFormProps } from "./forms/UserForm";
import { TeacherFormProps } from "./forms/TeacherForm";
import { StudentFormProps } from "./forms/StudentForm";
import { NivelFormProps } from "./forms/NivelForm";
import { CourseEnrollmentFormProps } from "./forms/CourseEnrollmentForm";
import { CourseAssignmentFormProps } from "./forms/CourseAssignmentForm";

// USE LAZY LOADING para los formularios
// Los componentes dinámicos no necesitan ser genéricos aquí, solo sus props
const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Cargando formulario de Docente...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Cargando formulario de Estudiante...</h1>,
});
const UserForm = dynamic(() => import("./forms/UserForm"), {
  loading: () => <h1>Cargando formulario de Usuario...</h1>,
});
const NivelForm = dynamic(() => import("./forms/NivelForm"), {
  loading: () => <h1>Cargando formulario de Nivel...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <h1>Cargando formulario de Materia...</h1>,
});
const CourseEnrollmentForm = dynamic<CourseEnrollmentFormProps>(() => import("./forms/CourseEnrollmentForm"), {
  loading: () => <h1>Cargando formulario de Inscripción...</h1>,
});
const CourseAssignmentForm = dynamic<CourseAssignmentFormProps>(() => import("./forms/CourseAssignmentForm"), {
  loading: () => <h1>Cargando formulario de Asignación...</h1>,
});

// Mapeo de nombres de tabla a componentes de formulario.
// Ahora, el valor es el componente React en sí, no una función que lo renderiza.
const forms = {
  teacher: TeacherForm,
  student: StudentForm,
  subject: SubjectForm,
  nivel: NivelForm,
  user: UserForm,
  "course-enrollment": CourseEnrollmentForm, // Añade el nuevo formulario
  "course-assignment": CourseAssignmentForm, // Añade el nuevo formulario
  // Se añade otros formularios aquí...
};

// Define los tipos de tabla que tienen un formulario asociado
type FormTableKey = keyof typeof forms; // Esto será "teacher" | "student" | "subject" | "user"

// Define las props de FormModal como un componente genérico <TData, TPayload>
interface FormModalProps<TData, TPayload> {
  table: FormTableKey; // 'table' solo puede ser una de las claves de 'forms'
  type: "create" | "update" | "delete";
  data?: TData;
  id?: number;
  onSubmit?: (formData: TPayload) => void;
  onConfirm?: () => void;
}

// El componente FormModal ahora es genérico
const FormModal = <TData, TPayload>(
  {
    table,
    type,
    data,
    id,
    onSubmit,
    onConfirm,
  }: FormModalProps<TData, TPayload>
) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-lamaPurple";

  const [open, setOpen] = useState(false);

  const handleCloseModal = () => {
    setOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleCloseModal();
  };

  const FormContent = () => {
    if (type === "delete" && id) {
      return (
        <form className="p-4 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleDeleteConfirm(); }}>
          <span className="text-center font-medium">
            Se perderán todos los datos. ¿Estás seguro de que quieres eliminar este {table}?
          </span>
          <button
            type="submit"
            className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center"
          >
            Eliminar
          </button>
        </form>
      );
    } else if (type === "create" || type === "update") {
      const SpecificForm = forms[table]; // Obtiene el componente React directamente
      let typedData: any;
      if (SpecificForm) {
        if (table === "subject") {
          typedData = data as Materia | undefined;
        } else if (
          table === "user" ||
          table === "teacher" ||
          table === "student"
        ) {
          typedData = data as Usuario | undefined;
        } else if (table === "nivel") {
          typedData = data as Nivel | undefined;
        } else if (
          table === "course-enrollment" ||
          table === "course-assignment"
        ) {
          // Para estos formularios, 'data' no se usa para precargar, pero se mantiene el tipo
          typedData = undefined; // O el tipo de dato específico si se fuera a usar
        }

        // Se añade más 'else if' para otros tipos de tabla

        return (
          <SpecificForm
            type={type}
            data={typedData} // Usamos el data casteado
            onSubmit={onSubmit as (formData: any) => void}
            onClose={handleCloseModal}
          />
        );
      } else {
        return (
          <p className="text-center text-red-500">
            Formulario no encontrado para {table}!
          </p>
        );
      }
    } else {
      return <p className="text-center text-red-500">Tipo de operación no soportado.</p>;
    }
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="Icon" width={16} height={16} />
      </button>
      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <FormContent />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={handleCloseModal}
            >
              <Image src="/close.png" alt="Cerrar" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
