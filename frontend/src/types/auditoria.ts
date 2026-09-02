export interface Bitacora {
  id: number
  usuario: number | null
  usuario_repr: string
  accion: string
  entidad_tipo: string | null
  entidad_object_id: number | null
  detalle: Record<string, unknown>
  fecha_hora: string
}
