from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    ROLES = [
        ('user', 'Usuario'),
        ('admin', 'Administrador'),
    ]
    rol = models.CharField(max_length=10, choices=ROLES, default='user')
    foto_perfil = models.ImageField(upload_to='perfiles/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.username

