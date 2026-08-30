from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import Rol, Usuario


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


class UsuarioWriteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    rol = serializers.SlugRelatedField(
        slug_field="nombre",
        queryset=Rol.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Usuario
        fields = ["username", "first_name", "last_name", "email", "password", "rol", "is_active"]

    def create(self, validated_data):
        raw_password = validated_data.pop("password", None) or None
        validated_data["password"] = make_password(raw_password) if raw_password else make_password(None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        raw_password = validated_data.pop("password", None) or None
        if raw_password:
            validated_data["password"] = make_password(raw_password)
        return super().update(instance, validated_data)
