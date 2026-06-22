import os
import secrets

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from comentarios.models import Comentario
from fenomenos.models import Favorito, Fenomeno

Usuario = get_user_model()

USUARIOS_PRUEBA = [
    {"username": "prueba1", "nombre": "Prueba", "apellido": "Uno"},
    {"username": "prueba2", "nombre": "Prueba", "apellido": "Dos"},
    {"username": "prueba3", "nombre": "Prueba", "apellido": "Tres"},
]

USUARIOS_ADMIN = [
    {"username": "sandra_lopez", "nombre": "Sandra", "apellido": "Lopez"},
    {"username": "sofia_maid", "nombre": "Sofia", "apellido": "Maid"},
    {"username": "stephany_rodriguez", "nombre": "Stephany", "apellido": "Rodriguez Capote"},
    {"username": "daniel_sosa", "nombre": "Daniel", "apellido": "Sosa"},
]


class Command(BaseCommand):
    help = "Crea/actualiza los usuarios de prueba (con perfil, comentario y favorito) y los usuarios admin del equipo."

    def resolver_password(self, username):
        """Toma la contraseña de la variable de entorno PASSWORD_<USERNAME>;
        si no esta definida, genera una al azar y la muestra una sola vez
        (asi el comando nunca tiene contraseñas reales escritas en el codigo)."""
        env_var = f"PASSWORD_{username.upper()}"
        password = os.environ.get(env_var)
        if password:
            return password

        password = secrets.token_urlsafe(9)
        self.stdout.write(self.style.WARNING(
            f"{env_var} no estaba seteada: se generó una contraseña al azar para '{username}': {password}"
        ))
        return password

    def handle(self, *args, **options):
        fenomeno = Fenomeno.objects.first()
        if fenomeno is None:
            self.stdout.write(self.style.WARNING(
                "No hay fenomenos cargados: se crea uno de prueba para poder asociar comentario y favorito."
            ))
            fenomeno = Fenomeno.objects.create(
                titulo="Fenomeno de prueba",
                descripcion="Fenomeno generado automaticamente para pruebas de ABM.",
                tipo="otro",
                latitud=0,
                longitud=0,
                actividad="baja",
            )

        for data in USUARIOS_PRUEBA:
            usuario, creado = Usuario.objects.get_or_create(
                username=data["username"],
                defaults={"email": f"{data['username']}@anomalydetected.test"},
            )
            usuario.nombre = data["nombre"]
            usuario.apellido = data["apellido"]
            usuario.bio = f"Cuenta de prueba ({data['username']}) para probar el ABM del proyecto."
            usuario.rol = "user"
            usuario.set_password(self.resolver_password(data["username"]))
            usuario.save()

            Comentario.objects.get_or_create(
                fenomeno=fenomeno,
                usuario=usuario,
                defaults={"texto": f"Comentario de prueba dejado por {usuario.username}."},
            )
            Favorito.objects.get_or_create(fenomeno=fenomeno, usuario=usuario)

            estado = "creado" if creado else "actualizado"
            self.stdout.write(self.style.SUCCESS(f"Usuario de prueba {estado}: {usuario.username}"))

        for data in USUARIOS_ADMIN:
            usuario, creado = Usuario.objects.get_or_create(
                username=data["username"],
                defaults={"email": f"{data['username']}@anomalydetected.test"},
            )
            usuario.nombre = data["nombre"]
            usuario.apellido = data["apellido"]
            usuario.rol = "admin"
            usuario.is_staff = True
            usuario.set_password(self.resolver_password(data["username"]))
            usuario.save()

            estado = "creado" if creado else "actualizado"
            self.stdout.write(self.style.SUCCESS(f"Usuario admin {estado}: {usuario.username}"))
