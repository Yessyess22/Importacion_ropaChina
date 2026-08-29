from django.contrib.auth.models import AbstractUser
from django.db import models


class Rol(models.Model):
    """Rol de negocio asignado a un usuario (Administrador, Operador de
    Comercio Exterior, Agente Aduanal, Contabilidad, Cliente Mayorista).

    Se modela como tabla propia (y no como TextChoices) porque el documento
    de diseño lo define como entidad independiente y porque debe poder
    administrarse desde el Django Admin sin requerir un despliegue de
    código. La autorización fina (qué puede hacer cada rol) se resolverá en
    Fase 3 mapeando este catálogo a Group/Permission de Django.
    """

    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=255, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ["nombre"]

    def __str__(self) -> str:
        return self.nombre


class Usuario(AbstractUser):
    """Usuario del sistema.

    Se extiende AbstractUser (no un backend de autenticación propio) para
    reutilizar el manejo seguro de contraseñas, sesiones y permisos que
    Django ya provee, agregando únicamente el atributo de dominio `rol`.
    """

    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        related_name="usuarios",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self) -> str:
        return self.get_username()
