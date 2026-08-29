import type { VarianteProductoResumen } from './catalogo'

export type EstadoOperacionImportacion =
  | 'REGISTRADA'
  | 'EN_TRANSITO'
  | 'EN_ADUANA'
  | 'LIBERADA'
  | 'CANCELADA'

export interface DetalleImportacion {
  id: number
  operacion: number
  variante: number
  variante_detalle?: VarianteProductoResumen
  cantidad: number
  costo_unitario_fob: string
}

export interface OperacionImportacion {
  id: number
  codigo_unico: string
  proveedor: number
  agente_aduanal: number | null
  transportista: number | null
  fecha_registro: string
  estado: EstadoOperacionImportacion
  valor_fob: string
  valor_flete: string
  valor_seguro: string
  valor_cif: string
  ruta_ingreso: string
  created_at: string
  updated_at: string
  detalles: DetalleImportacion[]
}
