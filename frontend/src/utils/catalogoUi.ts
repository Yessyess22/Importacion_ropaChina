import type { EstadoVariante } from '@/types/catalogo'

export const ESTADO_VARIANTE_COLOR: Record<EstadoVariante, string> = {
  BORRADOR:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700',
  PUBLICADO:
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  DESCONTINUADO:
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
}
