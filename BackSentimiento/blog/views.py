from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from .models import Usuario
from .serializers import UsuarioSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    Este ViewSet proporciona automáticamente las acciones `list`, `create`, `retrieve`, `update` y `destroy`.
    Esto nos permite manejar GET, POST, PUT, DELETE en la tabla Usuario.
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Por favor provea usuario y contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Buscar el usuario en la BD de forma case-insensitive
        usuario = Usuario.objects.get(username__iexact=username)
        
        # Verificar la contraseña (soporta encriptada y texto plano por si acaso)
        if check_password(password, usuario.password) or password == usuario.password:
            # Login exitoso, devolvemos un token mock (luego se puede cambiar por JWT)
            return Response({'mensaje': 'Login exitoso', 'token': 'fake-jwt-token-12345'})
        else:
            return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_401_UNAUTHORIZED)
            
    except Usuario.DoesNotExist:
        return Response({'error': 'El usuario no existe'}, status=status.HTTP_401_UNAUTHORIZED)
