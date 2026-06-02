from django.urls import path
from .views import RegisterView, LoginView, PerfilView, ListaUsuariosView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('perfil/', PerfilView.as_view()),
    path('lista/', ListaUsuariosView.as_view()),
]
