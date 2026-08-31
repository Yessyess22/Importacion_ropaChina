import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Check, Loader2, RefreshCcw, XCircle } from 'lucide-react'

import { api } from '@/services/api'
import type { OperacionImportacion, EstadoOperacionImportacion } from '@/types/importaciones'
import type { AgenteAduanal, Proveedor, Transportista } from '@/types/terceros'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, formatEstado } from '@/utils/formatters'
import {
  ESTADO_IMPORTACION_COLOR,
  PIPELINE_LINEAL,
  TRANSICIONES_VALIDAS,
} from '@/utils/importacionesUi'
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

const ESTADO_ROLES = ['Administrador', 'Operador de Comercio Exterior', 'Agente Aduanal']

function EstadoBadge({ estado }: { estado: EstadoOperacionImportacion }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${ESTADO_IMPORTACION_COLOR[estado]}`}
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

export function DetalleImportacion() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { role } = useAuth()
  const canCambiarEstado = role != null && ESTADO_ROLES.includes(role)

  const [operacion, setOperacion] = useState<OperacionImportacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [agente, setAgente] = useState<AgenteAduanal | null>(null)
  const [transportista, setTransportista] = useState<Transportista | null>(null)

  const [estadoDialogOpen, setEstadoDialogOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<EstadoOperacionImportacion | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    api
      .get<OperacionImportacion>(`/importaciones/${id}/`)
      .then(async (data) => {
        if (cancelled) return
        setOperacion(data)
        const [prov, ag, trans] = await Promise.all([
          api.get<Proveedor>(`/proveedores/${data.proveedor}/`).catch(() => null),
          data.agente_aduanal
            ? api.get<AgenteAduanal>(`/agentes-aduanales/${data.agente_aduanal}/`).catch(() => null)
            : Promise.resolve(null),
          data.transportista
            ? api.get<Transportista>(`/transportistas/${data.transportista}/`).catch(() => null)
            : Promise.resolve(null),
        ])
        if (cancelled) return
        setProveedor(prov)
        setAgente(ag)
        setTransportista(trans)
      })
      .catch(() => { if (!cancelled) toast.error('No se pudo cargar la operación de importación.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  async function handleConfirmarTransicion() {
    if (!operacion || !confirmTarget) return
    setTransitioning(true)
    try {
      const actualizada = await api.post<OperacionImportacion>(
        `/importaciones/${operacion.id}/actualizar-estado/`,
        { estado: confirmTarget }
      )
      setOperacion(actualizada)
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

  if (!operacion) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">No se encontró la operación de importación.</p>
        <Button variant="outline" onClick={() => navigate('/importaciones')}>
          <ArrowLeft className="size-4" />
          Volver al listado
        </Button>
      </div>
    )
  }

  const transicionesDisponibles = TRANSICIONES_VALIDAS[operacion.estado]
  const siguienteLineal = transicionesDisponibles.find((e) => e !== 'CANCELADA') ?? null
  const puedeCancelar = transicionesDisponibles.includes('CANCELADA')
  const pipelineIndexActual = PIPELINE_LINEAL.indexOf(operacion.estado)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/importaciones')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-mono text-2xl font-bold text-foreground">{operacion.codigo_unico}</h1>
            <div className="mt-1"><EstadoBadge estado={operacion.estado} /></div>
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
          Datos de la Operación
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoField label="Proveedor" value={proveedor?.razon_social ?? `#${operacion.proveedor}`} />
          <InfoField label="Agente Aduanal" value={agente?.razon_social ?? '—'} />
          <InfoField label="Transportista" value={transportista?.razon_social ?? '—'} />
          <InfoField label="Fecha de Registro" value={formatDate(operacion.fecha_registro)} />
          <InfoField label="Ruta de Ingreso" value={operacion.ruta_ingreso} />
        </div>
      </div>

      {/* Valores financieros */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor FOB</span>
          <span className="text-lg font-bold text-foreground">{formatCurrency(Number(operacion.valor_fob))}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flete</span>
          <span className="text-lg font-bold text-foreground">{formatCurrency(Number(operacion.valor_flete))}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seguro</span>
          <span className="text-lg font-bold text-foreground">{formatCurrency(Number(operacion.valor_seguro))}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">Valor CIF</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(Number(operacion.valor_cif))}</span>
        </div>
      </div>

      {/* Líneas / variantes ingresadas */}
      <div className="rounded-lg border border-border">
        <div className="border-b border-border p-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Variantes Ingresadas ({operacion.detalles.length})
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Talla</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Costo Unitario FOB</TableHead>
              <TableHead>Subtotal FOB</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operacion.detalles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Esta operación no tiene líneas de detalle registradas.
                </TableCell>
              </TableRow>
            ) : (
              operacion.detalles.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.variante_detalle?.talla ?? '—'}</TableCell>
                  <TableCell>{d.variante_detalle?.color ?? '—'}</TableCell>
                  <TableCell>{d.cantidad}</TableCell>
                  <TableCell>{formatCurrency(Number(d.costo_unitario_fob))}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(d.cantidad * Number(d.costo_unitario_fob))}
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
            <DialogTitle>Cambiar Estado de la Operación</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            {/* Stepper lineal de aduana */}
            <div className="flex items-center justify-between">
              {PIPELINE_LINEAL.map((estado, i) => {
                const completado = pipelineIndexActual >= 0 && i < pipelineIndexActual
                const actual = estado === operacion.estado
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
                    {i < PIPELINE_LINEAL.length - 1 && (
                      <div className={`mx-1 h-px flex-1 ${completado ? 'bg-emerald-300' : 'bg-border'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {operacion.estado === 'CANCELADA' && (
              <p className="text-center text-sm text-muted-foreground">
                Esta operación fue cancelada y no admite más transiciones.
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
                  onClick={() => setConfirmTarget('CANCELADA')}
                  disabled={transitioning}
                >
                  <XCircle className="size-4" />
                  Cancelar Operación
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
              {confirmTarget === 'CANCELADA'
                ? '¿Cancelar esta operación?'
                : `¿Avanzar a "${confirmTarget ? formatEstado(confirmTarget) : ''}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget === 'LIBERADA'
                ? 'Al liberar la operación se generará automáticamente la entrada de stock por cada variante del detalle. Esta acción no se puede deshacer.'
                : confirmTarget === 'CANCELADA'
                  ? 'La operación quedará cancelada de forma definitiva y no podrá reactivarse.'
                  : `La operación ${operacion.codigo_unico} pasará de "${formatEstado(operacion.estado)}" a "${confirmTarget ? formatEstado(confirmTarget) : ''}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transitioning}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmTarget === 'CANCELADA' ? 'destructive' : 'default'}
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
