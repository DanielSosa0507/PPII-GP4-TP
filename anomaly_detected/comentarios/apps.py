from django.apps import AppConfig


class ComentariosConfig(AppConfig):
    name = "comentarios"

    def ready(self):
        from . import signals  # noqa: F401
