import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, History } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { EstadoVariante, Prenda, VarianteProducto } from '@/types/catalogo'
import type { MovimientoInventario } from '@/types/inventario'
import { formatEstado } from '@/utils/formatters'
import { ESTADO_VARIANTE_COLOR, stockBadgeClasses } from '@/utils/catalogoUi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const PAGE_SIZE = 20
const TODOS = 'TODOS'
const ESTADOS_VARIANTE: EstadoVariante[] = ['BORRADOR', 'PUBLICADO', 'DESCONTINUADO']

const TIPO_MOVIMIENTO_COLOR: Record<string, string> = {
  ENTRADA:
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  SALIDA:
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  AJUSTE:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
}

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
}

export function Stock() {
  const [items, setItems] = useState<VarianteProducto[]>([])
  const [prendas, setPrendas] = useState<Prenda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [varianteSeleccionada, setVarianteSeleccionada] = useState<VarianteProducto | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [loadingMovimientos, setLoadingMovimientos] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hayFiltros = Boolean(search || estadoFiltro)

  useEffect(() => {
    api
      .get<PaginatedResponse<Prenda>>('/prendas/?page_size=100')
      .then((data) => setPrendas(data.results))
      .catch(() => setPrendas([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), page_size: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (estadoFiltro) params.set('estado', estadoFiltro)
    api
      .get<PaginatedResponse<VarianteProducto>>(`/variantes/?${params}`)
      .then((data) => {
        if (!cancelled) {
          setItems(data.results)
          setTotalCount(data.count)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, estadoFiltro, currentPage])

  useEffect(() => {
    if (!varianteSeleccionada) return
    let cancelled = false
    setLoadingMovimientos(true)
    api
      .get<PaginatedResponse<MovimientoInventario>>(`/movimientos-inventario/?variante=${varianteSeleccionada.id}&page_size=50`)
      .then((data) => { if (!cancelled) setMovimientos(data.results) })
      .catch(() => { if (!cancelled) setMovimientos([]) })
      .finally(() => { if (!cancelled) setLoadingMovimientos(false) })
    return () => { cancelled = true }
  }, [varianteSeleccionada])

  function prendaDe(id: number) {
    return prendas.find((p) => p.id === id)
  }

  function limpiarFiltros() {
    setSearch('')
    setEstadoFiltro('')
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'variante registrada' : 'variantes registradas'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Input
          placeholder="Buscar por modelo o código…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          className="max-w-xs"
        />

        <Select
          value={estadoFiltro || TODOS}
          onValueChange={(v) => { setEstadoFiltro(v === TODOS ? '' : (v ?? '')); setCurrentPage(1) }}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Todos los estados">
              {(value: string) => (value === TODOS ? 'Todos los estados' : formatEstado(value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los estados</SelectItem>
            {ESTADOS_VARIANTE.map((e) => (
              <SelectItem key={e} value={e}>{formatEstado(e)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hayFiltros && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo</TableHead>
              <TableHead>Talla</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  {hayFiltros ? 'Sin resultados para los filtros aplicados.' : 'No hay variantes registradas.'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const prenda = prendaDe(item.prenda)
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{prenda?.nombre ?? `#${item.prenda}`}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{prenda?.codigo_modelo ?? ''}</p>
                    </TableCell>
                    <TableCell>{item.talla}</TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${ESTADO_VARIANTE_COLOR[item.estado]}`}
                      >
                        {formatEstado(item.estado)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${stockBadgeClasses(item.stock_disponible)}`}
                      >
                        {item.stock_disponible}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setVarianteSeleccionada(item)}
                      >
                        <History className="size-3.5" />
                        Ver movimientos
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!varianteSeleccionada} onOpenChange={(open) => { if (!open) setVarianteSeleccionada(null) }}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>
              Movimientos — {varianteSeleccionada?.talla} · {varianteSeleccionada?.color}
              {varianteSeleccionada && ` (${prendaDe(varianteSeleccionada.prenda)?.nombre ?? ''})`}
            </DialogTitle>
          </DialogHeader>

          {loadingMovimientos ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : movimientos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Esta variante no tiene movimientos de inventario registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Observación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TIPO_MOVIMIENTO_COLOR[m.tipo]}`}
                      >
                        {formatEstado(m.tipo)}
                      </span>
                    </TableCell>
                    <TableCell className={m.cantidad < 0 ? 'text-destructive' : 'text-emerald-600'}>
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </TableCell>
                    <TableCell className="text-sm">{formatFechaHora(m.fecha)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.observacion || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
