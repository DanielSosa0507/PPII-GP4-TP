from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    ROLES = [
        ('user', 'Usuario'),
        ('admin', 'Administrador'),
    ]

    NIVELES = [
        ('investigador', 'Investigador'),
        ('cazador', 'Cazador paranormal'),
        ('testigo', 'Testigo frecuente'),
        ('explorador', 'Explorador nocturno'),
    ]

    rol = models.CharField(max_length=10, choices=ROLES, default='user')
    foto_perfil = models.ImageField(upload_to='perfiles/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    # --- Datos de perfil "temáticos" (gamificación) ---
    nombre = models.CharField(max_length=100, null=True, blank=True)
    apellido = models.CharField(max_length=100, null=True, blank=True)
    nivel = models.CharField(max_length=20, choices=NIVELES, default='investigador')
    lugares_visitados = models.PositiveIntegerField(default=0)
    estados_explorados = models.PositiveIntegerField(default=0)
    fenomenos_comentados = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.username

    def recalcular_gamificacion(self):
        """Recalcula los contadores desde los datos reales (no incrementa a ciegas,
        así quedan correctos también si se borra una visita o un comentario)."""
        from comentarios.models import Comentario
        from fenomenos.models import Visita

        visitas = Visita.objects.filter(usuario=self)
        self.lugares_visitados = visitas.count()
        self.estados_explorados = (
            visitas.exclude(fenomeno__estado='')
            .values('fenomeno__estado').distinct().count()
        )
        self.fenomenos_comentados = (
            Comentario.objects.filter(usuario=self)
            .values('fenomeno').distinct().count()
        )
        self.save(update_fields=['lugares_visitados', 'estados_explorados', 'fenomenos_comentados'])

    # --- Insignias calculadas a partir de la actividad ---
    # (no se guardan como campo aparte; se derivan de los contadores
    # de arriba para que nunca queden "desincronizadas")
    def insignias(self):
        lista = []
        if self.lugares_visitados >= 1:
            lista.append({'nombre': '1er avistamiento', 'icono': '🛸'})
        if self.lugares_visitados >= 5:
            lista.append({'nombre': 'Visitó 5 lugares embrujados', 'icono': '👻'})
        if self.fenomenos_comentados >= 20:
            lista.append({'nombre': 'Comentó 20 fenómenos', 'icono': '💬'})
        if self.estados_explorados >= 5:
            lista.append({'nombre': 'Exploró 5 estados diferentes', 'icono': '🗺️'})
        return lista