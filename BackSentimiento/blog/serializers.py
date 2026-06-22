from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import Usuario, Categoria

from .models import Usuario, Categoria, Publicacion, Comentario, Reaccion, Guardado, Conversacion, Mensaje, Notificacion

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class PublicacionSerializer(serializers.ModelSerializer):
    nombre_usuario = serializers.CharField(source='id_usuario.nombre', read_only=True)
    nombre_categoria = serializers.CharField(source='id_categoria.nombre_categoria', read_only=True)
    comentarios_count = serializers.SerializerMethodField()
    reacciones_resumen = serializers.SerializerMethodField()

    class Meta:
        model = Publicacion
        fields = '__all__'

    def get_comentarios_count(self, obj):
        return obj.comentario_set.count() if hasattr(obj, 'comentario_set') else 0

    def get_reacciones_resumen(self, obj):
        if not hasattr(obj, 'reaccion_set'):
            return {}
        reacciones = obj.reaccion_set.all()
        from collections import Counter
        conteo = Counter(r.tipo_reaccion for r in reacciones)
        return dict(conteo)


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

class ComentarioSerializer(serializers.ModelSerializer):
    nombre_usuario = serializers.SerializerMethodField()
    foto_perfil = serializers.SerializerMethodField()
    nombre_publicacion = serializers.CharField(source='id_publicacion.titulo', read_only=True)

    class Meta:
        model = Comentario
        fields = '__all__'

    def get_nombre_usuario(self, obj):
        if obj.visibilidad == 'ANONIMO':
            return "Usuario Anónimo"
        return obj.id_usuario.nombre if obj.id_usuario else None

    def get_foto_perfil(self, obj):
        if obj.visibilidad == 'ANONIMO':
            return None
        return obj.id_usuario.foto_perfil if obj.id_usuario else None

class ReaccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaccion
        fields = '__all__'

class GuardadoSerializer(serializers.ModelSerializer):
    publicacion = PublicacionSerializer(source='id_publicacion', read_only=True)
    
    class Meta:
        model = Guardado
        fields = '__all__'

class ConversacionSerializer(serializers.ModelSerializer):
    nombre_inicio = serializers.SerializerMethodField()
    nombre_destino = serializers.SerializerMethodField()
    foto_inicio = serializers.SerializerMethodField()
    foto_destino = serializers.SerializerMethodField()

    class Meta:
        model = Conversacion
        fields = '__all__'

    def is_anonymous(self, obj):
        if obj.id_publicacion and obj.id_publicacion.visibilidad == 'ANONIMO':
            return True
        return False

    def get_nombre_inicio(self, obj):
        if self.is_anonymous(obj):
            return "Usuario Anónimo"
        return obj.id_usuario_inicio.nombre if obj.id_usuario_inicio else None

    def get_nombre_destino(self, obj):
        if self.is_anonymous(obj):
            return "Autor Anónimo"
        return obj.id_usuario_destino.nombre if obj.id_usuario_destino else None

    def get_foto_inicio(self, obj):
        if self.is_anonymous(obj):
            return None
        return obj.id_usuario_inicio.foto_perfil if obj.id_usuario_inicio else None

    def get_foto_destino(self, obj):
        if self.is_anonymous(obj):
            return None
        return obj.id_usuario_destino.foto_perfil if obj.id_usuario_destino else None

class MensajeSerializer(serializers.ModelSerializer):
    nombre_usuario = serializers.SerializerMethodField()

    class Meta:
        model = Mensaje
        fields = '__all__'

    def get_nombre_usuario(self, obj):
        # Para saber si ocultar, revisamos la conversacion
        if obj.id_conversacion and obj.id_conversacion.id_publicacion and obj.id_conversacion.id_publicacion.visibilidad == 'ANONIMO':
            if obj.id_usuario_id == obj.id_conversacion.id_usuario_inicio_id:
                return "Usuario Anónimo"
            else:
                return "Autor Anónimo"
        return obj.id_usuario.nombre if obj.id_usuario else None

class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'

