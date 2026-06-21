from rest_framework import generics, permissions
from .models import Teoria, VotoTeoria
from .serializers import TeoriaSerializer, VotoTeoriaSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.usuario_id == request.user.id


class TeoriaListCreateView(generics.ListCreateAPIView):
    serializer_class = TeoriaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = Teoria.objects.all()

    def get_queryset(self):
        qs = Teoria.objects.all()
        fenomeno_id = self.request.query_params.get('fenomeno')
        if fenomeno_id:
            qs = qs.filter(fenomeno_id=fenomeno_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class TeoriaDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TeoriaSerializer
    permission_classes = [IsOwnerOrReadOnly]
    queryset = Teoria.objects.all()


class VotoTeoriaView(generics.CreateAPIView):
    serializer_class = VotoTeoriaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Votar de nuevo sobre la misma teoría actualiza el voto en vez de duplicarlo.
        instance, _ = VotoTeoria.objects.update_or_create(
            teoria_id=self.kwargs['pk'],
            usuario=self.request.user,
            defaults={'valor': serializer.validated_data['valor']},
        )
        serializer.instance = instance
