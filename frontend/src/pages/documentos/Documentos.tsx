import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, FileUp, Loader2, Trash2, Upload } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { OperacionImportacion } from '@/types/importaciones'
import type { Documento, TipoDocumento } from '@/types/documentos'
import { focusField, useFormErrors } from '@/hooks/useFormErrors'
import { formatDate } from '@/utils/formatters'
import { validarArchivoDocumento } from '@/utils/validators'
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

const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'FACTURA', label: 'Factura' },
  { value: 'BL', label: 'Bill of Lading' },
  { value: 'PACKING_LIST', label: 'Packing List' },
  { value: 'CERTIFICADO_ORIGEN', label: 'Certificado de Origen' },
  { value: 'OTRO', label: 'Otro' },
]

function labelTipo(tipo: TipoDocumento): string {
  return TIPOS_DOCUMENTO.find((t) => t.value === tipo)?.label ?? tipo
}

const EMPTY_FORM = { tipo: '' as TipoDocumento | '', nombre: '', fecha_emision: '' }

export function Documentos() {
  const [operaciones, setOperaciones] = useState<OperacionImportacion[]>([])
  const [loadingOperaciones, setLoadingOperaciones] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')

  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loadingDocumentos, setLoadingDocumentos] = useState(false)

  const [form, setForm] = useState(EMPTY_FORM)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Documento | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { errors, applyApiError, clearErrors, setFieldError } = useFormErrors()

  const operacionSeleccionada = operaciones.find((o) => String(o.id) === selectedId) ?? null
  const puedeEliminar = operacionSeleccionada?.estado !== 'LIBERADA'

  useEffect(() => {
    api
      .get<PaginatedResponse<OperacionImportacion>>('/importaciones/?page_size=100')
      .then((data) => setOperaciones(data.results))
      .catch(() => {
        setOperaciones([])
        toast.error('No se pudo cargar la lista de importaciones.')
      })
      .finally(() => setLoadingOperaciones(false))
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setDocumentos([])
      return
    }
    let cancelled = false
    setLoadingDocumentos(true)
    api
      .get<PaginatedResponse<Documento>>(`/documentos/?operacion=${selectedId}`)
      .then((data) => { if (!cancelled) setDocumentos(data.results) })
      .finally(() => { if (!cancelled) setLoadingDocumentos(false) })
    return () => { cancelled = true }
  }, [selectedId])

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleArchivoChange(file: File | null) {
    setArchivo(file)
    if (!file) {
      setFieldError('archivo', null)
      return
    }
    // Validación en tiempo real (checklist #9/#13): mismo criterio que
    // `documentos/serializers.DocumentoSerializer.validate_archivo`.
    setFieldError('archivo', validarArchivoDocumento(file))
  }

  async function handleUpload(e: { preventDefault(): void }) {
    e.preventDefault()
    clearErrors()
    if (!selectedId || !form.tipo) return
    if (archivo) {
      const error = validarArchivoDocumento(archivo)
      if (error) {
        setFieldError('archivo', error)
        focusField('archivo')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = new FormData()
      payload.set('operacion', selectedId)
      payload.set('tipo', form.tipo)
      if (form.nombre) payload.set('nombre', form.nombre)
      if (form.fecha_emision) payload.set('fecha_emision', form.fecha_emision)
      if (archivo) payload.set('archivo', archivo)

      const nuevo = await api.post<Documento>('/documentos/', payload)
      setDocumentos((prev) => [nuevo, ...prev])
      setForm(EMPTY_FORM)
      setArchivo(null)
      const fileInput = document.getElementById('archivo') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''
      toast.success('Documento adjuntado correctamente.')
    } catch (err) {
      applyApiError(err)
      toast.error('No se pudo adjuntar el documento', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEliminar() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/documentos/${deleteTarget.id}/`)
      setDocumentos((prev) => prev.filter((d) => d.id !== deleteTarget.id))
      toast.success('Documento eliminado.')
    } catch (err) {
      toast.error('No se pudo eliminar el documento', {
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
        <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Adjunta y consulta la documentación de respaldo de una operación de importación.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <Label htmlFor="operacion-select" className="mb-1.5 block">Operación de Importación</Label>
        <Select
          value={selectedId}
          onValueChange={(v) => { setSelectedId(v ?? ''); clearErrors() }}
          disabled={loadingOperaciones}
        >
          <SelectTrigger id="operacion-select" className="w-full sm:w-80">
            <SelectValue placeholder={loadingOperaciones ? 'Cargando…' : 'Seleccionar operación…'}>
              {(value: string) => {
                const op = operaciones.find((o) => String(o.id) === value)
                return op ? `${op.codigo_unico}` : 'Seleccionar operación…'
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {operaciones.map((op) => (
              <SelectItem key={op.id} value={String(op.id)}>{op.codigo_unico}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedId ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
          <FileUp className="size-8 opacity-40" />
          Selecciona una operación de importación para ver o adjuntar documentos.
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Adjuntar Documento
            </h2>
            <form onSubmit={handleUpload} className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tipo-doc">Tipo <span className="text-destructive">*</span></Label>
                <Select value={form.tipo} onValueChange={(v) => setField('tipo', (v as TipoDocumento) ?? '')}>
                  <SelectTrigger id="tipo-doc" className="w-full">
                    <SelectValue placeholder="Seleccionar…">
                      {(value: string) => labelTipo(value as TipoDocumento) || 'Seleccionar…'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nombre-doc">Nombre</Label>
                <Input id="nombre-doc" value={form.nombre} onChange={(e) => setField('nombre', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fecha-emision">Fecha de Emisión</Label>
                <Input
                  id="fecha-emision"
                  type="date"
                  value={form.fecha_emision}
                  onChange={(e) => setField('fecha_emision', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="archivo">Archivo</Label>
                <Input
                  id="archivo"
                  name="archivo"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => handleArchivoChange(e.target.files?.[0] ?? null)}
                  aria-invalid={Boolean(errors.archivo)}
                />
                {errors.archivo && <p className="text-xs text-destructive">{errors.archivo}</p>}
              </div>
              <Button type="submit" disabled={submitting || !form.tipo} className="w-full sm:w-auto">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Adjuntar
              </Button>
            </form>
          </div>

          <div className="rounded-lg border border-border">
            <div className="border-b border-border p-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Documentos Adjuntos ({documentos.length})
              </h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha de Emisión</TableHead>
                  <TableHead>Subido</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingDocumentos ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : documentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No hay documentos adjuntos para esta operación.
                    </TableCell>
                  </TableRow>
                ) : (
                  documentos.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{labelTipo(doc.tipo)}</TableCell>
                      <TableCell>{doc.nombre || '—'}</TableCell>
                      <TableCell>{doc.fecha_emision ? formatDate(doc.fecha_emision) : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {doc.archivo && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              nativeButton={false}
                              render={<a href={doc.archivo} target="_blank" rel="noreferrer" />}
                            >
                              <Download className="size-3.5" />
                            </Button>
                          )}
                          {puedeEliminar && (
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(doc)}>
                              <Trash2 className="size-3.5" />
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
        </>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null) }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este documento?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `${labelTipo(deleteTarget.tipo)}${deleteTarget.nombre ? ` — ${deleteTarget.nombre}` : ''}`}
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
