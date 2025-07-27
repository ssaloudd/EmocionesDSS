from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login
from .serializers import UsuarioSerializer # Para devolver los datos del usuario logeado

class CustomAuthToken(ObtainAuthToken):
    permission_classes = [AllowAny] # Permite que cualquiera acceda a esta vista

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        # Puedes personalizar la respuesta para incluir más datos del usuario
        user_serializer = UsuarioSerializer(user)

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'rol': user.rol, # ¡Incluimos el rol aquí!
            'user_data': user_serializer.data # Opcional: enviar todos los datos serializados
        })

# Opcional: Una vista para logout (invalidar el token)
class LogoutView(APIView):
    permission_classes = [IsAuthenticated] # Solo usuarios autenticados pueden deslogearse

    def post(self, request):
        request.user.auth_token.delete() # Elimina el token del usuario actual
        return Response(status=status.HTTP_200_OK)