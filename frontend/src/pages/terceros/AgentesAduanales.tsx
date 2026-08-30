import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { AgenteAduanal } from '@/types/terceros'
import { useAuth } from '@/hooks/useAuth'
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

type AgenteForm = Omit<AgenteAduanal, 'id'>

const EMPTY_FORM: AgenteForm = {
  razon_social: '',
  nit: '',
  telefono: '',
  email: '',
  direccion: '',
  activo: true,
  numero_registro: '',
}

const PAGE_SIZE = 20

export function AgentesAduanales() {
  const { role } = useAuth()
  const canWrite =
    role === 'Administrador' ||
    role === 'Operador de Comercio Exterior' ||
    role === 'Agente Aduanal'

  const [items, setItems] = useState<AgenteAduanal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<AgenteAduanal | null>(null)
  const [form, setForm] = useState<AgenteForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [toggleTarget, setToggleTarget] = useState<AgenteAduanal | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  async function fetchItems() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage) })
    if (search) params.set('search', search)
    try {
      const data = await api.get<PaginatedResponse<AgenteAduanal>>(`/agentes-aduanales/?${params}`)
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
      .get<PaginatedResponse<AgenteAduanal>>(`/agentes-aduanales/?${params}`)
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

  function openEdit(item: AgenteAduanal) {
    setEditItem(item)
    const { id: _, ...rest } = item
    setForm(rest)
    setDialogOpen(true)
  }

  function setField<K extends keyof AgenteForm>(key: K, value: AgenteForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editItem) {
        await api.patch(`/agentes-aduanales/${editItem.id}/`, form)
        toast.success('Agente actualizado correctamente.')
      } else {
        await api.post('/agentes-aduanales/', form)
        toast.success('Agente creado correctamente.')
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
      await api.patch(`/agentes-aduanales/${toggleTarget.id}/`, { activo: !toggleTarget.activo })
      toast.success(toggleTarget.activo ? 'Agente desactivado.' : 'Agente activado.')
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agentes Aduanales</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'agente registrado' : 'agentes registrados'}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Input
          placeholder="Buscar por razón social o NIT…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          className="max-w-xs"
        />
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo Agente
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razón Social</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>N.º Registro</TableHead>
              <TableHead>Teléfono</TableHead>
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
                  {search ? `Sin resultados para "${search}"` : 'No hay agentes registrados.'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.razon_social}</TableCell>
                  <TableCell className="font-mono text-sm">{item.nit}</TableCell>
                  <TableCell className="font-mono text-sm">{item.numero_registro}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.telefono || '—'}</TableCell>
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
            <DialogTitle>{editItem ? 'Editar Agente' : 'Nuevo Agente Aduanal'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="ag_razon_social">Razón Social *</Label>
                <Input id="ag_razon_social" value={form.razon_social} onChange={(e) => setField('razon_social', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ag_nit">NIT *</Label>
                <Input id="ag_nit" value={form.nit} onChange={(e) => setField('nit', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ag_registro">N.º Registro Aduanero *</Label>
                <Input id="ag_registro" value={form.numero_registro} onChange={(e) => setField('numero_registro', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ag_telefono">Teléfono *</Label>
                <Input id="ag_telefono" value={form.telefono} onChange={(e) => setField('telefono', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ag_email">Email *</Label>
                <Input id="ag_email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="ag_direccion">Dirección *</Label>
                <Input id="ag_direccion" value={form.direccion} onChange={(e) => setField('direccion', e.target.value)} required />
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

      {/* AlertDialog toggle activo */}
      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => { if (!open) setToggleTarget(null) }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.activo ? '¿Desactivar agente?' : '¿Activar agente?'}
            </AlertDialogTitle>
            <AlertDialogDescription>{toggleTarget?.razon_social}</AlertDialogDescription>
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
