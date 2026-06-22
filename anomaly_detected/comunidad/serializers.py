from django.db import models
from rest_framework import serializers
from .models import Teoria, VotoTeoria


class TeoriaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    votos_total = serializers.SerializerMethodField()

    class Meta:
        model = Teoria
        fields = '__all__'
        read_only_fields = ['usuario', 'creado_en']

    def get_votos_total(self, obj):
        return obj.votos.aggregate(total=models.Sum('valor'))['total'] or 0


class VotoTeoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = VotoTeoria
        fields = '__all__'
        read_only_fields = ['usuario', 'teoria', 'creado_en']
