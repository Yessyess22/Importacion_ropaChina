import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Power, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse, UsuarioAdmin } from '@/types/api'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 20

const ROLES = [
  'Administrador',
  'Operador de Comercio Exterior',
  'Agente Aduanal',
  'Contabilidad',
  'Cliente Mayorista',
] as const

const ROL_COLOR: Record<string, string> = {
  'Administrador':
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
  'Operador de Comercio Exterior':
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  'Agente Aduanal':
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  'Contabilidad':
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  'Cliente Mayorista':
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
}

interface UsuarioForm {
  username: string
  first_name: string
  last_name: string
  email: string
  password: string
  rol: string
  is_active: boolean
}

const EMPTY_FORM: UsuarioForm = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  rol: '',
  is_active: true,
}

export function Usuarios() {
  const [items, setItems] = useState<UsuarioAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<UsuarioAdmin | null>(null)
  const [form, setForm] = useState<UsuarioForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const [toggleTarget, setToggleTarget] = useState<UsuarioAdmin | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  async function fetchItems() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage) })
    if (search) params.set('search', search)
    try {
      const data = await api.get<PaginatedResponse<UsuarioAdmin>>(`/usuarios/?${params}`)
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
      .get<PaginatedResponse<UsuarioAdmin>>(`/usuarios/?${params}`)
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

  function openEdit(item: UsuarioAdmin) {
    setEditItem(item)
    setForm({
      username: item.username,
      first_name: item.first_name,
      last_name: item.last_name,
      email: item.email,
      password: '',
      rol: item.rol_nombre ?? '',
      is_active: item.is_active,
    })
    setDialogOpen(true)
  }

  function setField<K extends keyof UsuarioForm>(key: K, value: UsuarioForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSubmitting(true)
    const payload: Record<string, unknown> = {
      username: form.username,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      rol: form.rol || null,
      is_active: form.is_active,
    }
    if (form.password) payload.password = form.password
    try {
      if (editItem) {
        await api.patch(`/usuarios/${editItem.id}/`, payload)
        toast.success('Usuario actualizado correctamente.')
      } else {
        await api.post('/usuarios/', payload)
        toast.success('Usuario creado correctamente.')
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

  async function handleToggleActive() {
    if (!toggleTarget) return
    try {
      await api.patch(`/usuarios/${toggleTarget.id}/`, { is_active: !toggleTarget.is_active })
      toast.success(toggleTarget.is_active ? 'Usuario desactivado.' : 'Usuario activado.')
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
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'usuario registrado' : 'usuarios registrados'}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-6 shadow-sm shadow-primary/5">
        <Input
          placeholder="Buscar por nombre, usuario o email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          className="max-w-xs"
        />
        <Button onClick={openCreate} className="transition-all duration-200">
          <Plus className="size-4" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
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
                  {search ? `Sin resultados para "${search}"` : 'No hay usuarios registrados.'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((u) => (
                <TableRow key={u.id} className="transition-colors duration-200 hover:bg-secondary/40">
                  <TableCell className="font-semibold font-mono text-sm">{u.username}</TableCell>
                  <TableCell>
                    {u.first_name || u.last_name
                      ? `${u.first_name} ${u.last_name}`.trim()
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    {u.rol_nombre ? (
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${ROL_COLOR[u.rol_nombre] ?? 'bg-muted text-foreground border-border'}`}
                      >
                        {u.rol_nombre}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.is_active ? (
                      <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
                        Inactivo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(u)}
                        title="Editar usuario"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setToggleTarget(u)}
                        title={u.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        <Power className="size-3.5" />
                      </Button>
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
            <DialogTitle>{editItem ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fila 1: username | rol */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">
                  Usuario <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setField('username', e.target.value)}
                  required
                  autoComplete="off"
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rol">
                  Rol <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Select value={form.rol} onValueChange={(v) => setField('rol', v ?? '')}>
                  <SelectTrigger className="w-full focus-visible:ring-primary focus-visible:border-primary">
                    <SelectValue placeholder="Seleccionar rol…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fila 2: first_name | last_name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">Nombre</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) => setField('first_name', e.target.value)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) => setField('last_name', e.target.value)}
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              {/* Fila 3: email (ancho completo) */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="email">
                  Email <span className="ml-0.5 text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  required
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
              </div>

              {/* Fila 4: password (ancho completo) */}
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="password">
                  Contraseña{!editItem && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  required={!editItem}
                  autoComplete="new-password"
                  className="focus-visible:ring-primary focus-visible:border-primary"
                />
                {editItem && (
                  <p className="text-xs text-muted-foreground">
                    Al editar, deje este campo en blanco para conservar la contraseña actual.
                  </p>
                )}
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

      {/* AlertDialog cambio de estado */}
      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={(open) => { if (!open) setToggleTarget(null) }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.is_active ? '¿Desactivar usuario?' : '¿Activar usuario?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.username}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={toggleTarget?.is_active ? 'destructive' : 'default'}
              onClick={handleToggleActive}
            >
              {toggleTarget?.is_active ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
