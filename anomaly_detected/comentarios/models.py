from django.db import models
from usuarios.models import Usuario
from fenomenos.models import Fenomeno

class Comentario(models.Model):
    fenomeno = models.ForeignKey(Fenomeno, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    texto = models.TextField()
    creado_en = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)  # para moderación

    def __str__(self):
        return f"{self.usuario} - {self.fenomeno}"
