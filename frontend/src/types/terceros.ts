export interface Proveedor {
  id: number
  razon_social: string
  nit: string
  telefono: string
  email: string
  direccion: string
  activo: boolean
  fabrica: string
  ciudad_origen: string
  pais: string
}

export interface ClienteMayorista {
  id: number
  razon_social: string
  nit: string
  telefono: string
  email: string
  direccion: string
  activo: boolean
  tipo_negocio: string
  pedido_minimo_modelo: number
  usuario: number | null
}

export interface AgenteAduanal {
  id: number
  razon_social: string
  nit: string
  telefono: string
  email: string
  direccion: string
  activo: boolean
  numero_registro: string
}

export type TipoTransporte = 'MARITIMO' | 'AEREO' | 'TERRESTRE'

export interface Transportista {
  id: number
  razon_social: string
  nit: string
  telefono: string
  email: string
  direccion: string
  activo: boolean
  tipo_transporte: TipoTransporte | ''
}
