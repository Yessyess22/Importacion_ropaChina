const BOB_FORMATTER = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(amount: number): string {
  return `${BOB_FORMATTER.format(amount)} BOB`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const ESTADO_MAP: Record<string, string> = {
  EN_ADUANA: 'En Aduana',
  PENDIENTE: 'Pendiente',
  EN_TRANSITO: 'En Tránsito',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  LIQUIDADA: 'Liquidada',
  ENTREGADA: 'Entregada',
  CANCELADA: 'Cancelada',
  EN_PREPARACION: 'En Preparación',
  CONFIRMADO: 'Confirmado',
  DESPACHADO: 'Despachado',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
}

export function formatEstado(estado: string): string {
  return (
    ESTADO_MAP[estado] ??
    estado.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}
