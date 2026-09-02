import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { ClienteMayorista } from '@/types/terceros'
import type { ReporteImportacionesResponse, ReportePedidosResponse } from '@/types/reportes'
import { formatCurrency, formatEstado } from '@/utils/formatters'
import { downloadCsv } from '@/utils/csv'
import { ESTADO_IMPORTACION_COLOR } from '@/utils/importacionesUi'
import { ESTADO_PEDIDO_COLOR } from '@/utils/pedidosUi'
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
  const [data, setData] = useState<ReporteImportacionesResponse['por_estado']>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (fechaDesde) params.set('fecha_desde', fechaDesde)
    if (fechaHasta) params.set('fecha_hasta', fechaHasta)
    const query = params.toString()
    api
      .get<ReporteImportacionesResponse>(`/reportes/importaciones/${query ? `?${query}` : ''}`)
      .then((res) => { if (!cancelled) setData(res.por_estado) })
      .catch(() => { if (!cancelled) toast.error('No se pudo cargar el reporte de importaciones.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fechaDesde, fechaHasta])

  const totalCantidad = data.reduce((acc, d) => acc + d.cantidad, 0)
  const totalCif = data.reduce((acc, d) => acc + Number(d.total_cif ?? 0), 0)

  function exportarCsv() {
    downloadCsv(
      'reporte-importaciones.csv',
      ['Estado', 'Cantidad', 'Valor CIF Total (BOB)'],
      data.map((d) => [formatEstado(d.estado), d.cantidad, d.total_cif ?? '0']),
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Importaciones por Estado</h2>
          <p className="text-sm text-muted-foreground">
            {totalCantidad} {totalCantidad === 1 ? 'operación' : 'operaciones'} · CIF total {formatCurrency(totalCif)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportarCsv} disabled={loading || data.length === 0}>
          <Download className="size-3.5" />
          Exportar CSV
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
        {(fechaDesde || fechaHasta) && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setFechaDesde(''); setFechaHasta('') }}>
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
              data={data.map((d) => ({ label: formatEstado(d.estado), value: d.cantidad }))}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Valor CIF total (BOB)
            </p>
            <BarChart
              ariaLabel="Valor CIF total por estado"
              data={data.map((d) => ({ label: formatEstado(d.estado), value: Number(d.total_cif ?? 0) }))}
              formatValue={(v) => v.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            />
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Valor CIF Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 3 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                  No hay operaciones registradas en el rango seleccionado.
                </TableCell>
              </TableRow>
            ) : (
              data.map((d) => (
                <TableRow key={d.estado}>
                  <TableCell><EstadoBadge estado={d.estado} colorMap={ESTADO_IMPORTACION_COLOR} /></TableCell>
                  <TableCell>{d.cantidad}</TableCell>
                  <TableCell>{formatCurrency(Number(d.total_cif ?? 0))}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

function ReportePedidosSection() {
  const [clientes, setClientes] = useState<ClienteMayorista[]>([])
  const [clienteFiltro, setClienteFiltro] = useState('')
  const [data, setData] = useState<ReportePedidosResponse['por_estado']>([])
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
    const query = clienteFiltro ? `?cliente=${clienteFiltro}` : ''
    api
      .get<ReportePedidosResponse>(`/reportes/pedidos/${query}`)
      .then((res) => { if (!cancelled) setData(res.por_estado) })
      .catch(() => { if (!cancelled) toast.error('No se pudo cargar el reporte de pedidos.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [clienteFiltro])

  const totalCantidad = data.reduce((acc, d) => acc + d.cantidad, 0)

  function exportarCsv() {
    downloadCsv(
      'reporte-pedidos.csv',
      ['Estado', 'Cantidad'],
      data.map((d) => [formatEstado(d.estado), d.cantidad]),
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pedidos por Estado</h2>
          <p className="text-sm text-muted-foreground">
            {totalCantidad} {totalCantidad === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportarCsv} disabled={loading || data.length === 0}>
          <Download className="size-3.5" />
          Exportar CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
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
      </div>

      {loading ? (
        <Skeleton className="h-45 w-full" />
      ) : (
        <BarChart
          ariaLabel="Cantidad de pedidos por estado"
          data={data.map((d) => ({ label: formatEstado(d.estado), value: d.cantidad }))}
        />
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Cantidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">
                  No hay pedidos registrados para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              data.map((d) => (
                <TableRow key={d.estado}>
                  <TableCell><EstadoBadge estado={d.estado} colorMap={ESTADO_PEDIDO_COLOR} /></TableCell>
                  <TableCell>{d.cantidad}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
          Indicadores de importaciones y pedidos agrupados por estado.
        </p>
      </div>

      <ReporteImportacionesSection />
      <ReportePedidosSection />
    </div>
  )
}
