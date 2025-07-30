
"use client";

import React, { useState, useEffect } from "react";
import { Usuario, CreateUpdateUsuarioPayload } from "@/lib/api/users";
import { useAuth } from "@/lib/context/AuthContext"; // Importa el hook de autenticación

export interface TeacherFormProps {
  type: "create" | "update";
  data?: Usuario; // Para el caso de actualización, el objeto Usuario existente
  onSubmit: (formData: CreateUpdateUsuarioPayload) => void; // Callback para enviar los datos al padre
  onClose: () => void; // Callback para cerrar el modal
}

const GENEROS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "O", label: "Otro" },
];

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
  const [showPasswordField, setShowPasswordField] = useState(type === "create"); // Muestra por defecto en creación

  const rol = "docente"; // Rol fijo para docentes, no editable

  // Estados para los mensajes de error de validación
  const [usernameError, setUsernameError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [ciError, setCiError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState(""); // Para errores generales del formulario

  const { user, isAuthenticated, isLoading } = useAuth(); // Obtiene el usuario y su estado de autenticación

  // Efecto para precargar los datos en modo 'update'
  useEffect(() => {
    if (type === "update" && data) {
      setUsername(data.username || "");
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setEmail(data.email || "");
      setGenero(data.genero || "");
      setCi(data.CI || "");
      setPassword(""); // Siempre limpia la contraseña en modo actualización
      setShowPasswordField(false); // Oculta el campo de contraseña por defecto en actualización
    }
  }, [type, data]);

  // --- Funciones de Validación ---
  // Definir las funciones de validación individuales primero
  const validateUsername = (value: string): boolean => {
    if (!value) {
      setUsernameError("El username es requerido.");
      return false;
    }
    // Solo letras, números y guiones, sin espacios
    if (!/^[a-zA-Z0-9-]+$/.test(value)) {
      setUsernameError(
        "El username solo puede contener letras, números y guiones (sin espacios)."
      );
      return false;
    }
    setUsernameError("");
    return true;
  };

  const validateName = (value: string, fieldName: string): boolean => {
    if (!value) {
      if (fieldName === "first_name") setFirstNameError("El nombre es requerido.");
      if (fieldName === "last_name") setLastNameError("El apellido es requerido.");
      return false;
    }
    // Solo letras (mayúsculas y minúsculas) y espacios
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
      if (fieldName === "first_name") setFirstNameError("El nombre solo puede contener letras y espacios.");
      if (fieldName === "last_name") setLastNameError("El apellido solo puede contener letras y espacios.");
      return false;
    }
    if (fieldName === "first_name") setFirstNameError("");
    if (fieldName === "last_name") setLastNameError("");
    return true;
  };

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError("El email es requerido.");
      return false;
    }
    // Formato de email válido
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Por favor, introduce un email válido.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateCi = (value: string): boolean => {
    if (!value) {
      setCiError("La CI es requerida.");
      return false;
    }
    // Solo números, máximo 10 dígitos
    if (!/^\d{1,10}$/.test(value)) {
      setCiError("La CI debe contener solo números y tener un máximo de 10 dígitos.");
      return false;
    }
    setCiError("");
    return true;
  };

  const validatePassword = (value: string): boolean => {
    // Si el campo de contraseña no se muestra o está vacío en modo 'update', no se valida
    if (type === "update" && !showPasswordField) {
      setPasswordError("");
      return true;
    }

    // Si es creación y la contraseña está vacía
    if (type === "create" && !value) {
      setPasswordError("La contraseña es requerida para crear un docente.");
      return false;
    }

    // Si es actualización y el campo se mostró pero el valor está vacío
    if (type === "update" && showPasswordField && !value) {
      setPasswordError("Por favor, ingresa una contraseña o deja el campo oculto.");
      return false;
    }

    // Al menos 8 caracteres
    if (value.length < 8) {
      setPasswordError("La contraseña debe contener al menos 8 caracteres.");
      return false;
    }
    // No puede ser completamente numérica
    if (/^\d+$/.test(value)) {
      setPasswordError("La contraseña no puede ser completamente numérica.");
      return false;
    }

    // Validación básica de similitud con información personal
    const personalInfo = [username, firstName, lastName, email, ci]
      .filter(Boolean)
      .map((s) => s.toLowerCase());
    const lowerCasePassword = value.toLowerCase();

    for (const info of personalInfo) {
      if (info && lowerCasePassword.includes(info)) {
        setPasswordError(
          "La contraseña no puede ser demasiado similar a tu información personal (username, nombre, apellido, email, CI)."
        );
        return false;
      }
    }

    setPasswordError("");
    return true;
  };

  // Función de validación general del formulario
  const validateForm = (): boolean => {
    setFormError(""); // Limpiar errores generales antes de validar

    const isUsernameValid = validateUsername(username);
    const isFirstNameValid = validateName(firstName, "first_name");
    const isLastNameValid = validateName(lastName, "last_name");
    const isEmailValid = validateEmail(email);
    const isCiValid = validateCi(ci);
    // La validación de contraseña solo se ejecuta si el campo está visible o si es modo creación
    const isPasswordValid = showPasswordField || type === "create" ? validatePassword(password) : true;


    // Asegurarse de que el género esté seleccionado
    const isGeneroValid = !!genero;
    if (!isGeneroValid) {
      setFormError("Por favor, seleccione un género.");
      return false;
    }

    // Retorna true si todas las validaciones pasan
    return (
      isUsernameValid &&
      isFirstNameValid &&
      isLastNameValid &&
      isEmailValid &&
      isCiValid &&
      isPasswordValid &&
      isGeneroValid
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ejecutar todas las validaciones antes de enviar
    if (!validateForm()) {
      // Si la validación falla, no se envía el formulario
      setFormError("Por favor, corrige los errores en el formulario.");
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
    if (password && showPasswordField) { // Asegurarse de que el campo estaba visible y se ingresó algo
      formData.password = password;
    }

    onSubmit(formData);
    onClose();
  };

  // Si la autenticación está cargando, muestra un mensaje
  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">Cargando datos de usuario...</div>
    );
  }

  // Si el usuario no está autenticado o no es admin, no permite ver el formulario
  if (!isAuthenticated || user?.rol !== "admin") {
    return (
      <div className="p-4 text-center text-red-500">
        No tienes permisos para acceder a esta funcionalidad.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-center">
        {type === "create"
          ? "Crear Nuevo Docente"
          : `Actualizar Docente: ${data?.first_name} ${data?.last_name}`}
      </h2>

      {formError && (
        <p className="text-red-600 bg-red-100 p-2 rounded-md text-sm text-center">
          {formError}
        </p>
      )}

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
          onBlur={(e) => validateUsername(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
        {usernameError && (
          <p className="text-red-500 text-xs mt-1">{usernameError}</p>
        )}
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
          onBlur={(e) => validateName(e.target.value, "first_name")}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
        {firstNameError && (
          <p className="text-red-500 text-xs mt-1">{firstNameError}</p>
        )}
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
          onBlur={(e) => validateName(e.target.value, "last_name")} // Validar al salir del campo
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
        {lastNameError && (
          <p className="text-red-500 text-xs mt-1">{lastNameError}</p>
        )}
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
          onBlur={(e) => validateEmail(e.target.value)} // Validar al salir del campo
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
        {emailError && (
          <p className="text-red-500 text-xs mt-1">{emailError}</p>
        )}
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
          onBlur={(e) => validateCi(e.target.value)} // Validar al salir del campo
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
        {ciError && <p className="text-red-500 text-xs mt-1">{ciError}</p>}
      </div>
      
      {showPasswordField ? (
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
            onBlur={(e) => validatePassword(e.target.value)} // Validar al salir del campo
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required={type === "create"} // Solo requerido en modo creación
          />
          {passwordError && (
            <p className="text-red-500 text-xs mt-1">{passwordError}</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowPasswordField(true)}
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
