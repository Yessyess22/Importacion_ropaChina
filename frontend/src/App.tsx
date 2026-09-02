import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { BarChart3, Building2, Layers, Package, Ship, ShoppingCart, UserCheck } from 'lucide-react'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'
import { Login } from '@/pages/Login'
import { Usuarios } from '@/pages/admin/Usuarios'
import { Proveedores } from '@/pages/terceros/Proveedores'
import { ClientesMayoristas } from '@/pages/terceros/ClientesMayoristas'
import { AgentesAduanales } from '@/pages/terceros/AgentesAduanales'
import { Importaciones } from '@/pages/importaciones/Importaciones'
import { DetalleImportacion } from '@/pages/importaciones/DetalleImportacion'
import { Costeo } from '@/pages/costeo/Costeo'
import { TipoCambio } from '@/pages/costeo/TipoCambio'
import { Documentos } from '@/pages/documentos/Documentos'
import { NuevaImportacion } from '@/pages/importaciones/NuevaImportacion'
import { Catalogo } from '@/pages/catalogo/Catalogo'
import { NuevoPedido } from '@/pages/pedidos/NuevoPedido'
import { Pedidos } from '@/pages/pedidos/Pedidos'
import { PedidoDetalle } from '@/pages/pedidos/PedidoDetalle'
import { Stock } from '@/pages/inventario/Stock'
import { Reportes } from '@/pages/reportes/Reportes'
import { Auditoria } from '@/pages/auditoria/Auditoria'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/auth'

const ADMINISTRADOR: Role = 'Administrador'
const OPERADOR: Role = 'Operador de Comercio Exterior'
const AGENTE_ADUANAL: Role = 'Agente Aduanal'
const CONTABILIDAD: Role = 'Contabilidad'
const CLIENTE_MAYORISTA: Role = 'Cliente Mayorista'

const STAT_CARDS = [
  { label: 'Stock Activo', value: '—', icon: Package, color: 'text-primary' },
  { label: 'Importaciones', value: '—', icon: Ship, color: 'text-sky-600' },
  { label: 'Pedidos Pendientes', value: '—', icon: ShoppingCart, color: 'text-amber-600' },
  { label: 'Reportes', value: '—', icon: BarChart3, color: 'text-purple-600' },
] as const

const QUICK_LINKS = [
  { label: 'Gestión de Proveedores', href: '/proveedores', icon: Building2, desc: 'Administra tus proveedores chinos' },
  { label: 'Clientes Mayoristas', href: '/clientes-mayoristas', icon: UserCheck, desc: 'Base de clientes activos' },
  { label: 'Stock', href: '/stock', icon: Layers, desc: 'Estado del inventario' },
] as const

function Dashboard() {
  const { user, role } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      {/* Banner de bienvenida */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary/90 to-primary/70 p-8 text-primary-foreground shadow-lg">
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-75">Bienvenido de vuelta</p>
          <h1 className="mt-1 text-3xl font-bold">
            {user?.first_name ? `¡Hola, ${user.first_name}!` : 'Panel de Control'}
          </h1>
          <p className="mt-1.5 text-sm opacity-60">{role} · Trendy Import SRL</p>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -right-4 h-56 w-56 rounded-full bg-white/5" />
      </div>

      {/* Cards de métricas (placeholder) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </span>
                <Icon className={cn('size-4', card.color)} />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">Disponible en Sprint 2</p>
            </div>
          )
        })}
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-secondary hover:shadow-sm"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
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
              <Usuarios />
            </ProtectedRoute>
          }
        />

        <Route
          path="proveedores"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL]}>
              <Proveedores />
            </ProtectedRoute>
          }
        />

        <Route
          path="clientes-mayoristas"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR]}>
              <ClientesMayoristas />
            </ProtectedRoute>
          }
        />

        <Route
          path="agentes-aduanales"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL]}>
              <AgentesAduanales />
            </ProtectedRoute>
          }
        />

        <Route
          path="catalogo"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, CLIENTE_MAYORISTA]}>
              <Catalogo />
            </ProtectedRoute>
          }
        />

        <Route
          path="importaciones"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL, CONTABILIDAD]}>
              <Importaciones />
            </ProtectedRoute>
          }
        />

        <Route
          path="importaciones/nueva"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR]}>
              <NuevaImportacion />
            </ProtectedRoute>
          }
        />

        <Route
          path="importaciones/:id"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL, CONTABILIDAD]}>
              <DetalleImportacion />
            </ProtectedRoute>
          }
        />

        <Route
          path="documentos"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, AGENTE_ADUANAL]}>
              <Documentos />
            </ProtectedRoute>
          }
        />

        <Route
          path="costeo"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, CONTABILIDAD]}>
              <Costeo />
            </ProtectedRoute>
          }
        />

        <Route
          path="tipo-cambio"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, CONTABILIDAD]}>
              <TipoCambio />
            </ProtectedRoute>
          }
        />

        <Route
          path="stock"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL, CONTABILIDAD]}>
              <Stock />
            </ProtectedRoute>
          }
        />

        <Route
          path="pedidos"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, CONTABILIDAD, CLIENTE_MAYORISTA]}>
              <Pedidos />
            </ProtectedRoute>
          }
        />

        <Route
          path="pedidos/nuevo"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, CLIENTE_MAYORISTA]}>
              <NuevoPedido />
            </ProtectedRoute>
          }
        />

        <Route
          path="pedidos/:id"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, CONTABILIDAD, CLIENTE_MAYORISTA]}>
              <PedidoDetalle />
            </ProtectedRoute>
          }
        />

        <Route
          path="reportes"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, CONTABILIDAD]}>
              <Reportes />
            </ProtectedRoute>
          }
        />

        <Route
          path="auditoria"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR]}>
              <Auditoria />
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
