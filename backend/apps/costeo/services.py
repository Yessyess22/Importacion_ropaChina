from decimal import Decimal

from django.db import transaction

from .models import Costeo, Tributo


def calcular_monto_tributo(base_imponible, porcentaje):
    """monto = base_imponible x porcentaje / 100 (RF-05).

    Es la única fórmula de tributos que el proyecto tiene confirmada: un
    porcentaje simple sobre una base imponible. La base imponible de cada
    tributo (p. ej. el CIF para el arancel, o CIF + arancel para el IVA si
    así lo define la política aduanera vigente) la ingresa quien registra
    el tributo; el sistema no asume una fórmula en cascada no confirmada
    por el proyecto (sección 19 del encargo).
    """

    return (base_imponible * porcentaje / Decimal("100")).quantize(Decimal("0.01"))


def crear_tributo(validated_data):
    validated_data["monto"] = calcular_monto_tributo(
        validated_data["base_imponible"], validated_data["porcentaje"]
    )
    return Tributo.objects.create(**validated_data)


def actualizar_tributo(tributo, validated_data):
    for campo, valor in validated_data.items():
        setattr(tributo, campo, valor)
    tributo.monto = calcular_monto_tributo(tributo.base_imponible, tributo.porcentaje)
    tributo.save()
    return tributo


def calcular_costeo(operacion):
    """Costo total de nacionalización = CIF + suma de tributos ya
    registrados (RF-04/RF-05)."""

    with transaction.atomic():
        costeo, _ = Costeo.objects.get_or_create(operacion=operacion)
        total_tributos = sum((t.monto for t in costeo.tributos.all()), Decimal("0"))
        costeo.costo_total = operacion.valor_cif + total_tributos
        costeo.save(update_fields=["costo_total", "fecha_calculo"])
    return costeo
