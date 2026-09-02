import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
  Pencil,
  Plus,
  Power,
  Shirt,
  Trash2,
  X,
} from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { Prenda, VarianteProductoResumen } from '@/types/catalogo'
import { useAuth } from '@/hooks/useAuth'
import { useFormErrors } from '@/hooks/useFormErrors'
import { montoPositivo } from '@/utils/validators'
import { formatCurrency, formatEstado } from '@/utils/formatters'
import { ESTADO_VARIANTE_COLOR, stockBadgeClasses } from '@/utils/catalogoUi'
import { getImagenPrenda } from '@/utils/catalogoImagenes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
const TODOS = 'TODOS'
const PEDIDO_ROLES = ['Administrador', 'Operador de Comercio Exterior', 'Cliente Mayorista']
const GESTION_ROLES = ['Administrador', 'Operador de Comercio Exterior']

type PrendaForm = Omit<Prenda, 'id' | 'created_at' | 'updated_at' | 'variantes'>

const EMPTY_PRENDA_FORM: PrendaForm = {
  codigo_modelo: '',
  nombre: '',
  categoria: '',
  temporada: '',
  coleccion: '',
  descripcion: '',
  activo: true,
}

interface VarianteFormRow {
  key: string
  talla: string
  color: string
  precio: string
  stock: string
}

function nuevaVarianteRow(): VarianteFormRow {
  return { key: crypto.randomUUID(), talla: '', color: '', precio: '', stock: '' }
}

function ImagenPrendaCard({ prenda }: { prenda: Prenda }) {
  const [fallo, setFallo] = useState(false)

  if (fallo) {
    return (
      <div className="flex aspect-4/5 w-full items-center justify-center bg-muted">
        <ImageOff className="size-8 text-muted-foreground/50" />
      </div>
    )
  }

  return (
    <img
      src={getImagenPrenda(prenda)}
      alt={prenda.nombre}
      loading="lazy"
      className="aspect-4/5 w-full object-cover"
      onError={() => setFallo(true)}
    />
  )
}

