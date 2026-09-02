from rest_framework import serializers

from apps.core.validators import validar_fecha_no_futura

from .models import Costeo, TipoCambio, Tributo


class TributoNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tributo
        fields = ["id", "tipo", "partida_arancelaria", "base_imponible", "porcentaje", "monto"]


class TributoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tributo
        fields = ["id", "costeo", "tipo", "partida_arancelaria", "base_imponible", "porcentaje", "monto"]
        # `monto` siempre lo calcula `services.calcular_monto_tributo`
        # (RF-05): nunca se acepta el valor enviado por el cliente.
        read_only_fields = ["monto"]


class CosteoSerializer(serializers.ModelSerializer):
    tributos = TributoNestedSerializer(many=True, read_only=True)

    class Meta:
        model = Costeo
        fields = ["id", "operacion", "costo_total", "fecha_calculo", "observaciones", "tributos"]
        read_only_fields = ["costo_total", "fecha_calculo"]


class TipoCambioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoCambio
        fields = ["id", "fecha", "valor", "created_at"]

    def validate_fecha(self, value):
        validar_fecha_no_futura(value)
        return value
