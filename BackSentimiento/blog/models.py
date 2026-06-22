from django.db import models
from django.utils import timezone

class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'rol'
        managed = False # asume que la tabla fue creada por tu script SQL
        
    def __str__(self):
        return self.nombre_rol

class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=100)
    correo = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255)
    foto_perfil = models.CharField(max_length=255, null=True, blank=True)
    biografia = models.CharField(max_length=500, null=True, blank=True)
    fecha_registro = models.DateTimeField(default=timezone.now)
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    id_rol = models.ForeignKey(Rol, on_delete=models.RESTRICT, db_column='id_rol')

    class Meta:
        db_table = 'usuario'
        managed = False

    def __str__(self):
        return self.username

class Categoria(models.Model):
    id_categoria = models.AutoField(primary_key=True)
    nombre_categoria = models.CharField(max_length=100, unique=True)
    descripcion = models.CharField(max_length=255, null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'categoria'
        managed = False

    def __str__(self):
        return self.nombre_categoria

class Publicacion(models.Model):
    VISIBILIDAD_CHOICES = [
        ('PUBLICO', 'Público'),
        ('ANONIMO', 'Anónimo'),
    ]

    id_publicacion = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    visibilidad = models.CharField(max_length=20, choices=VISIBILIDAD_CHOICES, default='PUBLICO')
    fecha_publicacion = models.DateTimeField(default=timezone.now)
    activo = models.BooleanField(default=True)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    id_categoria = models.ForeignKey(Categoria, on_delete=models.RESTRICT, db_column='id_categoria')

    class Meta:
        db_table = 'publicacion'
        managed = False

class Comentario(models.Model):
    VISIBILIDAD_CHOICES = [
        ('PUBLICO', 'Público'),
        ('ANONIMO', 'Anónimo'),
    ]

    id_comentario = models.AutoField(primary_key=True)
    contenido = models.TextField()
    visibilidad = models.CharField(max_length=20, choices=VISIBILIDAD_CHOICES, default='PUBLICO')
    fecha_comentario = models.DateTimeField(default=timezone.now)
    activo = models.BooleanField(default=True)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    id_publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, db_column='id_publicacion')

    class Meta:
        db_table = 'comentario'
        managed = False

class Reaccion(models.Model):
    REACCION_CHOICES = [
        ('TE_ENTIENDO', 'Te entiendo'),
        ('ME_PASO_IGUAL', 'Me pasó igual'),
        ('SIGUE_ADELANTE', 'Sigue adelante'),
        ('TENGO_UN_CONSEJO', 'Tengo un consejo'),
    ]

    id_reaccion = models.AutoField(primary_key=True)
    tipo_reaccion = models.CharField(max_length=50, choices=REACCION_CHOICES)
    fecha_reaccion = models.DateTimeField(default=timezone.now)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    id_publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, db_column='id_publicacion')

    class Meta:
        db_table = 'reaccion'
        managed = False
        unique_together = (('id_usuario', 'id_publicacion'),)

class Conversacion(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('ACEPTADA', 'Aceptada'),
        ('RECHAZADA', 'Rechazada'),
    ]

    id_conversacion = models.AutoField(primary_key=True)
    id_usuario_inicio = models.ForeignKey(Usuario, on_delete=models.DO_NOTHING, db_column='id_usuario_inicio', related_name='conversaciones_iniciadas')
    id_usuario_destino = models.ForeignKey(Usuario, on_delete=models.DO_NOTHING, db_column='id_usuario_destino', related_name='conversaciones_recibidas')
    id_publicacion = models.ForeignKey(Publicacion, on_delete=models.DO_NOTHING, db_column='id_publicacion_id', null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    fecha_creacion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'conversacion'
        managed = False

class Mensaje(models.Model):
    id_mensaje = models.AutoField(primary_key=True)
    contenido = models.TextField()
    fecha_envio = models.DateTimeField(default=timezone.now)
    leido = models.BooleanField(default=False)
    id_conversacion = models.ForeignKey(Conversacion, on_delete=models.CASCADE, db_column='id_conversacion')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')

    class Meta:
        db_table = 'mensaje'
        managed = False

class Reporte(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('RESUELTO', 'Resuelto'),
        ('RECHAZADO', 'Rechazado'),
    ]

    id_reporte = models.AutoField(primary_key=True)
    motivo = models.CharField(max_length=255)
    descripcion = models.TextField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    fecha_reporte = models.DateTimeField(default=timezone.now)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.DO_NOTHING, db_column='id_usuario')
    id_publicacion = models.ForeignKey(Publicacion, on_delete=models.DO_NOTHING, db_column='id_publicacion', null=True, blank=True)
    id_comentario = models.ForeignKey(Comentario, on_delete=models.DO_NOTHING, db_column='id_comentario', null=True, blank=True)

    class Meta:
        db_table = 'reporte'
        managed = False

class Notificacion(models.Model):
    id_notificacion = models.AutoField(primary_key=True)
    titulo = models.CharField(max_length=100)
    mensaje = models.CharField(max_length=255)
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')

    class Meta:
        db_table = 'notificacion'
        managed = False

class Guardado(models.Model):
    id_guardado = models.AutoField(primary_key=True)
    fecha_guardado = models.DateTimeField(default=timezone.now)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='id_usuario')
    id_publicacion = models.ForeignKey(Publicacion, on_delete=models.CASCADE, db_column='id_publicacion')

    class Meta:
        db_table = 'guardado'
        managed = False
        unique_together = (('id_usuario', 'id_publicacion'),)
