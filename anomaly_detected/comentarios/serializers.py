from rest_framework import serializers
from .models import Comentario

class ComentarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comentario
        fields = '__all__'
        read_only_fields = ['usuario', 'creado_en']
