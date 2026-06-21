from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Visita


@receiver(post_save, sender=Visita)
@receiver(post_delete, sender=Visita)
def actualizar_gamificacion_visita(sender, instance, **kwargs):
    instance.usuario.recalcular_gamificacion()
