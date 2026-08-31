import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Calculator, Loader2, Plus, RefreshCcw, Trash2 } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { OperacionImportacion } from '@/types/importaciones'
import type { Costeo as CosteoType, TipoTributo, Tributo } from '@/types/costeo'
import { formatCurrency, formatDate, formatEstado } from '@/utils/formatters'
import { ESTADO_IMPORTACION_COLOR } from '@/utils/importacionesUi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const TIPOS_TRIBUTO: TipoTributo[] = ['ARANCEL', 'IVA']

const EMPTY_TRIBUTO_FORM = {
  tipo: '' as TipoTributo | '',
  partida_arancelaria: '',
  base_imponible: '',
  porcentaje: '',
}

export function Costeo() {
  const [operaciones, setOperaciones] = useState<OperacionImportacion[]>([])
  const [loadingOperaciones, setLoadingOperaciones] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')

  const [costeo, setCosteo] = useState<CosteoType | null>(null)
  const [loadingCosteo, setLoadingCosteo] = useState(false)
  const [desactualizado, setDesactualizado] = useState(false)
  const [calculando, setCalculando] = useState(false)

  const [form, setForm] = useState(EMPTY_TRIBUTO_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tributo | null>(null)
  const [deleting, setDeleting] = useState(false)

  const operacionSeleccionada = operaciones.find((o) => String(o.id) === selectedId) ?? null

  useEffect(() => {
    api
      .get<PaginatedResponse<OperacionImportacion>>('/importaciones/?page_size=100')
      .then((data) => setOperaciones(data.results))
      .finally(() => setLoadingOperaciones(false))
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setCosteo(null)
      return
    }
    let cancelled = false
    setLoadingCosteo(true)
    setDesactualizado(false)
    api
      .get<PaginatedResponse<CosteoType>>(`/costeos/?operacion=${selectedId}`)
      .then((data) => { if (!cancelled) setCosteo(data.results[0] ?? null) })
      .finally(() => { if (!cancelled) setLoadingCosteo(false) })
    return () => { cancelled = true }
  }, [selectedId])

  async function handleCalcularCosteo() {
    if (!selectedId) return null
    setCalculando(true)
    try {
      const actualizado = await api.post<CosteoType>(`/importaciones/${selectedId}/calcular-costeo/`)
      setCosteo(actualizado)
      setDesactualizado(false)
      toast.success('Costeo calculado correctamente.')
      return actualizado
    } catch (err) {
      toast.error('No se pudo calcular el costeo', {
        description: err instanceof Error ? err.message : undefined,
      })
      return null
    } finally {
      setCalculando(false)
    }
  }

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleAgregarTributo(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!selectedId || !form.tipo) return
    setSubmitting(true)
    try {
      const costeoActual = costeo ?? (await handleCalcularCosteo())
      if (!costeoActual) return

      const nuevoTributo = await api.post<Tributo>('/tributos/', {
        costeo: costeoActual.id,
        tipo: form.tipo,
        partida_arancelaria: form.partida_arancelaria,
        base_imponible: form.base_imponible,
        porcentaje: form.porcentaje,
      })

      setCosteo((prev) => (prev ? { ...prev, tributos: [...prev.tributos, nuevoTributo] } : prev))
      setDesactualizado(true)
      setForm(EMPTY_TRIBUTO_FORM)
      toast.success('Tributo registrado correctamente.')
    } catch (err) {
      toast.error('No se pudo registrar el tributo', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEliminarTributo() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/tributos/${deleteTarget.id}/`)
      setCosteo((prev) =>
        prev ? { ...prev, tributos: prev.tributos.filter((t) => t.id !== deleteTarget.id) } : prev
      )
      setDesactualizado(true)
      toast.success('Tributo eliminado.')
    } catch (err) {
      toast.error('No se pudo eliminar el tributo', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Costeo y Tributos</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Registra los tributos de una operación de importación y calcula el costeo total de nacionalización.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <Label htmlFor="operacion-select" className="mb-1.5 block">Operación de Importación</Label>
        <Select
          value={selectedId}
          onValueChange={(v) => setSelectedId(v ?? '')}
          disabled={loadingOperaciones}
        >
          <SelectTrigger id="operacion-select" className="w-full sm:w-80">
            <SelectValue placeholder={loadingOperaciones ? 'Cargando…' : 'Seleccionar operación…'}>
              {(value: string) => {
                const op = operaciones.find((o) => String(o.id) === value)
                return op ? `${op.codigo_unico} — ${formatEstado(op.estado)}` : 'Seleccionar operación…'
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {operaciones.map((op) => (
              <SelectItem key={op.id} value={String(op.id)}>
                {op.codigo_unico} — {formatEstado(op.estado)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedId ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
          <Calculator className="size-8 opacity-40" />
          Selecciona una operación de importación para ver o calcular su costeo.
        </div>
      ) : loadingCosteo ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          {/* Resumen de la operación */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Código</span>
              <span className="font-mono text-sm font-bold text-foreground">{operacionSeleccionada?.codigo_unico}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</span>
              {operacionSeleccionada && (
                <span
                  className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-medium ${ESTADO_IMPORTACION_COLOR[operacionSeleccionada.estado]}`}
                >
                  {formatEstado(operacionSeleccionada.estado)}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor CIF</span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(Number(operacionSeleccionada?.valor_cif ?? 0))}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">Costo Total Nacionalizado</span>
              <span className="text-lg font-bold text-primary">
                {costeo ? formatCurrency(Number(costeo.costo_total)) : '— sin calcular —'}
              </span>
            </div>
          </div>

          {desactualizado && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
              <span>El costeo total no refleja los últimos cambios en tributos. Recalcula para actualizarlo.</span>
              <Button size="sm" onClick={handleCalcularCosteo} disabled={calculando}>
                {calculando ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
                Recalcular Costeo
              </Button>
            </div>
          )}

          {!costeo && !desactualizado && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <span className="text-sm text-muted-foreground">
                Esta operación aún no tiene un costeo calculado.
              </span>
              <Button size="sm" onClick={handleCalcularCosteo} disabled={calculando}>
                {calculando ? <Loader2 className="size-4 animate-spin" /> : <Calculator className="size-4" />}
                Calcular Costeo
              </Button>
            </div>
          )}

          {/* Formulario de nuevo tributo */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Registrar Tributo
            </h2>
            <form onSubmit={handleAgregarTributo} className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tipo">Tipo <span className="text-destructive">*</span></Label>
                <Select value={form.tipo} onValueChange={(v) => setField('tipo', (v as TipoTributo) ?? '')}>
                  <SelectTrigger id="tipo" className="w-full">
                    <SelectValue placeholder="Seleccionar…">
                      {(value: string) => (value === 'ARANCEL' ? 'Arancel' : value === 'IVA' ? 'IVA' : 'Seleccionar…')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_TRIBUTO.map((t) => (
                      <SelectItem key={t} value={t}>{t === 'ARANCEL' ? 'Arancel' : 'IVA'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="partida">Partida Arancelaria</Label>
                <Input
                  id="partida"
                  value={form.partida_arancelaria}
                  onChange={(e) => setField('partida_arancelaria', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="base">Base Imponible <span className="text-destructive">*</span></Label>
                <Input
                  id="base"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.base_imponible}
                  onChange={(e) => setField('base_imponible', e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="porcentaje">Porcentaje (%) <span className="text-destructive">*</span></Label>
                <Input
                  id="porcentaje"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.porcentaje}
                  onChange={(e) => setField('porcentaje', e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting || !form.tipo} className="w-full sm:w-auto">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Agregar
              </Button>
            </form>
          </div>

          {/* Tabla de tributos */}
          <div className="rounded-lg border border-border">
            <div className="border-b border-border p-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Tributos Registrados ({costeo?.tributos.length ?? 0})
              </h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Partida Arancelaria</TableHead>
                  <TableHead>Base Imponible</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!costeo || costeo.tributos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No hay tributos registrados para esta operación.
                    </TableCell>
                  </TableRow>
                ) : (
                  costeo.tributos.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.tipo === 'ARANCEL' ? 'Arancel' : 'IVA'}</TableCell>
                      <TableCell>{t.partida_arancelaria || '—'}</TableCell>
                      <TableCell>{formatCurrency(Number(t.base_imponible))}</TableCell>
                      <TableCell>{Number(t.porcentaje).toFixed(2)}%</TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(t.monto))}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(t)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {costeo?.fecha_calculo && (
            <p className="text-xs text-muted-foreground">
              Último cálculo: {formatDate(costeo.fecha_calculo)}
            </p>
          )}
        </>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null) }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este tributo?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `${deleteTarget.tipo === 'ARANCEL' ? 'Arancel' : 'IVA'} — ${formatCurrency(Number(deleteTarget.monto))}. Deberás recalcular el costeo después de eliminarlo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleEliminarTributo} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
