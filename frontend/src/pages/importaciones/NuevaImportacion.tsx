import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { OperacionImportacion } from '@/types/importaciones'
import type { AgenteAduanal, Proveedor, Transportista } from '@/types/terceros'
import type { Prenda } from '@/types/catalogo'
import { formatCurrency } from '@/utils/formatters'
import { fechaNoFutura, montoNoNegativo } from '@/utils/validators'
import { focusField, useFormErrors } from '@/hooks/useFormErrors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface LineaForm {
  key: string
  variante: string
  cantidad: string
  costo_unitario_fob: string
}

const EMPTY_GENERAL = {
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

function nuevaLinea(): LineaForm {
  return { key: crypto.randomUUID(), variante: '', cantidad: '1', costo_unitario_fob: '' }
}

export function NuevaImportacion() {
  const navigate = useNavigate()

  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [agentes, setAgentes] = useState<AgenteAduanal[]>([])
  const [transportistas, setTransportistas] = useState<Transportista[]>([])
  const [prendas, setPrendas] = useState<Prenda[]>([])
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)

  const [form, setForm] = useState(EMPTY_GENERAL)
  const [lineas, setLineas] = useState<LineaForm[]>([])
  const [submitting, setSubmitting] = useState(false)

  const { errors, applyApiError, clearErrors, setFieldError } = useFormErrors()

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Proveedor>>('/proveedores/?page_size=100'),
      api.get<PaginatedResponse<AgenteAduanal>>('/agentes-aduanales/?page_size=100'),
      api.get<PaginatedResponse<Transportista>>('/transportistas/?page_size=100'),
      api.get<PaginatedResponse<Prenda>>('/prendas/?page_size=100'),
    ])
      .then(([prov, ag, trans, prend]) => {
        setProveedores(prov.results)
        setAgentes(ag.results)
        setTransportistas(trans.results)
        setPrendas(prend.results)
      })
      .finally(() => setLoadingCatalogos(false))
  }, [])

  const variantesDisponibles = useMemo(
    () =>
      prendas.flatMap((p) =>
        p.variantes.map((v) => ({
          id: v.id,
          label: `${p.codigo_modelo} — ${v.talla} / ${v.color}`,
        }))
      ),
    [prendas]
  )

  const cifPreview =
    (Number(form.valor_fob) || 0) + (Number(form.valor_flete) || 0) + (Number(form.valor_seguro) || 0)

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addLinea() {
    setLineas((prev) => [...prev, nuevaLinea()])
  }

  function removeLinea(key: string) {
    setLineas((prev) => prev.filter((l) => l.key !== key))
  }

  function updateLinea<K extends keyof LineaForm>(key: string, field: K, value: LineaForm[K]) {
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)))
  }

  function variantesParaLinea(lineaKey: string) {
    const usadasEnOtras = new Set(lineas.filter((l) => l.key !== lineaKey).map((l) => l.variante))
    return variantesDisponibles.filter((v) => !usadasEnOtras.has(String(v.id)))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    clearErrors()

    if (!form.proveedor) {
      toast.error('Selecciona un proveedor.')
      return
    }
    if (lineas.length > 0 && lineas.some((l) => !l.variante || !l.cantidad || !l.costo_unitario_fob)) {
      toast.error('Completa todos los campos de cada línea o elimínala.')
      return
    }
    const variantesUsadas = lineas.map((l) => l.variante)
    if (new Set(variantesUsadas).size !== variantesUsadas.length) {
      toast.error('No puedes repetir la misma variante en dos líneas.')
      return
    }

    // Validación en tiempo real (checklist #6/#7/#13): evita el round-trip
    // al backend para el error más común, sin reemplazarlo.
    if (!fechaNoFutura(form.fecha_registro)) {
      setFieldError('fecha_registro', 'La fecha de registro no puede ser futura.')
      focusField('fecha_registro')
      return
    }
    const camposMonto: Array<['valor_fob' | 'valor_flete' | 'valor_seguro', string]> = [
      ['valor_fob', 'El valor FOB no puede ser negativo.'],
      ['valor_flete', 'El flete no puede ser negativo.'],
      ['valor_seguro', 'El seguro no puede ser negativo.'],
    ]
    for (const [campo, mensaje] of camposMonto) {
      if (!montoNoNegativo(form[campo])) {
        setFieldError(campo, mensaje)
        focusField(campo)
        return
      }
    }

    setSubmitting(true)
    try {
      const operacion = await api.post<OperacionImportacion>('/importaciones/', {
        codigo_unico: form.codigo_unico,
        proveedor: Number(form.proveedor),
        agente_aduanal: form.agente_aduanal ? Number(form.agente_aduanal) : null,
        transportista: form.transportista ? Number(form.transportista) : null,
        fecha_registro: form.fecha_registro,
        ruta_ingreso: form.ruta_ingreso,
        valor_fob: form.valor_fob,
        valor_flete: form.valor_flete,
        valor_seguro: form.valor_seguro,
      })

      let fallos = 0
      for (const linea of lineas) {
        try {
          await api.post('/detalles-importacion/', {
            operacion: operacion.id,
            variante: Number(linea.variante),
            cantidad: Number(linea.cantidad),
            costo_unitario_fob: linea.costo_unitario_fob,
          })
        } catch {
          fallos += 1
        }
      }

      if (fallos > 0) {
        toast.error(`Operación creada, pero ${fallos} línea(s) no se pudieron registrar.`)
      } else {
        toast.success('Importación registrada correctamente.')
      }
      navigate(`/importaciones/${operacion.id}`)
    } catch (err) {
      applyApiError(err)
      toast.error('No se pudo registrar la importación', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/importaciones')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Importación</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            El CIF se calcula automáticamente en el backend a partir de FOB, flete y seguro.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Datos Generales
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="codigo_unico">Código Único <span className="text-destructive">*</span></Label>
              <Input
                id="codigo_unico"
                value={form.codigo_unico}
                onChange={(e) => setField('codigo_unico', e.target.value)}
                placeholder="IMP-2026-001"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proveedor">Proveedor <span className="text-destructive">*</span></Label>
              <Select value={form.proveedor} onValueChange={(v) => setField('proveedor', v ?? '')} disabled={loadingCatalogos}>
                <SelectTrigger id="proveedor" className="w-full">
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
              <Label htmlFor="agente">Agente Aduanal</Label>
              <Select value={form.agente_aduanal} onValueChange={(v) => setField('agente_aduanal', v ?? '')} disabled={loadingCatalogos}>
                <SelectTrigger id="agente" className="w-full">
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
              <Label htmlFor="transportista">Transportista</Label>
              <Select value={form.transportista} onValueChange={(v) => setField('transportista', v ?? '')} disabled={loadingCatalogos}>
                <SelectTrigger id="transportista" className="w-full">
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
              <Label htmlFor="fecha_registro">Fecha de Registro <span className="text-destructive">*</span></Label>
              <Input
                id="fecha_registro"
                name="fecha_registro"
                type="date"
                value={form.fecha_registro}
                onChange={(e) => setField('fecha_registro', e.target.value)}
                onBlur={(e) => {
                  setFieldError(
                    'fecha_registro',
                    fechaNoFutura(e.target.value) ? null : 'La fecha de registro no puede ser futura.'
                  )
                }}
                required
                aria-invalid={Boolean(errors.fecha_registro)}
              />
              {errors.fecha_registro && (
                <p className="text-xs text-destructive">{errors.fecha_registro}</p>
              )}
            </div>

            <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="ruta_ingreso">Ruta de Ingreso</Label>
              <Input
                id="ruta_ingreso"
                value={form.ruta_ingreso}
                onChange={(e) => setField('ruta_ingreso', e.target.value)}
                placeholder="Puerto de Arica → La Paz"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Valores de Importación
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor_fob">Valor FOB <span className="text-destructive">*</span></Label>
              <Input
                id="valor_fob"
                name="valor_fob"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_fob}
                onChange={(e) => setField('valor_fob', e.target.value)}
                onBlur={(e) =>
                  setFieldError(
                    'valor_fob',
                    montoNoNegativo(e.target.value) ? null : 'El valor FOB no puede ser negativo.'
                  )
                }
                required
                aria-invalid={Boolean(errors.valor_fob)}
              />
              {errors.valor_fob && <p className="text-xs text-destructive">{errors.valor_fob}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor_flete">Flete <span className="text-destructive">*</span></Label>
              <Input
                id="valor_flete"
                name="valor_flete"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_flete}
                onChange={(e) => setField('valor_flete', e.target.value)}
                onBlur={(e) =>
                  setFieldError(
                    'valor_flete',
                    montoNoNegativo(e.target.value) ? null : 'El flete no puede ser negativo.'
                  )
                }
                required
                aria-invalid={Boolean(errors.valor_flete)}
              />
              {errors.valor_flete && <p className="text-xs text-destructive">{errors.valor_flete}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor_seguro">Seguro <span className="text-destructive">*</span></Label>
              <Input
                id="valor_seguro"
                name="valor_seguro"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_seguro}
                onChange={(e) => setField('valor_seguro', e.target.value)}
                onBlur={(e) =>
                  setFieldError(
                    'valor_seguro',
                    montoNoNegativo(e.target.value) ? null : 'El seguro no puede ser negativo.'
                  )
                }
                required
                aria-invalid={Boolean(errors.valor_seguro)}
              />
              {errors.valor_seguro && <p className="text-xs text-destructive">{errors.valor_seguro}</p>}
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">CIF (previsualización)</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(cifPreview)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Líneas de Detalle ({lineas.length})
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addLinea} disabled={loadingCatalogos || variantesDisponibles.length === 0}>
              <Plus className="size-4" />
              Agregar Línea
            </Button>
          </div>

          {lineas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No se agregaron líneas. Puedes registrar la operación sin variantes y agregarlas después.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variante</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo Unitario FOB</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineas.map((linea) => (
                  <TableRow key={linea.key}>
                    <TableCell>
                      <Select
                        value={linea.variante}
                        onValueChange={(v) => updateLinea(linea.key, 'variante', v ?? '')}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar variante…">
                            {(value: string) => variantesDisponibles.find((v) => String(v.id) === value)?.label ?? 'Seleccionar variante…'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {variantesParaLinea(linea.key).map((v) => (
                            <SelectItem key={v.id} value={String(v.id)}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={linea.cantidad}
                        onChange={(e) => updateLinea(linea.key, 'cantidad', e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={linea.costo_unitario_fob}
                        onChange={(e) => updateLinea(linea.key, 'costo_unitario_fob', e.target.value)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeLinea(linea.key)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/importaciones')} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting || loadingCatalogos} className="min-w-40">
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Registrando…
              </span>
            ) : 'Registrar Importación'}
          </Button>
        </div>
      </form>
    </div>
  )
}
