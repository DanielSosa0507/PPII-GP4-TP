from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date
from usuarios.models import Usuario
from fenomenos.models import Fenomeno, Validacion
from comentarios.models import Comentario


class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        if Fenomeno.objects.exists():
            self.stdout.write('Los datos ya existen, omitiendo seed.')
            return

        # Usuarios
        u1, _ = Usuario.objects.get_or_create(username='mariela_g', defaults={'email': 'mariela@example.com', 'rol': 'user'})
        u1.set_password('pass1234'); u1.save()
        u2, _ = Usuario.objects.get_or_create(username='rodrigo_psi', defaults={'email': 'rodrigo@example.com', 'rol': 'user'})
        u2.set_password('pass1234'); u2.save()
        u3, _ = Usuario.objects.get_or_create(username='lautaro_x', defaults={'email': 'lautaro@example.com', 'rol': 'user'})
        u3.set_password('pass1234'); u3.save()

        fenomenos = [
            dict(titulo='Avistamiento triangular sobre el Riachuelo',
                 descripcion='A las 2:30 AM vi tres luces en formación triangular moviéndose en silencio total sobre el Riachuelo. Duró unos 4 minutos antes de desaparecer hacia el norte.',
                 tipo='ovni', latitud=-34.6637, longitud=-58.4434,
                 fecha_ocurrencia=date(2025, 3, 12), validado=True, creado_por=u1),
            dict(titulo='Objeto esférico sobre el Obelisco',
                 descripcion='Un objeto perfectamente esférico y plateado flotó durante 10 minutos sobre el Obelisco. Cientos de personas lo vieron desde la 9 de Julio. Desapareció de golpe sin dejar rastro.',
                 tipo='ovni', latitud=-34.6037, longitud=-58.3816,
                 fecha_ocurrencia=date(2025, 7, 4), validado=True, creado_por=u2),
            dict(titulo='Luces pulsantes en el delta del Paraná',
                 descripcion='Durante una noche de camping vimos luces de colores que pulsaban sobre el río. Se movían en patrones geométricos perfectos y no hacían ningún ruido.',
                 tipo='ovni', latitud=-34.1709, longitud=-58.8567,
                 fecha_ocurrencia=date(2025, 11, 20), validado=False, creado_por=u3),
            dict(titulo='La casa de Palermo que nadie quiere alquilar',
                 descripcion='En Thames al 1200 hay una casa donde todos los inquilinos se van al mes. Se escuchan pasos en el techo, las puertas se abren solas y hay una presencia constante en el baño del fondo.',
                 tipo='embrujado', latitud=-34.5875, longitud=-58.4274,
                 fecha_ocurrencia=date(2024, 6, 1), validado=True, creado_por=u1),
            dict(titulo='El sótano del Hospital Moyano',
                 descripcion='Empleados nocturnos reportan sombras y voces en el sótano del ala antigua. Un guardia renunció tras ver una figura que desapareció al encender la luz.',
                 tipo='embrujado', latitud=-34.6347, longitud=-58.4033,
                 fecha_ocurrencia=date(2025, 2, 14), validado=True, creado_por=u2),
            dict(titulo='Figura encapuchada en la Reserva Ecológica',
                 descripcion='Varios corredores reportan ver a la madrugada una figura alta con capucha negra parada inmóvil entre los árboles. Al acercarse desaparece. No deja huellas.',
                 tipo='embrujado', latitud=-34.6118, longitud=-58.3522,
                 fecha_ocurrencia=date(2025, 9, 3), validado=False, creado_por=u3),
            dict(titulo='Desaparición de brújulas en Tandil',
                 descripcion='En la zona de las sierras de Tandil, las brújulas giran sin control y los celulares pierden señal en un radio de 200 metros. El fenómeno ocurre siempre entre las 18 y las 20 hs.',
                 tipo='otro', latitud=-37.3217, longitud=-59.1332,
                 fecha_ocurrencia=date(2025, 4, 22), validado=True, creado_por=u1),
            dict(titulo='Lluvia de peces en Corrientes',
                 descripcion='Durante una tormenta eléctrica cayeron decenas de pequeños peces vivos en el barrio San Gerónimo. Los vecinos los recogieron del suelo. No había cuerpos de agua cercanos.',
                 tipo='otro', latitud=-27.4692, longitud=-58.8306,
                 fecha_ocurrencia=date(2025, 1, 8), validado=True, creado_por=u2),
        ]

        objs = []
        for data in fenomenos:
            f = Fenomeno.objects.create(**data)
            objs.append(f)

        # Validaciones
        pares = [(objs[0], u2), (objs[0], u3), (objs[1], u1), (objs[1], u3),
                 (objs[3], u2), (objs[3], u3), (objs[6], u2), (objs[7], u1)]
        for fenomeno, usuario in pares:
            Validacion.objects.get_or_create(fenomeno=fenomeno, usuario=usuario)

        # Comentarios
        comentarios = [
            (objs[0], u2, 'Yo también lo vi desde Avellaneda esa noche, era impresionante el silencio que hacía.'),
            (objs[0], u3, 'Mi hermano trabaja en el puerto y me contó lo mismo. Nadie le cree.'),
            (objs[1], u1, 'Tengo video pero se ve borroso. Lo subí a YouTube y me lo bajaron a las horas.'),
            (objs[1], u3, 'Estaba ahí, no tengo explicación racional para lo que vi.'),
            (objs[3], u2, 'Fui a ver esa casa. La energía que se siente desde afuera ya es rara.'),
            (objs[3], u3, 'Un amigo vivió ahí 3 semanas y dice que nunca más.'),
            (objs[6], u2, 'Fui con un GPS y también perdió la señal. Es una zona muy extraña.'),
            (objs[7], u3, 'Mi abuela vive en Corrientes y dice que pasó dos veces en su vida.'),
        ]
        for fenomeno, usuario, texto in comentarios:
            Comentario.objects.create(fenomeno=fenomeno, usuario=usuario, texto=texto)

        self.stdout.write(self.style.SUCCESS('Datos de ejemplo cargados correctamente.'))
