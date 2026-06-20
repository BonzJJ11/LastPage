from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, login_view, CategoriaViewSet, PublicacionViewSet

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'publicaciones', PublicacionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', login_view, name='login_api'),
]
