from rest_framework import serializers

from .models import Usuario


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class UsuarioMeSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="rol.nombre", default=None, read_only=True)

    class Meta:
        model = Usuario
        fields = ["id", "username", "email", "first_name", "last_name", "role"]
        read_only_fields = fields


class UsuarioListSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source="rol.nombre", default=None, read_only=True)

    class Meta:
        model = Usuario
        fields = ["id", "username", "first_name", "last_name", "email", "rol_nombre", "is_active"]
        read_only_fields = fields
