# api/ml_model/detector.py
import cv2
import mediapipe as mp
import numpy as np
from tensorflow.keras.models import load_model
import os

# Emociones en el mismo orden que en el entrenamiento
EMOTIONS = ['Disgusto', 'Enojo', 'Felicidad', 'Miedo', 'Neutral', 'Sorpresa', 'Tristeza']

BASE_DIR_ML = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR_ML, '3-5_personalizado_best_v1.keras')

# Cargar modelo entrenado CNN
try:
    cnn_model = load_model(MODEL_PATH)
    print(f"Modelo .keras cargado exitosamente desde: {MODEL_PATH}")
except Exception as e:
    print(f"Error al cargar el modelo .keras: {e}")
    cnn_model = None

IMG_SIZE = (100, 100)  # Ajusta al tamaño usado en el entrenamiento

# Inicializar MediaPipe
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

def detectar_emocion(imagen):
    """
    Detecta emociones en una imagen dada.

    Args:
        imagen (numpy.ndarray): La imagen de entrada en formato BGR de OpenCV.

    Returns:
        dict: Un diccionario con la emoción predominante, su confianza,
              y un diccionario con las probabilidades de todas las emociones.
              Retorna None si no se detecta ningún rostro o si el modelo no está cargado.
    """
    if cnn_model is None:
        print("Error: El modelo CNN no está cargado. No se puede realizar la detección.")
        return None
    
    rgb = cv2.cvtColor(imagen, cv2.COLOR_BGR2RGB)
    resultados = face_detection.process(rgb)

    if not resultados.detections:
        return None

    for det in resultados.detections:
        bboxC = det.location_data.relative_bounding_box
        h, w, _ = imagen.shape
        x, y, ancho, alto = int(bboxC.xmin * w), int(bboxC.ymin * h), int(bboxC.width * w), int(bboxC.height * h)
                
        # Asegurarse de que las coordenadas sean válidas para evitar errores de recorte
        x = max(0, x)
        y = max(0, y)
        ancho = min(w - x, ancho)
        alto = min(h - y, alto)

        rostro = imagen[y:y+alto, x:x+ancho]

        # Preprocesar el rostro para el modelo CNN
        rostro = cv2.resize(rostro, IMG_SIZE)
        #rostro = cv2.cvtColor(rostro, cv2.COLOR_BGR2GRAY)  # solo si entrenaste en escala de grises
        rostro = rostro / 255.0
        #rostro = np.expand_dims(rostro, axis=-1)  # (H, W, 1)
        rostro = np.expand_dims(rostro, axis=0)   # Añade una dimensión para el batch (1, H, W, 3)

        # Realizar la predicción
        pred = cnn_model.predict(rostro)[0] # [0] para obtener el array de probabilidades
        
        # Obtener la emoción predominante y su confianza
        idx = np.argmax(pred)
        emocion_predominante = EMOTIONS[idx]
        confianza_emocion = float(pred[idx])

        # Crear el diccionario de datos raw de emociones
        datos_raw_emociones = {EMOTIONS[i]: float(p) for i, p in enumerate(pred)}
        return {
            'emocion_predominante': emocion_predominante,
            'confianza_emocion': confianza_emocion,
            'datos_raw_emociones': datos_raw_emociones
        }
    # Si no se detecta ningún rostro, retornar None
    print("No se detectó ningún rostro en la imagen.")
    
    return None
