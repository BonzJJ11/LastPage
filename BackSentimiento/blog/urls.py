from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, login_view

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', login_view, name='login_api'),
]
