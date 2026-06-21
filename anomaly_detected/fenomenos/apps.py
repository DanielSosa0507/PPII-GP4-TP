from django.apps import AppConfig


class FenomenosConfig(AppConfig):
    name = "fenomenos"

    def ready(self):
        from . import signals  # noqa: F401
