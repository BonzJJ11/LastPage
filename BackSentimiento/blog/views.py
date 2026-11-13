from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from django.db.models import Q
import random
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from .models import Usuario, Categoria, Publicacion, Comentario, Reaccion, Guardado, Conversacion, Mensaje, Notificacion, Reporte, RecuperacionPassword
from .serializers import (UsuarioSerializer, CategoriaSerializer, PublicacionSerializer,
                          ComentarioSerializer, ReaccionSerializer, GuardadoSerializer,
                          ConversacionSerializer, MensajeSerializer, NotificacionSerializer)

class PublicacionViewSet(viewsets.ModelViewSet):
    queryset = Publicacion.objects.all().order_by('-fecha_publicacion')
    serializer_class = PublicacionSerializer

    def perform_destroy(self, instance):
        # Limpieza de dependencias antes de eliminar la publicación
        Mensaje.objects.filter(id_conversacion__id_publicacion=instance).delete()
        Conversacion.objects.filter(id_publicacion=instance).delete()
        Reporte.objects.filter(id_publicacion=instance).delete()
        Guardado.objects.filter(id_publicacion=instance).delete()
        Reaccion.objects.filter(id_publicacion=instance).delete()
        Comentario.objects.filter(id_publicacion=instance).delete()
        instance.delete()

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

    @action(detail=True, methods=['post'], url_path='cambiar-password')
    def cambiar_password(self, request, pk=None):
        usuario = self.get_object()
        password_actual = request.data.get('password_actual')
        nueva_password = request.data.get('nueva_password')
        confirmar_password = request.data.get('confirmar_password')

        if not password_actual:
            return Response({'error': 'Debes ingresar tu contraseña actual.'}, status=status.HTTP_400_BAD_REQUEST)

        if not nueva_password:
            return Response({'error': 'Debes ingresar una nueva contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Validar que la contraseña actual ingresada sea correcta
        if not (check_password(password_actual, usuario.password) or password_actual == usuario.password):
            return Response({'error': 'La contraseña actual ingresada es incorrecta.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Validar que la nueva contraseña no sea igual a la actual
        if password_actual == nueva_password or check_password(nueva_password, usuario.password) or nueva_password == usuario.password:
            return Response({'error': 'La nueva contraseña no puede ser igual a tu contraseña anterior.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Validar longitud mínima
        if len(nueva_password) < 6:
            return Response({'error': 'La nueva contraseña debe tener al menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Validar coincidencia de confirmación
        if confirmar_password and nueva_password != confirmar_password:
            return Response({'error': 'Las contraseñas no coinciden.'}, status=status.HTTP_400_BAD_REQUEST)

        usuario.password = make_password(nueva_password)
        usuario.save(update_fields=['password'])

        return Response({'mensaje': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='eliminar-cuenta')
    def eliminar_cuenta(self, request, pk=None):
        usuario = self.get_object()
        password = request.data.get('password')

        if not password:
            return Response({'error': 'Debes ingresar tu contraseña para confirmar la eliminación.'}, status=status.HTTP_400_BAD_REQUEST)

        if not (check_password(password, usuario.password) or password == usuario.password):
            return Response({'error': 'La contraseña ingresada es incorrecta.'}, status=status.HTTP_400_BAD_REQUEST)

        # Borrado lógico: se conserva el registro en la BD pero pasa a activo = False
        usuario.activo = False
        usuario.save(update_fields=['activo'])

        # Eliminar reacciones y guardados para no dejar registro en publicaciones de otros
        Reaccion.objects.filter(id_usuario=usuario).delete()
        Guardado.objects.filter(id_usuario=usuario).delete()

        return Response({'mensaje': 'Cuenta eliminada exitosamente.'}, status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        # Borrado lógico: desactivar el usuario en lugar de eliminarlo físicamente
        instance.activo = False
        instance.save(update_fields=['activo'])

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
        queryset = super().get_queryset().filter(id_usuario__activo=True)
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
        
        if not usuario.activo:
            return Response({'error': 'Esta cuenta ha sido desactivada o eliminada.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Verificar la contraseña (soporta encriptada y texto plano por si acaso)
        if check_password(password, usuario.password) or password == usuario.password:
            # Registrar el último acceso
            usuario.ultimo_acceso = timezone.now()
            usuario.save(update_fields=['ultimo_acceso'])

            return Response({
                'mensaje': 'Login exitoso', 
                'token': 'fake-jwt-token-12345',
                'id_rol': usuario.id_rol_id,
                'id_usuario': usuario.id_usuario,
                'username': usuario.username,
                'nombre': usuario.nombre,
                'correo': usuario.correo,
                'foto_perfil': usuario.foto_perfil,
                'biografia': usuario.biografia,
                'fecha_registro': usuario.fecha_registro,
                'ultimo_acceso': usuario.ultimo_acceso
            })
        else:
            return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_401_UNAUTHORIZED)
            
    except Usuario.DoesNotExist:
        return Response({'error': 'El usuario no existe'}, status=status.HTTP_401_UNAUTHORIZED)


import os
import uuid
from django.conf import settings
from django.core.files.storage import FileSystemStorage

@api_view(['POST'])
def upload_avatar(request):
    archivo = request.FILES.get('foto') or request.FILES.get('avatar') or request.FILES.get('file')
    if not archivo:
        return Response({'error': 'No se seleccionó ningún archivo de imagen.'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Validación de extensiones y tipos MIME permitidos
    extensiones_validas = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    nombre_orig = archivo.name.lower()
    ext = os.path.splitext(nombre_orig)[1]
    
    if ext not in extensiones_validas:
        return Response({
            'error': f'Formato no permitido ({ext}). Solo se admiten imágenes JPG, JPEG, PNG, WEBP o GIF.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # 2. Validación de tamaño máximo (5MB)
    max_mb = 5
    if archivo.size > max_mb * 1024 * 1024:
        peso_mb = round(archivo.size / (1024 * 1024), 2)
        return Response({
            'error': f'La imagen pesa {peso_mb}MB. El tamaño máximo permitido es de {max_mb}MB.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # 3. Guardar en carpeta media/avatars
    carpeta_avatars = os.path.join(settings.MEDIA_ROOT, 'avatars')
    os.makedirs(carpeta_avatars, exist_ok=True)
    fs = FileSystemStorage(location=carpeta_avatars, base_url='/media/avatars/')

    # Generar nombre único para evitar colisiones
    nombre_seguro = f"avatar_{uuid.uuid4().hex[:12]}{ext}"
    nombre_guardado = fs.save(nombre_seguro, archivo)
    url_relativa = fs.url(nombre_guardado)
    url_completa = request.build_absolute_uri(url_relativa)

    # 4. Si se envió el id_usuario, actualizarlo en la base de datos de una vez
    id_usuario = request.data.get('id_usuario')
    if id_usuario:
        try:
            usuario = Usuario.objects.get(id_usuario=id_usuario)
            usuario.foto_perfil = url_completa
            usuario.save(update_fields=['foto_perfil'])
        except Usuario.DoesNotExist:
            pass

    return Response({
        'mensaje': 'Foto subida exitosamente',
        'url': url_completa,
        'nombre_archivo': archivo.name,
        'tamano_kb': round(archivo.size / 1024, 1)
    }, status=status.HTTP_201_CREATED)


# ============================================================
# RECUPERACIÓN DE CONTRASEÑA CON CÓDIGO OTP
# ============================================================

@api_view(['POST'])
def solicitar_otp_password(request):
    """
    Paso 1: Recibe el correo, verifica que el usuario exista,
    genera un código OTP de 6 dígitos con validez de 10 minutos y lo envía por correo.
    """
    correo = request.data.get('correo', '').strip().lower()

    if not correo:
        return Response({'error': 'Debes ingresar un correo electrónico.'}, status=status.HTTP_400_BAD_REQUEST)

    usuario = Usuario.objects.filter(correo__iexact=correo).first()
    if not usuario:
        return Response({'error': 'No existe ninguna cuenta registrada con este correo electrónico.'}, status=status.HTTP_404_NOT_FOUND)

    # Invalida códigos anteriores no usados para este correo
    RecuperacionPassword.objects.filter(correo=correo, usado=False).update(usado=True)

    # Genera código de 6 dígitos numéricos
    codigo = f"{random.randint(100000, 999999)}"
    expira_en = timezone.now() + timedelta(minutes=10)

    RecuperacionPassword.objects.create(
        correo=correo,
        codigo=codigo,
        expira_en=expira_en,
        usado=False
    )

    # Plantilla de correo HTML
    asunto = f"{codigo} es tu código de recuperación - LastPage"
    cuerpo_texto = f"Hola {usuario.nombre or usuario.username},\n\nTu código de recuperación es: {codigo}\n\nEste código vencerá en 10 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje.\n\nEquipo LastPage"
    
    html_mensaje = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #4CAF6B; color: white; padding: 10px 16px; border-radius: 12px; font-weight: bold; font-size: 20px;">
                LastPage
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Red de apoyo emocional y expresión</p>
        </div>
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 12px; text-align: center;">Recuperación de contraseña</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Hola <strong>{usuario.nombre or usuario.username}</strong>, hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
        </p>
        <div style="background-color: #f0faf3; border: 1.5px dashed #4CAF6B; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #166534; font-weight: 600; margin: 0 0 8px 0;">Tu código de seguridad</p>
            <div style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #2e7d32; font-family: monospace;">{codigo}</div>
            <p style="font-size: 12px; color: #15803d; margin: 8px 0 0 0;">Válido durante los próximos 10 minutos</p>
        </div>
        <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-bottom: 24px;">
            Si tú no solicitaste este código, puedes ignorar este mensaje de forma segura. Tu contraseña actual permanecerá intacta.
        </p>
        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin: 0;">
            © LastPage • Este correo fue enviado automáticamente, no respondas a esta dirección.
        </p>
    </div>
    """

    try:
        send_mail(
            subject=asunto,
            message=cuerpo_texto,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[correo],
            html_message=html_mensaje,
            fail_silently=False
        )
    except Exception as e:
        return Response({'error': f'No se pudo enviar el correo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'mensaje': 'Código enviado correctamente a tu correo electrónico.',
        'correo': correo
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def verificar_otp_password(request):
    """
    Paso 2: Valida que el código OTP ingresado coincida, no haya expirado y no haya sido usado.
    """
    correo = request.data.get('correo', '').strip().lower()
    codigo = str(request.data.get('codigo', '')).strip()

    if not correo or not codigo:
        return Response({'error': 'Debes enviar el correo y el código OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    registro = RecuperacionPassword.objects.filter(correo=correo, codigo=codigo, usado=False).order_by('-creado_en').first()

    if not registro:
        return Response({'error': 'El código ingresado es incorrecto o no existe.'}, status=status.HTTP_400_BAD_REQUEST)

    if timezone.now() > registro.expira_en:
        return Response({'error': 'El código ha expirado. Por favor solicita uno nuevo.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'mensaje': 'Código verificado con éxito.',
        'valido': True
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def restablecer_password(request):
    """
    Paso 3: Recibe correo, código y nueva contraseña. Valida nuevamente el código,
    aplica el hash a la nueva contraseña y actualiza al usuario en la BD.
    """
    correo = request.data.get('correo', '').strip().lower()
    codigo = str(request.data.get('codigo', '')).strip()
    nueva_password = request.data.get('nueva_password', '')
    confirmar_password = request.data.get('confirmar_password', '')

    if not correo or not codigo:
        return Response({'error': 'Faltan parámetros requeridos.'}, status=status.HTTP_400_BAD_REQUEST)

    if not nueva_password:
        return Response({'error': 'Debes ingresar una nueva contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(nueva_password) < 6:
        return Response({'error': 'La contraseña debe tener al menos 6 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)

    if confirmar_password and nueva_password != confirmar_password:
        return Response({'error': 'Las contraseñas no coinciden.'}, status=status.HTTP_400_BAD_REQUEST)

    registro = RecuperacionPassword.objects.filter(correo=correo, codigo=codigo, usado=False).order_by('-creado_en').first()
    if not registro:
        return Response({'error': 'Código inválido o ya utilizado.'}, status=status.HTTP_400_BAD_REQUEST)

    if timezone.now() > registro.expira_en:
        return Response({'error': 'El código ha expirado. Solicita uno nuevo.'}, status=status.HTTP_400_BAD_REQUEST)

    usuario = Usuario.objects.filter(correo__iexact=correo).first()
    if not usuario:
        return Response({'error': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    # Actualizar contraseña con hash de Django
    usuario.password = make_password(nueva_password)
    usuario.save(update_fields=['password'])

    # Marcar código como usado
    registro.usado = True
    registro.save(update_fields=['usado'])

    return Response({
        'mensaje': 'Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.'
    }, status=status.HTTP_200_OK)

