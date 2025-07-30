"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { Usuario, CreateUpdateUsuarioPayload } from "@/lib/api/users"; // Ensure this path is correct
import { useAuth } from "@/lib/context/AuthContext"; // Import the authentication hook

// Props interface for the form
export interface StudentFormProps {
  type: "create" | "update";
  data?: Usuario; // Optional for update mode
  onSubmit: (formData: CreateUpdateUsuarioPayload) => void; // Callback to send data to parent
  onClose: () => void; // Callback to close the modal
}

const GENEROS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "O", label: "Otro" },
];

const StudentForm: React.FC<StudentFormProps> = ({
  type,
  data,
  onSubmit,
  onClose,
}) => {
  // States for form fields
  const [username, setUsername] = useState(data?.username || "");
  const [firstName, setFirstName] = useState(data?.first_name || "");
  const [lastName, setLastName] = useState(data?.last_name || "");
  const [email, setEmail] = useState(data?.email || "");
  const [genero, setGenero] = useState(data?.genero || "");
  const [ci, setCi] = useState(data?.CI || "");
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(type === "create"); // Show by default in create mode

  // Fixed role for students
  const rol = "alumno";

  // States for validation error messages
  const [usernameError, setUsernameError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [ciError, setCiError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState(""); // For general form errors

  const { user, isAuthenticated, isLoading } = useAuth(); // Get user and authentication status

  // Effect to pre-populate data in 'update' mode
  useEffect(() => {
    if (type === "update" && data) {
      setUsername(data.username || "");
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setEmail(data.email || "");
      setGenero(data.genero || "");
      setCi(data.CI || "");
      setPassword(""); // Always clear password in update mode
      setShowPasswordField(false); // Hide password field by default in update mode
    }
  }, [type, data]);

  // --- Validation Functions ---
  // Define individual validation functions first
  const validateUsername = (value: string): boolean => {
    if (!value) {
      setUsernameError("El username es requerido.");
      return false;
    }
    // Only letters, numbers, and hyphens, no spaces
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
    // Only letters (uppercase/lowercase) and spaces
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
    // Valid email format
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
    // Only numbers, max 10 digits
    if (!/^\d{1,10}$/.test(value)) {
      setCiError("La CI debe contener solo números y tener un máximo de 10 dígitos.");
      return false;
    }
    setCiError("");
    return true;
  };

  const validatePassword = (value: string): boolean => {
    // If the password field is not shown or is empty in 'update' mode, no validation is performed
    if (type === "update" && !showPasswordField) {
      setPasswordError("");
      return true;
    }

    // If in 'create' mode and password is empty
    if (type === "create" && !value) {
      setPasswordError("La contraseña es requerida para crear un alumno.");
      return false;
    }

    // If in 'update' mode, field is shown, but value is empty
    if (type === "update" && showPasswordField && !value) {
      setPasswordError("Por favor, ingresa una contraseña o deja el campo oculto.");
      return false;
    }

    // At least 8 characters
    if (value.length < 8) {
      setPasswordError("La contraseña debe contener al menos 8 caracteres.");
      return false;
    }
    // Cannot be entirely numeric
    if (/^\d+$/.test(value)) {
      setPasswordError("La contraseña no puede ser completamente numérica.");
      return false;
    }

    // Basic similarity validation with personal information
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

  // General form validation function
  // This function must be defined after individual validation functions
  const validateForm = (): boolean => {
    setFormError(""); // Clear general errors before validating

    const isUsernameValid = validateUsername(username);
    const isFirstNameValid = validateName(firstName, "first_name");
    const isLastNameValid = validateName(lastName, "last_name");
    const isEmailValid = validateEmail(email);
    const isCiValid = validateCi(ci);
    // Password validation only runs if the field is visible or if it's create mode
    const isPasswordValid = showPasswordField || type === "create" ? validatePassword(password) : true;

    // Ensure gender is selected
    const isGeneroValid = !!genero;
    if (!isGeneroValid) {
      setFormError("Por favor, seleccione un género.");
      return false;
    }

    // Returns true if all validations pass
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

  // Form submission handler
  // This function must be defined after validateForm
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Execute all validations before submitting
    if (!validateForm()) {
      // If validation fails, do not submit the form
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
      rol, // Fixed role as "alumno"
    };

    // Only add password if it's create mode or if it was modified in update mode
    if (password && showPasswordField) { // Ensure the field was visible and something was entered
      formData.password = password;
    }

    onSubmit(formData);
    onClose(); // Close the modal/form after submission
  };

  // If authentication is loading, show a loading message
  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">Cargando datos de usuario...</div>
    );
  }

  // If the user is not authenticated or not an admin, prevent access to the form
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
          ? "Crear Nuevo Alumno"
          : `Actualizar Alumno: ${data?.first_name} ${data?.last_name}`}
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
          Username de Alumno:
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={(e) => validateUsername(e.target.value)} // Validate on blur
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
          onBlur={(e) => validateName(e.target.value, "first_name")} // Validate on blur
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
          onBlur={(e) => validateName(e.target.value, "last_name")} // Validate on blur
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
          onBlur={(e) => validateEmail(e.target.value)} // Validate on blur
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
          onBlur={(e) => validateCi(e.target.value)} // Validate on blur
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
            onBlur={(e) => validatePassword(e.target.value)} // Validate on blur
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required={type === "create"} // Only required in create mode
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
        {type === "create" ? "Crear Alumno" : "Actualizar Alumno"}
      </button>
    </form>
  );
};

export default StudentForm;
