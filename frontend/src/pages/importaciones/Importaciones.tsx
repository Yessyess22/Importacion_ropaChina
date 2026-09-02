import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Eye, Pencil, Loader2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { DetalleImportacion, OperacionImportacion } from '@/types/importaciones'
import type { AgenteAduanal, Proveedor, Transportista } from '@/types/terceros'
import type { Prenda } from '@/types/catalogo'
import { useAuth } from '@/hooks/useAuth'
import { useFormErrors } from '@/hooks/useFormErrors'
import { fechaNoFutura, montoNoNegativo, montoPositivo } from '@/utils/validators'
import { formatCurrency, formatDate, formatEstado } from '@/utils/formatters'
import { ESTADOS_IMPORTACION, ESTADO_IMPORTACION_COLOR } from '@/utils/importacionesUi'
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

const PAGE_SIZE = 20

const GESTION_ROLES = ['Administrador', 'Operador de Comercio Exterior']
const ESTADOS_NO_EDITABLES = ['LIBERADA', 'CANCELADA']

type OperacionForm = {
  codigo_unico: string
  proveedor: string
  agente_aduanal: string
  transportista: string
  fecha_registro: string
  ruta_ingreso: string
  valor_fob: string
  valor_flete: string
  valor_seguro: string
}

const EMPTY_OPERACION_FORM: OperacionForm = {
  codigo_unico: '',
  proveedor: '',
  agente_aduanal: '',
  transportista: '',
  fecha_registro: '',
  ruta_ingreso: '',
  valor_fob: '',
  valor_flete: '',
  valor_seguro: '',
}

