from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count
from .models import Fenomeno, Validacion, Favorito, Visita, Puntuacion, Enlace, BaseMilitar
from .serializers import (
    FenomenoSerializer, ValidacionSerializer, FavoritoSerializer,
    VisitaSerializer, PuntuacionSerializer, EnlaceSerializer,
)
from reportlab.pdfgen import canvas


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.rol == 'admin'

class FenomenoListCreateView(generics.ListCreateAPIView):
    serializer_class = FenomenoSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Fenomeno.objects.annotate(
        puntuacion_total_anotada=Count('puntuaciones'),
        puntuacion_promedio_anotada=Avg('puntuaciones__valor'),
    )

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

class FenomenoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FenomenoSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Fenomeno.objects.annotate(
        puntuacion_total_anotada=Count('puntuaciones'),
        puntuacion_promedio_anotada=Avg('puntuaciones__valor'),
    )

class ValidacionView(generics.CreateAPIView):
    serializer_class = ValidacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class FavoritoListCreateView(generics.ListCreateAPIView):
    serializer_class = FavoritoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorito.objects.filter(usuario=self.request.user).select_related('fenomeno')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class FavoritoDeleteView(generics.DestroyAPIView):
    serializer_class = FavoritoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorito.objects.filter(usuario=self.request.user)

class VisitaListCreateView(generics.ListCreateAPIView):
    serializer_class = VisitaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Visita.objects.filter(usuario=self.request.user).select_related('fenomeno')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class VisitaDeleteView(generics.DestroyAPIView):
    serializer_class = VisitaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Visita.objects.filter(usuario=self.request.user)

class PuntuacionView(generics.CreateAPIView):
    serializer_class = PuntuacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # POST de nuevo sobre el mismo fenómeno actualiza el voto en vez de duplicarlo.
        instance, _ = Puntuacion.objects.update_or_create(
            fenomeno_id=self.kwargs['pk'],
            usuario=self.request.user,
            defaults={'valor': serializer.validated_data['valor']},
        )
        serializer.instance = instance

class EnlaceListCreateView(generics.ListCreateAPIView):
    serializer_class = EnlaceSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return Enlace.objects.filter(fenomeno=self.kwargs['pk'])

    def perform_create(self, serializer):
        serializer.save(fenomeno_id=self.kwargs['pk'])

class EnlaceDeleteView(generics.DestroyAPIView):
    serializer_class = EnlaceSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Enlace.objects.all()

class BasesPorEstadoView(APIView):
    """
    El dataset de bases militares no trae latitud/longitud por base, así
    que no se pueden poner como pines individuales en el mapa. Esto agrupa
    por estado para que el frontend dibuje una burbuja en el centroide de
    cada estado (coordenadas fijas conocidas, no vienen de la BD).
    """
    def get(self, request):
        datos = (
            BaseMilitar.objects.values('estado')
            .annotate(cantidad=Count('id'))
            .order_by('-cantidad')
        )
        return Response(list(datos))


class DescargaPDFView(APIView):
    def get(self, request, pk):
        fenomeno = get_object_or_404(Fenomeno, pk=pk)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{fenomeno.titulo}.pdf"'

        p = canvas.Canvas(response)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 800, f"Fenómeno: {fenomeno.titulo}")
        p.setFont("Helvetica", 12)
        p.drawString(100, 770, f"Tipo: {fenomeno.tipo}")
        p.drawString(100, 750, f"Descripción: {fenomeno.descripcion}")
        p.drawString(100, 730, f"Validado: {'Sí' if fenomeno.validado else 'No'}")
        p.drawString(100, 710, f"Fecha: {fenomeno.fecha_ocurrencia}")
        p.showPage()
        p.save()

        return response