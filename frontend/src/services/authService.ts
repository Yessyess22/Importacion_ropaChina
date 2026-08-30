import type { AuthUser, LoginCredentials } from '@/types/auth'

// Auth endpoints viven en /api/auth/ — ruta fija del backend, no versionada bajo /api/v1/
const AUTH_BASE = '/api/auth'

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isUnsafeMethod = Boolean(options.method) && options.method !== 'GET'

  const response = await fetch(`${AUTH_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(isUnsafeMethod ? { 'X-CSRFToken': getCsrfToken() } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail ?? 'Error de comunicación con el servidor.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const data = await request<{ user: AuthUser }>('/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    return data.user
  },

  async logout(): Promise<void> {
    await request<void>('/logout/', { method: 'POST' })
  },

  async me(): Promise<AuthUser | null> {
    try {
      return await request<AuthUser>('/me/')
    } catch {
      return null
    }
  },
}
