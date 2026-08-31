import type { EstadoOperacionImportacion } from '@/types/importaciones'

export const ESTADOS_IMPORTACION: EstadoOperacionImportacion[] = [
  'REGISTRADA',
  'EN_TRANSITO',
  'EN_ADUANA',
  'LIBERADA',
  'CANCELADA',
]

export const ESTADO_IMPORTACION_COLOR: Record<EstadoOperacionImportacion, string> = {
  REGISTRADA:
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  EN_TRANSITO:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  EN_ADUANA:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  LIBERADA:
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  CANCELADA:
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800',
}

/** Espeja `TRANSICIONES_VALIDAS` de `backend/apps/importaciones/services.py` —
 * solo determina qué botones de transición mostrar; el backend es quien
 * valida y rechaza con 409 si de todos modos se envía un estado inválido. */
export const TRANSICIONES_VALIDAS: Record<EstadoOperacionImportacion, EstadoOperacionImportacion[]> = {
  REGISTRADA: ['EN_TRANSITO', 'CANCELADA'],
  EN_TRANSITO: ['EN_ADUANA', 'CANCELADA'],
  EN_ADUANA: ['LIBERADA', 'CANCELADA'],
  LIBERADA: [],
  CANCELADA: [],
}

export const PIPELINE_LINEAL: EstadoOperacionImportacion[] = [
  'REGISTRADA',
  'EN_TRANSITO',
  'EN_ADUANA',
  'LIBERADA',
]
