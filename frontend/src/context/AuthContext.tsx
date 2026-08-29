import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { authService } from '@/services/authService'
import type { AuthUser, LoginCredentials } from '@/types/auth'

interface AuthContextValue {
  user: AuthUser | null
  role: AuthUser['role'] | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    authService.me().then((current) => {
      setUser(current)
      setIsLoading(false)
    })
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const authenticatedUser = await authService.login(credentials)
    setUser(authenticatedUser)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
