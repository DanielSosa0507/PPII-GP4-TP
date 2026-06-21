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
from django.contrib.auth.views import LoginView, LogoutView
from . import views
from usuarios.views import perfil_view, editar_perfil_view, registro_view, eliminar_cuenta_view
 
urlpatterns = [
    # PRINCIPAL
    path('', views.index, name='index'),
 
    # ADMINISTRADOR Y AUTENTICACIÓN
    path('admin/', admin.site.urls),
    path('login/', LoginView.as_view(template_name='login.html'), name='login'),
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
 
    # OTROS URLS
    path('api/usuarios/', include('usuarios.urls')),
    path('api/fenomenos/', include('fenomenos.urls')),
    path('api/comentarios/', include('comentarios.urls')),
]