function LineaImportacionRow({
  linea,
  onSaved,
  onDeleteRequest,
}: {
  linea: DetalleImportacion
  onSaved: () => Promise<void>
  onDeleteRequest: (linea: DetalleImportacion) => void
}) {
  const [cantidad, setCantidad] = useState(String(linea.cantidad))
  const [costo, setCosto] = useState(linea.costo_unitario_fob)
  const [saving, setSaving] = useState(false)

  const dirty = Number(cantidad) !== linea.cantidad || Number(costo) !== Number(linea.costo_unitario_fob)

  async function handleGuardar() {
    const cantidadNum = Number(cantidad)
    if (!Number.isInteger(cantidadNum) || cantidadNum < 1) {
      toast.error('La cantidad debe ser un entero mayor o igual a 1.')
      return
    }
    if (!montoPositivo(costo)) {
      toast.error('El costo unitario FOB debe ser mayor a 0.')
      return
    }
    setSaving(true)
    try {
      await api.patch(`/detalles-importacion/${linea.id}/`, {
        cantidad: cantidadNum,
        costo_unitario_fob: costo,
      })
      toast.success('Línea actualizada.')
      await onSaved()
    } catch (err) {
      toast.error('No se pudo guardar la línea', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <TableRow>
      <TableCell className="text-sm">
        {linea.variante_detalle ? `${linea.variante_detalle.talla} · ${linea.variante_detalle.color}` : `#${linea.variante}`}
      </TableCell>
      <TableCell>
        <Input type="number" min="1" step="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-20" />
      </TableCell>
      <TableCell>
        <Input type="number" min="0.01" step="0.01" value={costo} onChange={(e) => setCosto(e.target.value)} className="w-28" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button type="button" variant="outline" size="sm" disabled={!dirty || saving} onClick={handleGuardar}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : 'Guardar'}
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => onDeleteRequest(linea)} title="Eliminar línea">
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function LineasImportacionEditor({
  operacion,
  prendas,
  onMutated,
  onDeleteRequest,
}: {
  operacion: OperacionImportacion
  prendas: Prenda[]
  onMutated: () => Promise<void>
  onDeleteRequest: (linea: DetalleImportacion) => void
}) {
  const [nuevaVariante, setNuevaVariante] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState('1')
  const [nuevoCosto, setNuevoCosto] = useState('')
  const [creando, setCreando] = useState(false)

  const variantesDisponibles = useMemo(() => {
    const usadas = new Set(operacion.detalles.map((d) => d.variante))
    return prendas.flatMap((p) =>
      p.variantes
        .filter((v) => !usadas.has(v.id))
        .map((v) => ({ id: v.id, label: `${p.codigo_modelo} — ${v.talla} / ${v.color}` })),
    )
  }, [prendas, operacion.detalles])

  async function handleCrear(e: { preventDefault(): void }) {
    e.preventDefault()
    const cantidadNum = Number(nuevaCantidad)
    if (!nuevaVariante) {
      toast.error('Selecciona una variante.')
      return
    }
    if (!Number.isInteger(cantidadNum) || cantidadNum < 1) {
      toast.error('La cantidad debe ser un entero mayor o igual a 1.')
      return
    }
    if (!montoPositivo(nuevoCosto)) {
      toast.error('El costo unitario FOB debe ser mayor a 0.')
      return
    }
    setCreando(true)
    try {
      await api.post('/detalles-importacion/', {
        operacion: operacion.id,
        variante: Number(nuevaVariante),
        cantidad: cantidadNum,
        costo_unitario_fob: nuevoCosto,
      })
      toast.success('Línea agregada.')
      setNuevaVariante('')
      setNuevaCantidad('1')
      setNuevoCosto('')
      await onMutated()
    } catch (err) {
      toast.error('No se pudo agregar la línea', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <h3 className="text-sm font-semibold text-foreground">Líneas de detalle</h3>

      {operacion.detalles.length === 0 ? (
        <p className="text-xs text-muted-foreground">Todavía no hay líneas registradas.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variante</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Costo Unit. FOB</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operacion.detalles.map((linea) => (
              <LineaImportacionRow key={linea.id} linea={linea} onSaved={onMutated} onDeleteRequest={onDeleteRequest} />
            ))}
          </TableBody>
        </Table>
      )}

      <form onSubmit={handleCrear} className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed p-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Variante</Label>
          <Select value={nuevaVariante} onValueChange={(v) => setNuevaVariante(v ?? '')}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Seleccionar…">
                {(value: string) => variantesDisponibles.find((v) => String(v.id) === value)?.label ?? 'Seleccionar…'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {variantesDisponibles.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Cantidad</Label>
          <Input type="number" min="1" step="1" value={nuevaCantidad} onChange={(e) => setNuevaCantidad(e.target.value)} className="h-8 w-20" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Costo Unit. FOB</Label>
          <Input type="number" min="0.01" step="0.01" value={nuevoCosto} onChange={(e) => setNuevoCosto(e.target.value)} className="h-8 w-28" />
        </div>
        <Button type="submit" size="sm" disabled={creando}>
          {creando ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Agregar línea
        </Button>
      </form>
    </div>
  )
}

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
  const [agentes, setAgentes] = useState<AgenteAduanal[]>([])
  const [transportistas, setTransportistas] = useState<Transportista[]>([])
  const [prendas, setPrendas] = useState<Prenda[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<OperacionImportacion | null>(null)
  const [editForm, setEditForm] = useState<OperacionForm>(EMPTY_OPERACION_FORM)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deleteLineaTarget, setDeleteLineaTarget] = useState<DetalleImportacion | null>(null)

  const { errors, applyApiError, clearErrors } = useFormErrors()

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    api
      .get<PaginatedResponse<Proveedor>>('/proveedores/?page_size=100')
      .then((data) => setProveedores(data.results))
      .catch(() => setProveedores([]))
    api
      .get<PaginatedResponse<AgenteAduanal>>('/agentes-aduanales/?page_size=100')
      .then((data) => setAgentes(data.results))
      .catch(() => setAgentes([]))
    api
      .get<PaginatedResponse<Transportista>>('/transportistas/?page_size=100')
      .then((data) => setTransportistas(data.results))
      .catch(() => setTransportistas([]))
    api
      .get<PaginatedResponse<Prenda>>('/prendas/?page_size=100')
      .then((data) => setPrendas(data.results))
      .catch(() => setPrendas([]))
  }, [])

  async function fetchItems() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage) })
    if (search) params.set('search', search)
    if (estadoFiltro) params.set('estado', estadoFiltro)
    if (proveedorFiltro) params.set('proveedor', proveedorFiltro)
    try {
      const data = await api.get<PaginatedResponse<OperacionImportacion>>(`/importaciones/?${params}`)
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

  function openEdit(item: OperacionImportacion) {
    setEditItem(item)
    setEditForm({
      codigo_unico: item.codigo_unico,
      proveedor: String(item.proveedor),
      agente_aduanal: item.agente_aduanal ? String(item.agente_aduanal) : '',
      transportista: item.transportista ? String(item.transportista) : '',
      fecha_registro: item.fecha_registro,
      ruta_ingreso: item.ruta_ingreso,
      valor_fob: item.valor_fob,
      valor_flete: item.valor_flete,
      valor_seguro: item.valor_seguro,
    })
    clearErrors()
    setDialogOpen(true)
  }

  function setEditField<K extends keyof OperacionForm>(key: K, value: OperacionForm[K]) {
    setEditForm((prev) => ({ ...prev, [key]: value }))
  }

  async function refreshEditItem(id: number) {
    const data = await api.get<OperacionImportacion>(`/importaciones/${id}/`)
    setEditItem(data)
  }

  async function handleLineaMutated() {
    if (editItem) await refreshEditItem(editItem.id)
    await fetchItems()
  }

  async function handleSubmitHeader(e: { preventDefault(): void }) {
    e.preventDefault()
    clearErrors()

    if (!fechaNoFutura(editForm.fecha_registro)) {
      toast.error('La fecha de registro no puede ser futura.')
      return
    }
    for (const [campo, mensaje] of [
      ['valor_fob', 'El valor FOB no puede ser negativo.'],
      ['valor_flete', 'El flete no puede ser negativo.'],
      ['valor_seguro', 'El seguro no puede ser negativo.'],
    ] as const) {
      if (!montoNoNegativo(editForm[campo])) {
        toast.error(mensaje)
        return
      }
    }

    if (!editItem) return
    setEditSubmitting(true)
    try {
      const updated = await api.patch<OperacionImportacion>(`/importaciones/${editItem.id}/`, {
        codigo_unico: editForm.codigo_unico,
        proveedor: Number(editForm.proveedor),
        agente_aduanal: editForm.agente_aduanal ? Number(editForm.agente_aduanal) : null,
        transportista: editForm.transportista ? Number(editForm.transportista) : null,
        fecha_registro: editForm.fecha_registro,
        ruta_ingreso: editForm.ruta_ingreso,
        valor_fob: editForm.valor_fob,
        valor_flete: editForm.valor_flete,
        valor_seguro: editForm.valor_seguro,
      })
      setEditItem(updated)
      toast.success('Importación actualizada correctamente.')
      setDialogOpen(false)
      await fetchItems()
    } catch (err) {
      applyApiError(err)
      toast.error('No se pudo actualizar la importación', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleDeleteLinea() {
    if (!deleteLineaTarget) return
    try {
      await api.delete(`/detalles-importacion/${deleteLineaTarget.id}/`)
      toast.success('Línea eliminada.')
      await handleLineaMutated()
    } catch (err) {
      toast.error('No se pudo eliminar la línea', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setDeleteLineaTarget(null)
    }
  }

  const cifPreviewEdit =
    (Number(editForm.valor_fob) || 0) + (Number(editForm.valor_flete) || 0) + (Number(editForm.valor_seguro) || 0)

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
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => navigate(`/importaciones/${item.id}`)}
                        title="Ver detalle"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      {canCreate && !ESTADOS_NO_EDITABLES.includes(item.estado) && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(item)}
                          title="Editar importación"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                    </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-175 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Importación — {editItem?.codigo_unico}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitHeader} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit_codigo_unico">
                  Código Único <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_codigo_unico"
                  name="codigo_unico"
                  value={editForm.codigo_unico}
                  onChange={(e) => setEditField('codigo_unico', e.target.value)}
                  required
                  aria-invalid={Boolean(errors.codigo_unico)}
                />
                {errors.codigo_unico && <p className="text-xs text-destructive">{errors.codigo_unico}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit_proveedor">
                  Proveedor <span className="text-destructive">*</span>
                </Label>
                <Select value={editForm.proveedor} onValueChange={(v) => setEditField('proveedor', v ?? '')}>
                  <SelectTrigger id="edit_proveedor" className="w-full">
                    <SelectValue placeholder="Seleccionar…">
                      {(value: string) => proveedores.find((p) => String(p.id) === value)?.razon_social ?? 'Seleccionar…'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.razon_social}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit_agente">Agente Aduanal</Label>
                <Select value={editForm.agente_aduanal} onValueChange={(v) => setEditField('agente_aduanal', v ?? '')}>
                  <SelectTrigger id="edit_agente" className="w-full">
                    <SelectValue placeholder="Sin asignar">
                      {(value: string) => agentes.find((a) => String(a.id) === value)?.razon_social ?? 'Sin asignar'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {agentes.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.razon_social}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit_transportista">Transportista</Label>
                <Select value={editForm.transportista} onValueChange={(v) => setEditField('transportista', v ?? '')}>
                  <SelectTrigger id="edit_transportista" className="w-full">
                    <SelectValue placeholder="Sin asignar">
                      {(value: string) => transportistas.find((t) => String(t.id) === value)?.razon_social ?? 'Sin asignar'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {transportistas.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.razon_social}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit_fecha_registro">
                  Fecha de Registro <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_fecha_registro"
                  name="fecha_registro"
                  type="date"
                  value={editForm.fecha_registro}
                  onChange={(e) => setEditField('fecha_registro', e.target.value)}
                  required
                  aria-invalid={Boolean(errors.fecha_registro)}
                />
                {errors.fecha_registro && <p className="text-xs text-destructive">{errors.fecha_registro}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit_ruta_ingreso">Ruta de Ingreso</Label>
                <Input
                  id="edit_ruta_ingreso"
                  value={editForm.ruta_ingreso}
                  onChange={(e) => setEditField('ruta_ingreso', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit_valor_fob">
                  Valor FOB <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_valor_fob"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.valor_fob}
                  onChange={(e) => setEditField('valor_fob', e.target.value)}
                  required
                  aria-invalid={Boolean(errors.valor_fob)}
                />
                {errors.valor_fob && <p className="text-xs text-destructive">{errors.valor_fob}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit_valor_flete">
                  Flete <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_valor_flete"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.valor_flete}
                  onChange={(e) => setEditField('valor_flete', e.target.value)}
                  required
                  aria-invalid={Boolean(errors.valor_flete)}
                />
                {errors.valor_flete && <p className="text-xs text-destructive">{errors.valor_flete}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit_valor_seguro">
                  Seguro <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_valor_seguro"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.valor_seguro}
                  onChange={(e) => setEditField('valor_seguro', e.target.value)}
                  required
                  aria-invalid={Boolean(errors.valor_seguro)}
                />
                {errors.valor_seguro && <p className="text-xs text-destructive">{errors.valor_seguro}</p>}
              </div>

              <div className="flex flex-col gap-1.5 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">CIF (previsualización)</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(cifPreviewEdit)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={editSubmitting} className="min-w-25">
                {editSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Guardando…
                  </span>
                ) : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>

          {editItem && (
            <LineasImportacionEditor
              key={editItem.id}
              operacion={editItem}
              prendas={prendas}
              onMutated={handleLineaMutated}
              onDeleteRequest={setDeleteLineaTarget}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteLineaTarget}
        onOpenChange={(open) => { if (!open) setDeleteLineaTarget(null) }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar línea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la línea{' '}
              <strong>
                {deleteLineaTarget?.variante_detalle
                  ? `${deleteLineaTarget.variante_detalle.talla} · ${deleteLineaTarget.variante_detalle.color}`
                  : `#${deleteLineaTarget?.variante}`}
              </strong>{' '}
              de la operación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteLinea}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
