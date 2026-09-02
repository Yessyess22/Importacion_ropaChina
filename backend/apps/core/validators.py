"""Validadores y normalizadores reutilizables entre apps de dominio.

Checklist de validación profesional (docs/10-PLAN_VALIDACIONES.md, Sprint 5):
texto libre (#1), NIT (#2), teléfono (#3) y contraseña fuerte (#5). Cada
función levanta `django.core.exceptions.ValidationError`, que tanto los
`Field.validators` de un modelo como el `run_validators` de un
`serializers.Field` de DRF interpretan de forma nativa — así el mismo
validador sirve para el modelo y el serializer sin duplicar la regla.
"""

import re

from django.core.exceptions import ValidationError
from django.utils import timezone

TEXTO_REGEX = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\-\s]*$")
NIT_REGEX = re.compile(r"^\d{5,15}$")
TELEFONO_REGEX = re.compile(r"^\+?\d{7,15}$")


def normalizar_texto(valor: str) -> str:
    """Recorta espacios al inicio/fin y colapsa espacios internos dobles."""
    return re.sub(r"\s+", " ", valor.strip())


def validar_largo(valor: str, minimo: int = 2, maximo: int = 100) -> None:
    if not (minimo <= len(valor) <= maximo):
        raise ValidationError(f"Debe tener entre {minimo} y {maximo} caracteres.", code="largo_invalido")


def validar_solo_texto(valor: str) -> None:
    """Solo letras, espacios, acentos, guion y apóstrofe (checklist #1)."""
    if not TEXTO_REGEX.fullmatch(valor):
        raise ValidationError("Solo se permiten letras, espacios, guiones y apóstrofes.", code="solo_texto")


def normalizar_nit(valor: str) -> str:
    """Quita espacios y guiones antes de guardar (checklist #2)."""
    return re.sub(r"[\s-]", "", valor)


def validar_nit(valor: str) -> None:
    """Solo dígitos, largo 5-15. Debe aplicarse sobre el valor ya
    normalizado con `normalizar_nit` (checklist #2)."""
    if not NIT_REGEX.fullmatch(valor):
        raise ValidationError("El NIT debe contener solo dígitos (5 a 15 caracteres).", code="nit_invalido")


def normalizar_telefono(valor: str) -> str:
    return re.sub(r"[\s-]", "", valor)


def validar_telefono(valor: str) -> None:
    """Solo dígitos, con '+' opcional al inicio, largo 7-15 (checklist #3).
    Debe aplicarse sobre el valor ya normalizado con `normalizar_telefono`."""
    if not TELEFONO_REGEX.fullmatch(valor):
        raise ValidationError(
            "El teléfono debe contener solo dígitos (7 a 15), con '+' opcional al inicio.",
            code="telefono_invalido",
        )


class PasswordFuerteValidator:
    """Exige mayúscula, minúscula, número y símbolo (checklist #5).

    Se registra en `AUTH_PASSWORD_VALIDATORS` junto a (no en reemplazo de)
    los validadores estándar de Django: longitud mínima, similitud con
    datos del usuario y contraseñas comunes.
    """

    def validate(self, password, user=None):
        errores = []
        if not re.search(r"[A-Z]", password):
            errores.append("Debe contener al menos una letra mayúscula.")
        if not re.search(r"[a-z]", password):
            errores.append("Debe contener al menos una letra minúscula.")
        if not re.search(r"\d", password):
            errores.append("Debe contener al menos un número.")
        if not re.search(r"[^\w\s]", password):
            errores.append("Debe contener al menos un símbolo (ej. !@#$%).")
        if errores:
            raise ValidationError(errores, code="password_debil")

    def get_help_text(self):
        return "Debe incluir al menos una mayúscula, una minúscula, un número y un símbolo."


def validar_fecha_no_futura(value) -> None:
    """Checklist #7: rechaza fechas posteriores al día actual (zona horaria
    del proyecto, `TIME_ZONE = America/La_Paz`)."""
    if value > timezone.localdate():
        raise ValidationError("La fecha no puede ser futura.", code="fecha_futura")
