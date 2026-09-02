import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse, UsuarioAdmin } from '@/types/api'
import type { Bitacora } from '@/types/auditoria'
import { formatEstado } from '@/utils/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const PAGE_SIZE = 20
const TODOS = 'TODOS'

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })
}

export function Auditoria() {
  const [items, setItems] = useState<Bitacora[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [usuarioFiltro, setUsuarioFiltro] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<Bitacora | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hayFiltros = Boolean(search || usuarioFiltro)

  useEffect(() => {
    api
      .get<PaginatedResponse<UsuarioAdmin>>('/usuarios/?page_size=100')
      .then((data) => setUsuarios(data.results))
      .catch(() => setUsuarios([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), page_size: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (usuarioFiltro) params.set('usuario', usuarioFiltro)
    api
      .get<PaginatedResponse<Bitacora>>(`/bitacora/?${params}`)
      .then((data) => {
        if (!cancelled) {
          setItems(data.results)
          setTotalCount(data.count)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, usuarioFiltro, currentPage])

  function limpiarFiltros() {
    setSearch('')
    setUsuarioFiltro('')
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bitácora de Auditoría</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'registro' : 'registros'} de operaciones críticas del sistema
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Input
          placeholder="Buscar por acción…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          className="max-w-xs"
        />

        <Select
          value={usuarioFiltro || TODOS}
          onValueChange={(v) => { setUsuarioFiltro(v === TODOS ? '' : (v ?? '')); setCurrentPage(1) }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todos los usuarios">
              {(value: string) =>
                value === TODOS
                  ? 'Todos los usuarios'
                  : (usuarios.find((u) => String(u.id) === value)?.username ?? '—')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los usuarios</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>
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
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad afectada</TableHead>
              <TableHead className="text-right">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  {hayFiltros ? 'Sin resultados para los filtros aplicados.' : 'No hay registros de bitácora.'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{formatFechaHora(item.fecha_hora)}</TableCell>
                  <TableCell className="text-sm">{item.usuario_repr || '—'}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                      {formatEstado(item.accion)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.entidad_tipo ? `${item.entidad_tipo} #${item.entidad_object_id}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setDetalleSeleccionado(item)}
                      disabled={Object.keys(item.detalle ?? {}).length === 0}
                    >
                      <Eye className="size-3.5" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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

      <Dialog open={!!detalleSeleccionado} onOpenChange={(open) => { if (!open) setDetalleSeleccionado(null) }}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>
              Detalle — {detalleSeleccionado ? formatEstado(detalleSeleccionado.accion) : ''}
            </DialogTitle>
          </DialogHeader>
          <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
            {JSON.stringify(detalleSeleccionado?.detalle ?? {}, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}
