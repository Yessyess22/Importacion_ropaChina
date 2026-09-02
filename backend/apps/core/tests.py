import datetime

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase
from django.utils import timezone

from .validators import (
    PasswordFuerteValidator,
    normalizar_nit,
    normalizar_telefono,
    normalizar_texto,
    validar_fecha_no_futura,
    validar_largo,
    validar_nit,
    validar_solo_texto,
    validar_telefono,
)


class NormalizarTextoTests(SimpleTestCase):
    def test_recorta_espacios_inicio_y_fin(self):
        self.assertEqual(normalizar_texto("  Juan Pérez  "), "Juan Pérez")

    def test_colapsa_espacios_dobles(self):
        self.assertEqual(normalizar_texto("Juan   Pérez"), "Juan Pérez")


class ValidarSoloTextoTests(SimpleTestCase):
    def test_acepta_letras_espacios_acentos_guion_apostrofe(self):
        for valor in ["María José", "D'Angelo", "Villa-Nueva", "Ñuñoa"]:
            validar_solo_texto(valor)  # no debe lanzar

    def test_rechaza_numeros(self):
        with self.assertRaises(ValidationError):
            validar_solo_texto("Juan123")

    def test_rechaza_simbolos_raros(self):
        with self.assertRaises(ValidationError):
            validar_solo_texto("Juan@Perez")

    def test_rechaza_cadena_vacia(self):
        with self.assertRaises(ValidationError):
            validar_solo_texto("")


class ValidarLargoTests(SimpleTestCase):
    def test_acepta_dentro_del_rango(self):
        validar_largo("Ana", minimo=2, maximo=100)

    def test_rechaza_menor_al_minimo(self):
        with self.assertRaises(ValidationError):
            validar_largo("A", minimo=2, maximo=100)

    def test_rechaza_mayor_al_maximo(self):
        with self.assertRaises(ValidationError):
            validar_largo("A" * 101, minimo=2, maximo=100)


class NitTests(SimpleTestCase):
    def test_normalizar_quita_espacios_y_guiones(self):
        self.assertEqual(normalizar_nit("123 456-789"), "123456789")

    def test_valida_solo_digitos(self):
        validar_nit("1234567")  # no debe lanzar

    def test_rechaza_letras(self):
        with self.assertRaises(ValidationError):
            validar_nit("12A4567")

    def test_rechaza_muy_corto(self):
        with self.assertRaises(ValidationError):
            validar_nit("123")

    def test_rechaza_muy_largo(self):
        with self.assertRaises(ValidationError):
            validar_nit("1" * 16)


class TelefonoTests(SimpleTestCase):
    def test_normalizar_quita_espacios_y_guiones(self):
        self.assertEqual(normalizar_telefono("+591 700-12345"), "+59170012345")

    def test_valida_digitos_con_mas_opcional(self):
        validar_telefono("+59170012345")
        validar_telefono("70012345")

    def test_rechaza_letras(self):
        with self.assertRaises(ValidationError):
            validar_telefono("70A12345")

    def test_rechaza_muy_corto(self):
        with self.assertRaises(ValidationError):
            validar_telefono("123")


class PasswordFuerteValidatorTests(SimpleTestCase):
    def setUp(self):
        self.validator = PasswordFuerteValidator()

    def test_acepta_password_con_todas_las_clases(self):
        self.validator.validate("Abcdef1!")  # no debe lanzar

    def test_rechaza_sin_mayuscula(self):
        with self.assertRaises(ValidationError):
            self.validator.validate("abcdef1!")

    def test_rechaza_sin_minuscula(self):
        with self.assertRaises(ValidationError):
            self.validator.validate("ABCDEF1!")

    def test_rechaza_sin_numero(self):
        with self.assertRaises(ValidationError):
            self.validator.validate("Abcdefg!")

    def test_rechaza_sin_simbolo(self):
        with self.assertRaises(ValidationError):
            self.validator.validate("Abcdefg1")

    def test_get_help_text_no_esta_vacio(self):
        self.assertTrue(self.validator.get_help_text())


class ValidarFechaNoFuturaTests(SimpleTestCase):
    def test_acepta_fecha_de_hoy(self):
        validar_fecha_no_futura(timezone.localdate())

    def test_acepta_fecha_pasada(self):
        validar_fecha_no_futura(timezone.localdate() - datetime.timedelta(days=1))

    def test_rechaza_fecha_futura(self):
        with self.assertRaises(ValidationError):
            validar_fecha_no_futura(timezone.localdate() + datetime.timedelta(days=1))
