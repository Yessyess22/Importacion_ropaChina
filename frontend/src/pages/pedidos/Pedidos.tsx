import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, Plus } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { PedidoMayorista } from '@/types/pedidos'
import type { ClienteMayorista } from '@/types/terceros'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, formatEstado } from '@/utils/formatters'
import { ESTADOS_PEDIDO, ESTADO_PEDIDO_COLOR } from '@/utils/pedidosUi'
import { Button } from '@/components/ui/button'
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
const CLIENTE_MAYORISTA = 'Cliente Mayorista'
const PEDIDO_ROLES = ['Administrador', 'Operador de Comercio Exterior', CLIENTE_MAYORISTA]

function totalPedido(pedido: PedidoMayorista): number {
  return pedido.detalles.reduce((acc, d) => acc + Number(d.precio_unitario) * d.cantidad, 0)
}

export function Pedidos() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const esCliente = role === CLIENTE_MAYORISTA
  const canCrear = role != null && PEDIDO_ROLES.includes(role)

  const [items, setItems] = useState<PedidoMayorista[]>([])
  const [loading, setLoading] = useState(true)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [clienteFiltro, setClienteFiltro] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [clientes, setClientes] = useState<ClienteMayorista[]>([])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    if (esCliente) return
    api
      .get<PaginatedResponse<ClienteMayorista>>('/clientes-mayoristas/?page_size=100')
      .then((data) => setClientes(data.results))
      .catch(() => setClientes([]))
  }, [esCliente])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), page_size: String(PAGE_SIZE) })
    if (estadoFiltro) params.set('estado', estadoFiltro)
    if (!esCliente && clienteFiltro) params.set('cliente', clienteFiltro)
    api
      .get<PaginatedResponse<PedidoMayorista>>(`/pedidos/?${params}`)
      .then((data) => {
        if (!cancelled) {
          setItems(data.results)
          setTotalCount(data.count)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [estadoFiltro, clienteFiltro, esCliente, currentPage])

  function nombreCliente(id: number): string {
    return clientes.find((c) => c.id === id)?.razon_social ?? `#${id}`
  }

  const hayFiltros = Boolean(estadoFiltro || clienteFiltro)
  const columnas = esCliente ? 4 : 5

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'pedido registrado' : 'pedidos registrados'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
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
              {ESTADOS_PEDIDO.map((e) => (
                <SelectItem key={e} value={e}>{formatEstado(e)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!esCliente && (
            <Select
              value={clienteFiltro || 'TODOS'}
              onValueChange={(v) => { setClienteFiltro(v === 'TODOS' ? '' : (v ?? '')); setCurrentPage(1) }}
            >
              <SelectTrigger className="w-50">
                <SelectValue placeholder="Todos los clientes">
                  {(value: string) =>
                    value === 'TODOS'
                      ? 'Todos los clientes'
                      : (clientes.find((c) => String(c.id) === value)?.razon_social ?? value)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los clientes</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.razon_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {canCrear && (
          <Button nativeButton={false} render={<Link to="/pedidos/nuevo" />}>
            <Plus className="size-4" />
            Nuevo Pedido
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              {!esCliente && <TableHead>Cliente</TableHead>}
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columnas + 1 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas + 1} className="py-8 text-center text-sm text-muted-foreground">
                  {hayFiltros ? 'Sin resultados para los filtros aplicados.' : 'Todavía no hay pedidos registrados.'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm font-medium">{item.codigo_pedido}</TableCell>
                  {!esCliente && <TableCell>{nombreCliente(item.cliente)}</TableCell>}
                  <TableCell>{formatDate(item.fecha)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${ESTADO_PEDIDO_COLOR[item.estado]}`}
                    >
                      {formatEstado(item.estado)}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(totalPedido(item))}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => navigate(`/pedidos/${item.id}`)}
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
