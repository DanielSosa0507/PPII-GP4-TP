import os
from django.core.management.base import BaseCommand
from usuarios.models import Usuario

ADMINS = [
    {'username': 'sofia',     'email': 'sofia@anomaly.com'},
    {'username': 'stephany',  'email': 'stephany@anomaly.com'},
    {'username': 'daniel',    'email': 'daniel@anomaly.com'},
    {'username': 'sandra',    'email': 'sandra@anomaly.com'},
]

DEFAULT_PASSWORD = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Anomaly2026!')

class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        for data in ADMINS:
            user, created = Usuario.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': data['email'],
                    'rol': 'admin',
                    'is_staff': True,
                }
            )
            if created:
                user.set_password(DEFAULT_PASSWORD)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Admin creado: {data['username']}"))
            else:
                self.stdout.write(f"Ya existe: {data['username']}")
