"""Único punto de escritura de `VarianteProducto.stock_disponible`
(sección 22 del encargo): ningún serializer/view de otra app debe tocar
ese campo directamente, siempre pasa por aquí.
"""

from django.db import transaction

from config.exceptions import ConflictError

from .models import MovimientoInventario


def _aplicar_movimiento(variante, tipo, cantidad_delta, observacion="", origen=None):
    """`select_for_update` bloquea la fila de la variante durante la
    transacción para evitar condiciones de carrera cuando dos operaciones
    concurrentes (p. ej. dos pedidos) afectan el mismo stock (sección 41
    del encargo): nunca debe quedar `stock_disponible` negativo.
    """
    from apps.catalogo.models import VarianteProducto

    with transaction.atomic():
        variante_bloqueada = VarianteProducto.objects.select_for_update().get(pk=variante.pk)
        nuevo_stock = variante_bloqueada.stock_disponible + cantidad_delta
        if nuevo_stock < 0:
            # Checklist #13 (docs/10-PLAN_VALIDACIONES.md, Sprint 8): el
            # mensaje identifica la variante y la cantidad disponible para
            # que el frontend no tenga que adivinarlo ni repetir la
            # consulta de stock por su cuenta.
            raise ConflictError(
                f"Stock insuficiente para {variante_bloqueada}: disponible "
                f"{variante_bloqueada.stock_disponible}, solicitado {abs(cantidad_delta)}."
            )

        variante_bloqueada.stock_disponible = nuevo_stock
        variante_bloqueada.save(update_fields=["stock_disponible", "updated_at"])

        movimiento_kwargs = {
            "variante": variante_bloqueada,
            "tipo": tipo,
            "cantidad": cantidad_delta,
            "observacion": observacion,
        }
        if origen is not None:
            movimiento_kwargs["origen"] = origen
        MovimientoInventario.objects.create(**movimiento_kwargs)

    return variante_bloqueada


def registrar_entrada(variante, cantidad, observacion="", origen=None):
    return _aplicar_movimiento(variante, MovimientoInventario.Tipo.ENTRADA, cantidad, observacion, origen)


def registrar_salida(variante, cantidad, observacion="", origen=None):
    return _aplicar_movimiento(variante, MovimientoInventario.Tipo.SALIDA, -cantidad, observacion, origen)


def registrar_ajuste(variante, delta, observacion=""):
    return _aplicar_movimiento(variante, MovimientoInventario.Tipo.AJUSTE, delta, observacion)
