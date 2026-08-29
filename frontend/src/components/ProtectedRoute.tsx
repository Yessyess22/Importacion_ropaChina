import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/auth'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: Role[]
}

/**
 * Protección de UX en el frontend: redirige si no hay sesión o el rol no
 * está permitido. No es la fuente de seguridad real — Django vuelve a
 * validar autenticación y permisos en cada endpoint.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth()

  if (isLoading) {
    return <p className="p-8 text-center text-muted-foreground">Cargando...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