function rangoPrecio(prenda: Prenda): string {
  if (prenda.variantes.length === 0) return 'Sin variantes'
  const precios = prenda.variantes.map((v) => Number(v.precio_unitario))
  const min = Math.min(...precios)
  const max = Math.max(...precios)
  return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`
}

function VarianteRow({
  variante,
  onSaved,
  onDeleteRequest,
}: {
  variante: VarianteProductoResumen
  onSaved: () => Promise<void>
  onDeleteRequest: (variante: VarianteProductoResumen) => void
}) {
  const [talla, setTalla] = useState(variante.talla)
  const [color, setColor] = useState(variante.color)
  const [precio, setPrecio] = useState(variante.precio_unitario)
  const [saving, setSaving] = useState(false)
  const [publicando, setPublicando] = useState(false)

  const dirty =
    talla.trim() !== variante.talla ||
    color.trim() !== variante.color ||
    Number(precio) !== Number(variante.precio_unitario)

  async function handleGuardar() {
    if (!talla.trim() || !color.trim()) {
      toast.error('Talla y color son obligatorios.')
      return
    }
    if (!montoPositivo(precio)) {
      toast.error('El precio debe ser mayor a 0.')
      return
    }
    setSaving(true)
    try {
      await api.patch(`/variantes/${variante.id}/`, {
        talla: talla.trim(),
        color: color.trim(),
        precio_unitario: precio,
      })
      toast.success('Variante actualizada.')
      await onSaved()
    } catch (err) {
      toast.error('No se pudo guardar la variante', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handlePublicar() {
    setPublicando(true)
    try {
      await api.post(`/variantes/${variante.id}/publicar/`)
      toast.success('Variante publicada.')
      await onSaved()
    } catch (err) {
      toast.error('No se pudo publicar la variante', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setPublicando(false)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Talla</Label>
        <Input value={talla} onChange={(e) => setTalla(e.target.value)} className="h-8 w-20" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Color</Label>
        <Input value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-28" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Precio</Label>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="h-8 w-24"
        />
      </div>
      <span
        className={`inline-flex h-8 items-center rounded-md border px-2 text-xs font-medium ${ESTADO_VARIANTE_COLOR[variante.estado]}`}
      >
        {formatEstado(variante.estado)}
      </span>
      <span
        className={`inline-flex h-8 items-center rounded-md border px-2 text-xs font-medium ${stockBadgeClasses(variante.stock_disponible)}`}
      >
        Stock: {variante.stock_disponible}
      </span>
      <div className="ml-auto flex gap-1">
        <Button type="button" variant="outline" size="sm" disabled={!dirty || saving} onClick={handleGuardar}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : 'Guardar'}
        </Button>
        {variante.estado === 'BORRADOR' && (
          <Button type="button" variant="outline" size="sm" disabled={publicando} onClick={handlePublicar}>
            {publicando ? <Loader2 className="size-3.5 animate-spin" /> : 'Publicar'}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onDeleteRequest(variante)}
          title="Eliminar variante"
        >
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  )
}

function VariantesEditor({
  prenda,
  onMutated,
  onDeleteRequest,
}: {
  prenda: Prenda
  onMutated: () => Promise<void>
  onDeleteRequest: (variante: VarianteProductoResumen) => void
}) {
  const [nuevaTalla, setNuevaTalla] = useState('')
  const [nuevoColor, setNuevoColor] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [nuevoStock, setNuevoStock] = useState('')
  const [creando, setCreando] = useState(false)

  async function handleCrear(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!nuevaTalla.trim() || !nuevoColor.trim()) {
      toast.error('Talla y color son obligatorios.')
      return
    }
    if (!montoPositivo(nuevoPrecio)) {
      toast.error('El precio debe ser mayor a 0.')
      return
    }
    setCreando(true)
    try {
      const creada = await api.post<VarianteProductoResumen>('/variantes/', {
        prenda: prenda.id,
        talla: nuevaTalla.trim(),
        color: nuevoColor.trim(),
        precio_unitario: nuevoPrecio,
      })
      toast.success('Variante creada.')

      const stockInicial = Number(nuevoStock)
      if (nuevoStock.trim() && Number.isInteger(stockInicial) && stockInicial > 0) {
        try {
          await api.post('/movimientos-inventario/entrada/', {
            variante: creada.id,
            cantidad: stockInicial,
            observacion: 'Alta inicial de variante',
          })
        } catch (err) {
          toast.error('Variante creada, pero no se pudo registrar el stock inicial', {
            description: err instanceof Error ? err.message : undefined,
          })
        }
      }

      setNuevaTalla('')
      setNuevoColor('')
      setNuevoPrecio('')
      setNuevoStock('')
      await onMutated()
    } catch (err) {
      toast.error('No se pudo crear la variante', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setCreando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <h3 className="text-sm font-semibold text-foreground">Variantes</h3>

      {prenda.variantes.length === 0 ? (
        <p className="text-xs text-muted-foreground">Todavía no hay variantes registradas.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {prenda.variantes.map((v) => (
            <VarianteRow key={v.id} variante={v} onSaved={onMutated} onDeleteRequest={onDeleteRequest} />
          ))}
        </div>
      )}

      <form onSubmit={handleCrear} className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed p-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="nueva-talla" className="text-xs">Talla</Label>
          <Input
            id="nueva-talla"
            value={nuevaTalla}
            onChange={(e) => setNuevaTalla(e.target.value)}
            className="h-8 w-20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="nuevo-color" className="text-xs">Color</Label>
          <Input
            id="nuevo-color"
            value={nuevoColor}
            onChange={(e) => setNuevoColor(e.target.value)}
            className="h-8 w-28"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="nuevo-precio" className="text-xs">Precio</Label>
          <Input
            id="nuevo-precio"
            type="number"
            min="0.01"
            step="0.01"
            value={nuevoPrecio}
            onChange={(e) => setNuevoPrecio(e.target.value)}
            className="h-8 w-24"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="nuevo-stock" className="text-xs">Stock inicial</Label>
          <Input
            id="nuevo-stock"
            type="number"
            min="0"
            step="1"
            value={nuevoStock}
            onChange={(e) => setNuevoStock(e.target.value)}
            className="h-8 w-24"
          />
        </div>
        <Button type="submit" size="sm" disabled={creando}>
          {creando ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Agregar variante
        </Button>
      </form>
    </div>
  )
}

export function Catalogo() {
  const { role } = useAuth()
  const canPedir = role != null && PEDIDO_ROLES.includes(role)
  const canGestionar = role != null && GESTION_ROLES.includes(role)

  const [items, setItems] = useState<Prenda[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [tallaFiltro, setTallaFiltro] = useState('')
  const [colorFiltro, setColorFiltro] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Catálogo completo (sin filtros) solo para derivar las opciones de los
  // Select de categoría/talla/color — igual al patrón de `proveedores` en
  // la vista de Importaciones.
  const [opciones, setOpciones] = useState<Prenda[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Prenda | null>(null)
  const [form, setForm] = useState<PrendaForm>(EMPTY_PRENDA_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [toggleTarget, setToggleTarget] = useState<Prenda | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Prenda | null>(null)
  const [deleteVarianteTarget, setDeleteVarianteTarget] = useState<VarianteProductoResumen | null>(null)

  const [variantesPendientes, setVariantesPendientes] = useState<VarianteFormRow[]>([])

  const { errors, applyApiError, clearErrors } = useFormErrors()

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hayFiltros = Boolean(search || categoriaFiltro || tallaFiltro || colorFiltro)

  useEffect(() => {
    api
      .get<PaginatedResponse<Prenda>>('/prendas/?page_size=100')
      .then((data) => setOpciones(data.results))
      .catch(() => setOpciones([]))
  }, [])

  const categorias = useMemo(
    () => Array.from(new Set(opciones.map((p) => p.categoria).filter(Boolean))).sort(),
    [opciones],
  )
  const tallas = useMemo(
    () =>
      Array.from(new Set(opciones.flatMap((p) => p.variantes.map((v) => v.talla)))).sort(),
    [opciones],
  )
  const colores = useMemo(
    () =>
      Array.from(new Set(opciones.flatMap((p) => p.variantes.map((v) => v.color)))).sort(),
    [opciones],
  )

  async function fetchItems() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), page_size: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (categoriaFiltro) params.set('categoria', categoriaFiltro)
    if (tallaFiltro) params.set('talla', tallaFiltro)
    if (colorFiltro) params.set('color', colorFiltro)
    try {
      const data = await api.get<PaginatedResponse<Prenda>>(`/prendas/?${params}`)
      setItems(data.results)
      setTotalCount(data.count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), page_size: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (categoriaFiltro) params.set('categoria', categoriaFiltro)
    if (tallaFiltro) params.set('talla', tallaFiltro)
    if (colorFiltro) params.set('color', colorFiltro)
    api
      .get<PaginatedResponse<Prenda>>(`/prendas/?${params}`)
      .then((data) => {
        if (!cancelled) {
          setItems(data.results)
          setTotalCount(data.count)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, categoriaFiltro, tallaFiltro, colorFiltro, currentPage])

  function limpiarFiltros() {
    setSearch('')
    setCategoriaFiltro('')
    setTallaFiltro('')
    setColorFiltro('')
    setCurrentPage(1)
  }

  function openCreatePrenda() {
    setEditItem(null)
    setForm(EMPTY_PRENDA_FORM)
    setVariantesPendientes([])
    clearErrors()
    setDialogOpen(true)
  }

  function openEditPrenda(item: Prenda) {
    setEditItem(item)
    const { id: _id, created_at: _c, updated_at: _u, variantes: _v, ...rest } = item
    setForm(rest)
    clearErrors()
    setDialogOpen(true)
  }

  function setField<K extends keyof PrendaForm>(key: K, value: PrendaForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addVarianteRow() {
    setVariantesPendientes((prev) => [...prev, nuevaVarianteRow()])
  }

  function removeVarianteRow(key: string) {
    setVariantesPendientes((prev) => prev.filter((r) => r.key !== key))
  }

  function updateVarianteRow<K extends keyof VarianteFormRow>(key: string, field: K, value: VarianteFormRow[K]) {
    setVariantesPendientes((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  async function refreshEditItem(id: number) {
    const data = await api.get<Prenda>(`/prendas/${id}/`)
    setEditItem(data)
  }

  async function handleVarianteMutated() {
    if (editItem) await refreshEditItem(editItem.id)
    await fetchItems()
  }

  async function handleSubmitPrenda(e: { preventDefault(): void }) {
    e.preventDefault()
    clearErrors()

    if (!editItem && variantesPendientes.length > 0) {
      if (variantesPendientes.some((v) => !v.talla.trim() || !v.color.trim())) {
        toast.error('Completa talla y color de cada variante, o elimínala.')
        return
      }
      if (variantesPendientes.some((v) => !montoPositivo(v.precio))) {
        toast.error('El precio de cada variante debe ser mayor a 0.')
        return
      }
      const combinaciones = variantesPendientes.map((v) => `${v.talla.trim()}|${v.color.trim()}`)
      if (new Set(combinaciones).size !== combinaciones.length) {
        toast.error('No puedes repetir la misma combinación de talla y color en dos variantes.')
        return
      }
    }

    setSubmitting(true)
    try {
      if (editItem) {
        const updated = await api.patch<Prenda>(`/prendas/${editItem.id}/`, form)
        setEditItem(updated)
        toast.success('Prenda actualizada correctamente.')
        setDialogOpen(false)
      } else {
        const created = await api.post<Prenda>('/prendas/', form)

        let fallos = 0
        for (const linea of variantesPendientes) {
          try {
            const variante = await api.post<VarianteProductoResumen>('/variantes/', {
              prenda: created.id,
              talla: linea.talla.trim(),
              color: linea.color.trim(),
              precio_unitario: linea.precio,
            })

            const stockInicial = Number(linea.stock)
            if (linea.stock.trim() && Number.isInteger(stockInicial) && stockInicial > 0) {
              await api.post('/movimientos-inventario/entrada/', {
                variante: variante.id,
                cantidad: stockInicial,
                observacion: 'Alta inicial de variante',
              })
            }
          } catch {
            fallos += 1
          }
        }

        if (fallos > 0) {
          toast.error(`Prenda creada, pero ${fallos} variante(s) no se pudieron registrar.`)
        } else {
          toast.success('Prenda creada correctamente.')
        }

        setDialogOpen(false)
      }
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
      await api.patch(`/prendas/${toggleTarget.id}/`, { activo: !toggleTarget.activo })
      toast.success(toggleTarget.activo ? 'Prenda desactivada.' : 'Prenda activada.')
      if (editItem?.id === toggleTarget.id) await refreshEditItem(toggleTarget.id)
      await fetchItems()
    } catch (err) {
      toast.error('No se pudo cambiar el estado', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setToggleTarget(null)
    }
  }

  async function handleDeletePrenda() {
    if (!deleteTarget) return
    try {
      await api.delete(`/prendas/${deleteTarget.id}/`)
      toast.success('Prenda eliminada.')
      if (editItem?.id === deleteTarget.id) {
        setDialogOpen(false)
        setEditItem(null)
      }
      await fetchItems()
    } catch (err) {
      toast.error('No se pudo eliminar', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  async function handleDeleteVariante() {
    if (!deleteVarianteTarget) return
    try {
      await api.delete(`/variantes/${deleteVarianteTarget.id}/`)
      toast.success('Variante eliminada.')
      await handleVarianteMutated()
    } catch (err) {
      toast.error('No se pudo eliminar la variante', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setDeleteVarianteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'modelo disponible' : 'modelos disponibles'}
          </p>
        </div>

        <div className="flex gap-2">
          {canGestionar && (
            <Button onClick={openCreatePrenda}>
              <Plus className="size-4" />
              Nueva Prenda
            </Button>
          )}
          {canPedir && (
            <Button variant="outline" nativeButton={false} render={<Link to="/pedidos/nuevo" />}>
              <Plus className="size-4" />
              Nuevo Pedido
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Input
          placeholder="Buscar por nombre o código…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          className="max-w-xs"
        />

        <Select
          value={categoriaFiltro || TODOS}
          onValueChange={(v) => { setCategoriaFiltro(v === TODOS ? '' : (v ?? '')); setCurrentPage(1) }}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Todas las categorías">
              {(value: string) => (value === TODOS ? 'Todas las categorías' : value)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={tallaFiltro || TODOS}
          onValueChange={(v) => { setTallaFiltro(v === TODOS ? '' : (v ?? '')); setCurrentPage(1) }}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Toda talla">
              {(value: string) => (value === TODOS ? 'Toda talla' : value)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Toda talla</SelectItem>
            {tallas.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={colorFiltro || TODOS}
          onValueChange={(v) => { setColorFiltro(v === TODOS ? '' : (v ?? '')); setCurrentPage(1) }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Todo color">
              {(value: string) => (value === TODOS ? 'Todo color' : value)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todo color</SelectItem>
            {colores.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hayFiltros && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={limpiarFiltros}>
            <X className="size-3.5" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden p-0">
              <Skeleton className="aspect-4/5 w-full rounded-none" />
              <CardContent className="flex flex-col gap-2 py-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-16 text-center">
          <Shirt className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {hayFiltros ? 'Sin resultados para los filtros aplicados.' : 'Todavía no hay modelos en el catálogo.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((prenda) => (
            <Card key={prenda.id} className="overflow-hidden p-0 transition-shadow hover:shadow-md">
              <div className="relative">
                <ImagenPrendaCard prenda={prenda} />
                {prenda.categoria && (
                  <Badge variant="secondary" className="absolute left-2 top-2 shadow-sm">
                    {prenda.categoria}
                  </Badge>
                )}
                {!prenda.activo && (
                  <Badge variant="outline" className="absolute right-2 top-2 bg-card shadow-sm">
                    Inactivo
                  </Badge>
                )}
              </div>
              <CardContent className="flex flex-col gap-2 py-4">
                <div>
                  <p className="font-mono text-[11px] text-muted-foreground">{prenda.codigo_modelo}</p>
                  <p className="truncate text-sm font-semibold text-foreground">{prenda.nombre}</p>
                </div>

                <p className="text-sm font-medium text-primary">{rangoPrecio(prenda)}</p>

                <div className="flex flex-wrap gap-1">
                  {prenda.variantes.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin variantes registradas</span>
                  ) : (
                    prenda.variantes.map((v) => (
                      <span
                        key={v.id}
                        title={`${formatEstado(v.estado)} · Stock: ${v.stock_disponible}`}
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${ESTADO_VARIANTE_COLOR[v.estado]} ${v.stock_disponible === 0 ? 'opacity-50' : ''}`}
                      >
                        {v.talla} · {v.color}
                      </span>
                    ))
                  )}
                </div>

                {canGestionar && (
                  <div className="flex justify-end gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditPrenda(prenda)}
                      title="Editar prenda"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setToggleTarget(prenda)}
                      title={prenda.activo ? 'Desactivar prenda' : 'Activar prenda'}
                    >
                      <Power className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(prenda)}
                      title="Eliminar prenda"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

      {/* Modal alta / edición de Prenda + gestión de variantes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-175 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? `Editar Prenda — ${editItem.codigo_modelo}` : 'Nueva Prenda'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPrenda} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="codigo_modelo">
                  Código de modelo <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="codigo_modelo"
                  name="codigo_modelo"
                  value={form.codigo_modelo}
                  onChange={(e) => setField('codigo_modelo', e.target.value)}
                  required
                  aria-invalid={Boolean(errors.codigo_modelo)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
                {errors.codigo_modelo && <p className="text-xs text-destructive">{errors.codigo_modelo}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nombre">
                  Nombre <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={(e) => setField('nombre', e.target.value)}
                  required
                  aria-invalid={Boolean(errors.nombre)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  name="categoria"
                  value={form.categoria}
                  onChange={(e) => setField('categoria', e.target.value)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="temporada">Temporada</Label>
                <Input
                  id="temporada"
                  name="temporada"
                  value={form.temporada}
                  onChange={(e) => setField('temporada', e.target.value)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="coleccion">Colección</Label>
                <Input
                  id="coleccion"
                  name="coleccion"
                  value={form.coleccion}
                  onChange={(e) => setField('coleccion', e.target.value)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={(e) => setField('descripcion', e.target.value)}
                  rows={3}
                  className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/50"
                />
              </div>
            </div>

            {!editItem && (
              <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Variantes ({variantesPendientes.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Agrega las tallas/colores con las que nace este producto. Puedes dejarlo sin
                      variantes y agregarlas después.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addVarianteRow}>
                    <Plus className="size-4" />
                    Agregar variante
                  </Button>
                </div>

                {variantesPendientes.map((linea) => (
                  <div key={linea.key} className="flex flex-wrap items-end gap-2 rounded-lg border p-2.5">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Talla</Label>
                      <Input
                        value={linea.talla}
                        onChange={(e) => updateVarianteRow(linea.key, 'talla', e.target.value)}
                        className="h-8 w-20"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Color</Label>
                      <Input
                        value={linea.color}
                        onChange={(e) => updateVarianteRow(linea.key, 'color', e.target.value)}
                        className="h-8 w-28"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Precio</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={linea.precio}
                        onChange={(e) => updateVarianteRow(linea.key, 'precio', e.target.value)}
                        className="h-8 w-24"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Stock inicial</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={linea.stock}
                        onChange={(e) => updateVarianteRow(linea.key, 'stock', e.target.value)}
                        className="h-8 w-24"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="ml-auto"
                      onClick={() => removeVarianteRow(linea.key)}
                      title="Quitar variante"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

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

          {editItem && (
            <VariantesEditor
              key={editItem.id}
              prenda={editItem}
              onMutated={handleVarianteMutated}
              onDeleteRequest={setDeleteVarianteTarget}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog toggle de estado de Prenda */}
      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={(open) => { if (!open) setToggleTarget(null) }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.activo ? '¿Desactivar prenda?' : '¿Activar prenda?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de cambiar el estado de <strong>{toggleTarget?.nombre}</strong>?
              Esto afectará su visibilidad en el catálogo mayorista.
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

      {/* AlertDialog eliminar Prenda */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar prenda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará <strong>{deleteTarget?.nombre}</strong> de forma permanente.
              Si tiene variantes asociadas, la operación será rechazada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeletePrenda}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog eliminar Variante */}
      <AlertDialog
        open={!!deleteVarianteTarget}
        onOpenChange={(open) => { if (!open) setDeleteVarianteTarget(null) }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar variante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la variante{' '}
              <strong>{deleteVarianteTarget?.talla} · {deleteVarianteTarget?.color}</strong>.
              Si tiene movimientos de stock registrados, la operación será rechazada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteVariante}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
