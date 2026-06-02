from rest_framework import generics, permissions
from .models import Comentario
from .serializers import ComentarioSerializer

class ComentarioListCreateView(generics.ListCreateAPIView):
    serializer_class = ComentarioSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        fenomeno_id = self.request.query_params.get('fenomeno')
        return Comentario.objects.filter(fenomeno=fenomeno_id, activo=True)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class ComentarioDeleteView(generics.DestroyAPIView):
    serializer_class = ComentarioSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Comentario.objects.all()
