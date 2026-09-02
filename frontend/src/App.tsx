import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Package,
  Ship,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AuthProvider } from '@/context/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'
import { Login } from '@/pages/Login'
import { Usuarios } from '@/pages/admin/Usuarios'
import { Proveedores } from '@/pages/terceros/Proveedores'
import { ClientesMayoristas } from '@/pages/terceros/ClientesMayoristas'
import { AgentesAduanales } from '@/pages/terceros/AgentesAduanales'
import { Transportistas } from '@/pages/terceros/Transportistas'
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
import { api } from '@/services/api'
import { cn } from '@/lib/utils'
import type { PaginatedResponse } from '@/types/api'
import type { Role } from '@/types/auth'
import type { VarianteProducto } from '@/types/catalogo'
import type { OperacionImportacion } from '@/types/importaciones'
import type { PedidoMayorista } from '@/types/pedidos'
import type { ReporteImportacionesResponse, ReportePedidosResponse } from '@/types/reportes'
import { formatCurrency, formatDate, formatEstado } from '@/utils/formatters'

const ADMINISTRADOR: Role = 'Administrador'
const OPERADOR: Role = 'Operador de Comercio Exterior'
const AGENTE_ADUANAL: Role = 'Agente Aduanal'
const CONTABILIDAD: Role = 'Contabilidad'
const CLIENTE_MAYORISTA: Role = 'Cliente Mayorista'

type DashboardState = {
  stockDisponible: number
  stockCritico: number
  importacionesActivas: number
  pedidosPendientes: number
  cifTotal: number
  alertasStock: Array<VarianteProducto>
  ultimasImportaciones: OperacionImportacion[]
  ultimosPedidos: PedidoMayorista[]
}

const EMPTY_DASHBOARD: DashboardState = {
  stockDisponible: 0,
  stockCritico: 0,
  importacionesActivas: 0,
  pedidosPendientes: 0,
  cifTotal: 0,
  alertasStock: [],
  ultimasImportaciones: [],
  ultimosPedidos: [],
}

