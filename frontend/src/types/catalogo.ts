export type EstadoVariante = 'BORRADOR' | 'PUBLICADO' | 'DESCONTINUADO'

export interface VarianteProductoResumen {
  id: number
  talla: string
  color: string
  precio_unitario: string
  stock_disponible: number
  estado: EstadoVariante
}

export interface VarianteProducto extends VarianteProductoResumen {
  prenda: number
  created_at: string
  updated_at: string
}

export interface Prenda {
  id: number
  codigo_modelo: string
  nombre: string
  categoria: string
  temporada: string
  coleccion: string
  descripcion: string
  activo: boolean
  created_at: string
  updated_at: string
  variantes: VarianteProductoResumen[]
}
