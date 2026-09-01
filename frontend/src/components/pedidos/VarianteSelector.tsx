import { useState } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'

import type { VarianteProductoResumen } from '@/types/catalogo'
import { formatCurrency } from '@/utils/formatters'
import { stockBadgeClasses } from '@/utils/catalogoUi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface VarianteSelectorProps {
  variante: VarianteProductoResumen
  onAgregar: (variante: VarianteProductoResumen, cantidad: number) => void
}

export function VarianteSelector({ variante, onAgregar }: VarianteSelectorProps) {
  const disponible = variante.estado === 'PUBLICADO' && variante.stock_disponible > 0
  const [cantidad, setCantidad] = useState(1)

  function clamp(value: number) {
    return Math.max(1, Math.min(value, variante.stock_disponible || 1))
  }

  function handleAgregar() {
    onAgregar(variante, cantidad)
    setCantidad(1)
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">
          {variante.talla} · {variante.color}
        </p>
        <p className="text-xs text-muted-foreground">{formatCurrency(Number(variante.precio_unitario))} c/u</p>
      </div>

      <span
        className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${stockBadgeClasses(variante.stock_disponible, disponible)}`}
      >
        {disponible ? `Stock: ${variante.stock_disponible}` : 'Agotado'}
      </span>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={!disponible}
          onClick={() => setCantidad((c) => clamp(c - 1))}
        >
          <Minus className="size-3.5" />
        </Button>
        <Input
          type="number"
          min={1}
          max={variante.stock_disponible || 1}
          value={cantidad}
          disabled={!disponible}
          onChange={(e) => setCantidad(clamp(Number(e.target.value) || 1))}
          className="w-14 text-center"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={!disponible}
          onClick={() => setCantidad((c) => clamp(c + 1))}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <Button type="button" size="sm" disabled={!disponible} onClick={handleAgregar}>
        <ShoppingCart className="size-3.5" />
        Agregar
      </Button>
    </div>
  )
}
