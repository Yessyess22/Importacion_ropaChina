from rest_framework import serializers

from .models import AgenteAduanal, ClienteMayorista, Proveedor, Transportista


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = [
            "id", "razon_social", "nit", "telefono", "email", "direccion",
            "activo", "fabrica", "ciudad_origen", "pais",
        ]


class ClienteMayoristaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClienteMayorista
        fields = [
            "id", "razon_social", "nit", "telefono", "email", "direccion",
            "activo", "tipo_negocio", "pedido_minimo_modelo", "usuario",
        ]
        # `usuario` (vínculo con la cuenta de acceso al portal) se
        # administra desde Django Admin, no desde esta API: permitir su
        # escritura aquí abriría la puerta a que un cliente reasigne su
        # registro a otra cuenta.
        read_only_fields = ["usuario"]


class AgenteAduanalSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgenteAduanal
        fields = [
            "id", "razon_social", "nit", "telefono", "email", "direccion",
            "activo", "numero_registro",
        ]


class TransportistaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transportista
        fields = [
            "id", "razon_social", "nit", "telefono", "email", "direccion",
            "activo", "tipo_transporte",
        ]
