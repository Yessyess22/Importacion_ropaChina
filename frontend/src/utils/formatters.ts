const BOB_FORMATTER = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number): string {
  return `${BOB_FORMATTER.format(amount)} BOB`
}

export function formatDate(dateString: string): string {
  // Las fechas puras "YYYY-MM-DD" (sin hora) las interpreta `Date` como
  // medianoche UTC; en zonas horarias negativas (ej. America/La_Paz)
  // `toLocaleDateString` las corre un día hacia atrás. Forzamos hora local
  // agregando T00:00:00 solo cuando no viene un componente de hora.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
  const date = isDateOnly ? new Date(`${dateString}T00:00:00`) : new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const ESTADO_MAP: Record<string, string> = {
  REGISTRADA: 'Registrada',
  EN_ADUANA: 'En Aduana',
  PENDIENTE: 'Pendiente',
  EN_TRANSITO: 'En Tránsito',
  LIBERADA: 'Liberada',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  LIQUIDADA: 'Liquidada',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada',
  EN_PREPARACION: 'En Preparación',
  CONFIRMADO: 'Confirmado',
  DESPACHADO: 'Despachado',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  AJUSTE: 'Ajuste',
  BORRADOR: 'Borrador',
  PUBLICADO: 'Publicado',
  DESCONTINUADO: 'Descontinuado',
}

export function formatEstado(estado: string): string {
  return (
    ESTADO_MAP[estado] ??
    estado.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}
