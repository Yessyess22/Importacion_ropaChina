/**
 * Cliente HTTP centralizado para /api/v1/ (sección 44 del encargo).
 *
 * Reutiliza el mismo esquema de autenticación de `authService.ts`
 * (sesión por cookie + `X-CSRFToken` en escrituras): no se introduce un
 * segundo mecanismo de auth para las rutas de negocio.
 */
const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const V1_URL = `${API_URL}/v1`

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isUnsafeMethod = Boolean(options.method) && options.method !== 'GET'
  const isFormData = options.body instanceof FormData

  const response = await fetch(`${V1_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

function toBody(data: unknown): BodyInit | undefined {
  if (data === undefined) return undefined
  return data instanceof FormData ? data : JSON.stringify(data)
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: toBody(data) }),
  patch: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PATCH', body: toBody(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
