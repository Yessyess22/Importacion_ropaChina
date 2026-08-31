export type TipoDocumento = 'FACTURA' | 'BL' | 'PACKING_LIST' | 'CERTIFICADO_ORIGEN' | 'OTRO'

export interface Documento {
  id: number
  operacion: number
  tipo: TipoDocumento
  nombre: string
  archivo: string | null
  fecha_emision: string | null
  created_at: string
}
