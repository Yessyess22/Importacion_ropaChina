import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { TipoCambio as TipoCambioType } from '@/types/costeo'
import { useAuth } from '@/hooks/useAuth'
import { focusField, useFormErrors } from '@/hooks/useFormErrors'
import { formatDate } from '@/utils/formatters'
import { fechaNoFutura, montoPositivo } from '@/utils/validators'
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

type TipoCambioForm = { fecha: string; valor: string }

const EMPTY_FORM: TipoCambioForm = { fecha: '', valor: '' }
const PAGE_SIZE = 20

export function TipoCambio() {
  const { role } = useAuth()
  const canWrite = role === 'Administrador' || role === 'Contabilidad'

  const [items, setItems] = useState<TipoCambioType[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<TipoCambioType | null>(null)
  const [form, setForm] = useState<TipoCambioForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<TipoCambioType | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { errors, applyApiError, clearErrors, setFieldError } = useFormErrors()

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  async function fetchItems() {
    setLoading(true)
    try {
      const data = await api.get<PaginatedResponse<TipoCambioType>>(`/tipo-cambio/?page=${currentPage}`)
      setItems(data.results)
      setTotalCount(data.count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get<PaginatedResponse<TipoCambioType>>(`/tipo-cambio/?page=${currentPage}`)
      .then((data) => {
        if (!cancelled) {
          setItems(data.results)
          setTotalCount(data.count)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [currentPage])

  function openCreate() {
    setEditItem(null)
    setForm(EMPTY_FORM)
    clearErrors()
    setDialogOpen(true)
  }

  function openEdit(item: TipoCambioType) {
    setEditItem(item)
    setForm({ fecha: item.fecha, valor: item.valor })
    clearErrors()
    setDialogOpen(true)
  }

  function setField<K extends keyof TipoCambioForm>(key: K, value: TipoCambioForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    clearErrors()

    if (!fechaNoFutura(form.fecha)) {
      setFieldError('fecha', 'La fecha no puede ser futura.')
      focusField('fecha')
      return
    }
    if (!montoPositivo(form.valor)) {
      setFieldError('valor', 'El valor debe ser mayor a 0.')
      focusField('valor')
      return
    }

    setSubmitting(true)
    try {
      if (editItem) {
        await api.patch(`/tipo-cambio/${editItem.id}/`, form)
        toast.success('Tipo de cambio actualizado correctamente.')
      } else {
        await api.post('/tipo-cambio/', form)
        toast.success('Tipo de cambio registrado correctamente.')
      }
      setDialogOpen(false)
      await fetchItems()
    } catch (err) {
      applyApiError(err)
      toast.error('Error al guardar', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEliminar() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/tipo-cambio/${deleteTarget.id}/`)
      toast.success('Tipo de cambio eliminado.')
      await fetchItems()
    } catch (err) {
      toast.error('No se pudo eliminar', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tipo de Cambio</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Registro diario del tipo de cambio USD/BOB para reportes y conversiones.
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo Registro
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Valor (BOB por USD)</TableHead>
              <TableHead>Registrado</TableHead>
              {canWrite && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: canWrite ? 4 : 3 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 4 : 3} className="py-8 text-center text-sm text-muted-foreground">
                  No hay tipos de cambio registrados.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{formatDate(item.fecha)}</TableCell>
                  <TableCell className="font-mono">{Number(item.valor).toFixed(4)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(item.created_at)}</TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Tipo de Cambio' : 'Nuevo Tipo de Cambio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fecha">Fecha <span className="text-destructive">*</span></Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setField('fecha', e.target.value)}
                  onBlur={(e) =>
                    setFieldError('fecha', fechaNoFutura(e.target.value) ? null : 'La fecha no puede ser futura.')
                  }
                  required
                  aria-invalid={Boolean(errors.fecha)}
                />
                {errors.fecha && <p className="text-xs text-destructive">{errors.fecha}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="valor">Valor (BOB) <span className="text-destructive">*</span></Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={form.valor}
                  onChange={(e) => setField('valor', e.target.value)}
                  onBlur={(e) =>
                    setFieldError('valor', montoPositivo(e.target.value) ? null : 'El valor debe ser mayor a 0.')
                  }
                  required
                  aria-invalid={Boolean(errors.valor)}
                />
                {errors.valor && <p className="text-xs text-destructive">{errors.valor}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="min-w-25">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Guardando…
                  </span>
                ) : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null) }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este tipo de cambio?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `${formatDate(deleteTarget.fecha)} — ${Number(deleteTarget.valor).toFixed(4)} BOB`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleEliminar} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
