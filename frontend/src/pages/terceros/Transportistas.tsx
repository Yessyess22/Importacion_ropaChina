import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Power, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { TipoTransporte, Transportista } from '@/types/terceros'
import { useAuth } from '@/hooks/useAuth'
import { focusField, useFormErrors } from '@/hooks/useFormErrors'
import {
  validarEmailCampo,
  validarNitCampo,
  validarRazonSocial,
  validarTelefonoCampo,
} from '@/utils/terceroValidation'
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

const TODOS = 'TODOS'
const SIN_ESPECIFICAR = 'SIN_ESPECIFICAR'

const TIPOS_TRANSPORTE: TipoTransporte[] = ['MARITIMO', 'AEREO', 'TERRESTRE']

const TIPO_TRANSPORTE_LABEL: Record<TipoTransporte | '', string> = {
  MARITIMO: 'Marítimo',
  AEREO: 'Aéreo',
  TERRESTRE: 'Terrestre',
  '': 'Sin especificar',
}

type TransportistaForm = Omit<Transportista, 'id'>

const EMPTY_FORM: TransportistaForm = {
  razon_social: '',
  nit: '',
  tipo_transporte: '',
  telefono: '',
  email: '',
  direccion: '',
  activo: true,
}

const PAGE_SIZE = 20

