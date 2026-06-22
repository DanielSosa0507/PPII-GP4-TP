"""
URL configuration for anomaly_detected project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.views import LogoutView
from . import views
from usuarios.views import perfil_view, editar_perfil_view, registro_view, eliminar_cuenta_view

urlpatterns = [
    # PRINCIPAL
    path('', views.index, name='index'),

    # ADMINISTRADOR Y AUTENTICACIÓN
    path('admin/', admin.site.urls),
    path('login/', views.CustomLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(next_page='index'), name='logout'),
    path('registro/', registro_view, name='registro'),
    path('mapa/', views.mapa_view, name='mapa'),
 
    # PERFIL DE USUARIO
    path('perfil/', perfil_view, name='perfil'),
    path('perfil/editar/', editar_perfil_view, name='editar_perfil'),
    path('perfil/eliminar/', eliminar_cuenta_view, name='eliminar_cuenta'),
 
    # OTRAS PAGINAS
    path('reportes/', views.reportes, name='reportes'),
    path('comunidad/', views.comunidad, name='comunidad'),
    path('favoritos/', views.favoritos, name='favoritos'),
    path('reporte/', views.reporte_formulario, name='ReportForm'),
    path('reporte/<int:fenomeno_id>/editar/', views.reporte_formulario, name='editar_fenomeno'),

    # MIS FENÓMENOS (ABM del usuario sobre lo que él mismo reportó)
    path('mis-fenomenos/', views.mis_fenomenos_view, name='mis_fenomenos'),
    path('mis-fenomenos/<int:fenomeno_id>/eliminar/', views.eliminar_fenomeno_view, name='eliminar_fenomeno'),

    # PANEL ADMIN (moderación de fenómenos/comentarios, gestión de usuarios)
    path('panel-admin/', views.panel_admin_view, name='panel_admin'),
    path('panel-admin/fenomeno/<int:fenomeno_id>/aprobar/', views.aprobar_fenomeno_view, name='aprobar_fenomeno'),
    path('panel-admin/fenomeno/<int:fenomeno_id>/rechazar/', views.rechazar_fenomeno_view, name='rechazar_fenomeno'),
    path('panel-admin/comentario/<int:comentario_id>/toggle/', views.toggle_comentario_view, name='toggle_comentario'),
    path('panel-admin/usuario/<int:usuario_id>/toggle-activo/', views.toggle_usuario_activo_view, name='toggle_usuario_activo'),
    path('panel-admin/usuario/<int:usuario_id>/cambiar-rol/', views.cambiar_rol_usuario_view, name='cambiar_rol_usuario'),

    # OTROS URLS
    path('api/usuarios/', include('usuarios.urls')),
    path('api/fenomenos/', include('fenomenos.urls')),
    path('api/comentarios/', include('comentarios.urls')),
    path('api/comunidad/', include('comunidad.urls')),
]