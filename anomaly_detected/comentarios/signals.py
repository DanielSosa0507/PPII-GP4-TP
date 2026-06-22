from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Comentario


@receiver(post_save, sender=Comentario)
@receiver(post_delete, sender=Comentario)
def actualizar_gamificacion_comentario(sender, instance, **kwargs):
    instance.usuario.recalcular_gamificacion()
