from rest_framework import serializers
from .models import Comentario

class ComentarioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = Comentario
        fields = '__all__'
        read_only_fields = ['usuario', 'creado_en', 'activo']
