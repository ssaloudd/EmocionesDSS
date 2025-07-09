# api/ml_model/detector.py
import cv2
import mediapipe as mp
import numpy as np
from joblib import load
from tensorflow.keras.models import load_model

# Emociones en el mismo orden que en el entrenamiento
#EMOTIONS = ['Enojo', 'Disgusto', 'Miedo', 'Felicidad', 'Tristeza', 'Sorpresa', 'Neutral']
EMOTIONS = ['Disgusto', 'Enojo', 'Felicidad', 'Miedo', 'Neutral', 'Sorpresa', 'Tristeza']


# Cargar modelo entrenado
#mlp_model = load('api/ml_model/emotion_mlp.pkl')

# Cargar modelo entrenado
cnn_model = load_model('api/ml_model/cnn_emociones_bestv1.keras')
IMG_SIZE = (48, 48)  # Ajusta al tamaño usado en el entrenamiento

# Inicializar MediaPipe
#mp_face_mesh = mp.solutions.face_mesh
#face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1)
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

def detectar_emocion(imagen):
    rgb = cv2.cvtColor(imagen, cv2.COLOR_BGR2RGB)
    #resultado = face_mesh.process(rgb)
    resultados = face_detection.process(rgb)

    if not resultados.detections:
        return None, None

    for det in resultados.detections:
        bboxC = det.location_data.relative_bounding_box
        h, w, _ = imagen.shape
        x, y, ancho, alto = int(bboxC.xmin * w), int(bboxC.ymin * h), int(bboxC.width * w), int(bboxC.height * h)
        rostro = imagen[y:y+alto, x:x+ancho]

        # Preprocesar para el modelo
        rostro = cv2.resize(rostro, IMG_SIZE)
        rostro = cv2.cvtColor(rostro, cv2.COLOR_BGR2GRAY)  # solo si entrenaste en escala de grises
        rostro = rostro / 255.0
        rostro = np.expand_dims(rostro, axis=-1)  # (H, W, 1)
        rostro = np.expand_dims(rostro, axis=0)   # (1, H, W, 1)

        pred = cnn_model.predict(rostro)[0]
        idx = np.argmax(pred)
        return EMOTIONS[idx], float(pred[idx])
    
    return None, None
