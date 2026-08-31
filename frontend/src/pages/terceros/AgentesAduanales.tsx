import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Power, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

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
  numero_registro: '',
  telefono: '',
  email: '',
  direccion: '',
  activo: true,
}

const PAGE_SIZE = 20

export function AgentesAduanales() {
  const { role } = useAuth()
  const canWrite = role === 'Administrador' || role === 'Operador de Comercio Exterior'

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
        toast.success('Agente aduanal actualizado correctamente.')
      } else {
        await api.post('/agentes-aduanales/', form)
        toast.success('Agente aduanal creado correctamente.')
      }
      setDialogOpen(false)
      await fetchItems()
    } catch (err) {
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
      await api.patch(`/agentes-aduanales/${toggleTarget.id}/`, { activo: !toggleTarget.activo })
      toast.success(toggleTarget.activo ? 'Agente aduanal desactivado.' : 'Agente aduanal activado.')
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
        <h1 className="text-2xl font-bold text-foreground">Agentes Aduanales</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'agente registrado' : 'agentes registrados'}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-6 shadow-sm shadow-primary/5">
        <Input
          placeholder="Buscar por razón social o NIT…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          className="max-w-xs"
        />
        {canWrite && (
          <Button
            onClick={openCreate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
          >
            <Plus className="size-4" />
            Nuevo Agente
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
              <TableHead className="bg-muted/50 font-semibold">Registro Aduanero</TableHead>
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
                  {search ? `Sin resultados para "${search}"` : 'No hay agentes registrados.'}
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
                  <TableCell className="font-mono text-sm">{item.numero_registro}</TableCell>
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
                          title="Editar agente"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setToggleTarget(item)}
                          title={item.activo ? 'Desactivar agente' : 'Activar agente'}
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
            <DialogTitle>{editItem ? 'Editar Agente Aduanal' : 'Nuevo Agente Aduanal'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Fila 1: Razón Social | NIT */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ag_razon_social">
                  Razón Social <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="ag_razon_social"
                  value={form.razon_social}
                  onChange={(e) => setField('razon_social', e.target.value)}
                  required
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ag_nit">
                  NIT <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="ag_nit"
                  value={form.nit}
                  onChange={(e) => setField('nit', e.target.value)}
                  required
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              {/* Fila 2: Registro Aduanero | Teléfono */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ag_registro">
                  Registro Aduanero <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="ag_registro"
                  value={form.numero_registro}
                  onChange={(e) => setField('numero_registro', e.target.value)}
                  required
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ag_telefono">Teléfono</Label>
                <Input
                  id="ag_telefono"
                  value={form.telefono}
                  onChange={(e) => setField('telefono', e.target.value)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              {/* Fila 3: Email (ancho completo) */}
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="ag_email">
                  Correo Electrónico <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="ag_email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  required
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              {/* Fila 4: Dirección (ancho completo) */}
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="ag_direccion">Dirección</Label>
                <Input
                  id="ag_direccion"
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
              {toggleTarget?.activo ? '¿Desactivar agente aduanal?' : '¿Activar agente aduanal?'}
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
