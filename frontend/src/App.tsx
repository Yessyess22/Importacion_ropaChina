import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthProvider } from '@/context/AuthContext'
import { useAuth } from '@/hooks/useAuth'
import { Login } from '@/pages/Login'
import type { Role } from '@/types/auth'

const ADMINISTRADOR: Role = 'Administrador'
const OPERADOR: Role = 'Operador de Comercio Exterior'
const AGENTE_ADUANAL: Role = 'Agente Aduanal'
const CONTABILIDAD: Role = 'Contabilidad'
const CLIENTE_MAYORISTA: Role = 'Cliente Mayorista'

function ModulePlaceholder({ title }: { title: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background p-8 text-foreground">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">Módulo de negocio — se implementará en la Fase 4.</p>
    </main>
  )
}

function Dashboard() {
  const { user, role, logout } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-foreground">
      <h1 className="text-3xl font-bold">Trendy Import SRL</h1>
      <p className="text-muted-foreground">
        Sesión iniciada como <strong>{user?.username}</strong> ({role})
      </p>
      <Button onClick={() => logout()}>Cerrar sesión</Button>
    </main>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR]}>
            <ModulePlaceholder title="Usuarios" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditoria"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR]}>
            <ModulePlaceholder title="Bitácora" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL, CONTABILIDAD]}>
            <ModulePlaceholder title="Reportes" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/catalogo"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, CLIENTE_MAYORISTA]}>
            <ModulePlaceholder title="Catálogo" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proveedores"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL]}>
            <ModulePlaceholder title="Proveedores" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/importaciones"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL, CONTABILIDAD]}>
            <ModulePlaceholder title="Importaciones" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute
            allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL, CONTABILIDAD, CLIENTE_MAYORISTA]}
          >
            <ModulePlaceholder title="Stock" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/documentos"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR, AGENTE_ADUANAL]}>
            <ModulePlaceholder title="Documentos" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/despachos"
        element={
          <ProtectedRoute allowedRoles={[AGENTE_ADUANAL]}>
            <ModulePlaceholder title="Despachos" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/costeo"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR, CONTABILIDAD]}>
            <ModulePlaceholder title="Costeo" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributos"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR, CONTABILIDAD]}>
            <ModulePlaceholder title="Tributos" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tipo-cambio"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR, CONTABILIDAD]}>
            <ModulePlaceholder title="Tipo de cambio" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pedidos"
        element={
          <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, CONTABILIDAD, CLIENTE_MAYORISTA]}>
            <ModulePlaceholder title="Pedidos" />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
