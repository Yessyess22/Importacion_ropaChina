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


def actualizar_detalles_pedido(pedido, detalles_data, usuario):
    """Reemplaza el conjunto de líneas de un pedido PENDIENTE por el
    carrito final enviado, ajustando la reserva de stock por la
    diferencia (nunca tocando `stock_disponible` a mano, sección 22:
    siempre vía `inventario_services`). Revalida el mínimo por modelo
    sobre el resultado final, igual que `crear_pedido`; si falla, la
    transacción completa (incluidos los movimientos de stock ya
    aplicados) se revierte.
    """
    if pedido.estado != PedidoMayorista.Estado.PENDIENTE:
        raise ConflictError("Solo se puede editar un pedido mientras está Pendiente.")

    with transaction.atomic():
        detalles_actuales = {d.variante_id: d for d in pedido.detalles.select_related("variante")}
        cantidades_nuevas = {item["variante"].id: item["cantidad"] for item in detalles_data}
        variantes_por_id = {item["variante"].id: item["variante"] for item in detalles_data}

        # Líneas quitadas: liberar la reserva completa y borrar el detalle.
        for variante_id, detalle in list(detalles_actuales.items()):
            if variante_id not in cantidades_nuevas:
                inventario_services.registrar_entrada(
                    detalle.variante,
                    detalle.cantidad,
                    observacion=f"Edición pedido {pedido.codigo_pedido}: línea eliminada",
                )
                detalle.delete()

        # Líneas nuevas o con cantidad modificada.
        for variante_id, cantidad_nueva in cantidades_nuevas.items():
            detalle_existente = detalles_actuales.get(variante_id)
            if detalle_existente is None:
                variante = variantes_por_id[variante_id]
                inventario_services.registrar_salida(
                    variante,
                    cantidad_nueva,
                    observacion=f"Edición pedido {pedido.codigo_pedido}: línea nueva",
                )
                DetallePedido.objects.create(
                    pedido=pedido,
                    variante=variante,
                    cantidad=cantidad_nueva,
                    precio_unitario=variante.precio_unitario,
                )
            elif cantidad_nueva != detalle_existente.cantidad:
                delta = cantidad_nueva - detalle_existente.cantidad
                observacion = f"Edición pedido {pedido.codigo_pedido}: ajuste de cantidad"
                if delta > 0:
                    inventario_services.registrar_salida(
                        detalle_existente.variante, delta, observacion=observacion
                    )
                else:
                    inventario_services.registrar_entrada(
                        detalle_existente.variante, -delta, observacion=observacion
                    )
                detalle_existente.cantidad = cantidad_nueva
                detalle_existente.save(update_fields=["cantidad"])

        cantidades_por_prenda = {}
        for detalle in pedido.detalles.select_related("variante"):
            cantidades_por_prenda[detalle.variante.prenda_id] = (
                cantidades_por_prenda.get(detalle.variante.prenda_id, 0) + detalle.cantidad
            )
        minimo = pedido.cliente.pedido_minimo_modelo
        for cantidad_total in cantidades_por_prenda.values():
            if cantidad_total < minimo:
                raise ConflictError(
                    f"La cantidad mínima por modelo es {minimo} unidades; uno de los "
                    f"modelos del pedido tiene solo {cantidad_total}."
                )

        auditoria_services.registrar(usuario, "actualizar_detalles_pedido", pedido)

        # `pedido` puede venir con `detalles` ya cacheado por el
        # `prefetch_related` de la vista (`get_object()` se llamó antes de
        # estas mutaciones); `refresh_from_db()` limpia ese caché para que
        # el serializer de la respuesta refleje las líneas recién editadas,
        # no las que había al inicio de la request.
        pedido.refresh_from_db()

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
