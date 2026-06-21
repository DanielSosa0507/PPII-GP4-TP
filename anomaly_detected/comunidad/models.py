from django.db import models
from usuarios.models import Usuario
from fenomenos.models import Fenomeno


class Teoria(models.Model):
    fenomeno = models.ForeignKey(Fenomeno, on_delete=models.CASCADE, related_name='teorias', null=True, blank=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='teorias')
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado_en']

    def __str__(self):
        return self.titulo


class VotoTeoria(models.Model):
    teoria = models.ForeignKey(Teoria, on_delete=models.CASCADE, related_name='votos')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='votos_teoria')
    valor = models.SmallIntegerField(choices=[(1, 'A favor'), (-1, 'En contra')])
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('teoria', 'usuario')  # un voto por usuario por teoria
