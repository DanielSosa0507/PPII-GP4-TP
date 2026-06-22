import csv
import random
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from fenomenos.models import Fenomeno, Enlace, BaseMilitar

DATASET_DIR = Path(settings.BASE_DIR) / 'dataset'

# Pesos para el campo "actividad" (alimenta el mapa de calor). Los CSVs no
# traen ninguna señal de intensidad real, así que se reparte con un sesgo
# razonable (la mayoría moderada/baja, pocos casos extremos) en vez de
# asignar todo al mismo valor por defecto.
NIVELES_ACTIVIDAD = ['baja', 'moderada', 'alta', 'extrema']
PESOS_ACTIVIDAD = [25, 40, 25, 10]


def actividad_aleatoria():
    return random.choices(NIVELES_ACTIVIDAD, weights=PESOS_ACTIVIDAD, k=1)[0]


def parsear_float(valor):
    try:
        return float(valor)
    except (TypeError, ValueError):
        return None


class Command(BaseCommand):
    help = 'Importa los datasets limpios (UFO, lugares embrujados, bases militares) desde dataset/'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Borra los registros importados previamente (creado_por=None) antes de volver a importar.',
        )

    def handle(self, *args, **options):
        if options['reset']:
            borrados, _ = Fenomeno.objects.filter(creado_por__isnull=True).delete()
            BaseMilitar.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Reset: borrados {borrados} fenómenos importados y todas las bases militares.'))

        self.importar_ufo()
        self.importar_embrujados()
        self.importar_bases()

    # ------------------------------------------------------------
    # Los fenómenos importados de dataset usan creado_por=None, lo que los
    # distingue de los reportados por un usuario real (y sirve como marca
    # para no duplicar si el comando se corre de nuevo sin --reset).
    # ------------------------------------------------------------

    def importar_ufo(self):
        if Fenomeno.objects.filter(creado_por__isnull=True, tipo='ovni').exists():
            self.stdout.write('OVNIs: ya estaban importados, salteo (usá --reset para reimportar).')
            return

        ruta = DATASET_DIR / 'clean_ufo_data_nufor_2013_2024.csv'
        nuevos = []
        enlaces_por_indice = []

        with open(ruta, encoding='utf-8-sig', newline='') as archivo:
            for fila in csv.DictReader(archivo):
                lat = parsear_float(fila.get('lat'))
                lng = parsear_float(fila.get('lng'))
                if lat is None or lng is None:
                    continue

                fecha_ocurrencia = None
                if fila.get('date'):
                    try:
                        fecha_ocurrencia = datetime.strptime(fila['date'], '%Y-%m-%d').date()
                    except ValueError:
                        pass

                ciudad = (fila.get('city') or '').strip()
                fenomeno = Fenomeno(
                    titulo=f"Avistamiento en {ciudad}" if ciudad else 'Avistamiento OVNI',
                    descripcion=fila.get('summary') or 'Sin descripción.',
                    tipo='ovni',
                    estado=(fila.get('state') or '').strip(),
                    latitud=lat,
                    longitud=lng,
                    fecha_ocurrencia=fecha_ocurrencia,
                    creado_por=None,
                    estado_moderacion='aprobado',
                    validado=True,
                    actividad=actividad_aleatoria(),
                    descripcion_traducida=False,
                )
                nuevos.append(fenomeno)

                link = (fila.get('img_link') or '').strip()
                enlaces_por_indice.append(link if link.startswith('http') else None)

        Fenomeno.objects.bulk_create(nuevos, batch_size=1000)

        # Volver a buscarlos para tener los ids reales y poder crear los Enlace.
        creados = list(
            Fenomeno.objects.filter(creado_por__isnull=True, tipo='ovni').order_by('id')[: len(nuevos)]
        )
        enlaces = [
            Enlace(fenomeno=fenomeno, titulo='Reporte original (NUFORC)', url=link)
            for fenomeno, link in zip(creados, enlaces_por_indice)
            if link
        ]
        Enlace.objects.bulk_create(enlaces, batch_size=1000)

        self.stdout.write(self.style.SUCCESS(f'OVNIs importados: {len(nuevos)} (+ {len(enlaces)} enlaces de evidencia).'))

    def importar_embrujados(self):
        if Fenomeno.objects.filter(creado_por__isnull=True, tipo='embrujado').exists():
            self.stdout.write('Lugares embrujados: ya estaban importados, salteo (usá --reset para reimportar).')
            return

        ruta = DATASET_DIR / 'haunted_places_atemporal.csv'
        nuevos = []

        with open(ruta, encoding='utf-8-sig', newline='') as archivo:
            for fila in csv.DictReader(archivo):
                lat = parsear_float(fila.get('latitude')) or parsear_float(fila.get('city_latitude'))
                lng = parsear_float(fila.get('longitude')) or parsear_float(fila.get('city_longitude'))
                if lat is None or lng is None:
                    continue

                ubicacion = (fila.get('location') or '').strip()
                ciudad = (fila.get('city') or '').strip()
                titulo = (ubicacion or ciudad or 'Lugar embrujado')[:200]

                nuevos.append(Fenomeno(
                    titulo=titulo,
                    descripcion=(fila.get('description') or 'Sin descripción.').strip(),
                    tipo='embrujado',
                    estado=(fila.get('state_abbrev') or '').strip(),
                    latitud=lat,
                    longitud=lng,
                    creado_por=None,
                    estado_moderacion='aprobado',
                    validado=True,
                    actividad=actividad_aleatoria(),
                    descripcion_traducida=False,
                ))

        Fenomeno.objects.bulk_create(nuevos, batch_size=1000)
        self.stdout.write(self.style.SUCCESS(f'Lugares embrujados importados: {len(nuevos)}.'))

    def importar_bases(self):
        if BaseMilitar.objects.exists():
            self.stdout.write('Bases militares: ya estaban importadas, salteo (usá --reset para reimportar).')
            return

        ruta = DATASET_DIR / 'clean_bases.csv'
        nuevas = []

        with open(ruta, encoding='utf-8-sig', newline='') as archivo:
            for fila in csv.DictReader(archivo, delimiter=';'):
                nombre = (fila.get('Site Name') or '').strip()
                if not nombre:
                    continue
                nuevas.append(BaseMilitar(
                    nombre=nombre,
                    estado=(fila.get('State Terr') or '').strip(),
                    operativa=(fila.get('Oper Stat') or '').strip().lower() == 'active',
                ))

        BaseMilitar.objects.bulk_create(nuevas, batch_size=1000)
        self.stdout.write(self.style.SUCCESS(f'Bases militares importadas: {len(nuevas)}.'))
