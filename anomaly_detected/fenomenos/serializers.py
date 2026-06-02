from rest_framework import serializers
from .models import Fenomeno, Validacion

class FenomenoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fenomeno
        fields = '__all__'
        read_only_fields = ['creado_por', 'creado_en']

class ValidacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Validacion
        fields = '__all__'
        read_only_fields = ['usuario', 'creado_en']
