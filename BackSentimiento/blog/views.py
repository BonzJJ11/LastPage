from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from .models import Usuario, Categoria, Publicacion, Comentario, Reaccion, Guardado, Conversacion, Mensaje, Notificacion
from .serializers import (UsuarioSerializer, CategoriaSerializer, PublicacionSerializer,
                          ComentarioSerializer, ReaccionSerializer, GuardadoSerializer,
                          ConversacionSerializer, MensajeSerializer, NotificacionSerializer)

class PublicacionViewSet(viewsets.ModelViewSet):
    queryset = Publicacion.objects.all().order_by('-fecha_publicacion')
    serializer_class = PublicacionSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    Este ViewSet proporciona automáticamente las acciones `list`, `create`, `retrieve`, `update` y `destroy`.
    Esto nos permite manejar GET, POST, PUT, DELETE en la tabla Usuario.
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class ComentarioViewSet(viewsets.ModelViewSet):
    queryset = Comentario.objects.all().order_by('fecha_comentario')
    serializer_class = ComentarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        publicacion_id = self.request.query_params.get('id_publicacion', None)
        if publicacion_id is not None:
            queryset = queryset.filter(id_publicacion=publicacion_id)
        return queryset

    def perform_create(self, serializer):
        comentario = serializer.save()
        # Generar notificación al autor de la publicación
        if comentario.id_publicacion.id_usuario_id != comentario.id_usuario_id:
            Notificacion.objects.create(
                titulo="Nuevo comentario",
                mensaje=f"Han comentado en tu publicación: {comentario.id_publicacion.titulo}",
                id_usuario=comentario.id_publicacion.id_usuario
            )

class ReaccionViewSet(viewsets.ModelViewSet):
    queryset = Reaccion.objects.all()
    serializer_class = ReaccionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        publicacion_id = self.request.query_params.get('id_publicacion', None)
        usuario_id = self.request.query_params.get('id_usuario', None)
        if publicacion_id is not None:
            queryset = queryset.filter(id_publicacion=publicacion_id)
        if usuario_id is not None:
            queryset = queryset.filter(id_usuario=usuario_id)
        return queryset

    def create(self, request, *args, **kwargs):
        id_usuario = request.data.get('id_usuario')
        id_publicacion = request.data.get('id_publicacion')
        tipo_reaccion = request.data.get('tipo_reaccion')

        reaccion_existente = Reaccion.objects.filter(id_usuario=id_usuario, id_publicacion=id_publicacion).first()
        if reaccion_existente:
            reaccion_existente.tipo_reaccion = tipo_reaccion
            reaccion_existente.save()
            serializer = self.get_serializer(reaccion_existente)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        response = super().create(request, *args, **kwargs)
        # Generar notificacion
        reaccion = Reaccion.objects.get(id_reaccion=response.data['id_reaccion'])
        if reaccion.id_publicacion.id_usuario_id != reaccion.id_usuario_id:
            Notificacion.objects.create(
                titulo="Nueva reacción",
                mensaje=f"Alguien reaccionó a tu publicación: {reaccion.id_publicacion.titulo}",
                id_usuario=reaccion.id_publicacion.id_usuario
            )
        return response

class GuardadoViewSet(viewsets.ModelViewSet):
    queryset = Guardado.objects.all().order_by('-fecha_guardado')
    serializer_class = GuardadoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        usuario_id = self.request.query_params.get('id_usuario', None)
        if usuario_id is not None:
            queryset = queryset.filter(id_usuario=usuario_id)
        return queryset

class ConversacionViewSet(viewsets.ModelViewSet):
    queryset = Conversacion.objects.all().order_by('-fecha_creacion')
    serializer_class = ConversacionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        usuario_id = self.request.query_params.get('id_usuario', None)
        if usuario_id is not None:
            from django.db.models import Q
            queryset = queryset.filter(Q(id_usuario_inicio=usuario_id) | Q(id_usuario_destino=usuario_id))
        return queryset

    def perform_create(self, serializer):
        conversacion = serializer.save()
        Notificacion.objects.create(
            titulo="Nueva solicitud de mensaje",
            mensaje="Has recibido una solicitud para iniciar una conversación.",
            id_usuario=conversacion.id_usuario_destino
        )

    def perform_update(self, serializer):
        conversacion = serializer.save()
        if conversacion.estado == 'ACEPTADA':
            Notificacion.objects.create(
                titulo="Solicitud aceptada",
                mensaje="Tu solicitud de conversación ha sido aceptada.",
                id_usuario=conversacion.id_usuario_inicio
            )

class MensajeViewSet(viewsets.ModelViewSet):
    queryset = Mensaje.objects.all().order_by('fecha_envio')
    serializer_class = MensajeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        conversacion_id = self.request.query_params.get('id_conversacion', None)
        if conversacion_id is not None:
            queryset = queryset.filter(id_conversacion=conversacion_id)
        return queryset

    def perform_create(self, serializer):
        mensaje = serializer.save()
        # Notificar al receptor
        conversacion = mensaje.id_conversacion
        receptor = conversacion.id_usuario_destino if conversacion.id_usuario_inicio_id == mensaje.id_usuario_id else conversacion.id_usuario_inicio
        Notificacion.objects.create(
            titulo="Nuevo mensaje",
            mensaje="Tienes un nuevo mensaje en una conversación.",
            id_usuario=receptor
        )

class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all().order_by('-fecha_creacion')
    serializer_class = NotificacionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        usuario_id = self.request.query_params.get('id_usuario', None)
        if usuario_id is not None:
            queryset = queryset.filter(id_usuario=usuario_id)
        return queryset

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
            return Response({
                'mensaje': 'Login exitoso', 
                'token': 'fake-jwt-token-12345',
                'id_rol': usuario.id_rol_id,
                'id_usuario': usuario.id_usuario
            })
        else:
            return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_401_UNAUTHORIZED)
            
    except Usuario.DoesNotExist:
        return Response({'error': 'El usuario no existe'}, status=status.HTTP_401_UNAUTHORIZED)
