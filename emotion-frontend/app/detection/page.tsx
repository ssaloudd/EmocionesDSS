'use client';

import { useEffect, useRef, useState } from 'react';

export default function DeteccionEmociones() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emocion, setEmocion] = useState<string | null>(null);
  const [confianza, setConfianza] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Solicitar acceso a la cámara
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error al acceder a la cámara:", err);
        setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
      });
  }, []);

  const capturarYEnviarFrame = async () => {
    const video = videoRef.current;
    if (!video) return;

    // Crear un canvas para dibujar el frame del video
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; // Usar el tamaño real del video para mejor calidad
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir el contenido del canvas a un Blob (imagen)
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError('No se pudo capturar el frame del video.');
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg'); // 'image' debe coincidir con request.FILES.get('image') en Django

      setLoading(true);
      setError(null); // Limpiar errores previos

      try {
        const response = await fetch('http://127.0.0.1:8000/api/test-detectar-emocion/', {
          method: 'POST',
          body: formData,
          // No necesitas 'Content-Type': 'multipart/form-data' aquí,
          // fetch lo establece automáticamente con FormData.
        });

        const data = await response.json(); // La respuesta siempre será JSON

        if (response.ok) { // Si el status code es 2xx
          if (data.emocion) { // Si se detectó una emoción
            setEmocion(data.emocion);
            setConfianza(data.confianza);
          } else { // Si no se detectó rostro (status 200 con message)
            setEmocion('No detectado');
            setConfianza(null);
          }
        } else { // Si el status code es un error (4xx, 5xx)
          setEmocion('Error en la detección');
          setConfianza(null);
          setError(data.error || 'Error desconocido en la API.');
        }
      } catch (err: any) {
        console.error("Error al conectar con la API:", err);
        setEmocion('Error de conexión');
        setConfianza(null);
        setError(`Error de red o conexión: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg', 0.9); // 'image/jpeg' y calidad 0.9
  };

  useEffect(() => {
    // Solo iniciar la captura si el video está listo y no hay errores de cámara
    if (videoRef.current && !error) {
      const interval = setInterval(capturarYEnviarFrame, 1500); // cada 1.5s
      return () => clearInterval(interval);
    }
  }, [videoRef.current, error]); // Re-ejecutar si videoRef.current cambia o hay un error de cámara

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Detección de emociones en tiempo real (Prueba)</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <video ref={videoRef} autoPlay playsInline className="rounded shadow-md w-[300px] h-[300px]" />
      <div className="mt-4 text-xl">
        {loading ? 'Detectando...' : (emocion ? `${emocion} (${(confianza! * 100).toFixed(1)}%)` : 'Esperando detección...')}
      </div>
    </div>
  );
}
