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
import { Usuario, getUsers } from "@/lib/api/users";
import Image from "next/image";

// Simulación de usuario logueado (reemplazar con autenticación real)
const MOCKED_ALUMNO_ID = 2;
const MOCKED_ALUMNO_ROL = "alumno";

interface RealizarActividadPageProps {
  params: { materiaId: string; actividadId: string };
}

const RealizarActividadPage: React.FC<RealizarActividadPageProps> = () => {
  const params = useParams();
  const router = useRouter();

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null); // Almacena el stream de la cámara
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const getCurrentUserId = useCallback(async (): Promise<number | null> => {
    try {
      const users = await getUsers({ rol: MOCKED_ALUMNO_ROL });
      const mockedUser = users.find((user) => user.id === MOCKED_ALUMNO_ID);
      if (mockedUser) {
        return mockedUser.id;
      } else {
        setError(
          "Usuario simulado no encontrado. Asegúrate de tener un alumno con ID 6."
        );
        return null;
      }
    } catch (err: any) {
      setError(`Error al obtener usuario simulado: ${err.message}`);
      return null;
    }
  }, []);

  // Función para finalizar la sesión
  const isEndingRef = useRef(false);

  const endCurrentSession = useCallback(async () => {
    if (isEndingRef.current || sessionEnded) return;
    isEndingRef.current = true;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    if (sesionActividad) {
      try {
        console.log(`DEBUG: Intentando finalizar sesión ${sesionActividad.id}`);
        await endSesionActividad(sesionActividad.id);
        setSessionEnded(true);
        
        alert("Sesión de actividad finalizada.");
      } catch (err: any) {
        console.error("Error al finalizar sesión:", err);
        setError(`Error al finalizar sesión: ${err.message}`);
      }
    }
  }, [sesionActividad, sessionEnded, cameraStream]);

  // Limpiar intervalo y finalizar sesión al desmontar el componente
  useEffect(() => {
    return () => {
      endCurrentSession();
    };
  }, [endCurrentSession]);

  // useEffect 1: Cargar detalles de la actividad
  useEffect(() => {
    const fetchActivityDetails = async () => {
      if (!actividadId || !materiaId) {
        setError("IDs de materia o actividad no proporcionados.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const activities = await getActivities(materiaId);
        const foundActivity =
          activities.find((act) => act.id === actividadId) || null;

        if (foundActivity) {
          setActividad(foundActivity);
        } else {
          setError("Actividad no encontrada.");
        }
      } catch (err: any) {
        setError(`Error al cargar detalles de la actividad: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchActivityDetails();
  }, [actividadId, materiaId]);

  // useEffect 2: Acceder a la cámara cuando el videoRef esté disponible
  useEffect(() => {
    let active = true; // bandera para evitar operaciones si el componente ya se desmontó

    const startCamera = async () => {
      if (!videoRef.current || cameraStream) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (!active || !videoRef.current) {
          // Si el componente ya se desmontó, no hagas nada con el stream
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
          setError(
            "No se pudo acceder a la cámara. Asegúrate de dar permisos."
          );
          setCameraStream(null);
        }
      }
    };

    startCamera();

    // Cleanup: detener la cámara si el componente se desmonta
    return () => {
      active = false;
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
        console.log("DEBUG: Cámara detenida en cleanup.");
      }
    };
  }, [videoRef.current, cameraStream]); // Depende de videoRef.current y cameraStream

  // useEffect 3: Iniciar SesionActividad y Análisis de Emoción una vez que todo esté listo
  useEffect(() => {
    const startSessionAndEmotionDetection = async () => {
      if (!actividad || !cameraStream || sessionStarted) {
        // console.log("DEBUG: Esperando para iniciar sesión...", { actividad: !!actividad, cameraStream: !!cameraStream, sessionStarted });
        return;
      }

      setLoading(true); // Mostrar loading mientras se crea la sesión
      setError(null);

      try {
        const alumnoId = await getCurrentUserId();
        if (!alumnoId) {
          setLoading(false);
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
                }
              };
            },
            "image/jpeg",
            0.8
          );
        }, 1500); // Frecuencia de envío de frames

        intervalRef.current = captureInterval;

        if (actividad.duracion_analisis_minutos > 0) {
          setTimeout(() => {
            endCurrentSession();
          }, actividad.duracion_analisis_minutos * 60 * 1000);
        }
      } catch (err: any) {
        console.error("Error al iniciar sesión o detección:", err);
        setError(`Error al iniciar sesión o detección: ${err.message}`);
        // Si hay un error al iniciar la sesión, también detener la cámara
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
          setCameraStream(null);
        }
      } finally {
        setLoading(false);
      }
    };

    startSessionAndEmotionDetection();
  }, [
    actividad,
    cameraStream,
    sessionStarted,
    getCurrentUserId,
    endCurrentSession,
  ]);

  // Renderizado condicional
  if (!materiaId || !actividadId) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center text-red-500">
        Error: IDs de materia o actividad no válidos en la URL.
      </div>
    );
  }

  if (loading && !sessionStarted) {
    // Mostrar loading solo al inicio, no durante la sesión
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center">
        Cargando actividad y preparando detección...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!actividad) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 text-center">
        Actividad no encontrada.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Actividad: {actividad.nombre}</h1>
      <p className="text-gray-700 mb-2">{actividad.descripcion}</p>
      <p className="text-gray-600 text-sm mb-4">
        Duración de Análisis: {actividad.duracion_analisis_minutos} minutos
      </p>

      {!cameraStream && ( // Muestra el mensaje si no hay stream de cámara
        <p className="text-red-500 mb-4">
          Por favor, permite el acceso a la cámara para iniciar la actividad.
        </p>
      )}

      <div className="relative w-[400px] h-[300px] bg-gray-200 rounded-lg overflow-hidden shadow-lg mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {MOCKED_ALUMNO_ROL === "alumno" && (
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
          <span className="text-gray-500">Esperando inicio de sesión...</span>
        )}
      </div>

      {sessionStarted && !sessionEnded && (
        <button
          onClick={endCurrentSession}
          className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
        >
          Finalizar Sesión Manualmente
        </button>
      )}
    </div>
  );
};

export default RealizarActividadPage;
