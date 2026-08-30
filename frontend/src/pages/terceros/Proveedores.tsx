import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { Proveedor } from '@/types/terceros'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
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

type ProveedorForm = Omit<Proveedor, 'id'>

const EMPTY_FORM: ProveedorForm = {
  razon_social: '',
  nit: '',
  telefono: '',
  email: '',
  direccion: '',
  activo: true,
  fabrica: '',
  ciudad_origen: '',
  pais: '',
}

const PAGE_SIZE = 20

export function Proveedores() {
  const { role } = useAuth()
  const canWrite = role === 'Administrador' || role === 'Operador de Comercio Exterior'

  const [items, setItems] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Proveedor | null>(null)
  const [form, setForm] = useState<ProveedorForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [toggleTarget, setToggleTarget] = useState<Proveedor | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  async function fetchItems() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage) })
    if (search) params.set('search', search)
    try {
      const data = await api.get<PaginatedResponse<Proveedor>>(`/proveedores/?${params}`)
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
    api
      .get<PaginatedResponse<Proveedor>>(`/proveedores/?${params}`)
      .then((data) => {
        if (!cancelled) {
          setItems(data.results)
          setTotalCount(data.count)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, currentPage])

  function openCreate() {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(item: Proveedor) {
    setEditItem(item)
    const { id: _, ...rest } = item
    setForm(rest)
    setDialogOpen(true)
  }

  function setField<K extends keyof ProveedorForm>(key: K, value: ProveedorForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editItem) {
        await api.patch(`/proveedores/${editItem.id}/`, form)
        toast.success('Proveedor actualizado correctamente.')
      } else {
        await api.post('/proveedores/', form)
        toast.success('Proveedor creado correctamente.')
      }
      setDialogOpen(false)
      await fetchItems()
    } catch (err) {
      toast.error('Error al guardar', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActivo() {
    if (!toggleTarget) return
    try {
      await api.patch(`/proveedores/${toggleTarget.id}/`, { activo: !toggleTarget.activo })
      toast.success(
        toggleTarget.activo ? 'Proveedor desactivado.' : 'Proveedor activado.'
      )
      await fetchItems()
    } catch (err) {
      toast.error('No se pudo cambiar el estado', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setToggleTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'proveedor registrado' : 'proveedores registrados'}
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      <Input
        placeholder="Buscar por razón social o NIT…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
        className="max-w-xs"
      />

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razón Social</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Fábrica</TableHead>
              <TableHead>Estado</TableHead>
              {canWrite && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: canWrite ? 6 : 5 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 6 : 5} className="py-8 text-center text-sm text-muted-foreground">
                  {search ? `Sin resultados para "${search}"` : 'No hay proveedores registrados.'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.razon_social}</TableCell>
                  <TableCell className="font-mono text-sm">{item.nit}</TableCell>
                  <TableCell>{item.pais}</TableCell>
                  <TableCell>{item.fabrica}</TableCell>
                  <TableCell>
                    <Badge variant={item.activo ? 'default' : 'secondary'}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setToggleTarget(item)}
                          className="text-xs"
                        >
                          {item.activo ? 'Desactivar' : 'Activar'}
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

      {/* Modal alta / edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="razon_social">Razón Social *</Label>
                <Input id="razon_social" value={form.razon_social} onChange={(e) => setField('razon_social', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nit">NIT *</Label>
                <Input id="nit" value={form.nit} onChange={(e) => setField('nit', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pais">País *</Label>
                <Input id="pais" value={form.pais} onChange={(e) => setField('pais', e.target.value)} required placeholder="China" />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="fabrica">Fábrica *</Label>
                <Input id="fabrica" value={form.fabrica} onChange={(e) => setField('fabrica', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ciudad_origen">Ciudad de origen</Label>
                <Input id="ciudad_origen" value={form.ciudad_origen} onChange={(e) => setField('ciudad_origen', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={form.telefono} onChange={(e) => setField('telefono', e.target.value)} />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" value={form.direccion} onChange={(e) => setField('direccion', e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog toggle activo */}
      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => { if (!open) setToggleTarget(null) }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.activo ? '¿Desactivar proveedor?' : '¿Activar proveedor?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.razon_social}
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
