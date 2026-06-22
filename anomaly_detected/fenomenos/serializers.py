from django.db import models
from rest_framework import serializers
from .models import Fenomeno, Validacion, Favorito, Visita, Puntuacion, Enlace

class FenomenoSerializer(serializers.ModelSerializer):
    puntuacion_promedio = serializers.SerializerMethodField()
    puntuacion_total = serializers.SerializerMethodField()

    class Meta:
        model = Fenomeno
        fields = '__all__'
        read_only_fields = ['creado_por', 'creado_en']

    def get_puntuacion_promedio(self, obj):
        # Si la queryset viene anotada (ver FenomenoListCreateView/DetailView), evita
        # una query por fenomeno; si no, calcula al vuelo (caso de fenomeno_detalle anidado).
        promedio = getattr(obj, 'puntuacion_promedio_anotada', None)
        if promedio is None:
            promedio = obj.puntuaciones.aggregate(models.Avg('valor'))['valor__avg']
        return round(promedio, 1) if promedio else None

    def get_puntuacion_total(self, obj):
        total = getattr(obj, 'puntuacion_total_anotada', None)
        return total if total is not None else obj.puntuaciones.count()

class ValidacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Validacion
        fields = '__all__'
        read_only_fields = ['usuario', 'creado_en']


class FavoritoSerializer(serializers.ModelSerializer):
    fenomeno_detalle = FenomenoSerializer(source='fenomeno', read_only=True)

    class Meta:
        model = Favorito
        fields = '__all__'
        read_only_fields = ['usuario', 'creado_en']


class VisitaSerializer(serializers.ModelSerializer):
    fenomeno_detalle = FenomenoSerializer(source='fenomeno', read_only=True)

    class Meta:
        model = Visita
        fields = '__all__'
        read_only_fields = ['usuario', 'creado_en']


class PuntuacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puntuacion
        fields = '__all__'
        read_only_fields = ['usuario', 'fenomeno', 'creado_en']


class EnlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enlace
        fields = '__all__'
        read_only_fields = ['fenomeno', 'creado_en']
