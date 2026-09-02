from rest_framework import serializers

from apps.core.validators import (
    normalizar_nit,
    normalizar_telefono,
    normalizar_texto,
    validar_largo,
    validar_nit,
    validar_solo_texto,
    validar_telefono,
)

from .models import AgenteAduanal, ClienteMayorista, Proveedor, Transportista


class TerceroValidationMixin:
    """Checklist #1/#2/#3/#4 (docs/10-PLAN_VALIDACIONES.md, Sprint 6).

    Los 4 subtipos de Tercero (Proveedor, ClienteMayorista, AgenteAduanal,
    Transportista) heredan los mismos campos de la clase abstracta
    `Tercero` (`razon_social`, `nit`, `telefono`, `email`), así que
    comparten también su validación mediante este mixin en vez de
    repetirla en cada serializer.
    """

    def validate_razon_social(self, value):
        value = normalizar_texto(value)
        validar_largo(value, minimo=2, maximo=100)
        validar_solo_texto(value)
        return value

    def validate_nit(self, value):
        value = normalizar_nit(value)
        validar_nit(value)
        # El `UniqueValidator` automático de DRF (por `unique=True` en el
        # modelo) compara contra el valor crudo enviado por el cliente,
        # antes de esta normalización — dos NIT que solo difieren en
        # espacios/guiones no lo activarían y llegarían al `save()` como
        # un `IntegrityError` en vez de un error de validación legible.
        # Se repite la comprobación aquí ya sobre el valor normalizado.
        modelo = self.Meta.model
        queryset = modelo.objects.filter(nit=value)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Ya existe un registro con este NIT.")
        return value

    def validate_telefono(self, value):
        if not value:
            return value
        value = normalizar_telefono(value)
        validar_telefono(value)
        return value

    def validate_email(self, value):
        # Checklist #4: se guarda siempre en minúsculas.
        return value.lower()


class ProveedorSerializer(TerceroValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = [
            "id",
            "razon_social",
            "nit",
            "telefono",
            "email",
            "direccion",
            "activo",
            "fabrica",
            "ciudad_origen",
            "pais",
        ]


class ClienteMayoristaSerializer(TerceroValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = ClienteMayorista
        fields = [
            "id",
            "razon_social",
            "nit",
            "telefono",
            "email",
            "direccion",
            "activo",
            "tipo_negocio",
            "pedido_minimo_modelo",
            "usuario",
        ]
        # `usuario` (vínculo con la cuenta de acceso al portal) se
        # administra desde Django Admin, no desde esta API: permitir su
        # escritura aquí abriría la puerta a que un cliente reasigne su
        # registro a otra cuenta.
        read_only_fields = ["usuario"]


class AgenteAduanalSerializer(TerceroValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = AgenteAduanal
        fields = [
            "id",
            "razon_social",
            "nit",
            "telefono",
            "email",
            "direccion",
            "activo",
            "numero_registro",
        ]


class TransportistaSerializer(TerceroValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Transportista
        fields = [
            "id",
            "razon_social",
            "nit",
            "telefono",
            "email",
            "direccion",
            "activo",
            "tipo_transporte",
        ]
