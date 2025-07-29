import os
import cv2
import numpy as np
from tensorflow.keras.models import load_model
import mediapipe as mp

# Configuración RAF-DB
EMOTION_LABELS = ['sorpresa', 'miedo', 'disgusto', 'felicidad', 'tristeza', 'enojo', 'neutral']
IMG_SIZE = (48, 48)
MIN_FACE_SIZE = 48

# Ruta al modelo (en la misma carpeta ml_model)
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'raf_model.keras')

# Cargar modelo al inicio
try:
    model = load_model(MODEL_PATH)
    print(f"✅ Modelo RAF-DB cargado desde: {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error cargando modelo: {str(e)}")
    model = None

def detectar_emocion(imagen):
    if model is None:
        return {'detected': False, 'error': 'Modelo no disponible'}
    
    try:
        # Detección de rostros
        face_detection = mp.solutions.face_detection.FaceDetection(
            model_selection=1,
            min_detection_confidence=0.7
        )
        
        rgb_frame = cv2.cvtColor(imagen, cv2.COLOR_BGR2RGB)
        results = face_detection.process(rgb_frame)
        
        if not results.detections:
            return {'detected': False, 'message': 'No se detectaron rostros'}

        # Obtener coordenadas
        bbox = results.detections[0].location_data.relative_bounding_box
        ih, iw = imagen.shape[:2]
        x = int(bbox.xmin * iw)
        y = int(bbox.ymin * ih)
        w = int(bbox.width * iw)
        h = int(bbox.height * ih)
        
        # Ajustar coordenadas
        x, y = max(0, x), max(0, y)
        w, h = min(iw - x, w), min(ih - y, h)

        if w < MIN_FACE_SIZE or h < MIN_FACE_SIZE:
            return {'detected': False, 'message': 'Rostro demasiado pequeño'}

        # Preprocesamiento RAF-DB
        face_region = imagen[y:y+h, x:x+w]
        gray_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        resized_face = cv2.resize(gray_face, IMG_SIZE)
        normalized_face = resized_face.astype(np.float32) / 255.0
        input_tensor = np.expand_dims(normalized_face, axis=(0, -1))

        # Predicción
        predictions = model.predict(input_tensor, verbose=0)[0]
        emotion_idx = np.argmax(predictions)

        return {
            'detected': True,
            'emotion': EMOTION_LABELS[emotion_idx],
            'confidence': float(predictions[emotion_idx]),
            'all_emotions': {e: float(p) for e, p in zip(EMOTION_LABELS, predictions)},
            'face_box': (x, y, w, h)
        }
        
    except Exception as e:
        return {'detected': False, 'error': str(e)}
    finally:
        face_detection.close()