from rest_framework import generics, permissions
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from django.contrib.auth import authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import Usuario
from .serializers import UsuarioSerializer, RegisterSerializer


# ============================================================
# API REST (ya existente, sin cambios)
# ============================================================

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginThrottle(AnonRateThrottle):
    rate = '10/min'


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'rol': user.rol})
        return Response({'error': 'Credenciales inválidas'}, status=400)


class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ListaUsuariosView(generics.ListAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Usuario.objects.all()


# ============================================================
# VISTAS HTML (nuevas) — para las páginas del sitio, distintas
# de la API de arriba. Estas devuelven templates, no JSON.
# ============================================================

def registro_view(request):
    """Formulario de registro de un nuevo usuario (Usuario + Email + Contraseña)."""
    if request.user.is_authenticated:
        return redirect('perfil')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        password_confirm = request.POST.get('password_confirm', '')

        errores = []

        if not username or not email or not password:
            errores.append('Completá todos los campos.')

        if password != password_confirm:
            errores.append('Las contraseñas no coinciden.')

        if username and Usuario.objects.filter(username=username).exists():
            errores.append('Ese nombre de usuario ya está en uso.')

        if email and Usuario.objects.filter(email=email).exists():
            errores.append('Ese email ya tiene una cuenta registrada.')

        if password and not errores:
            try:
                validate_password(password)
            except ValidationError as e:
                errores.extend(e.messages)

        if errores:
            for error in errores:
                messages.error(request, error)
            return render(request, 'registro.html', {
                'username': username,
                'email': email,
            })

        Usuario.objects.create_user(username=username, email=email, password=password)
        messages.success(request, 'Cuenta creada con éxito. Ya podés iniciar sesión.')
        return redirect('login')

    return render(request, 'registro.html')


@login_required(login_url='login')
def perfil_view(request):
    """Muestra el perfil del usuario logueado (solo lectura)."""
    return render(request, 'perfil.html', {'usuario': request.user})


@login_required(login_url='login')
def editar_perfil_view(request):
    """Formulario para editar los datos del propio perfil."""
    usuario = request.user

    if request.method == 'POST':
        usuario.nombre = request.POST.get('nombre', '').strip()
        usuario.apellido = request.POST.get('apellido', '').strip()
        usuario.bio = request.POST.get('bio', '').strip()
        usuario.nivel = request.POST.get('nivel', usuario.nivel)

        if request.FILES.get('foto_perfil'):
            usuario.foto_perfil = request.FILES['foto_perfil']

        usuario.save()
        messages.success(request, 'Tu perfil se actualizó correctamente.')
        return redirect('perfil')

    return render(request, 'editar_perfil.html', {'usuario': usuario})


@login_required(login_url='login')
def eliminar_cuenta_view(request):
    """Elimina la cuenta del usuario logueado (solo vía POST, con confirmación en el template)."""
    if request.method == 'POST':
        usuario = request.user
        logout(request)
        usuario.delete()
        messages.success(request, 'Tu cuenta fue eliminada. ¡Esperamos verte de nuevo!')
        return redirect('index')

    return redirect('perfil')