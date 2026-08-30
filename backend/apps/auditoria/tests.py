"""
Suite de pruebas unitarias — S1-T10 / GAP-4
Cubre el servicio registrar() y los invariantes del modelo Bitacora.
"""
import pytest
from django.test import TestCase

from apps.auditoria.models import Bitacora
from apps.auditoria.services import registrar
from apps.terceros.models import Proveedor
from apps.usuarios.models import Usuario


class RegistrarCreacionCorrectaTest(TestCase):
    """Test 1: el servicio crea la entrada con todos los campos esperados."""

    def setUp(self):
        self.user = Usuario.objects.create_user(
            username="operador_test",
            password="TestPass123!",
            first_name="Operador",
            last_name="Prueba",
        )

    def test_crea_bitacora_con_campos_correctos(self):
        detalle_payload = {"modulo": "terceros", "operacion": "CREATE"}

        registrar(
            usuario=self.user,
            accion="PROVEEDOR_CREADO",
            detalle=detalle_payload,
        )

        self.assertEqual(Bitacora.objects.count(), 1)
        entrada = Bitacora.objects.first()

        self.assertEqual(entrada.accion, "PROVEEDOR_CREADO")
        self.assertEqual(entrada.detalle, detalle_payload)
        self.assertIsNotNone(entrada.fecha_hora)

    def test_usuario_repr_captura_username(self):
        registrar(usuario=self.user, accion="LOGIN")

        entrada = Bitacora.objects.first()
        self.assertEqual(entrada.usuario_repr, "operador_test")
        self.assertEqual(entrada.usuario, self.user)


class InvarianteSetNullTest(TestCase):
    """
    Test 2: al eliminar el usuario la bitácora persiste con usuario=NULL
    pero usuario_repr conserva el snapshot original.
    """

    def setUp(self):
        self.user = Usuario.objects.create_user(
            username="usuario_efimero",
            password="TestPass123!",
        )
        registrar(usuario=self.user, accion="ACCION_REGISTRADA")
        self.entrada_pk = Bitacora.objects.first().pk
        self.username_snapshot = self.user.username

    def test_bitacora_sobrevive_borrado_de_usuario(self):
        self.user.delete()

        self.assertTrue(
            Bitacora.objects.filter(pk=self.entrada_pk).exists(),
            "El registro de bitácora debe persistir tras borrar el usuario (SET_NULL).",
        )

    def test_campo_usuario_queda_null_tras_borrado(self):
        self.user.delete()

        entrada = Bitacora.objects.get(pk=self.entrada_pk)
        self.assertIsNone(
            entrada.usuario,
            "El FK usuario debe quedar NULL al eliminar la cuenta.",
        )

    def test_usuario_repr_conserva_snapshot_original(self):
        self.user.delete()

        entrada = Bitacora.objects.get(pk=self.entrada_pk)
        self.assertEqual(
            entrada.usuario_repr,
            self.username_snapshot,
            "usuario_repr debe conservar el nombre original aunque la cuenta ya no exista.",
        )


class RelacionGenericaContentTypesTest(TestCase):
    """
    Test 3: el framework de ContentTypes resuelve la GenericForeignKey
    y entidad_afectada devuelve la instancia real del objeto auditado.
    """

    def setUp(self):
        self.user = Usuario.objects.create_user(
            username="admin_test",
            password="TestPass123!",
        )
        self.proveedor = Proveedor.objects.create(
            razon_social="Shenzhen Textiles Co.",
            nit="CN-20260001",
            pais="China",
        )

    def test_entidad_afectada_resuelve_a_instancia_correcta(self):
        registrar(
            usuario=self.user,
            accion="PROVEEDOR_CREADO",
            entidad=self.proveedor,
        )

        entrada = Bitacora.objects.first()

        self.assertIsNotNone(
            entrada.entidad_content_type,
            "entidad_content_type no debe ser NULL cuando se pasa una entidad.",
        )
        self.assertEqual(
            entrada.entidad_object_id,
            self.proveedor.pk,
        )
        self.assertEqual(
            entrada.entidad_afectada,
            self.proveedor,
            "entidad_afectada (GenericForeignKey) debe devolver la instancia original de Proveedor.",
        )

    def test_sin_entidad_los_campos_genericos_quedan_null(self):
        registrar(usuario=self.user, accion="LOGIN")

        entrada = Bitacora.objects.first()
        self.assertIsNone(entrada.entidad_content_type)
        self.assertIsNone(entrada.entidad_object_id)
        self.assertIsNone(entrada.entidad_afectada)


# ---------------------------------------------------------------------------
# Marcadores pytest — permiten ejecutar con: pytest apps/auditoria/
# Las clases TestCase de Django son detectadas automáticamente por pytest-django.
# ---------------------------------------------------------------------------
pytestmark = pytest.mark.django_db
