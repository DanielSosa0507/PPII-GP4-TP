from rest_framework import serializers
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'rol', 'foto_perfil', 'bio']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = Usuario.objects.create_user(**validated_data)
        return user
