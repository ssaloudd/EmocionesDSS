from django.urls import path
from .views import EmotionDetectionView

urlpatterns = [
    path('detectar-emocion/', EmotionDetectionView.as_view(), name='detectar_emocion')
]