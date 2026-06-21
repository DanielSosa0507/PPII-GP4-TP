from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario


class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'rol', 'nivel', 'is_staff', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        ('Perfil Anomaly Detected', {
            'fields': (
                'rol', 'foto_perfil', 'bio',
                'nombre', 'apellido', 'nivel',
                'lugares_visitados', 'estados_explorados', 'fenomenos_comentados',
            )
        }),
    )


admin.site.register(Usuario, UsuarioAdmin)