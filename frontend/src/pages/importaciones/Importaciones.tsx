import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { OperacionImportacion } from '@/types/importaciones'
import type { Proveedor } from '@/types/terceros'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, formatEstado } from '@/utils/formatters'
import { ESTADOS_IMPORTACION, ESTADO_IMPORTACION_COLOR } from '@/utils/importacionesUi'
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

const PAGE_SIZE = 20

const GESTION_ROLES = ['Administrador', 'Operador de Comercio Exterior']

export function Importaciones() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const canCreate = role != null && GESTION_ROLES.includes(role)

  const [items, setItems] = useState<OperacionImportacion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('')
  const [proveedorFiltro, setProveedorFiltro] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [proveedores, setProveedores] = useState<Proveedor[]>([])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    api
      .get<PaginatedResponse<Proveedor>>('/proveedores/?page_size=100')
      .then((data) => setProveedores(data.results))
      .catch(() => setProveedores([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage) })
    if (search) params.set('search', search)
    if (estadoFiltro) params.set('estado', estadoFiltro)
    if (proveedorFiltro) params.set('proveedor', proveedorFiltro)
    api
      .get<PaginatedResponse<OperacionImportacion>>(`/importaciones/?${params}`)
      .then((data) => {
        if (!cancelled) {
          setItems(data.results)
          setTotalCount(data.count)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, estadoFiltro, proveedorFiltro, currentPage])

  function nombreProveedor(id: number): string {
    return proveedores.find((p) => p.id === id)?.razon_social ?? `#${id}`
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Importaciones</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'operación registrada' : 'operaciones registradas'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Buscar por código…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="max-w-xs"
          />

          <Select
            value={estadoFiltro || 'TODOS'}
            onValueChange={(v) => { setEstadoFiltro(v === 'TODOS' ? '' : (v ?? '')); setCurrentPage(1) }}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Todos los estados">
                {(value: string) => (value === 'TODOS' ? 'Todos los estados' : formatEstado(value))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              {ESTADOS_IMPORTACION.map((e) => (
                <SelectItem key={e} value={e}>{formatEstado(e)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={proveedorFiltro || 'TODOS'}
            onValueChange={(v) => { setProveedorFiltro(v === 'TODOS' ? '' : (v ?? '')); setCurrentPage(1) }}
          >
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Todos los proveedores">
                {(value: string) =>
                  value === 'TODOS'
                    ? 'Todos los proveedores'
                    : (proveedores.find((p) => String(p.id) === value)?.razon_social ?? value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los proveedores</SelectItem>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.razon_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canCreate && (
          <Button nativeButton={false} render={<Link to="/importaciones/nueva" />}>
            <Plus className="size-4" />
            Nueva Importación
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Fecha Registro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Valor CIF</TableHead>
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
                  {search || estadoFiltro || proveedorFiltro
                    ? 'Sin resultados para los filtros aplicados.'
                    : 'No hay operaciones de importación registradas.'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm font-medium">{item.codigo_unico}</TableCell>
                  <TableCell>{nombreProveedor(item.proveedor)}</TableCell>
                  <TableCell>{formatDate(item.fecha_registro)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${ESTADO_IMPORTACION_COLOR[item.estado]}`}
                    >
                      {formatEstado(item.estado)}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(item.valor_cif))}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => navigate(`/importaciones/${item.id}`)}
                    >
                      <Eye className="size-3.5" />
                      Ver detalle
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
    </div>
  )
}
