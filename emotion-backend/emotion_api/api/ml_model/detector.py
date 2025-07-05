# api/ml_model/detector.py
import cv2
import mediapipe as mp
import numpy as np
from joblib import load

# Emociones en el mismo orden que en el entrenamiento
EMOTIONS = ['Enojo', 'Disgusto', 'Miedo', 'Felicidad', 'Tristeza', 'Sorpresa', 'Neutral']

# Cargar modelo entrenado
mlp_model = load('api/ml_model/emotion_mlp.pkl')

# Inicializar MediaPipe
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1)

def detectar_emocion(imagen):
    rgb = cv2.cvtColor(imagen, cv2.COLOR_BGR2RGB)
    resultado = face_mesh.process(rgb)

    if not resultado.multi_face_landmarks:
        return None, None

    for cara in resultado.multi_face_landmarks:
        puntos = []
        for lm in cara.landmark:
            puntos.append(lm.x)
            puntos.append(lm.y)

        puntos = np.array(puntos).reshape(1, -1)
        prediccion = mlp_model.predict(puntos)[0]
        probas = mlp_model.predict_proba(puntos)[0]

        return EMOTIONS[prediccion], float(np.max(probas))
    
    return None, None
