"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getActivities, Actividad } from "@/lib/api/actividades";
import {
  createSesionActividad,
  endSesionActividad,
  sendEmotionFrame,
  SesionActividad,
} from "@/lib/api/sesiones_actividad";
import Image from "next/image";

// --- IMPORTACIÓN CLAVE: El hook useAuth ---
import { useAuth } from '@/lib/context/AuthContext';

interface RealizarActividadPageProps {
  params: { materiaId: string; actividadId: string };
}

const RealizarActividadPage: React.FC<RealizarActividadPageProps> = () => {
  const params = useParams();
  const router = useRouter();

  // --- USO CLAVE: Obtener el estado de autenticación del contexto ---
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();

  const materiaId = params.materiaId
    ? parseInt(params.materiaId as string)
    : null;
  const actividadId = params.actividadId
    ? parseInt(params.actividadId as string)
    : null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [sesionActividad, setSesionActividad] =
    useState<SesionActividad | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [emotionConfidence, setEmotionConfidence] = useState<number | null>(
    null
  );
  const [loadingPage, setLoadingPage] = useState(true); // Estado de carga inicial de la página
  const [error, setError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null); // Almacena el stream de la cámara
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Función para finalizar la sesión
  const isEndingRef = useRef(false);

  const endCurrentSession = useCallback(async () => {
    if (isEndingRef.current || sessionEnded) return;
    isEndingRef.current = true;

    console.log("DEBUG: Ejecutando endCurrentSession...");

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("DEBUG: Intervalo de emociones detenido.");
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
      console.log("DEBUG: Contador detenido.");
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      console.log("DEBUG: Cámara detenida.");
    }

    if (sesionActividad) {
      try {
        await endSesionActividad(sesionActividad.id);
        console.log(
          `DEBUG: Sesión ${sesionActividad.id} finalizada correctamente.`
        );
      } catch (err: any) {
        console.error("Error al finalizar sesión:", err);
        setError(`Error al finalizar sesión: ${err.message}`);
      }
    }
    setSessionEnded(true);
  }, [sesionActividad, sessionEnded, cameraStream]);

  // useEffect para limpiar intervalos y stream al desmontar o al finalizar la sesión
  /*useEffect(() => {
    return () => {
      console.log("DEBUG: Cleanup effect ejecutado.");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    };
  }, [cameraStream]); // Depende de cameraStream para asegurar que se detenga si cambia o se desmonta*/

  // useEffect 1: Cargar detalles de la actividad y controlar acceso
  useEffect(() => {
    const fetchActivityDetails = async () => {
      if (isLoading) {
        return; // Esperar a que la autenticación cargue
      }
      if (!isAuthenticated) {
        console.log("DEBUG: Usuario no autenticado, redirigiendo a /login");
        router.push('/login');
        return;
      }
      // Esta página es para que el alumno realice la actividad.
      // Otros roles pueden verla, pero no podrán iniciar la funcionalidad de "realizar".
      // No hay redirección estricta por rol aquí, la funcionalidad se controla más abajo.

      if (!actividadId || !materiaId) {
        setError("IDs de materia o actividad no proporcionados.");
        setLoadingPage(false);
        return;
      }
      setLoadingPage(true); // Iniciar carga de la página
      setError(null);
      try {
        const activities = await getActivities(materiaId);
        const foundActivity =
          activities.find((act) => act.id === actividadId) || null;

        if (foundActivity) {
          setActividad(foundActivity);
        } else {
          setError("Actividad no encontrada o no tienes permiso para verla.");
        }
      } catch (err: any) {
        console.error("Error al cargar detalles de la actividad:", err);
        setError(`Error al cargar detalles de la actividad: ${err.message}`);
      } finally {
        setLoadingPage(false); // Finalizar carga de la página
      }
    };
    fetchActivityDetails();
  }, [actividadId, materiaId, isAuthenticated, isLoading, router]); // Dependencias de autenticación y router

  // useEffect 2: Acceder a la cámara cuando el videoRef y la autenticación estén disponibles
  useEffect(() => {
    // Solo iniciar cámara si la página no está en carga, está autenticado y no ha terminado la sesión
    if (loadingPage || !isAuthenticated || sessionEnded) {
      if (sessionEnded && cameraStream) { // Asegurarse de detener la cámara si la sesión ya terminó
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
        console.log("DEBUG: Cámara detenida porque la sesión ya finalizó.");
      }
      return;
    }

    let active = true; // bandera para evitar operaciones si el componente ya se desmontó

    const startCamera = async () => {
      if (!videoRef.current || cameraStream) return; // Si ya hay stream, no iniciar de nuevo

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        if (!active || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        videoRef.current.srcObject = stream;
        setCameraStream(stream); // Guardar el stream en el estado

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current
              .play()
              .catch((e) => console.error("Error al reproducir video:", e));
          }
        };

        console.log("DEBUG: Cámara iniciada y stream asignado.");
      } catch (err: any) {
        console.error("Error al acceder a la cámara:", err);
        if (active) {
          setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
          setCameraStream(null);
        }
      }
    };

    startCamera();

    // Cleanup: detener la cámara si el componente se desmonta o se cambia de página
    return () => {
      active = false;
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
        console.log("DEBUG: Cámara detenida en cleanup del useEffect.");
      }
    };
  }, [videoRef.current, cameraStream, sessionEnded]); // Dependencias

  // useEffect 3: Iniciar SesionActividad y Análisis de Emoción una vez que todo esté listo
  useEffect(() => {
    const startSessionAndEmotionDetection = async () => {
      // Solo iniciar si:
      // - La página no está cargando
      // - El usuario está autenticado
      // - El usuario es un ALUMNO (solo alumnos realizan la actividad)
      // - La actividad ha sido cargada
      // - El stream de la cámara está disponible
      // - La sesión aún no ha comenzado
      if (loadingPage || !isAuthenticated || !hasRole('alumno') || !actividad || !cameraStream || sessionStarted) {
        console.log("DEBUG: Esperando para iniciar sesión o no cumple requisitos.", {
          loadingPage, isAuthenticated, isAlumno: hasRole('alumno'), actividad: !!actividad, cameraStream: !!cameraStream, sessionStarted
        });
        return;
      }

      setLoadingPage(true); // Mostrar loading mientras se crea la sesión
      setError(null);

      try {
        const alumnoId = user?.id; // Obtener el ID real del alumno desde el contexto
        if (!alumnoId) {
          setError("ID de alumno no disponible. Por favor, inicie sesión como alumno.");
          setLoadingPage(false);
          return;
        }

        const newSesion = await createSesionActividad({
          actividad: actividad.id,
          alumno: alumnoId,
        });
        setSesionActividad(newSesion);
        setSessionStarted(true);
        startTimeRef.current = Date.now();

        console.log("DEBUG: Sesión de actividad creada:", newSesion.id);

        const mins = actividad.duracion_analisis_minutos;
        if (mins > 0) {
          const durationInSeconds = mins * 60;
          console.log("DEBUG: iniciando contador con", durationInSeconds, "segundos");
          setRemainingTime(durationInSeconds);

          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }

          countdownRef.current = setInterval(() => {
            setRemainingTime((prev) => {
              if (prev === null) return null;

              if (prev <= 1) {
                clearInterval(countdownRef.current!);
                countdownRef.current = null;
                console.log("DEBUG: contador llegó a 0, forzando endCurrentSession");
                endCurrentSession();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          console.log("DEBUG: duración de análisis no positiva, no se inicia contador automático");
        }

        const captureInterval = setInterval(async () => {
          const video = videoRef.current;
          if (!video || !newSesion.id) return;

          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            async (blob) => {
              if (!blob) return;

              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = async () => {
                const base64data = reader.result as string;
                const momentoSegundo = Math.floor(
                  (Date.now() - startTimeRef.current) / 1000
                );

                try {
                  const response = await sendEmotionFrame(
                    newSesion.id,
                    base64data,
                    momentoSegundo
                  );
                  console.log("Respuesta de detección de emoción:", response);
                  if (response.emocion) {
                    setCurrentEmotion(response.emocion);
                    setEmotionConfidence(response.confianza);
                  } else {
                    setCurrentEmotion("No detectado");
                    setEmotionConfidence(null);
                  }
                } catch (err: any) {
                  console.error("Error al enviar frame de emoción:", err);
                  // Podrías manejar errores específicos aquí, ej. si el backend deniega por rol
                }
              };
            },
            "image/jpeg",
            0.8
          );
        }, 1500); // Frecuencia de envío de frames

        intervalRef.current = captureInterval;

      } catch (err: any) {
        console.error("Error al iniciar sesión o detección:", err);
        setError(`Error al iniciar sesión o detección: ${err.message}`);
        // Si hay un error al iniciar la sesión, también detener la cámara
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
          setCameraStream(null);
        }
      } finally {
        setLoadingPage(false); // Finalizar carga de la página
      }
    };

    startSessionAndEmotionDetection();
  }, [
    actividad,
    cameraStream,
    sessionStarted,
    user, // Depende del objeto user para obtener el ID real
    isAuthenticated,
    isLoading,
    hasRole,
    endCurrentSession,
    loadingPage // Asegurarse de que no se ejecute si la página está cargando
  ]);

  // Renderizado condicional
  if (!materiaId || !actividadId) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center text-red-500">
        Error: IDs de materia o actividad no válidos en la URL.
      </div>
    );
  }

  // Mostrar loading inicial de la página
  if (loadingPage && !sessionStarted) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center">
        Cargando actividad y preparando detección...
      </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  // Si no se encontró la actividad (y no hubo error de carga general)
  if (!actividad) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center">
        Actividad no encontrada o no disponible.
      </div>
    );
  }

  // Contenido principal de la página
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Actividad: {actividad.nombre}</h1>
      <p className="text-gray-700 mb-2">{actividad.descripcion}</p>
      <p className="text-gray-600 text-sm mb-4">
        Duración de Análisis: {actividad.duracion_analisis_minutos} minutos
      </p>

      {!cameraStream && (
        <p className="text-red-500 mb-4">
          No es posible el acceso a la cámara. Asegúrate de dar permisos.
        </p>
      )}

      <div className="relative w-[400px] h-[300px] bg-gray-200 rounded-lg overflow-hidden shadow-lg mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {hasRole('alumno') && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            Emoción: {currentEmotion || "Detectando..."}
            {currentEmotion &&
              emotionConfidence !== null &&
              ` (${(emotionConfidence * 100).toFixed(1)}%)`}
          </div>
        )}
      </div>

      <div className="mt-4 text-xl font-semibold">
        {sessionStarted ? (
          sessionEnded ? (
            <span className="text-green-600">Sesión Finalizada.</span>
          ) : (
            <span className="text-blue-600">Sesión en curso...</span>
          )
        ) : (
          // Mostrar mensaje diferente si el usuario no es alumno
          hasRole('alumno') ? (
            <span className="text-gray-500">Preparando sesión...</span>
          ) : (
            <span className="text-gray-500">Solo los alumnos pueden realizar esta actividad.</span>
          )
        )}
      </div>

      {sessionStarted && !sessionEnded && remainingTime !== null && (
        <div className="mt-4 text-lg text-center">
          Tiempo restante:{" "}
          <span className="font-bold text-blue-700">
            {Math.floor(remainingTime / 60)
              .toString()
              .padStart(2, "0")}
            :{(remainingTime % 60).toString().padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
};

export default RealizarActividadPage;
