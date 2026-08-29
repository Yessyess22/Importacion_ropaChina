import type { VarianteProductoResumen } from './catalogo'

export type EstadoPedido =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO'

export interface DetallePedido {
  id: number
  variante: number
  variante_detalle?: VarianteProductoResumen
  cantidad: number
  precio_unitario: string
}

export interface PedidoMayorista {
  id: number
  codigo_pedido: string
  cliente: number
  fecha: string
  estado: EstadoPedido
  created_at: string
  updated_at: string
  detalles: DetallePedido[]
}

export interface NuevoDetallePedido {
  variante: number
  cantidad: number
}

export interface NuevoPedido {
  cliente?: number
  detalles: NuevoDetallePedido[]
}
