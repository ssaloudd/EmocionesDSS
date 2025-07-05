'use client';

import { useEffect, useRef, useState } from 'react';

export default function DeteccionEmociones() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emocion, setEmocion] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, []);

  const capturarYEnviarFrame = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');

      try {
        const response = await fetch('http://127.0.0.1:8000/api/detectar-emocion/', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          setEmocion(`${data.emocion} (${(data.confianza * 100).toFixed(1)}%)`);
        } else {
          setEmocion('No detectado');
        }
      } catch (error) {
        console.error(error);
        setEmocion('Error al conectar con la API');
      }
    }, 'image/jpeg');
  };

  useEffect(() => {
    const intervalo = setInterval(capturarYEnviarFrame, 1500); // cada 1.5s
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Detección de emociones en tiempo real</h1>
      <video ref={videoRef} autoPlay playsInline className="rounded shadow-md w-[300px] h-[300px]" />
      <div className="mt-4 text-xl">{emocion || 'Esperando detección...'}</div>
    </div>
  );
}
