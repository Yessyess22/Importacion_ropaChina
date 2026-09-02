import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, ShoppingBag, Trash2 } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { Prenda, VarianteProductoResumen } from '@/types/catalogo'
import type { ClienteMayorista } from '@/types/terceros'
import type { PedidoMayorista } from '@/types/pedidos'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/utils/formatters'
import { VarianteSelector } from '@/components/pedidos/VarianteSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

const CLIENTE_MAYORISTA = 'Cliente Mayorista'

interface ItemCarrito {
  prendaId: number
  prendaLabel: string
  variante: VarianteProductoResumen
  cantidad: number
}

export function NuevoPedido() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const esCliente = role === CLIENTE_MAYORISTA

  const [prendas, setPrendas] = useState<Prenda[]>([])
  const [clientes, setClientes] = useState<ClienteMayorista[]>([])
  const [ownCliente, setOwnCliente] = useState<ClienteMayorista | null>(null)
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)

  const [prendaSeleccionada, setPrendaSeleccionada] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const peticiones: [Promise<PaginatedResponse<Prenda>>, Promise<PaginatedResponse<ClienteMayorista>>] = [
      api.get<PaginatedResponse<Prenda>>('/prendas/?page_size=100'),
      esCliente
        ? api.get<PaginatedResponse<ClienteMayorista>>('/clientes-mayoristas/')
        : api.get<PaginatedResponse<ClienteMayorista>>('/clientes-mayoristas/?activo=true&page_size=100'),
    ]
    Promise.all(peticiones)
      .then(([prend, cli]) => {
        setPrendas(prend.results)
        if (esCliente) {
          setOwnCliente(cli.results[0] ?? null)
        } else {
          setClientes(cli.results)
        }
      })
      .catch(() => toast.error('No se pudo cargar el catálogo de modelos.'))
      .finally(() => setLoadingCatalogos(false))
  }, [esCliente])

  const prendasDisponibles = useMemo(
    () => prendas.filter((p) => p.variantes.some((v) => v.estado === 'PUBLICADO' && v.stock_disponible > 0)),
    [prendas],
  )

  const prendaActual = prendasDisponibles.find((p) => String(p.id) === prendaSeleccionada)

  const minimoRequerido = esCliente
    ? ownCliente?.pedido_minimo_modelo ?? null
    : clientes.find((c) => String(c.id) === clienteId)?.pedido_minimo_modelo ?? null

  const totalesPorModelo = useMemo(() => {
    const mapa = new Map<number, { label: string; cantidad: number }>()
    for (const item of carrito) {
      const actual = mapa.get(item.prendaId)
      mapa.set(item.prendaId, {
        label: item.prendaLabel,
        cantidad: (actual?.cantidad ?? 0) + item.cantidad,
      })
    }
    return mapa
  }, [carrito])

  const totalPedido = carrito.reduce(
    (acc, item) => acc + Number(item.variante.precio_unitario) * item.cantidad,
    0,
  )

  const modelosInsuficientes = useMemo(() => {
    if (minimoRequerido == null) return []
    return Array.from(totalesPorModelo.values()).filter((m) => m.cantidad < minimoRequerido)
  }, [totalesPorModelo, minimoRequerido])

  function agregarAlCarrito(prenda: Prenda, variante: VarianteProductoResumen, cantidad: number) {
    setCarrito((prev) => {
      const idx = prev.findIndex((i) => i.variante.id === variante.id)
      if (idx >= 0) {
        const actualizado = [...prev]
        actualizado[idx] = {
          ...actualizado[idx],
          cantidad: Math.min(actualizado[idx].cantidad + cantidad, variante.stock_disponible),
        }
        return actualizado
      }
      return [
        ...prev,
        { prendaId: prenda.id, prendaLabel: `${prenda.codigo_modelo} — ${prenda.nombre}`, variante, cantidad },
      ]
    })
    toast.success(`${variante.talla} / ${variante.color} agregado al pedido.`)
  }

  function quitarDelCarrito(varianteId: number) {
    setCarrito((prev) => prev.filter((i) => i.variante.id !== varianteId))
  }

  async function handleConfirmar() {
    setSubmitError(null)

    if (carrito.length === 0) {
      toast.error('Agrega al menos una variante al pedido.')
      return
    }
    if (!esCliente && !clienteId) {
      toast.error('Selecciona el cliente mayorista para este pedido.')
      return
    }
    if (minimoRequerido == null) {
      toast.error('No se pudo determinar la cantidad mínima del cliente.')
      return
    }
    // Validación en tiempo real (checklist #13): el resumen por modelo ya
    // marca en rojo "faltan N" en cada línea insuficiente (ver abajo);
    // este mensaje se muestra además como toast y como banner persistente,
    // nunca solo como uno de los dos.
    if (modelosInsuficientes.length > 0) {
      const mensaje = `La cantidad mínima por modelo es ${minimoRequerido} unidades. Falta completar: ${modelosInsuficientes
        .map((m) => `${m.label} (${m.cantidad}/${minimoRequerido})`)
        .join(', ')}.`
      setSubmitError(mensaje)
      toast.error(mensaje)
      return
    }

    setSubmitting(true)
    try {
      const payload: { detalles: { variante: number; cantidad: number }[]; cliente?: number } = {
        detalles: carrito.map((item) => ({ variante: item.variante.id, cantidad: item.cantidad })),
      }
      if (!esCliente) payload.cliente = Number(clienteId)

      const pedido = await api.post<PedidoMayorista>('/pedidos/', payload)
      toast.success(`Pedido ${pedido.codigo_pedido} registrado correctamente.`)
      setCarrito([])
      navigate('/catalogo')
    } catch (err) {
      // El backend responde 409 con un `detail` de negocio (mínimo por
      // modelo desactualizado, o stock insuficiente en una condición de
      // carrera — el mensaje ya identifica la variante y la cantidad
      // disponible, ver `inventario/services._aplicar_movimiento`). Se
      // muestra como banner persistente junto al carrito, no solo en un
      // toast que desaparece.
      const mensaje = err instanceof Error ? err.message : 'No se pudo registrar el pedido.'
      setSubmitError(mensaje)
      toast.error('No se pudo registrar el pedido', { description: mensaje })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/catalogo')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Pedido</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Agrega variantes al carrito respetando la cantidad mínima por modelo.
          </p>
        </div>
      </div>

      {!esCliente && (
        <Card>
          <CardContent className="flex flex-col gap-1.5">
            <Label htmlFor="cliente">Cliente Mayorista <span className="text-destructive">*</span></Label>
            <Select value={clienteId} onValueChange={(v) => setClienteId(v ?? '')} disabled={loadingCatalogos}>
              <SelectTrigger id="cliente" className="w-full sm:w-96">
                <SelectValue placeholder="Seleccionar cliente…">
                  {(value: string) => clientes.find((c) => String(c.id) === value)?.razon_social ?? 'Seleccionar cliente…'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.razon_social} · mín. {c.pedido_minimo_modelo} unid./modelo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {esCliente && ownCliente && (
        <p className="text-xs text-muted-foreground">
          Cantidad mínima por modelo: <span className="font-medium text-foreground">{ownCliente.pedido_minimo_modelo} unidades</span>
        </p>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prenda">Modelo</Label>
            <Select value={prendaSeleccionada} onValueChange={(v) => setPrendaSeleccionada(v ?? '')} disabled={loadingCatalogos}>
              <SelectTrigger id="prenda" className="w-full sm:w-96">
                <SelectValue placeholder="Seleccionar modelo…">
                  {(value: string) => {
                    const p = prendasDisponibles.find((x) => String(x.id) === value)
                    return p ? `${p.codigo_modelo} — ${p.nombre}` : 'Seleccionar modelo…'
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {prendasDisponibles.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.codigo_modelo} — {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {prendaActual && (
            <div className="flex flex-col gap-2">
              {prendaActual.variantes
                .filter((v) => v.estado === 'PUBLICADO' && v.stock_disponible > 0)
                .map((variante) => (
                  <VarianteSelector
                    key={variante.id}
                    variante={variante}
                    onAgregar={(v, cantidad) => agregarAlCarrito(prendaActual, v, cantidad)}
                  />
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Carrito de Pedido
          </h2>

          {carrito.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ShoppingBag className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Todavía no agregaste ninguna variante.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead className="text-right">Quitar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carrito.map((item) => (
                    <TableRow key={item.variante.id}>
                      <TableCell className="text-sm">{item.prendaLabel}</TableCell>
                      <TableCell className="text-sm">{item.variante.talla} · {item.variante.color}</TableCell>
                      <TableCell className="text-sm">{item.cantidad}</TableCell>
                      <TableCell className="text-sm">{formatCurrency(Number(item.variante.precio_unitario))}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatCurrency(Number(item.variante.precio_unitario) * item.cantidad)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => quitarDelCarrito(item.variante.id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3 text-sm">
                {Array.from(totalesPorModelo.entries()).map(([prendaId, info]) => {
                  const cumple = minimoRequerido == null || info.cantidad >= minimoRequerido
                  const faltan = minimoRequerido != null ? minimoRequerido - info.cantidad : 0
                  return (
                    <div key={prendaId} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{info.label}</span>
                      <span className={cumple ? 'text-emerald-600' : 'font-medium text-destructive'}>
                        {info.cantidad}{minimoRequerido != null ? ` / ${minimoRequerido} mín.` : ''}
                        {!cumple && ` — faltan ${faltan}`}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold text-foreground">Total del Pedido</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(totalPedido)}</span>
              </div>

              {submitError && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {submitError}
                </p>
              )}

              <Button onClick={handleConfirmar} disabled={submitting} className="self-end">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Confirmar Pedido
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
