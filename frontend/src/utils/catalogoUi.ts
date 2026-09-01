import type { EstadoVariante } from '@/types/catalogo'

export const ESTADO_VARIANTE_COLOR: Record<EstadoVariante, string> = {
  BORRADOR:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700',
  PUBLICADO:
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  DESCONTINUADO:
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
}

const STOCK_BAJO_UMBRAL = 10

/** Mismo criterio de color usado en el badge de stock de `VarianteSelector`
 * (Sprint 3, carrito de pedido) y en la vista `/stock` — un único umbral
 * para no divergir entre ambas pantallas. */
export function stockBadgeClasses(stock: number, disponible = true): string {
  if (!disponible || stock === 0) {
    return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
  }
  if (stock <= STOCK_BAJO_UMBRAL) {
    return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
  }
  return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
}
