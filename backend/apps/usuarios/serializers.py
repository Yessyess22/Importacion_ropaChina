from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Rol, Usuario

USERNAME_LARGO_MINIMO = 4


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

    def validate_email(self, value):
        # Checklist #4: se guarda siempre en minúsculas, igual que
        # `TerceroValidationMixin.validate_email` (apps/terceros/serializers.py).
        return value.lower()

    def validate_username(self, value):
        # Checklist #5: sin espacios ya lo impone `UnicodeUsernameValidator`
        # (heredado de AbstractUser); aquí se suma el largo mínimo.
        if len(value) < USERNAME_LARGO_MINIMO:
            raise serializers.ValidationError(
                f"El usuario debe tener al menos {USERNAME_LARGO_MINIMO} caracteres."
            )
        return value

    def validate_password(self, value):
        # Checklist #5: contraseña fuerte. Vacío/ausente es intencional
        # (create sin password = cuenta con password inutilizable hasta que
        # se le asigne una; update sin password = conserva la actual), así
        # que solo se valida fuerza cuando el cliente sí envía una.
        if not value:
            return value
        usuario_tentativo = self.instance or Usuario(
            username=self.initial_data.get("username", ""),
            email=self.initial_data.get("email", ""),
        )
        try:
            django_validate_password(value, user=usuario_tentativo)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def create(self, validated_data):
        raw_password = validated_data.pop("password", None) or None
        validated_data["password"] = make_password(raw_password) if raw_password else make_password(None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        raw_password = validated_data.pop("password", None) or None
        if raw_password:
            validated_data["password"] = make_password(raw_password)
        return super().update(instance, validated_data)
