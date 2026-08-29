export type Role =
  | 'Administrador'
  | 'Operador de Comercio Exterior'
  | 'Agente Aduanal'
  | 'Contabilidad'
  | 'Cliente Mayorista'

export interface AuthUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: Role | null
}

export interface LoginCredentials {
  username: string
  password: string
}
