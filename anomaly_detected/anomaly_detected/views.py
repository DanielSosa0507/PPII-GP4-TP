from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from functools import wraps


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
    Decorador que protege vistas exclusivas de administradores
    (rol == 'admin'). Si no es admin, redirige al inicio con mensaje.
    """
    @wraps(vista)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            messages.info(request, 'Necesitás iniciar sesión para acceder al panel.')
            return redirect('login')
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


# REPORTE (formulario para registrar fenómeno, requiere cuenta)
@login_required_con_mensaje
def reporte_formulario(request):
    return render(request, 'Reporte.html')


# MAPA (libre, no requiere cuenta — visitantes también pueden explorar)
def mapa_view(request):
    return render(request, 'mapa.html')


# PANEL DE ADMINISTRACIÓN (solo rol == 'admin')
@admin_required
def admin_panel(request):
    return render(request, 'admin_panel.html')