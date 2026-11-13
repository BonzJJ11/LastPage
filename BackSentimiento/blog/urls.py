from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (UsuarioViewSet, login_view, upload_avatar, CategoriaViewSet, PublicacionViewSet,
                    ComentarioViewSet, ReaccionViewSet, GuardadoViewSet,
                    ConversacionViewSet, MensajeViewSet, NotificacionViewSet,
                    solicitar_otp_password, verificar_otp_password, restablecer_password)

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'publicaciones', PublicacionViewSet)
router.register(r'comentarios', ComentarioViewSet)
router.register(r'reacciones', ReaccionViewSet)
router.register(r'guardados', GuardadoViewSet)
router.register(r'conversaciones', ConversacionViewSet)
router.register(r'mensajes', MensajeViewSet)
router.register(r'notificaciones', NotificacionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', login_view, name='login_api'),
    path('upload-avatar/', upload_avatar, name='upload_avatar'),
    path('solicitar-otp/', solicitar_otp_password, name='solicitar_otp_password'),
    path('verificar-otp/', verificar_otp_password, name='verificar_otp_password'),
    path('restablecer-password/', restablecer_password, name='restablecer_password'),
]

