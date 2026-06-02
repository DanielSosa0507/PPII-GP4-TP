from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Fenomeno, Validacion
from .serializers import FenomenoSerializer, ValidacionSerializer
from reportlab.pdfgen import canvas


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.rol == 'admin'

class FenomenoListCreateView(generics.ListCreateAPIView):
    serializer_class = FenomenoSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Fenomeno.objects.all()

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

class FenomenoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FenomenoSerializer
    permission_classes = [IsAdminOrReadOnly]
    queryset = Fenomeno.objects.all()

class ValidacionView(generics.CreateAPIView):
    serializer_class = ValidacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class DescargaPDFView(APIView):
    def get(self, request, pk):
        fenomeno = Fenomeno.objects.get(pk=pk)

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