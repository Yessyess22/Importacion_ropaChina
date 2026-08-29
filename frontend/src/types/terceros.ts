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
