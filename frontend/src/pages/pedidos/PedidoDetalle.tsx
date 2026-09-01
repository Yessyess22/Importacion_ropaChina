import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Check, Loader2, RefreshCcw, XCircle } from 'lucide-react'

import { api } from '@/services/api'
import type { EstadoPedido, PedidoMayorista } from '@/types/pedidos'
import type { ClienteMayorista } from '@/types/terceros'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, formatEstado } from '@/utils/formatters'
import {
  ESTADO_PEDIDO_COLOR,
  PIPELINE_LINEAL_PEDIDO,
  TRANSICIONES_VALIDAS_PEDIDO,
} from '@/utils/pedidosUi'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const ESTADO_ROLES = ['Administrador', 'Operador de Comercio Exterior']

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${ESTADO_PEDIDO_COLOR[estado]}`}
    >
      {formatEstado(estado)}
    </span>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value || '—'}</span>
    </div>
  )
}

export function PedidoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useAuth()
  const canCambiarEstado = role != null && ESTADO_ROLES.includes(role)

  const [pedido, setPedido] = useState<PedidoMayorista | null>(null)
  const [cliente, setCliente] = useState<ClienteMayorista | null>(null)
  const [loading, setLoading] = useState(true)

  const [estadoDialogOpen, setEstadoDialogOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<EstadoPedido | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    api
      .get<PedidoMayorista>(`/pedidos/${id}/`)
      .then(async (data) => {
        if (cancelled) return
        setPedido(data)
        const cli = await api.get<ClienteMayorista>(`/clientes-mayoristas/${data.cliente}/`).catch(() => null)
        if (!cancelled) setCliente(cli)
      })
      .catch(() => { if (!cancelled) toast.error('No se pudo cargar el pedido.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  async function handleConfirmarTransicion() {
    if (!pedido || !confirmTarget) return
    setTransitioning(true)
    try {
      const actualizado = await api.post<PedidoMayorista>(
        `/pedidos/${pedido.id}/actualizar-estado/`,
        { estado: confirmTarget }
      )
      setPedido(actualizado)
      toast.success(`Estado actualizado a "${formatEstado(confirmTarget)}".`)
      setEstadoDialogOpen(false)
    } catch (err) {
      toast.error('No se pudo cambiar el estado', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setTransitioning(false)
      setConfirmTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">No se encontró el pedido.</p>
        <Button variant="outline" onClick={() => navigate('/pedidos')}>
          <ArrowLeft className="size-4" />
          Volver al listado
        </Button>
      </div>
    )
  }

  const transicionesDisponibles = TRANSICIONES_VALIDAS_PEDIDO[pedido.estado]
  const siguienteLineal = transicionesDisponibles.find((e) => e !== 'CANCELADO') ?? null
  const puedeCancelar = transicionesDisponibles.includes('CANCELADO')
  const pipelineIndexActual = PIPELINE_LINEAL_PEDIDO.indexOf(pedido.estado)
  const total = pedido.detalles.reduce((acc, d) => acc + Number(d.precio_unitario) * d.cantidad, 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/pedidos')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-mono text-2xl font-bold text-foreground">{pedido.codigo_pedido}</h1>
            <div className="mt-1"><EstadoBadge estado={pedido.estado} /></div>
          </div>
        </div>

        {canCambiarEstado && transicionesDisponibles.length > 0 && (
          <Button onClick={() => setEstadoDialogOpen(true)}>
            <RefreshCcw className="size-4" />
            Cambiar Estado
          </Button>
        )}
      </div>

      {/* Datos generales */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Datos del Pedido
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoField label="Cliente" value={cliente?.razon_social ?? `#${pedido.cliente}`} />
          <InfoField label="Fecha" value={formatDate(pedido.fecha)} />
          <InfoField label="Total" value={formatCurrency(total)} />
        </div>
      </div>

      {/* Líneas del pedido */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Variantes del Pedido ({pedido.detalles.length})
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Talla</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Precio Unit.</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedido.detalles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Este pedido no tiene líneas de detalle registradas.
                </TableCell>
              </TableRow>
            ) : (
              pedido.detalles.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.variante_detalle?.talla ?? '—'}</TableCell>
                  <TableCell>{d.variante_detalle?.color ?? '—'}</TableCell>
                  <TableCell>{d.cantidad}</TableCell>
                  <TableCell>{formatCurrency(Number(d.precio_unitario))}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(d.cantidad * Number(d.precio_unitario))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de transición de estado */}
      <Dialog open={estadoDialogOpen} onOpenChange={(open) => { if (!transitioning) setEstadoDialogOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Pedido</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            {/* Stepper lineal del ciclo de pedido */}
            <div className="flex items-center justify-between">
              {PIPELINE_LINEAL_PEDIDO.map((estado, i) => {
                const completado = pipelineIndexActual >= 0 && i < pipelineIndexActual
                const actual = estado === pedido.estado
                return (
                  <div key={estado} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex size-7 items-center justify-center rounded-full border text-xs font-semibold ${
                          actual
                            ? 'border-primary bg-primary text-primary-foreground'
                            : completado
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                              : 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {completado ? <Check className="size-3.5" /> : i + 1}
                      </div>
                      <span className="text-center text-[0.65rem] font-medium text-muted-foreground">
                        {formatEstado(estado)}
                      </span>
                    </div>
                    {i < PIPELINE_LINEAL_PEDIDO.length - 1 && (
                      <div className={`mx-1 h-px flex-1 ${completado ? 'bg-emerald-300' : 'bg-border'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {pedido.estado === 'CANCELADO' && (
              <p className="text-center text-sm text-muted-foreground">
                Este pedido fue cancelado y no admite más transiciones.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {siguienteLineal && (
                <Button onClick={() => setConfirmTarget(siguienteLineal)} disabled={transitioning}>
                  <RefreshCcw className="size-4" />
                  Avanzar a {formatEstado(siguienteLineal)}
                </Button>
              )}
              {puedeCancelar && (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmTarget('CANCELADO')}
                  disabled={transitioning}
                >
                  <XCircle className="size-4" />
                  Cancelar Pedido
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEstadoDialogOpen(false)} disabled={transitioning}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de la transición seleccionada */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => { if (!open && !transitioning) setConfirmTarget(null) }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget === 'CANCELADO'
                ? '¿Cancelar este pedido?'
                : `¿Avanzar a "${confirmTarget ? formatEstado(confirmTarget) : ''}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget === 'CANCELADO'
                ? 'El pedido quedará cancelado y se liberará el stock reservado de cada variante. Esta acción no se puede deshacer.'
                : `El pedido ${pedido.codigo_pedido} pasará de "${formatEstado(pedido.estado)}" a "${confirmTarget ? formatEstado(confirmTarget) : ''}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transitioning}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmTarget === 'CANCELADO' ? 'destructive' : 'default'}
              onClick={handleConfirmarTransicion}
              disabled={transitioning}
            >
              {transitioning ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Actualizando…
                </span>
              ) : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
