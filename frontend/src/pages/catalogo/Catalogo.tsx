import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff, Shirt, X } from 'lucide-react'

import { api } from '@/services/api'
import type { PaginatedResponse } from '@/types/api'
import type { Prenda } from '@/types/catalogo'
import { formatCurrency, formatEstado } from '@/utils/formatters'
import { ESTADO_VARIANTE_COLOR } from '@/utils/catalogoUi'
import { getImagenPrenda } from '@/utils/catalogoImagenes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZE = 20
const TODOS = 'TODOS'

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

export function Catalogo() {
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

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catálogo</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'modelo disponible' : 'modelos disponibles'}
        </p>
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
    </div>
  )
}
