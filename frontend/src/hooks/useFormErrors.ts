import { useCallback, useState } from 'react'

import { ApiError } from '@/services/api'

export type FormErrors = Record<string, string>

/** Enfoca el primer input/select/textarea cuyo `name` coincide (checklist #13). */
export function focusField(name: string) {
  document.querySelector<HTMLElement>(`[name="${name}"]`)?.focus()
}

/**
 * Traduce un `ApiError` (errores de campo de DRF) a un mapa `{ campo: mensaje }`
 * listo para renderizar bajo cada `<Input>`, y enfoca automáticamente el
 * primer campo inválido (checklist #13). Los errores generales
 * (`non_field_errors`, `detail`) no se asocian a ningún campo — siguen
 * mostrándose como toast en el `catch` de cada página, igual que hoy.
 */
export function useFormErrors() {
  const [errors, setErrors] = useState<FormErrors>({})

  const applyApiError = useCallback((err: unknown) => {
    if (!(err instanceof ApiError)) {
      setErrors({})
      return
    }
    const fieldErrors: FormErrors = {}
    for (const [field, messages] of Object.entries(err.fields)) {
      if (field === 'non_field_errors') continue
      fieldErrors[field] = messages[0]
    }
    setErrors(fieldErrors)
    const firstField = Object.keys(fieldErrors)[0]
    if (firstField) focusField(firstField)
  }, [])

  const clearErrors = useCallback(() => setErrors({}), [])

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  /** Validación en tiempo real (checklist #13): fija o limpia el error de
   * un campo específico sin esperar el round-trip al backend. */
  const setFieldError = useCallback((field: string, message: string | null) => {
    setErrors((prev) => {
      if (!message) {
        if (!(field in prev)) return prev
        const next = { ...prev }
        delete next[field]
        return next
      }
      return { ...prev, [field]: message }
    })
  }, [])

  return { errors, applyApiError, clearErrors, clearFieldError, setFieldError }
}
