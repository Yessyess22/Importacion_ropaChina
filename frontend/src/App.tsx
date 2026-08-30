import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'
import { Login } from '@/pages/Login'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/auth'

const ADMINISTRADOR: Role = 'Administrador'
const OPERADOR: Role = 'Operador de Comercio Exterior'
const AGENTE_ADUANAL: Role = 'Agente Aduanal'
const CONTABILIDAD: Role = 'Contabilidad'
const CLIENTE_MAYORISTA: Role = 'Cliente Mayorista'

function Dashboard() {
  const { user, role } = useAuth()

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Bienvenido, <strong>{user?.first_name || user?.username}</strong> — {role}
      </p>
    </div>
  )
}

function ModulePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">Módulo en desarrollo.</p>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        <Route
          path="usuarios"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR]}>
              <ModulePlaceholder title="Usuarios" />
            </ProtectedRoute>
          }
        />

        <Route
          path="proveedores"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL]}>
              <ModulePlaceholder title="Proveedores" />
            </ProtectedRoute>
          }
        />

        <Route
          path="clientes-mayoristas"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR]}>
              <ModulePlaceholder title="Clientes Mayoristas" />
            </ProtectedRoute>
          }
        />

        <Route
          path="agentes-aduanales"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL]}>
              <ModulePlaceholder title="Agentes Aduanales" />
            </ProtectedRoute>
          }
        />

        <Route
          path="catalogo"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, CLIENTE_MAYORISTA]}>
              <ModulePlaceholder title="Catálogo" />
            </ProtectedRoute>
          }
        />

        <Route
          path="importaciones"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL, CONTABILIDAD]}>
              <ModulePlaceholder title="Importaciones" />
            </ProtectedRoute>
          }
        />

        <Route
          path="documentos"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, AGENTE_ADUANAL]}>
              <ModulePlaceholder title="Documentos" />
            </ProtectedRoute>
          }
        />

        <Route
          path="costeo"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, CONTABILIDAD]}>
              <ModulePlaceholder title="Costeo" />
            </ProtectedRoute>
          }
        />

        <Route
          path="stock"
          element={
            <ProtectedRoute
              allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL, CONTABILIDAD, CLIENTE_MAYORISTA]}
            >
              <ModulePlaceholder title="Stock" />
            </ProtectedRoute>
          }
        />

        <Route
          path="pedidos"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, CONTABILIDAD, CLIENTE_MAYORISTA]}>
              <ModulePlaceholder title="Pedidos" />
            </ProtectedRoute>
          }
        />

        <Route
          path="reportes"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL, CONTABILIDAD]}>
              <ModulePlaceholder title="Reportes" />
            </ProtectedRoute>
          }
        />

        <Route
          path="auditoria"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR]}>
              <ModulePlaceholder title="Bitácora" />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
