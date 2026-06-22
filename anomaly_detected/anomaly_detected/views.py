from datetime import datetime, timedelta

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from functools import wraps

from fenomenos.models import Fenomeno, Enlace
from comentarios.models import Comentario
from usuarios.models import Usuario


def login_required_con_mensaje(vista):
    """
    Igual que @login_required, pero además deja un mensaje
    'Necesitás iniciar sesión' para mostrar en login.html.
    """
    @wraps(vista)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            messages.info(request, 'Necesitás iniciar sesión para ver esta sección.')
        return login_required(login_url='login')(vista)(request, *args, **kwargs)
    return wrapper


def admin_required(vista):
    """
    Igual que @login_required_con_mensaje, pero además exige rol == 'admin'.
    """
    @wraps(vista)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            messages.info(request, 'Necesitás iniciar sesión para ver esta sección.')
            return login_required(login_url='login')(vista)(request, *args, **kwargs)
        if request.user.rol != 'admin':
            messages.error(request, 'No tenés permisos para acceder al panel de administración.')
            return redirect('index')
        return vista(request, *args, **kwargs)
    return wrapper


# INICIO SESION
def login_view(request):
    return render(request, 'login.html')


# VOLVER
def index(request):
    return render(request, 'index.html')


# REPORTES (requiere cuenta)
@login_required_con_mensaje
def reportes(request):
    return render(request, 'reportes.html')


# COMUNIDAD (requiere cuenta)
@login_required_con_mensaje
def comunidad(request):
    return render(request, 'comunidad.html')


# FAVORITOS (requiere cuenta)
@login_required_con_mensaje
def favoritos(request):
    return render(request, 'favoritos.html')


# REPORTE (formulario para registrar O editar un fenómeno propio, requiere cuenta)
@login_required_con_mensaje
def reporte_formulario(request, fenomeno_id=None):
    fenomeno_existente = None
    if fenomeno_id is not None:
        fenomeno_existente = get_object_or_404(
            Fenomeno, id=fenomeno_id, creado_por=request.user, estado_moderacion='pendiente'
        )

    if request.method == 'POST':
        tipo = request.POST.get('tipo', 'ovni')
        lugar = request.POST.get('lugar', '').strip()
        fecha_texto = request.POST.get('fecha', '').strip()
        descripcion = request.POST.get('descripcion', '').strip()
        latitud = request.POST.get('latitud', '').strip()
        longitud = request.POST.get('longitud', '').strip()
        enlace_url = request.POST.get('enlace_url', '').strip()
        imagen = request.FILES.get('imagen')

        errores = []
        if not lugar:
            errores.append('Falta el lugar/ubicación.')
        if not descripcion:
            errores.append('Falta la descripción del evento.')
        if not latitud or not longitud:
            errores.append('Falta marcar la ubicación en el mini-mapa.')

        fecha_ocurrencia = None
        if fecha_texto:
            try:
                fecha_ocurrencia = datetime.strptime(fecha_texto, '%d/%m/%Y').date()
            except ValueError:
                errores.append('La fecha debe tener el formato dd/mm/aaaa.')

        if errores:
            for error in errores:
                messages.error(request, error)
        else:
            # "Lugar / Ubicación" sigue el formato "Ciudad, Estado" (placeholder del form);
            # separamos el estado/provincia para que alimente bien el contador de
            # "estados explorados" de la gamificación.
            estado = lugar.rsplit(',', 1)[-1].strip() if ',' in lugar else lugar
            tipo_display = dict(Fenomeno.TIPOS).get(tipo, tipo)

            if fenomeno_existente is not None:
                fenomeno = fenomeno_existente
                fenomeno.titulo = f"{tipo_display} en {lugar}"
                fenomeno.descripcion = descripcion
                fenomeno.tipo = tipo
                fenomeno.estado = estado
                fenomeno.latitud = float(latitud)
                fenomeno.longitud = float(longitud)
                fenomeno.fecha_ocurrencia = fecha_ocurrencia
                if imagen:
                    fenomeno.imagen = imagen
                fenomeno.save()
                mensaje = 'Tu fenómeno fue actualizado y sigue pendiente de revisión.'
            else:
                fenomeno = Fenomeno.objects.create(
                    titulo=f"{tipo_display} en {lugar}",
                    descripcion=descripcion,
                    tipo=tipo,
                    estado=estado,
                    latitud=float(latitud),
                    longitud=float(longitud),
                    fecha_ocurrencia=fecha_ocurrencia,
                    imagen=imagen,
                    creado_por=request.user,
                    estado_moderacion='pendiente',
                )
                mensaje = 'Tu fenómeno fue enviado y está pendiente de revisión.'

            if enlace_url:
                Enlace.objects.create(fenomeno=fenomeno, titulo='Fuente externa', url=enlace_url)

            messages.success(request, mensaje)
            return redirect('mis_fenomenos')

    # El "Lugar / Ubicación" original no se guarda como campo propio (solo se
    # parte en titulo/estado al crear), así que al editar lo reconstruimos
    # quitando el prefijo "<Tipo> en " que le agregamos en el título.
    lugar_inicial = ''
    if fenomeno_existente is not None and ' en ' in fenomeno_existente.titulo:
        lugar_inicial = fenomeno_existente.titulo.split(' en ', 1)[-1]

    mis_reportes_recientes = Fenomeno.objects.filter(creado_por=request.user).order_by('-creado_en')[:3]
    return render(request, 'Reporte.html', {
        'mis_reportes_recientes': mis_reportes_recientes,
        'fenomeno': fenomeno_existente,
        'lugar_inicial': lugar_inicial,
    })


