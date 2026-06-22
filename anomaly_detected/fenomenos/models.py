from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from usuarios.models import Usuario

class Fenomeno(models.Model):
    TIPOS = [
        ('ovni', 'OVNI'),
        ('embrujado', 'Lugar Embrujado'),
        ('otro', 'Otro'),
    ]
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    tipo = models.CharField(max_length=20, choices=TIPOS)
    estado = models.CharField(max_length=100, blank=True)  # estado/provincia, para "estados explorados"
    latitud = models.FloatField()
    longitud = models.FloatField()
    fecha_ocurrencia = models.DateField(null=True, blank=True)
    imagen = models.ImageField(upload_to='fenomenos/', null=True, blank=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    validado = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo


class Validacion(models.Model):
    fenomeno = models.ForeignKey(Fenomeno, on_delete=models.CASCADE, related_name='validaciones')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    comentario = models.TextField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('fenomeno', 'usuario')  # un voto por usuario


class Favorito(models.Model):
    fenomeno = models.ForeignKey(Fenomeno, on_delete=models.CASCADE, related_name='favoritos')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='favoritos')
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('fenomeno', 'usuario')  # no se puede marcar dos veces


class Visita(models.Model):
    fenomeno = models.ForeignKey(Fenomeno, on_delete=models.CASCADE, related_name='visitas')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='visitas')
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('fenomeno', 'usuario')  # un mismo lugar no cuenta dos veces


class Puntuacion(models.Model):
    fenomeno = models.ForeignKey(Fenomeno, on_delete=models.CASCADE, related_name='puntuaciones')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='puntuaciones')
    valor = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('fenomeno', 'usuario')  # un voto de puntuacion por usuario


class Enlace(models.Model):
    fenomeno = models.ForeignKey(Fenomeno, on_delete=models.CASCADE, related_name='enlaces')
    titulo = models.CharField(max_length=200)
    url = models.URLField()
    creado_en = models.DateTimeField(auto_now_add=True)
