export type TipoTributo = 'ARANCEL' | 'IVA'

export interface Tributo {
  id: number
  costeo: number
  tipo: TipoTributo
  partida_arancelaria: string
  base_imponible: string
  porcentaje: string
  monto: string
}

export interface Costeo {
  id: number
  operacion: number
  costo_total: string
  fecha_calculo: string
  observaciones: string
  tributos: Tributo[]
}

export interface TipoCambio {
  id: number
  fecha: string
  valor: string
  created_at: string
}
