from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Usuario, Categoria

from .models import Usuario, Categoria, Publicacion

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class PublicacionSerializer(serializers.ModelSerializer):
    nombre_usuario = serializers.CharField(source='id_usuario.nombre', read_only=True)
    nombre_categoria = serializers.CharField(source='id_categoria.nombre_categoria', read_only=True)

    class Meta:
        model = Publicacion
        fields = '__all__'


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True} # Para no devolver la contraseña en las respuestas GET
        }

    def create(self, validated_data):
        # Encriptar la contraseña antes de guardar el usuario
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Si se actualiza la contraseña, encriptarla nuevamente
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)