function Dashboard() {
  const { user, role } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboard, setDashboard] = useState<DashboardState>(EMPTY_DASHBOARD)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        const [variantesRes, importacionesReportRes, pedidosReportRes, importacionesRes, pedidosRes] = await Promise.all([
          api.get<PaginatedResponse<VarianteProducto>>('/variantes/?page_size=100'),
          api.get<ReporteImportacionesResponse>('/reportes/importaciones/'),
          api.get<ReportePedidosResponse>('/reportes/pedidos/'),
          api.get<PaginatedResponse<OperacionImportacion>>('/importaciones/?page_size=5'),
          api.get<PaginatedResponse<PedidoMayorista>>('/pedidos/?page_size=5'),
        ])

        if (cancelled) return

        const variantes = variantesRes.results ?? []
        const importacionesPorEstado = importacionesReportRes.por_estado ?? []
        const pedidosPorEstado = pedidosReportRes.por_estado ?? []

        const stockDisponible = variantes.reduce((total, item) => total + item.stock_disponible, 0)
        const alertasStock = variantes
          .filter((item) => item.stock_disponible <= 5)
          .sort((a, b) => a.stock_disponible - b.stock_disponible)
          .slice(0, 5)

        const totalCif = importacionesPorEstado.reduce(
          (total, item) => total + Number(item.total_cif ?? 0),
          0,
        )

        const importacionesActivas = importacionesPorEstado.reduce((total, item) => {
          if (item.estado === 'CANCELADA') return total
          return total + item.cantidad
        }, 0)

        const pedidosPendientes = pedidosPorEstado.reduce((total, item) => {
          if (['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION'].includes(item.estado)) {
            return total + item.cantidad
          }
          return total
        }, 0)

        setDashboard({
          stockDisponible,
          stockCritico: alertasStock.length,
          importacionesActivas,
          pedidosPendientes,
          cifTotal: totalCif,
          alertasStock,
          ultimasImportaciones: importacionesRes.results ?? [],
          ultimosPedidos: pedidosRes.results ?? [],
        })
      } catch {
        if (!cancelled) {
          setDashboard(EMPTY_DASHBOARD)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  const metricCards = [
    {
      label: 'Stock Activo',
      value: isLoading ? '—' : dashboard.stockDisponible.toLocaleString('es-BO'),
      detail: dashboard.stockCritico > 0 ? `${dashboard.stockCritico} variantes en alerta` : 'Sin alertas de stock',
      icon: Package,
      color: 'text-primary',
    },
    {
      label: 'Importaciones',
      value: isLoading ? '—' : dashboard.importacionesActivas.toLocaleString('es-BO'),
      detail: 'Operaciones activas',
      icon: Ship,
      color: 'text-sky-600',
    },
    {
      label: 'Pedidos Pendientes',
      value: isLoading ? '—' : dashboard.pedidosPendientes.toLocaleString('es-BO'),
      detail: 'En preparación o confirmados',
      icon: ShoppingCart,
      color: 'text-amber-600',
    },
    {
      label: 'CIF Total',
      value: isLoading ? '—' : formatCurrency(dashboard.cifTotal),
      detail: 'Valor consolidado',
      icon: BarChart3,
      color: 'text-purple-600',
    },
  ] as const

  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricCards.map((card) => {
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
              <p className="text-xs text-muted-foreground">{card.detail}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Alertas de stock</h2>
              <p className="text-sm text-muted-foreground">Variantes con inventario crítico</p>
            </div>
            <Link to="/stock" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Ver stock <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-12 animate-pulse rounded-md bg-muted" />
                <div className="h-12 animate-pulse rounded-md bg-muted" />
                <div className="h-12 animate-pulse rounded-md bg-muted" />
              </div>
            ) : dashboard.alertasStock.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No hay alertas de stock en este momento.
              </div>
            ) : (
              dashboard.alertasStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.color} · {item.talla}</p>
                      <p className="text-xs text-muted-foreground">Variante #{item.id}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-amber-600">{item.stock_disponible} uds.</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Resumen ejecutivo</h2>
              <p className="text-sm text-muted-foreground">Indicadores clave del negocio</p>
            </div>
            <TrendingUp className="size-5 text-primary" />
          </div>

          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">Stock disponible total</span>
              <span className="font-semibold text-foreground">{isLoading ? '—' : dashboard.stockDisponible}</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">Importaciones activas</span>
              <span className="font-semibold text-foreground">{isLoading ? '—' : dashboard.importacionesActivas}</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">Pedidos pendientes</span>
              <span className="font-semibold text-foreground">{isLoading ? '—' : dashboard.pedidosPendientes}</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-muted-foreground">CIF consolidado</span>
              <span className="font-semibold text-foreground">
                {isLoading ? '—' : formatCurrency(dashboard.cifTotal)}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Operaciones recientes</h2>
              <p className="text-xs text-muted-foreground">Seguimiento de importaciones</p>
            </div>
            <Link to="/importaciones" className="text-xs font-medium text-primary">Ver todo</Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`import-loading-${index}`}>
                    <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                  </TableRow>
                ))
              ) : dashboard.ultimasImportaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                    No hay importaciones registradas.
                  </TableCell>
                </TableRow>
              ) : (
                dashboard.ultimasImportaciones.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link to={`/importaciones/${item.id}`} className="font-medium text-primary hover:underline">
                        {item.codigo_unico}
                      </Link>
                    </TableCell>
                    <TableCell>{formatEstado(item.estado)}</TableCell>
                    <TableCell>{formatDate(item.fecha_registro)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Pedidos recientes</h2>
              <p className="text-xs text-muted-foreground">Estado comercial del ciclo</p>
            </div>
            <Link to="/pedidos" className="text-xs font-medium text-primary">Ver todo</Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`pedido-loading-${index}`}>
                    <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                  </TableRow>
                ))
              ) : dashboard.ultimosPedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                    No hay pedidos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                dashboard.ultimosPedidos.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link to={`/pedidos/${item.id}`} className="font-medium text-primary hover:underline">
                        {item.codigo_pedido}
                      </Link>
                    </TableCell>
                    <TableCell>{formatEstado(item.estado)}</TableCell>
                    <TableCell>{formatDate(item.fecha)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
          path="transportistas"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR, AGENTE_ADUANAL]}>
              <Transportistas />
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
          path="pedidos/:id/editar"
          element={
            <ProtectedRoute allowedRoles={[ADMINISTRADOR, OPERADOR]}>
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
