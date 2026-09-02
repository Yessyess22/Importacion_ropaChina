// Validación en tiempo real (checklist #13) compartida por los 4
// formularios de Tercero (Proveedor, ClienteMayorista, AgenteAduanal,
// Transportista): mismos campos heredados, misma regla — igual que el
// `TerceroValidationMixin` del backend (`apps/terceros/serializers.py`).

import { emailValido, largoValido, nitValido, normalizarNit, normalizarTelefono, normalizarTexto, soloTexto, telefonoValido } from './validators'

interface CampoValidado {
  valor: string
  error: string | null
}

export function validarRazonSocial(value: string): CampoValidado {
  const valor = normalizarTexto(value)
  if (!valor) return { valor, error: null }
  if (!largoValido(valor)) return { valor, error: 'Debe tener entre 2 y 100 caracteres.' }
  if (!soloTexto(valor)) {
    return { valor, error: 'Solo se permiten letras, espacios, guiones y apóstrofes.' }
  }
  return { valor, error: null }
}

export function validarNitCampo(value: string): CampoValidado {
  const valor = normalizarNit(value)
  if (!valor) return { valor, error: null }
  if (!nitValido(valor)) {
    return { valor, error: 'El NIT debe contener solo dígitos (5 a 15 caracteres).' }
  }
  return { valor, error: null }
}

export function validarTelefonoCampo(value: string): CampoValidado {
  const valor = normalizarTelefono(value)
  if (!valor) return { valor, error: null }
  if (!telefonoValido(valor)) {
    return { valor, error: "Solo dígitos (7 a 15), con '+' opcional al inicio." }
  }
  return { valor, error: null }
}

export function validarEmailCampo(value: string): CampoValidado {
  const valor = value.trim().toLowerCase()
  if (!valor) return { valor, error: null }
  if (!emailValido(valor)) return { valor, error: 'Ingrese un correo electrónico válido.' }
  return { valor, error: null }
}
