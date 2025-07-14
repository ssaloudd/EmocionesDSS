
"use client";

import React, { useState, useEffect } from "react";
import { Usuario, CreateUpdateUsuarioPayload } from "@/lib/api/users";

export interface TeacherFormProps {
  type: "create" | "update";
  data?: Usuario; // Para el caso de actualización, el objeto Usuario existente
  onSubmit: (formData: CreateUpdateUsuarioPayload) => void; // Callback para enviar los datos al padre
  onClose: () => void; // Callback para cerrar el modal
}

const TeacherForm: React.FC<TeacherFormProps> = ({
  type,
  data,
  onSubmit,
  onClose,
}) => {
  const [username, setUsername] = useState(data?.username || "");
  const [firstName, setFirstName] = useState(data?.first_name || "");
  const [lastName, setLastName] = useState(data?.last_name || "");
  const [email, setEmail] = useState(data?.email || "");
  const [genero, setGenero] = useState(data?.genero || "");
  const [ci, setCi] = useState(data?.CI || "");
  const [password, setPassword] = useState(""); // Contraseña, solo para creación o cambio
  const rol = "docente"; // Rol fijo para estudiantes, no editable

  const GENEROS = [
    { value: "M", label: "Masculino" },
    { value: "F", label: "Femenino" },
    { value: "O", label: "Otro" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (
      !username ||
      !firstName ||
      !lastName ||
      !email ||
      !genero ||
      !ci ||
      !rol
    ) {
      alert("Por favor, complete todos los campos obligatorios.");
      return;
    }
    if (type === "create" && !password) {
      alert("Por favor, ingrese una contraseña para el nuevo docente.");
      return;
    }

    const formData: CreateUpdateUsuarioPayload = {
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      genero,
      CI: ci,
      rol,
    };

    // Solo añade la contraseña si es creación o si se ha modificado en actualización
    if (password || type === "create") {
      formData.password = password;
    }

    onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-center">
        {type === "create"
          ? "Crear Nuevo Docente"
          : `Actualizar Docente: ${data?.first_name} ${data?.last_name}`}
      </h2>

      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700"
        >
          Username de Docente:
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label
          htmlFor="first_name"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre:
        </label>
        <input
          type="text"
          id="first_name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label
          htmlFor="last_name"
          className="block text-sm font-medium text-gray-700"
        >
          Apellido:
        </label>
        <input
          type="text"
          id="last_name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email:
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label
          htmlFor="genero"
          className="block text-sm font-medium text-gray-700"
        >
          Género:
        </label>
        <select
          id="genero"
          value={genero}
          onChange={(e) => setGenero(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        >
          <option value="">Seleccione</option>
          {GENEROS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ci" className="block text-sm font-medium text-gray-700">
          CI:
        </label>
        <input
          type="text"
          id="ci"
          value={ci}
          onChange={(e) => setCi(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      
      {type === "create" || (type === "update" && password) ? ( // Muestra el campo de contraseña solo si es create o si se está editando la contraseña
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Contraseña{" "}
            {type === "update" ? "(dejar en blanco para no cambiar)" : ""}:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required={type === "create"}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPassword("temp")}
          className="text-blue-500 hover:underline text-sm self-start"
        >
          Cambiar contraseña
        </button>
      )}

      <button
        type="submit"
        className="bg-lamaSky text-white py-2 px-4 rounded-md border-none w-max self-center mt-4"
      >
        {type === "create" ? "Crear Docente" : "Actualizar Docente"}
      </button>
    </form>
  );
};

export default TeacherForm;
