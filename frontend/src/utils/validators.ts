// Validación en tiempo real (checklist #13) espejo de las reglas de
// `backend/apps/core/validators.py` (checklist #1, #2, #3, #5). El backend
// sigue siendo la fuente de verdad: estas funciones solo evitan un
// round-trip al servidor para el error más común, nunca lo reemplazan.

const TEXTO_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-\s]*$/
const NIT_REGEX = /^\d{5,15}$/
const TELEFONO_REGEX = /^\+?\d{7,15}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizarTexto(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ')
}

export function soloTexto(valor: string): boolean {
  return TEXTO_REGEX.test(valor)
}

export function largoValido(valor: string, minimo = 2, maximo = 100): boolean {
  return valor.length >= minimo && valor.length <= maximo
}

export function normalizarNit(valor: string): string {
  return valor.replace(/[\s-]/g, '')
}

export function nitValido(valor: string): boolean {
  return NIT_REGEX.test(normalizarNit(valor))
}

export function normalizarTelefono(valor: string): string {
  return valor.replace(/[\s-]/g, '')
}

export function telefonoValido(valor: string): boolean {
  return TELEFONO_REGEX.test(normalizarTelefono(valor))
}

export function emailValido(valor: string): boolean {
  return EMAIL_REGEX.test(valor)
}

export function montoNoNegativo(valor: string): boolean {
  const n = Number(valor)
  return valor !== '' && !Number.isNaN(n) && n >= 0
}

export function montoPositivo(valor: string): boolean {
  const n = Number(valor)
  return valor !== '' && !Number.isNaN(n) && n > 0
}

export function porcentajeValido(valor: string): boolean {
  const n = Number(valor)
  return valor !== '' && !Number.isNaN(n) && n >= 0 && n <= 100
}

// Checklist #9: espejo de `EXTENSIONES_PERMITIDAS`/`TAMANO_MAXIMO_BYTES` en
// `backend/apps/documentos/serializers.py`.
const EXTENSIONES_DOCUMENTO_PERMITIDAS = ['pdf', 'jpg', 'jpeg', 'png']
const TAMANO_MAXIMO_DOCUMENTO_MB = 10

export function validarArchivoDocumento(file: File): string | null {
  const extension = file.name.includes('.') ? (file.name.split('.').pop() ?? '').toLowerCase() : ''
  if (!EXTENSIONES_DOCUMENTO_PERMITIDAS.includes(extension)) {
    return `Extensión no permitida. Solo se aceptan: ${EXTENSIONES_DOCUMENTO_PERMITIDAS.join(', ')}.`
  }
  if (file.size > TAMANO_MAXIMO_DOCUMENTO_MB * 1024 * 1024) {
    return `El archivo supera el tamaño máximo permitido (${TAMANO_MAXIMO_DOCUMENTO_MB} MB).`
  }
  return null
}

/** Checklist #7: espejo de `apps.core.validators.validar_fecha_no_futura`. */
export function fechaNoFutura(valor: string): boolean {
  if (!valor) return true
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return new Date(`${valor}T00:00:00`) <= hoy
}

export interface PasswordFuerteResultado {
  valido: boolean
  errores: string[]
}

export function passwordFuerte(password: string): PasswordFuerteResultado {
  const errores: string[] = []
  if (password.length < 8) errores.push('Debe tener al menos 8 caracteres.')
  if (!/[A-Z]/.test(password)) errores.push('Debe contener al menos una letra mayúscula.')
  if (!/[a-z]/.test(password)) errores.push('Debe contener al menos una letra minúscula.')
  if (!/\d/.test(password)) errores.push('Debe contener al menos un número.')
  if (!/[^\w\s]/.test(password)) errores.push('Debe contener al menos un símbolo (ej. !@#$%).')
  return { valido: errores.length === 0, errores }
}
