import time

from django.core.management.base import BaseCommand
from deep_translator import GoogleTranslator

from fenomenos.models import Fenomeno

# Límite por request del traductor gratuito de Google; si una descripción
# es más larga, deep-translator la corta sola y perdería el resto, así que
# la partimos en pedazos y volvemos a unir la traducción.
LIMITE_CARACTERES = 4500
PAUSA_ENTRE_PEDIDOS = 0.15  # segundos, para no saturar el servicio gratuito


def traducir_texto(traductor, texto):
    if len(texto) <= LIMITE_CARACTERES:
        return traductor.translate(texto)

    partes = [texto[i:i + LIMITE_CARACTERES] for i in range(0, len(texto), LIMITE_CARACTERES)]
    return ' '.join(traductor.translate(parte) for parte in partes)


class Command(BaseCommand):
    help = 'Traduce al castellano las descripciones de los fenómenos importados desde datasets en inglés.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limite',
            type=int,
            default=None,
            help='Traducir como máximo N fenómenos (para probar antes de correrlo completo).',
        )

    def handle(self, *args, **options):
        pendientes = Fenomeno.objects.filter(descripcion_traducida=False).order_by('id')
        total = pendientes.count()

        if options['limite']:
            pendientes = pendientes[: options['limite']]

        if total == 0:
            self.stdout.write('No hay descripciones pendientes de traducir.')
            return

        self.stdout.write(f'Traduciendo {min(total, options["limite"] or total)} de {total} fenómenos pendientes...')

        traductor = GoogleTranslator(source='en', target='es')
        traducidos = 0
        fallidos = 0

        for fenomeno in pendientes:
            try:
                fenomeno.descripcion = traducir_texto(traductor, fenomeno.descripcion)
                fenomeno.descripcion_traducida = True
                fenomeno.save(update_fields=['descripcion', 'descripcion_traducida'])
                traducidos += 1
                if traducidos % 100 == 0:
                    self.stdout.write(f'  ...{traducidos} traducidos hasta ahora')
            except Exception as error:
                fallidos += 1
                self.stderr.write(f'  Fenómeno {fenomeno.id} falló ({error}), queda pendiente para el próximo intento.')
            time.sleep(PAUSA_ENTRE_PEDIDOS)

        self.stdout.write(self.style.SUCCESS(
            f'Listo: {traducidos} traducidos, {fallidos} fallaron (van a quedar pendientes; '
            f'correr el comando de nuevo más tarde los reintenta solos).'
        ))
