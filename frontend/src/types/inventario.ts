export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE'

export interface MovimientoInventario {
  id: number
  variante: number
  tipo: TipoMovimiento
  cantidad: number
  observacion: string
  fecha: string
}
