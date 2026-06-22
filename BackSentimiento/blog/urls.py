from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (UsuarioViewSet, login_view, CategoriaViewSet, PublicacionViewSet,
                    ComentarioViewSet, ReaccionViewSet, GuardadoViewSet,
                    ConversacionViewSet, MensajeViewSet, NotificacionViewSet)

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
]
