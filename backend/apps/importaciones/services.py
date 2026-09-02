from django.db import transaction

from apps.auditoria import services as auditoria_services
from apps.inventario import services as inventario_services
from config.exceptions import ConflictError

from .models import OperacionImportacion

TRANSICIONES_VALIDAS = {
    OperacionImportacion.Estado.REGISTRADA: {
        OperacionImportacion.Estado.EN_TRANSITO,
        OperacionImportacion.Estado.CANCELADA,
    },
    OperacionImportacion.Estado.EN_TRANSITO: {
        OperacionImportacion.Estado.EN_ADUANA,
        OperacionImportacion.Estado.CANCELADA,
    },
    OperacionImportacion.Estado.EN_ADUANA: {
        OperacionImportacion.Estado.LIBERADA,
        OperacionImportacion.Estado.CANCELADA,
    },
    OperacionImportacion.Estado.LIBERADA: set(),
    OperacionImportacion.Estado.CANCELADA: set(),
}


def calcular_cif(valor_fob, valor_flete, valor_seguro):
    """CIF = FOB + Flete + Seguro (RF-04). Único lugar donde se calcula:
    el backend es la autoridad de este cálculo, nunca se confía en un
    `valor_cif` enviado por el cliente HTTP (sección 17 del encargo)."""

    return valor_fob + valor_flete + valor_seguro


def crear_operacion(validated_data, usuario):
    valor_cif = calcular_cif(
        validated_data["valor_fob"], validated_data["valor_flete"], validated_data["valor_seguro"]
    )
    with transaction.atomic():
        operacion = OperacionImportacion.objects.create(**validated_data, valor_cif=valor_cif)
        auditoria_services.registrar(usuario, "crear_importacion", operacion)
    return operacion


def actualizar_operacion(operacion, validated_data, usuario):
    if operacion.estado in (OperacionImportacion.Estado.LIBERADA, OperacionImportacion.Estado.CANCELADA):
        raise ConflictError("No se puede editar una operación liberada o cancelada.")

    for campo, valor in validated_data.items():
        setattr(operacion, campo, valor)
    operacion.valor_cif = calcular_cif(operacion.valor_fob, operacion.valor_flete, operacion.valor_seguro)
    operacion.save()
    auditoria_services.registrar(usuario, "actualizar_importacion", operacion)
    return operacion


def cambiar_estado(operacion, nuevo_estado, usuario):
    permitidos = TRANSICIONES_VALIDAS.get(operacion.estado, set())
    if nuevo_estado not in permitidos:
        raise ConflictError(f"No se puede pasar de '{operacion.estado}' a '{nuevo_estado}'.")

    with transaction.atomic():
        estado_anterior = operacion.estado
        operacion.estado = nuevo_estado
        operacion.save(update_fields=["estado", "updated_at"])

        if nuevo_estado == OperacionImportacion.Estado.LIBERADA:
            # RF-08/RF-09: la liberación aduanera es el punto en que la
            # mercadería realmente ingresa a stock; se genera una entrada
            # de inventario por cada línea de la operación.
            for detalle in operacion.detalles.select_related("variante"):
                inventario_services.registrar_entrada(
                    detalle.variante,
                    detalle.cantidad,
                    observacion=f"Liberación aduanera {operacion.codigo_unico}",
                    origen=detalle,
                )

        auditoria_services.registrar(
            usuario,
            "cambiar_estado_importacion",
            operacion,
            detalle={"estado_anterior": estado_anterior, "estado_nuevo": nuevo_estado},
        )
    return operacion
