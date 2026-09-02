import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { AgenteAduanal, ClienteMayorista, Proveedor, Transportista } from '@/types/terceros'
import type { OperacionImportacion } from '@/types/importaciones'
import type { PedidoMayorista } from '@/types/pedidos'
import type { ReporteImportacionesResponse, ReportePedidosResponse } from '@/types/reportes'
import { formatCurrency, formatDate, formatEstado, formatTime } from '@/utils/formatters'
import { downloadPdf } from '@/utils/pdf'
import { ESTADOS_IMPORTACION, ESTADO_IMPORTACION_COLOR } from '@/utils/importacionesUi'
import { ESTADOS_PEDIDO, ESTADO_PEDIDO_COLOR } from '@/utils/pedidosUi'
import { BarChart } from '@/components/charts/BarChart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const TODOS = 'TODOS'

function EstadoBadge({ estado, colorMap }: { estado: string; colorMap: Record<string, string> }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colorMap[estado] ?? ''}`}
    >
      {formatEstado(estado)}
    </span>
  )
}

function ReporteImportacionesSection() {
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [dataAgregado, setDataAgregado] = useState<ReporteImportacionesResponse['por_estado']>([])
  const [dataDetalle, setDataDetalle] = useState<OperacionImportacion[]>([])
  const [loading, setLoading] = useState(true)

  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [agentes, setAgentes] = useState<AgenteAduanal[]>([])
  const [transportistas, setTransportistas] = useState<Transportista[]>([])

  useEffect(() => {
    api.get<PaginatedResponse<Proveedor>>('/proveedores/?page_size=100').then((r) => setProveedores(r.results)).catch(() => setProveedores([]))
    api.get<PaginatedResponse<AgenteAduanal>>('/agentes-aduanales/?page_size=100').then((r) => setAgentes(r.results)).catch(() => setAgentes([]))
    api.get<PaginatedResponse<Transportista>>('/transportistas/?page_size=100').then((r) => setTransportistas(r.results)).catch(() => setTransportistas([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (fechaDesde) params.set('fecha_desde', fechaDesde)
    if (fechaHasta) params.set('fecha_hasta', fechaHasta)
    if (estadoFiltro) params.set('estado', estadoFiltro)
    const query = params.toString()
    Promise.all([
      api.get<ReporteImportacionesResponse>(`/reportes/importaciones/${query ? `?${query}` : ''}`),
      api.get<OperacionImportacion[]>(`/reportes/importaciones/detalle/${query ? `?${query}` : ''}`),
    ])
      .then(([agregado, detalle]) => {
        if (cancelled) return
        setDataAgregado(agregado.por_estado)
        setDataDetalle(detalle)
      })
      .catch(() => { if (!cancelled) toast.error('No se pudo cargar el reporte de importaciones.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fechaDesde, fechaHasta, estadoFiltro])

  const totalCantidad = dataAgregado.reduce((acc, d) => acc + d.cantidad, 0)
  const totalCif = dataAgregado.reduce((acc, d) => acc + Number(d.total_cif ?? 0), 0)

  function nombreProveedor(id: number) {
    return proveedores.find((p) => p.id === id)?.razon_social ?? `#${id}`
  }
  function nombreAgente(id: number | null) {
    if (id == null) return '—'
    return agentes.find((a) => a.id === id)?.razon_social ?? `#${id}`
  }
  function nombreTransportista(id: number | null) {
    if (id == null) return '—'
    return transportistas.find((t) => t.id === id)?.razon_social ?? `#${id}`
  }

  function exportarPdf() {
    downloadPdf(
      'reporte-importaciones-detallado.pdf',
      `Reporte Detallado de Importaciones${fechaDesde || fechaHasta ? ` (${fechaDesde || '...'} a ${fechaHasta || '...'})` : ''}`,
      ['Código', 'Proveedor', 'Agente Aduanal', 'Transportista', 'Fecha Registro', 'Hora', 'Estado', 'FOB', 'Flete', 'Seguro', 'CIF', 'Ruta Ingreso'],
      dataDetalle.map((op) => [
        op.codigo_unico,
        nombreProveedor(op.proveedor),
        nombreAgente(op.agente_aduanal),
        nombreTransportista(op.transportista),
        formatDate(op.fecha_registro),
        formatTime(op.created_at),
        formatEstado(op.estado),
        formatCurrency(Number(op.valor_fob)),
        formatCurrency(Number(op.valor_flete)),
        formatCurrency(Number(op.valor_seguro)),
        formatCurrency(Number(op.valor_cif)),
        op.ruta_ingreso || '—',
      ]),
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Importaciones</h2>
          <p className="text-sm text-muted-foreground">
            {totalCantidad} {totalCantidad === 1 ? 'operación' : 'operaciones'} · CIF total {formatCurrency(totalCif)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportarPdf} disabled={loading || dataDetalle.length === 0}>
          <Download className="size-3.5" />
          Exportar PDF
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fecha-desde" className="text-xs">Desde</Label>
          <Input
            id="fecha-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fecha-hasta" className="text-xs">Hasta</Label>
          <Input
            id="fecha-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Estado</Label>
          <Select value={estadoFiltro || TODOS} onValueChange={(v) => setEstadoFiltro(v === TODOS ? '' : (v ?? ''))}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Todos los estados">
                {(value: string) => (value === TODOS ? 'Todos los estados' : formatEstado(value))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los estados</SelectItem>
              {ESTADOS_IMPORTACION.map((e) => (
                <SelectItem key={e} value={e}>{formatEstado(e)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(fechaDesde || fechaHasta || estadoFiltro) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => { setFechaDesde(''); setFechaHasta(''); setEstadoFiltro('') }}
          >
            Limpiar filtro
          </Button>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-45 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cantidad de operaciones
            </p>
            <BarChart
              ariaLabel="Cantidad de importaciones por estado"
              data={dataAgregado.map((d) => ({ label: formatEstado(d.estado), value: d.cantidad }))}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Valor CIF total (BOB)
            </p>
            <BarChart
              ariaLabel="Valor CIF total por estado"
              data={dataAgregado.map((d) => ({ label: formatEstado(d.estado), value: Number(d.total_cif ?? 0) }))}
              formatValue={(v) => v.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            />
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Detalle de operaciones ({dataDetalle.length})
        </h3>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Agente Aduanal</TableHead>
                <TableHead>Transportista</TableHead>
                <TableHead>Fecha Registro</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>FOB</TableHead>
                <TableHead>Flete</TableHead>
                <TableHead>Seguro</TableHead>
                <TableHead>CIF</TableHead>
                <TableHead>Ruta Ingreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 12 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : dataDetalle.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-6 text-center text-sm text-muted-foreground">
                    No hay operaciones registradas en el rango seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                dataDetalle.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-mono text-sm font-medium">{op.codigo_unico}</TableCell>
                    <TableCell className="text-sm">{nombreProveedor(op.proveedor)}</TableCell>
                    <TableCell className="text-sm">{nombreAgente(op.agente_aduanal)}</TableCell>
                    <TableCell className="text-sm">{nombreTransportista(op.transportista)}</TableCell>
                    <TableCell className="text-sm">{formatDate(op.fecha_registro)}</TableCell>
                    <TableCell className="text-sm">{formatTime(op.created_at)}</TableCell>
                    <TableCell><EstadoBadge estado={op.estado} colorMap={ESTADO_IMPORTACION_COLOR} /></TableCell>
                    <TableCell className="text-sm">{formatCurrency(Number(op.valor_fob))}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(Number(op.valor_flete))}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(Number(op.valor_seguro))}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(Number(op.valor_cif))}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{op.ruta_ingreso || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  )
}

function ReportePedidosSection() {
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [clientes, setClientes] = useState<ClienteMayorista[]>([])
  const [clienteFiltro, setClienteFiltro] = useState('')
  const [dataAgregado, setDataAgregado] = useState<ReportePedidosResponse['por_estado']>([])
  const [dataDetalle, setDataDetalle] = useState<PedidoMayorista[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<PaginatedResponse<ClienteMayorista>>('/clientes-mayoristas/?page_size=100')
      .then((res) => setClientes(res.results))
      .catch(() => setClientes([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (fechaDesde) params.set('fecha_desde', fechaDesde)
    if (fechaHasta) params.set('fecha_hasta', fechaHasta)
    if (estadoFiltro) params.set('estado', estadoFiltro)
    if (clienteFiltro) params.set('cliente', clienteFiltro)
    const query = params.toString()
    Promise.all([
      api.get<ReportePedidosResponse>(`/reportes/pedidos/${query ? `?${query}` : ''}`),
      api.get<PedidoMayorista[]>(`/reportes/pedidos/detalle/${query ? `?${query}` : ''}`),
    ])
      .then(([agregado, detalle]) => {
        if (cancelled) return
        setDataAgregado(agregado.por_estado)
        setDataDetalle(detalle)
      })
      .catch(() => { if (!cancelled) toast.error('No se pudo cargar el reporte de pedidos.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fechaDesde, fechaHasta, estadoFiltro, clienteFiltro])

  const totalCantidad = dataAgregado.reduce((acc, d) => acc + d.cantidad, 0)

  function nombreCliente(id: number) {
    return clientes.find((c) => c.id === id)?.razon_social ?? `#${id}`
  }
  function totalPedido(pedido: PedidoMayorista): number {
    return pedido.detalles.reduce((acc, d) => acc + Number(d.precio_unitario) * d.cantidad, 0)
  }

  function exportarPdf() {
    downloadPdf(
      'reporte-pedidos-detallado.pdf',
      `Reporte Detallado de Pedidos${fechaDesde || fechaHasta ? ` (${fechaDesde || '...'} a ${fechaHasta || '...'})` : ''}`,
      ['Código', 'Cliente', 'Fecha', 'Hora', 'Estado', 'Líneas', 'Total'],
      dataDetalle.map((p) => [
        p.codigo_pedido,
        nombreCliente(p.cliente),
        formatDate(p.fecha),
        formatTime(p.created_at),
        formatEstado(p.estado),
        p.detalles.length,
        formatCurrency(totalPedido(p)),
      ]),
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pedidos</h2>
          <p className="text-sm text-muted-foreground">
            {totalCantidad} {totalCantidad === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportarPdf} disabled={loading || dataDetalle.length === 0}>
          <Download className="size-3.5" />
          Exportar PDF
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ped-fecha-desde" className="text-xs">Desde</Label>
          <Input
            id="ped-fecha-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ped-fecha-hasta" className="text-xs">Hasta</Label>
          <Input
            id="ped-fecha-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Estado</Label>
          <Select value={estadoFiltro || TODOS} onValueChange={(v) => setEstadoFiltro(v === TODOS ? '' : (v ?? ''))}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Todos los estados">
                {(value: string) => (value === TODOS ? 'Todos los estados' : formatEstado(value))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los estados</SelectItem>
              {ESTADOS_PEDIDO.map((e) => (
                <SelectItem key={e} value={e}>{formatEstado(e)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Cliente</Label>
          <Select
            value={clienteFiltro || TODOS}
            onValueChange={(v) => setClienteFiltro(v === TODOS ? '' : (v ?? ''))}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todos los clientes">
                {(value: string) =>
                  value === TODOS
                    ? 'Todos los clientes'
                    : (clientes.find((c) => String(c.id) === value)?.razon_social ?? '—')
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los clientes</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.razon_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(fechaDesde || fechaHasta || estadoFiltro || clienteFiltro) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => { setFechaDesde(''); setFechaHasta(''); setEstadoFiltro(''); setClienteFiltro('') }}
          >
            Limpiar filtro
          </Button>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-45 w-full" />
      ) : (
        <BarChart
          ariaLabel="Cantidad de pedidos por estado"
          data={dataAgregado.map((d) => ({ label: formatEstado(d.estado), value: d.cantidad }))}
        />
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Detalle de pedidos ({dataDetalle.length})
        </h3>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Líneas</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : dataDetalle.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                    No hay pedidos registrados para este filtro.
                  </TableCell>
                </TableRow>
              ) : (
                dataDetalle.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm font-medium">{p.codigo_pedido}</TableCell>
                    <TableCell className="text-sm">{nombreCliente(p.cliente)}</TableCell>
                    <TableCell className="text-sm">{formatDate(p.fecha)}</TableCell>
                    <TableCell className="text-sm">{formatTime(p.created_at)}</TableCell>
                    <TableCell><EstadoBadge estado={p.estado} colorMap={ESTADO_PEDIDO_COLOR} /></TableCell>
                    <TableCell className="text-sm">{p.detalles.length}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(totalPedido(p))}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  )
}

export function Reportes() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Indicadores y detalle completo de importaciones y pedidos.
        </p>
      </div>

      <ReporteImportacionesSection />
      <ReportePedidosSection />
    </div>
  )
}