# MIS FENÓMENOS (requiere cuenta)
@login_required_con_mensaje
def mis_fenomenos_view(request):
    fenomenos = Fenomeno.objects.filter(creado_por=request.user).order_by('-creado_en')
    return render(request, 'mis_fenomenos.html', {'fenomenos': fenomenos})


# ELIMINAR FENÓMENO PROPIO (solo mientras está pendiente, requiere cuenta)
@login_required_con_mensaje
def eliminar_fenomeno_view(request, fenomeno_id):
    fenomeno = get_object_or_404(
        Fenomeno, id=fenomeno_id, creado_por=request.user, estado_moderacion='pendiente'
    )
    if request.method == 'POST':
        fenomeno.delete()
        messages.success(request, 'Fenómeno eliminado.')
    return redirect('mis_fenomenos')


# PANEL ADMIN (requiere rol admin)
@admin_required
def panel_admin_view(request):
    hace_una_semana = timezone.now() - timedelta(days=7)
    contexto = {
        'kpi_usuarios_activos': Usuario.objects.filter(is_active=True).count(),
        'kpi_fenomenos_pendientes': Fenomeno.objects.filter(estado_moderacion='pendiente').count(),
        'kpi_total_fenomenos': Fenomeno.objects.count(),
        'kpi_nuevos_semana': Fenomeno.objects.filter(creado_en__gte=hace_una_semana).count(),
        'fenomenos_pendientes': Fenomeno.objects.filter(estado_moderacion='pendiente').order_by('-creado_en'),
        'comentarios_recientes': Comentario.objects.select_related('usuario', 'fenomeno').order_by('-creado_en')[:20],
        'usuarios': Usuario.objects.all().order_by('username'),
    }
    return render(request, 'panel_admin.html', contexto)


@admin_required
def aprobar_fenomeno_view(request, fenomeno_id):
    fenomeno = get_object_or_404(Fenomeno, id=fenomeno_id)
    if request.method == 'POST':
        fenomeno.estado_moderacion = 'aprobado'
        fenomeno.validado = True
        fenomeno.save()
        messages.success(request, f'"{fenomeno.titulo}" fue aprobado.')
    return redirect('panel_admin')


@admin_required
def rechazar_fenomeno_view(request, fenomeno_id):
    fenomeno = get_object_or_404(Fenomeno, id=fenomeno_id)
    if request.method == 'POST':
        fenomeno.estado_moderacion = 'rechazado'
        fenomeno.save()
        messages.success(request, f'"{fenomeno.titulo}" fue rechazado.')
    return redirect('panel_admin')


@admin_required
def toggle_comentario_view(request, comentario_id):
    comentario = get_object_or_404(Comentario, id=comentario_id)
    if request.method == 'POST':
        comentario.activo = not comentario.activo
        comentario.save()
    return redirect('panel_admin')


@admin_required
def toggle_usuario_activo_view(request, usuario_id):
    usuario = get_object_or_404(Usuario, id=usuario_id)
    if request.method == 'POST' and usuario.id != request.user.id:
        usuario.is_active = not usuario.is_active
        usuario.save()
    return redirect('panel_admin')


@admin_required
def cambiar_rol_usuario_view(request, usuario_id):
    usuario = get_object_or_404(Usuario, id=usuario_id)
    if request.method == 'POST' and usuario.id != request.user.id:
        usuario.rol = 'user' if usuario.rol == 'admin' else 'admin'
        usuario.save()
    return redirect('panel_admin')


# MAPA (libre, no requiere cuenta — visitantes también pueden explorar)
def mapa_view(request):
    return render(request, 'mapa.html')