export function Transportistas() {
  const { role } = useAuth()
  const canWrite = role === 'Administrador' || role === 'Operador de Comercio Exterior'

  const [items, setItems] = useState<Transportista[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Transportista | null>(null)
  const [form, setForm] = useState<TransportistaForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [toggleTarget, setToggleTarget] = useState<Transportista | null>(null)

  const { errors, applyApiError, clearErrors, setFieldError } = useFormErrors()

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hayFiltros = Boolean(search || tipoFiltro)

  async function fetchItems() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage) })
    if (search) params.set('search', search)
    if (tipoFiltro) params.set('tipo_transporte', tipoFiltro)
    try {
      const data = await api.get<PaginatedResponse<Transportista>>(`/transportistas/?${params}`)
      setItems(data.results)
      setTotalCount(data.count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage) })
    if (search) params.set('search', search)
    if (tipoFiltro) params.set('tipo_transporte', tipoFiltro)
    api
      .get<PaginatedResponse<Transportista>>(`/transportistas/?${params}`)
      .then((data) => {
        if (!cancelled) {
          setItems(data.results)
          setTotalCount(data.count)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, tipoFiltro, currentPage])

  function limpiarFiltros() {
    setSearch('')
    setTipoFiltro('')
    setCurrentPage(1)
  }

  function openCreate() {
    setEditItem(null)
    setForm(EMPTY_FORM)
    clearErrors()
    setDialogOpen(true)
  }

  function openEdit(item: Transportista) {
    setEditItem(item)
    const { id: _, ...rest } = item
    setForm(rest)
    clearErrors()
    setDialogOpen(true)
  }

  function setField<K extends keyof TransportistaForm>(key: K, value: TransportistaForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    clearErrors()

    const razonSocial = validarRazonSocial(form.razon_social)
    const nit = validarNitCampo(form.nit)
    const telefono = validarTelefonoCampo(form.telefono)
    const email = validarEmailCampo(form.email)
    if (razonSocial.error || nit.error || telefono.error || email.error) {
      setFieldError('razon_social', razonSocial.error)
      setFieldError('nit', nit.error)
      setFieldError('telefono', telefono.error)
      setFieldError('email', email.error)
      focusField(razonSocial.error ? 'razon_social' : nit.error ? 'nit' : telefono.error ? 'telefono' : 'email')
      return
    }

    const payload = {
      ...form,
      razon_social: razonSocial.valor,
      nit: nit.valor,
      telefono: telefono.valor,
      email: email.valor,
    }

    setSubmitting(true)
    try {
      if (editItem) {
        await api.patch(`/transportistas/${editItem.id}/`, payload)
        toast.success('Transportista actualizado correctamente.')
      } else {
        await api.post('/transportistas/', payload)
        toast.success('Transportista creado correctamente.')
      }
      setDialogOpen(false)
      await fetchItems()
    } catch (err) {
      applyApiError(err)
      toast.error('Error al guardar', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActivo() {
    if (!toggleTarget) return
    try {
      await api.patch(`/transportistas/${toggleTarget.id}/`, { activo: !toggleTarget.activo })
      toast.success(toggleTarget.activo ? 'Transportista desactivado.' : 'Transportista activado.')
      await fetchItems()
    } catch (err) {
      toast.error('No se pudo cambiar el estado', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setToggleTarget(null)
    }
  }

  const colSpan = canWrite ? 6 : 5

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transportistas</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'transportista registrado' : 'transportistas registrados'}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-6 shadow-sm shadow-primary/5">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Buscar por razón social o NIT…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="max-w-xs"
          />

          <Select
            value={tipoFiltro || TODOS}
            onValueChange={(v) => { setTipoFiltro(v === TODOS ? '' : (v ?? '')); setCurrentPage(1) }}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Todos los tipos">
                {(value: string) => (value === TODOS ? 'Todos los tipos' : TIPO_TRANSPORTE_LABEL[value as TipoTransporte])}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los tipos</SelectItem>
              {TIPOS_TRANSPORTE.map((t) => (
                <SelectItem key={t} value={t}>{TIPO_TRANSPORTE_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hayFiltros && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          )}
        </div>

        {canWrite && (
          <Button
            onClick={openCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
          >
            <Plus className="size-4" />
            Nuevo Transportista
          </Button>
        )}
      </div>

      {/* Data Grid */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-muted/50 font-semibold">Razón Social</TableHead>
              <TableHead className="bg-muted/50 font-semibold">NIT</TableHead>
              <TableHead className="bg-muted/50 font-semibold">Tipo de Transporte</TableHead>
              <TableHead className="bg-muted/50 font-semibold">Contacto</TableHead>
              <TableHead className="bg-muted/50 font-semibold">Estado</TableHead>
              {canWrite && (
                <TableHead className="bg-muted/50 font-semibold text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: colSpan }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-8 text-center text-sm text-muted-foreground">
                  {hayFiltros ? 'Sin resultados para los filtros aplicados.' : 'No hay transportistas registrados.'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className="transition-colors duration-200 hover:bg-secondary/40"
                >
                  <TableCell className="font-semibold">{item.razon_social}</TableCell>
                  <TableCell className="font-mono text-sm">{item.nit}</TableCell>
                  <TableCell className="text-sm">{TIPO_TRANSPORTE_LABEL[item.tipo_transporte]}</TableCell>
                  <TableCell className="text-sm">
                    {item.telefono && (
                      <span className="block text-foreground">{item.telefono}</span>
                    )}
                    {item.email && (
                      <span className="block text-muted-foreground">{item.email}</span>
                    )}
                    {!item.telefono && !item.email && (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.activo ? (
                      <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
                        Inactivo
                      </span>
                    )}
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(item)}
                          title="Editar transportista"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setToggleTarget(item)}
                          title={item.activo ? 'Desactivar transportista' : 'Activar transportista'}
                        >
                          <Power className="size-3.5" />
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
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal alta / edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Transportista' : 'Nuevo Transportista'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Fila 1: Razón Social | NIT */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tr_razon_social">
                  Razón Social <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="tr_razon_social"
                  name="razon_social"
                  value={form.razon_social}
                  onChange={(e) => setField('razon_social', e.target.value)}
                  onBlur={(e) => {
                    const { valor, error } = validarRazonSocial(e.target.value)
                    setField('razon_social', valor)
                    setFieldError('razon_social', error)
                  }}
                  required
                  aria-invalid={Boolean(errors.razon_social)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
                {errors.razon_social && (
                  <p className="text-xs text-destructive">{errors.razon_social}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tr_nit">
                  NIT <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="tr_nit"
                  name="nit"
                  value={form.nit}
                  onChange={(e) => setField('nit', e.target.value)}
                  onBlur={(e) => {
                    const { valor, error } = validarNitCampo(e.target.value)
                    setField('nit', valor)
                    setFieldError('nit', error)
                  }}
                  required
                  aria-invalid={Boolean(errors.nit)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
                {errors.nit && <p className="text-xs text-destructive">{errors.nit}</p>}
              </div>

              {/* Fila 2: Tipo de Transporte | Teléfono */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tr_tipo">Tipo de Transporte</Label>
                <Select
                  value={form.tipo_transporte || SIN_ESPECIFICAR}
                  onValueChange={(v) =>
                    setField('tipo_transporte', v === SIN_ESPECIFICAR ? '' : (v as TipoTransporte))
                  }
                >
                  <SelectTrigger id="tr_tipo" className="w-full">
                    <SelectValue placeholder="Sin especificar">
                      {(value: string) =>
                        value === SIN_ESPECIFICAR ? 'Sin especificar' : TIPO_TRANSPORTE_LABEL[value as TipoTransporte]
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_ESPECIFICAR}>Sin especificar</SelectItem>
                    {TIPOS_TRANSPORTE.map((t) => (
                      <SelectItem key={t} value={t}>{TIPO_TRANSPORTE_LABEL[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tr_telefono">Teléfono</Label>
                <Input
                  id="tr_telefono"
                  name="telefono"
                  value={form.telefono}
                  onChange={(e) => setField('telefono', e.target.value)}
                  onBlur={(e) => {
                    const { valor, error } = validarTelefonoCampo(e.target.value)
                    setField('telefono', valor)
                    setFieldError('telefono', error)
                  }}
                  aria-invalid={Boolean(errors.telefono)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
                {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
              </div>

              {/* Fila 3: Email (ancho completo) */}
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="tr_email">Correo Electrónico</Label>
                <Input
                  id="tr_email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  onBlur={(e) => {
                    const { valor, error } = validarEmailCampo(e.target.value)
                    setField('email', valor)
                    setFieldError('email', error)
                  }}
                  aria-invalid={Boolean(errors.email)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Fila 4: Dirección (ancho completo) */}
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="tr_direccion">Dirección</Label>
                <Input
                  id="tr_direccion"
                  value={form.direccion}
                  onChange={(e) => setField('direccion', e.target.value)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
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

      {/* AlertDialog toggle de estado */}
      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={(open) => { if (!open) setToggleTarget(null) }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.activo ? '¿Desactivar transportista?' : '¿Activar transportista?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de cambiar el estado de <strong>{toggleTarget?.razon_social}</strong>?
              Esto afectará su visibilidad en el registro de nuevas operaciones de importación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={toggleTarget?.activo ? 'destructive' : 'default'}
              onClick={handleToggleActivo}
            >
              {toggleTarget?.activo ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
