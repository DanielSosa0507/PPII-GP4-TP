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
