from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
import cv2
import numpy as np
from .ml_model.detector import detectar_emocion

class EmotionDetectionView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No image provided'}, status=400)

        # Leer imagen desde archivo
        image_bytes = np.asarray(bytearray(file.read()), dtype=np.uint8)
        image = cv2.imdecode(image_bytes, cv2.IMREAD_COLOR)

        emocion, confianza = detectar_emocion(image)

        if emocion is None:
            return Response({'error': 'No se detectó rostro'}, status=400)

        return Response({
            'emocion': emocion,
            'confianza': confianza
        })
