import uuid

from django.db import transaction
from django.utils import timezone

from apps.auditoria import services as auditoria_services
from apps.inventario import services as inventario_services
from config.exceptions import ConflictError

from .models import DetallePedido, PedidoMayorista

PEDIDO_TRANSICIONES_VALIDAS = {
    PedidoMayorista.Estado.PENDIENTE: {
        PedidoMayorista.Estado.CONFIRMADO,
        PedidoMayorista.Estado.CANCELADO,
    },
    PedidoMayorista.Estado.CONFIRMADO: {
        PedidoMayorista.Estado.EN_PREPARACION,
        PedidoMayorista.Estado.CANCELADO,
    },
    PedidoMayorista.Estado.EN_PREPARACION: {
        PedidoMayorista.Estado.ENVIADO,
        PedidoMayorista.Estado.CANCELADO,
    },
    PedidoMayorista.Estado.ENVIADO: {PedidoMayorista.Estado.ENTREGADO},
    PedidoMayorista.Estado.ENTREGADO: set(),
    PedidoMayorista.Estado.CANCELADO: set(),
}


def _generar_codigo_pedido():
    return f"PED-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:6].upper()}"


def crear_pedido(cliente, detalles_data, usuario):
    """Crea un pedido validando la cantidad mínima por modelo (RF-15) y
    reservando stock (sección 27) de forma atómica: si cualquier variante
    no tiene stock suficiente, o el mínimo por modelo no se cumple, no se
    crea nada (rollback completo, nunca una reserva parcial). El precio
    de cada línea se congela desde `VarianteProducto.precio_unitario` en
    este momento (sección 25: nunca se recalcula con el precio vigente).
    """
    with transaction.atomic():
        cantidades_por_prenda = {}
        for item in detalles_data:
            variante = item["variante"]
            cantidades_por_prenda[variante.prenda_id] = (
                cantidades_por_prenda.get(variante.prenda_id, 0) + item["cantidad"]
            )

        minimo = cliente.pedido_minimo_modelo
        for cantidad_total in cantidades_por_prenda.values():
            if cantidad_total < minimo:
                raise ConflictError(
                    f"La cantidad mínima por modelo es {minimo} unidades; uno de los "
                    f"modelos del pedido tiene solo {cantidad_total}."
                )

        pedido = PedidoMayorista.objects.create(
            codigo_pedido=_generar_codigo_pedido(), cliente=cliente, fecha=timezone.localdate()
        )

        for item in detalles_data:
            variante = item["variante"]
            cantidad = item["cantidad"]
            inventario_services.registrar_salida(
                variante, cantidad, observacion=f"Reserva pedido {pedido.codigo_pedido}"
            )
            DetallePedido.objects.create(
                pedido=pedido,
                variante=variante,
                cantidad=cantidad,
                precio_unitario=variante.precio_unitario,
            )

        auditoria_services.registrar(usuario, "crear_pedido", pedido)

    return pedido


def cambiar_estado_pedido(pedido, nuevo_estado, usuario):
    permitidos = PEDIDO_TRANSICIONES_VALIDAS.get(pedido.estado, set())
    if nuevo_estado not in permitidos:
        raise ConflictError(f"No se puede pasar de '{pedido.estado}' a '{nuevo_estado}'.")

    with transaction.atomic():
        estado_anterior = pedido.estado
        if nuevo_estado == PedidoMayorista.Estado.CANCELADO:
            # Cancelar libera la reserva de stock hecha al crear el pedido.
            for detalle in pedido.detalles.select_related("variante"):
                inventario_services.registrar_entrada(
                    detalle.variante,
                    detalle.cantidad,
                    observacion=f"Cancelación pedido {pedido.codigo_pedido}",
                )
        pedido.estado = nuevo_estado
        pedido.save(update_fields=["estado", "updated_at"])
        auditoria_services.registrar(
            usuario,
            "cambiar_estado_pedido",
            pedido,
            detalle={"estado_anterior": estado_anterior, "estado_nuevo": nuevo_estado},
        )
    return pedido
