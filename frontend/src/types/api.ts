export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface UsuarioAdmin {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  rol_nombre: string | null
  is_active: boolean
}
