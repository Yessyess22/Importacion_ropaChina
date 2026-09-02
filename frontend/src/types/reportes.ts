import type { EstadoOperacionImportacion } from './importaciones'
import type { EstadoPedido } from './pedidos'

export interface ResumenImportacionPorEstado {
  estado: EstadoOperacionImportacion
  cantidad: number
  total_cif: string | null
}

export interface ReporteImportacionesResponse {
  por_estado: ResumenImportacionPorEstado[]
}

export interface ResumenPedidoPorEstado {
  estado: EstadoPedido
  cantidad: number
}

export interface ReportePedidosResponse {
  por_estado: ResumenPedidoPorEstado[]
}
