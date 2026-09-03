"""Carga datos transaccionales ricos para la defensa académica del sistema
Trendy Import S.R.L.

Limpia completamente los datos transaccionales y el catálogo previos, luego
reconstruye un conjunto de datos coherente y realista usando los servicios de
negocio del proyecto (importaciones.services, pedidos.services,
costeo.services, auditoria.services) para garantizar que todas las
postcondiciones —entradas de stock, reservas, logs de bitácora— sean
idénticas a las que generaría la aplicación web real.

Uso:
    docker compose exec backend python manage.py load_defense_data
"""

import os
from datetime import date, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone


class Command(BaseCommand):
    help = "Pobla la BD con datos transaccionales ricos para la defensa académica."

    # ──────────────────────────────────────────────────────────────────────────
    # Punto de entrada
    # ──────────────────────────────────────────────────────────────────────────

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING(
            "\n══════════════════════════════════════════════════\n"
            "  TRENDY IMPORT — Carga de datos de defensa\n"
            "══════════════════════════════════════════════════"
        ))

        self._cargar_modulos()

        with transaction.atomic():
            self._limpiar_transaccionales()
            roles = self._asegurar_roles()
            usuarios = self._crear_usuarios(roles)
            maestros = self._crear_datos_maestros(usuarios)
            variantes = self._crear_catalogo()
            self._crear_tipos_cambio()
            self._crear_importaciones(maestros, variantes, usuarios)
            self._crear_pedidos(maestros, variantes, usuarios)
            self._bitacora_adicional(maestros, variantes, usuarios)

        self.stdout.write(self.style.SUCCESS(
            "\n══════════════════════════════════════════════════\n"
            "  ¡Datos de defensa cargados exitosamente!\n"
            "══════════════════════════════════════════════════\n"
        ))

    # ──────────────────────────────────────────────────────────────────────────
    # Carga de módulos
    # ──────────────────────────────────────────────────────────────────────────

    def _cargar_modulos(self):
        from apps.auditoria import services as auditoria_svc
        from apps.auditoria.models import Bitacora
        from apps.catalogo.models import Prenda, VarianteProducto
        from apps.costeo import services as costeo_svc
        from apps.costeo.models import Costeo, TipoCambio, Tributo
        from apps.documentos.models import Documento
        from apps.importaciones import services as importacion_svc
        from apps.importaciones.models import DetalleImportacion, OperacionImportacion
        from apps.inventario.models import MovimientoInventario
        from apps.pedidos import services as pedidos_svc
        from apps.pedidos.models import DetallePedido, PedidoMayorista
        from apps.terceros.models import AgenteAduanal, ClienteMayorista, Proveedor, Transportista
        from apps.usuarios.models import Rol, Usuario

        self.Prenda = Prenda
        self.VarianteProducto = VarianteProducto
        self.Proveedor = Proveedor
        self.ClienteMayorista = ClienteMayorista
        self.AgenteAduanal = AgenteAduanal
        self.Transportista = Transportista
        self.Rol = Rol
        self.Usuario = Usuario
        self.OperacionImportacion = OperacionImportacion
        self.DetalleImportacion = DetalleImportacion
        self.Costeo = Costeo
        self.Tributo = Tributo
        self.TipoCambio = TipoCambio
        self.Documento = Documento
        self.MovimientoInventario = MovimientoInventario
        self.PedidoMayorista = PedidoMayorista
        self.DetallePedido = DetallePedido
        self.Bitacora = Bitacora
        self.importacion_svc = importacion_svc
        self.costeo_svc = costeo_svc
        self.pedidos_svc = pedidos_svc
        self.auditoria_svc = auditoria_svc

    # ──────────────────────────────────────────────────────────────────────────
    # Limpieza de datos transaccionales
    # ──────────────────────────────────────────────────────────────────────────

    def _limpiar_transaccionales(self):
        """Elimina datos transaccionales y el catálogo respetando el orden de
        claves foráneas.  Los terceros y usuarios se conservan y se actualizan
        mediante get_or_create para que el comando sea idempotente."""

        self.Bitacora.objects.all().delete()
        # MovimientoInventario referencia VarianteProducto con PROTECT
        self.MovimientoInventario.objects.all().delete()
        # DetallePedido referencia VarianteProducto con PROTECT; CASCADE desde PedidoMayorista
        self.PedidoMayorista.objects.all().delete()
        # OperacionImportacion CASCADE → DetalleImportacion, Documento, Costeo → Tributo
        self.OperacionImportacion.objects.all().delete()
        self.TipoCambio.objects.all().delete()
        # VarianteProducto necesita que los detalles ya estén eliminados
        self.VarianteProducto.objects.all().delete()
        self.Prenda.objects.all().delete()

        self.stdout.write("  ✔ Datos transaccionales y catálogo anteriores eliminados.")

    # ──────────────────────────────────────────────────────────────────────────
    # Roles
    # ──────────────────────────────────────────────────────────────────────────

    ROLES = [
        "Administrador",
        "Operador de Comercio Exterior",
        "Agente Aduanal",
        "Contabilidad",
        "Cliente Mayorista",
    ]

    def _asegurar_roles(self):
        roles = {}
        for nombre in self.ROLES:
            rol, _ = self.Rol.objects.get_or_create(nombre=nombre)
            roles[nombre] = rol
        self.stdout.write(f"  ✔ Roles asegurados: {', '.join(self.ROLES)}")
        return roles

    # ──────────────────────────────────────────────────────────────────────────
    # Usuarios
    # ──────────────────────────────────────────────────────────────────────────

    def _crear_usuarios(self, roles):
        specs = [
            # (username, email, password, rol, is_superuser, first_name, last_name)
            (
                "admin",
                "admin@trendy.com.bo",
                "AdminDesarrolloUPDS2026!",
                "Administrador",
                True,
                "Admin",
                "Sistema",
            ),
            (
                "shirley_operador",
                "shirley@trendy.com.bo",
                "OperadorPass2026!",
                "Operador de Comercio Exterior",
                False,
                "Shirley",
                "Vargas",
            ),
            (
                "oscar_agente",
                "oscar@ovandoaduana.com.bo",
                "AgentePass2026!",
                "Agente Aduanal",
                False,
                "Oscar",
                "Ovando",
            ),
            (
                "carla_contador",
                "carla@trendy.com.bo",
                "ContadorPass2026!",
                "Contabilidad",
                False,
                "Carla",
                "Méndez",
            ),
            (
                "marian_cliente",
                "marian@boutiquemarian.com.bo",
                "ClientePass2026!",
                "Cliente Mayorista",
                False,
                "Marian",
                "López",
            ),
            (
                "boutique_glam_cliente",
                "info@boutiqueglam.com.bo",
                "ClientePass2026!",
                "Cliente Mayorista",
                False,
                "Boutique",
                "Glam",
            ),
        ]

        usuarios = {}
        for username, email, password, rol_nombre, is_super, fname, lname in specs:
            if self.Usuario.objects.filter(username=username).exists():
                u = self.Usuario.objects.get(username=username)
                u.set_password(password)
                u.rol = roles[rol_nombre]
                u.email = email
                u.first_name = fname
                u.last_name = lname
                u.save()
            else:
                kwargs = dict(
                    username=username,
                    email=email,
                    password=password,
                    rol=roles[rol_nombre],
                    first_name=fname,
                    last_name=lname,
                )
                if is_super:
                    u = self.Usuario.objects.create_superuser(**kwargs)
                else:
                    u = self.Usuario.objects.create_user(**kwargs)
            usuarios[username] = u

        self.stdout.write("  ✔ 6 usuarios creados/actualizados con contraseñas de defensa.")
        return usuarios

    # ──────────────────────────────────────────────────────────────────────────
    # Datos maestros (terceros)
    # ──────────────────────────────────────────────────────────────────────────

    def _crear_datos_maestros(self, usuarios):
        maestros = {}

        # — Proveedores ───────────────────────────────────────────────────────
        prov_gz, _ = self.Proveedor.objects.get_or_create(
            nit="900123841",
            defaults={
                "razon_social": "Guangzhou Fast Fashion Co",
                "fabrica": "Shengzhou Apparel Ltd",
                "ciudad_origen": "Guangzhou",
                "pais": "China",
                "telefono": "+8620888812340",
                "email": "sales@gzfastfashion.cn",
                "direccion": "No 128 Tianhe Rd Guangzhou Guangdong 510620",
            },
        )
        maestros["prov_gz"] = prov_gz

        prov_yiwu, _ = self.Proveedor.objects.get_or_create(
            nit="800456121",
            defaults={
                "razon_social": "Yiwu Silk and Cotton Factory",
                "fabrica": "Yiwu Textile Co",
                "ciudad_origen": "Yiwu",
                "pais": "China",
                "telefono": "+8679988856780",
                "email": "export@yiwutextile.cn",
                "direccion": "No 55 International Trade City Yiwu Zhejiang 322000",
            },
        )
        maestros["prov_yiwu"] = prov_yiwu

        # — Agentes aduanales ─────────────────────────────────────────────────
        agente_ovando, _ = self.AgenteAduanal.objects.get_or_create(
            nit="456102001",
            defaults={
                "razon_social": "Ovando Aduana SRL",
                "numero_registro": "IMP-2026-001",
                "telefono": "+59144440001",
                "email": "despachos@ovandoaduana.com.bo",
                "direccion": "Av Blanco Galindo Km 5 Cochabamba Bolivia",
            },
        )
        maestros["agente_ovando"] = agente_ovando

        agente_dab, _ = self.AgenteAduanal.objects.get_or_create(
            nit="102030405",
            defaults={
                "razon_social": "Despachantes Asociados Bolivianos",
                "numero_registro": "IMP-2026-002",
                "telefono": "+59122220405",
                "email": "contacto@dab.com.bo",
                "direccion": "Calle Comercio 1234 La Paz Bolivia",
            },
        )
        maestros["agente_dab"] = agente_dab

        # — Transportistas ────────────────────────────────────────────────────
        T = self.Transportista.TipoTransporte

        trans_bcx, _ = self.Transportista.objects.get_or_create(
            nit="789150001",
            defaults={
                "razon_social": "Bolivia Cargo Express",
                "tipo_transporte": T.MARITIMO,
                "telefono": "+59144441500",
                "email": "logistica@boliviacargo.com.bo",
                "direccion": "Parque Industrial Bloque C Cochabamba Bolivia",
            },
        )
        maestros["trans_bcx"] = trans_bcx

        trans_tpac, _ = self.Transportista.objects.get_or_create(
            nit="321654001",
            defaults={
                "razon_social": "Trans-Pacifico SRL",
                "tipo_transporte": T.MARITIMO,
                "telefono": "+59122226540",
                "email": "operaciones@transpacifico.com.bo",
                "direccion": "Zona Puerto Oruro Bolivia",
            },
        )
        maestros["trans_tpac"] = trans_tpac

        # — Clientes mayoristas ────────────────────────────────────────────────
        # Vinculamos el usuario de acceso al portal; si el ClienteMayorista
        # ya existe del ciclo anterior, get_or_create lo devuelve sin cambios
        # (el usuario ya está vinculado correctamente).
        cli_marian, _ = self.ClienteMayorista.objects.get_or_create(
            nit="401234501",
            defaults={
                "razon_social": "Boutique Marian Fashion",
                "tipo_negocio": "Boutique de ropa femenina",
                "pedido_minimo_modelo": 10,
                "usuario": usuarios["marian_cliente"],
                "telefono": "+59143215678",
                "email": "marian@boutiquemarian.com.bo",
                "direccion": "Calle Mayor Rocha 345 Cochabamba Bolivia",
            },
        )
        maestros["cli_marian"] = cli_marian

        cli_glam, _ = self.ClienteMayorista.objects.get_or_create(
            nit="405678901",
            defaults={
                "razon_social": "Boutique Glam SRL",
                "tipo_negocio": "Boutique premium de ropa",
                "pedido_minimo_modelo": 24,
                "usuario": usuarios["boutique_glam_cliente"],
                "telefono": "+59145678901",
                "email": "info@boutiqueglam.com.bo",
                "direccion": "Plaza 14 de Septiembre 178 Cochabamba Bolivia",
            },
        )
        maestros["cli_glam"] = cli_glam

        self.stdout.write(
            "  ✔ Datos maestros: 2 proveedores, 2 agentes, 2 transportistas, 2 clientes."
        )
        return maestros

    # ──────────────────────────────────────────────────────────────────────────
    # Catálogo: 6 prendas × variantes de talla y color
    # ──────────────────────────────────────────────────────────────────────────

    def _crear_catalogo(self):
        """Crea las prendas y variantes de la colección de defensa.

        Los precios de las variantes corresponden al precio de venta al
        cliente mayorista en BOB.  El stock arranca en 0 y sube cuando la
        operación IMP-2026-001 se libera (inventario.services).
        """
        VP = self.VarianteProducto

        catalogo = [
            {
                "codigo_modelo": "DEF-CH-001",
                "nombre": "Chaqueta Denim Urbana",
                "categoria": "Chaquetas",
                "temporada": "Otoño-Invierno 2026",
                "coleccion": "Urban Street Collection",
                "descripcion": (
                    "Chaqueta denim de corte recto con lavado medio. Diseño urbano "
                    "versátil para el día a día. Costuras reforzadas y bolsillos "
                    "frontales con botones metálicos estilo jeans."
                ),
                "precio": Decimal("180.00"),
                "variantes": [
                    ("S", "Negro"), ("M", "Negro"), ("L", "Negro"), ("XL", "Negro"),
                    ("S", "Azul"),  ("M", "Azul"),  ("L", "Azul"),
                ],
            },
            {
                "codigo_modelo": "DEF-PL-001",
                "nombre": "Polera Oversize Streetwear",
                "categoria": "Poleras",
                "temporada": "Otoño-Invierno 2026",
                "coleccion": "Streetwear Essentials",
                "descripcion": (
                    "Polera oversize en algodón 100% peinado. Cuello redondo amplio "
                    "y manga ligeramente caída. Ideal para looks casuales y layering moderno."
                ),
                "precio": Decimal("85.00"),
                "variantes": [
                    ("S", "Blanco"), ("M", "Blanco"), ("L", "Blanco"), ("XL", "Blanco"),
                    ("S", "Gris"),   ("M", "Gris"),   ("L", "Gris"),
                    ("M", "Negro"),  ("L", "Negro"),
                ],
            },
            {
                "codigo_modelo": "DEF-JN-001",
                "nombre": "Jeans Recto Juvenil",
                "categoria": "Pantalones",
                "temporada": "Todo el año",
                "coleccion": "Denim Basics",
                "descripcion": (
                    "Jean de tiro medio con corte recto clásico. Tela denim 98% "
                    "algodón 2% elastano. Lavado stone con acabado natural y "
                    "cintura ajustable mediante botón metálico."
                ),
                "precio": Decimal("160.00"),
                "variantes": [
                    ("S", "Azul"),  ("M", "Azul"),  ("L", "Azul"),  ("XL", "Azul"),
                    ("S", "Negro"), ("M", "Negro"), ("L", "Negro"),
                ],
            },
            {
                "codigo_modelo": "DEF-SD-001",
                "nombre": "Sudadera Hoodie Basica",
                "categoria": "Sudaderas",
                "temporada": "Otoño-Invierno 2026",
                "coleccion": "Cozy Winter Basics",
                "descripcion": (
                    "Hoodie unisex con interior afelpado de alta suavidad. Capucha "
                    "regulable con cordón y bolsillo canguro frontal. Algodón "
                    "premium fleece, perfecto para los climas fríos del altiplano."
                ),
                "precio": Decimal("210.00"),
                "variantes": [
                    ("S", "Gris"),  ("M", "Gris"),  ("L", "Gris"),  ("XL", "Gris"),
                    ("S", "Beige"), ("M", "Beige"), ("L", "Beige"),
                    ("M", "Negro"), ("L", "Negro"),
                ],
            },
            {
                "codigo_modelo": "DEF-VE-001",
                "nombre": "Vestido Casual de Verano",
                "categoria": "Vestidos",
                "temporada": "Primavera-Verano 2026",
                "coleccion": "Summer Bloom",
                "descripcion": (
                    "Vestido midi de tela liviana tipo viscosa con caída suave. "
                    "Escote en V moderado, manga corta y cintura marcada con "
                    "cinturón desmontable. Ideal para el clima cochabambino."
                ),
                "precio": Decimal("250.00"),
                "variantes": [
                    ("S", "Beige"),        ("M", "Beige"),        ("L", "Beige"),
                    ("S", "Rosado Pastel"), ("M", "Rosado Pastel"), ("L", "Rosado Pastel"),
                    ("XL", "Rosado Pastel"),
                    ("S", "Blanco"),       ("M", "Blanco"),
                ],
            },
            {
                "codigo_modelo": "DEF-TR-001",
                "nombre": "Top Rib Acanalado",
                "categoria": "Poleras",
                "temporada": "Otoño-Invierno 2026",
                "coleccion": "Minimal Essentials",
                "descripcion": (
                    "Top de punto acanalado (rib) en algodón elastano, ajuste ceñido. "
                    "Cuello redondo definido y largo que cubre la cintura. Versátil: "
                    "funciona solo o bajo chaqueta. Paleta de colores neutros de temporada."
                ),
                "precio": Decimal("65.00"),
                "variantes": [
                    ("S", "Rosado Pastel"), ("M", "Rosado Pastel"), ("L", "Rosado Pastel"),
                    ("S", "Beige"),         ("M", "Beige"),         ("L", "Beige"),
                    ("S", "Negro"),         ("M", "Negro"),         ("L", "Negro"),
                    ("M", "Blanco"),        ("L", "Blanco"),
                ],
            },
        ]

        variantes_map = {}
        total_variantes = 0

        for datos in catalogo:
            prenda, _ = self.Prenda.objects.get_or_create(
                codigo_modelo=datos["codigo_modelo"],
                defaults={
                    "nombre": datos["nombre"],
                    "categoria": datos["categoria"],
                    "temporada": datos["temporada"],
                    "coleccion": datos["coleccion"],
                    "descripcion": datos["descripcion"],
                },
            )
            for talla, color in datos["variantes"]:
                var, _ = VP.objects.get_or_create(
                    prenda=prenda,
                    talla=talla,
                    color=color,
                    defaults={
                        "precio_unitario": datos["precio"],
                        "estado": VP.Estado.BORRADOR,
                        "stock_disponible": 0,
                    },
                )
                # Clave: "DEF-CH-001_M_Negro" (espacios reemplazados por _)
                key = f"{datos['codigo_modelo']}_{talla}_{color}".replace(" ", "_")
                variantes_map[key] = var
                total_variantes += 1

        self.stdout.write(
            f"  ✔ Catálogo: {len(catalogo)} prendas, {total_variantes} variantes (estado inicial: BORRADOR)."
        )
        return variantes_map

    # ──────────────────────────────────────────────────────────────────────────
    # Tipos de cambio
    # ──────────────────────────────────────────────────────────────────────────

    def _crear_tipos_cambio(self):
        hoy = timezone.localdate()
        for i in range(5):
            self.TipoCambio.objects.get_or_create(
                fecha=hoy - timedelta(days=i),
                defaults={"valor": Decimal("6.9600")},
            )
        self.stdout.write("  ✔ Tipo de cambio: 1 USD = 6.96 BOB (últimos 5 días).")

    # ──────────────────────────────────────────────────────────────────────────
    # Importaciones
    # ──────────────────────────────────────────────────────────────────────────

    def _crear_importaciones(self, maestros, variantes, usuarios):
        hoy = timezone.localdate()
        shirley = usuarios["shirley_operador"]
        oscar = usuarios["oscar_agente"]
        OI = self.OperacionImportacion

        # ── IMP-2026-001 : LIBERADA ───────────────────────────────────────────
        # FOB 12 000 + Flete 1 500 + Seguro 300 = CIF 13 800 USD
        # Detalle de unidades × costo FOB unitario → suma = 12 000 USD:
        #   60×65 + 60×28 + 60×52 + 50×38 + 50×16 + 80×7.50 = 12 000
        op001 = self.importacion_svc.crear_operacion(
            validated_data={
                "codigo_unico": "IMP-2026-001",
                "proveedor": maestros["prov_gz"],
                "agente_aduanal": maestros["agente_ovando"],
                "transportista": maestros["trans_tpac"],
                "fecha_registro": hoy - timedelta(days=45),
                "valor_fob": Decimal("12000.00"),
                "valor_flete": Decimal("1500.00"),
                "valor_seguro": Decimal("300.00"),
                "ruta_ingreso": "Guangzhou → Puerto Iquique Chile → Oruro Bolivia",
            },
            usuario=shirley,
        )

        # Líneas de detalle — se deben registrar ANTES de la liberación para
        # que cambiar_estado(LIBERADA) genere los movimientos de inventario
        # correspondientes a cada línea (RF-08/RF-09).
        detalles_001 = [
            (variantes["DEF-CH-001_M_Negro"],        60, Decimal("65.00")),
            (variantes["DEF-PL-001_M_Blanco"],       60, Decimal("28.00")),
            (variantes["DEF-JN-001_L_Azul"],         60, Decimal("52.00")),
            (variantes["DEF-SD-001_M_Gris"],         50, Decimal("38.00")),
            (variantes["DEF-VE-001_S_Beige"],        50, Decimal("16.00")),
            (variantes["DEF-TR-001_S_Rosado_Pastel"], 80, Decimal("7.50")),
        ]
        for var, cantidad, costo_fob in detalles_001:
            self.DetalleImportacion.objects.create(
                operacion=op001,
                variante=var,
                cantidad=cantidad,
                costo_unitario_fob=costo_fob,
            )

        # Transición completa de estados — cada llamada registra auditoría
        self.importacion_svc.cambiar_estado(op001, OI.Estado.EN_TRANSITO, shirley)
        self.importacion_svc.cambiar_estado(op001, OI.Estado.EN_ADUANA, oscar)
        # Al pasar a LIBERADA, inventario.services crea ENTRADA por cada línea
        self.importacion_svc.cambiar_estado(op001, OI.Estado.LIBERADA, oscar)

        # Publicar las variantes que ya tienen stock en el catálogo mayorista
        pks_liberados = [var.pk for var, _, _ in detalles_001]
        self.VarianteProducto.objects.filter(pk__in=pks_liberados).update(
            estado=self.VarianteProducto.Estado.PUBLICADO
        )

        # Costeo de nacionalización: Arancel 10% + IVA 13% sobre CIF
        op001.refresh_from_db()
        costeo_001, _ = self.Costeo.objects.get_or_create(operacion=op001)
        self.costeo_svc.crear_tributo({
            "costeo": costeo_001,
            "tipo": self.Tributo.Tipo.ARANCEL,
            "partida_arancelaria": "6201.40",
            "base_imponible": op001.valor_cif,  # 13 800.00
            "porcentaje": Decimal("10.00"),      # → 1 380.00
        })
        self.costeo_svc.crear_tributo({
            "costeo": costeo_001,
            "tipo": self.Tributo.Tipo.IVA,
            "partida_arancelaria": "6201.40",
            "base_imponible": op001.valor_cif,  # 13 800.00
            "porcentaje": Decimal("13.00"),      # → 1 794.00
        })
        self.costeo_svc.calcular_costeo(op001)  # costo_total = 13 800 + 1 380 + 1 794

        self.stdout.write(
            "  ✔ IMP-2026-001 LIBERADA — stock ingresado, 2 tributos y costeo calculado."
        )

        # ── IMP-2026-002 : EN_ADUANA (con documentos adjuntos) ────────────────
        op002 = self.importacion_svc.crear_operacion(
            validated_data={
                "codigo_unico": "IMP-2026-002",
                "proveedor": maestros["prov_gz"],
                "agente_aduanal": maestros["agente_dab"],
                "transportista": maestros["trans_tpac"],
                "fecha_registro": hoy - timedelta(days=18),
                "valor_fob": Decimal("8500.00"),
                "valor_flete": Decimal("1200.00"),
                "valor_seguro": Decimal("220.00"),
                "ruta_ingreso": "Guangzhou → Puerto Arica Chile → La Paz Bolivia",
            },
            usuario=shirley,
        )
        for var, cantidad, costo_fob in [
            (variantes["DEF-CH-001_L_Negro"],        40, Decimal("65.00")),
            (variantes["DEF-SD-001_L_Gris"],         35, Decimal("72.00")),
            (variantes["DEF-VE-001_M_Rosado_Pastel"], 45, Decimal("16.50")),
            (variantes["DEF-JN-001_M_Azul"],         30, Decimal("52.00")),
        ]:
            self.DetalleImportacion.objects.create(
                operacion=op002, variante=var, cantidad=cantidad, costo_unitario_fob=costo_fob
            )
        self.importacion_svc.cambiar_estado(op002, OI.Estado.EN_TRANSITO, shirley)
        self.importacion_svc.cambiar_estado(op002, OI.Estado.EN_ADUANA, oscar)
        self._adjuntar_documentos(op002, hoy - timedelta(days=10))
        self.stdout.write("  ✔ IMP-2026-002 EN_ADUANA — 2 documentos PDF adjuntos.")

        # ── IMP-2026-003 : EN_TRANSITO ────────────────────────────────────────
        op003 = self.importacion_svc.crear_operacion(
            validated_data={
                "codigo_unico": "IMP-2026-003",
                "proveedor": maestros["prov_yiwu"],
                "agente_aduanal": maestros["agente_ovando"],
                "transportista": maestros["trans_bcx"],
                "fecha_registro": hoy - timedelta(days=8),
                "valor_fob": Decimal("6800.00"),
                "valor_flete": Decimal("950.00"),
                "valor_seguro": Decimal("180.00"),
                "ruta_ingreso": (
                    "Yiwu → Puerto Shanghai → Puerto Iquique Chile → Cochabamba Bolivia"
                ),
            },
            usuario=shirley,
        )
        for var, cantidad, costo_fob in [
            (variantes["DEF-PL-001_L_Gris"],  55, Decimal("28.00")),
            (variantes["DEF-TR-001_M_Beige"],  60, Decimal("7.50")),
            (variantes["DEF-SD-001_M_Beige"],  40, Decimal("70.00")),
        ]:
            self.DetalleImportacion.objects.create(
                operacion=op003, variante=var, cantidad=cantidad, costo_unitario_fob=costo_fob
            )
        self.importacion_svc.cambiar_estado(op003, OI.Estado.EN_TRANSITO, shirley)
        self.stdout.write("  ✔ IMP-2026-003 EN_TRANSITO — viaje marítimo activo.")

        # ── IMP-2026-004 : REGISTRADA (borrador) ─────────────────────────────
        op004 = self.importacion_svc.crear_operacion(
            validated_data={
                "codigo_unico": "IMP-2026-004",
                "proveedor": maestros["prov_yiwu"],
                "agente_aduanal": None,
                "transportista": None,
                "fecha_registro": hoy - timedelta(days=2),
                "valor_fob": Decimal("5200.00"),
                "valor_flete": Decimal("800.00"),
                "valor_seguro": Decimal("130.00"),
                "ruta_ingreso": "Yiwu → Shanghai (pendiente asignacion de agente y transportista)",
            },
            usuario=shirley,
        )
        for var, cantidad, costo_fob in [
            (variantes["DEF-PL-001_XL_Blanco"], 80, Decimal("28.00")),
            (variantes["DEF-JN-001_XL_Azul"],   50, Decimal("52.00")),
            (variantes["DEF-TR-001_L_Negro"],    70, Decimal("7.50")),
        ]:
            self.DetalleImportacion.objects.create(
                operacion=op004, variante=var, cantidad=cantidad, costo_unitario_fob=costo_fob
            )
        self.stdout.write("  ✔ IMP-2026-004 REGISTRADA — borrador recién iniciado por operador.")

    def _adjuntar_documentos(self, operacion, fecha_emision):
        """Crea PDFs mínimos en disco y los registra en la base de datos."""
        media_root = getattr(settings, "MEDIA_ROOT", "/app/media")
        subdir = os.path.join("documentos", str(fecha_emision.year), f"{fecha_emision.month:02d}")
        dir_abs = os.path.join(media_root, subdir)
        os.makedirs(dir_abs, exist_ok=True)

        # PDF de una página vacía (cabecera estándar PDF 1.4)
        pdf_stub = (
            b"%PDF-1.4\n"
            b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n"
            b"%%EOF\n"
        )

        docs = [
            (f"factura_{operacion.codigo_unico}.pdf", "FACTURA", "Factura Comercial"),
            (f"bl_{operacion.codigo_unico}.pdf",      "BL",      "Bill of Lading"),
        ]
        for nombre_archivo, tipo, nombre_display in docs:
            ruta_rel = os.path.join(subdir, nombre_archivo)
            ruta_abs = os.path.join(dir_abs, nombre_archivo)
            with open(ruta_abs, "wb") as f:
                f.write(pdf_stub)
            self.Documento.objects.create(
                operacion=operacion,
                tipo=tipo,
                nombre=nombre_display,
                archivo=ruta_rel,
                fecha_emision=fecha_emision,
            )

    # ──────────────────────────────────────────────────────────────────────────
    # Pedidos mayoristas
    # ──────────────────────────────────────────────────────────────────────────

    def _crear_pedidos(self, maestros, variantes, usuarios):
        """Crea 5 pedidos en estados progresivos usando pedidos.services para
        que el stock se descuente atómicamente y la bitácora se genere igual
        que en la aplicación web real.

        Stock disponible tras IMP-2026-001 LIBERADA:
          DEF-CH-001 M Negro        → 60 u
          DEF-PL-001 M Blanco       → 60 u
          DEF-JN-001 L Azul         → 60 u
          DEF-SD-001 M Gris         → 50 u
          DEF-VE-001 S Beige        → 50 u
          DEF-TR-001 S Rosado Pastel → 80 u

        Consumo total por pedidos:
          CH M Negro   : 15 (P1) + 24 (P4) = 39  → resta 21
          PL M Blanco  : 20 (P1) + 15 (P3) = 35  → resta 25
          JN L Azul    : 30 (P2) + 10 (P5) = 40  → resta 20
          SD M Gris    : 25 (P2)            = 25  → resta 25
          VE S Beige   : 25 (P4)            = 25  → resta 25
          TR S Rosado  : 30 (P3) + 12 (P5) = 42  → resta 38
        """
        hoy = timezone.localdate()
        shirley = usuarios["shirley_operador"]
        marian_u = usuarios["marian_cliente"]
        glam_u = usuarios["boutique_glam_cliente"]
        cli_marian = maestros["cli_marian"]
        cli_glam = maestros["cli_glam"]
        PM = self.PedidoMayorista

        def v(key):
            var = variantes[key]
            var.refresh_from_db()
            return var

        # ── PED-2026-001 : ENTREGADO (marian — mínimo 10) ────────────────────
        ped001 = self.pedidos_svc.crear_pedido(
            cliente=cli_marian,
            detalles_data=[
                {"variante": v("DEF-CH-001_M_Negro"),  "cantidad": 15},
                {"variante": v("DEF-PL-001_M_Blanco"), "cantidad": 20},
            ],
            usuario=marian_u,
        )
        ped001.codigo_pedido = "PED-2026-001"
        ped001.fecha = hoy - timedelta(days=30)
        ped001.save(update_fields=["codigo_pedido", "fecha"])
        self.pedidos_svc.cambiar_estado_pedido(ped001, PM.Estado.CONFIRMADO,    shirley)
        self.pedidos_svc.cambiar_estado_pedido(ped001, PM.Estado.EN_PREPARACION, shirley)
        self.pedidos_svc.cambiar_estado_pedido(ped001, PM.Estado.ENVIADO,        shirley)
        self.pedidos_svc.cambiar_estado_pedido(ped001, PM.Estado.ENTREGADO,      shirley)
        self.stdout.write("  ✔ PED-2026-001 ENTREGADO (marian — 15 chaquetas + 20 poleras).")

        # ── PED-2026-002 : ENVIADO (boutique_glam — mínimo 24) ───────────────
        ped002 = self.pedidos_svc.crear_pedido(
            cliente=cli_glam,
            detalles_data=[
                {"variante": v("DEF-JN-001_L_Azul"),  "cantidad": 30},
                {"variante": v("DEF-SD-001_M_Gris"),  "cantidad": 25},
            ],
            usuario=glam_u,
        )
        ped002.codigo_pedido = "PED-2026-002"
        ped002.fecha = hoy - timedelta(days=14)
        ped002.save(update_fields=["codigo_pedido", "fecha"])
        self.pedidos_svc.cambiar_estado_pedido(ped002, PM.Estado.CONFIRMADO,    shirley)
        self.pedidos_svc.cambiar_estado_pedido(ped002, PM.Estado.EN_PREPARACION, shirley)
        self.pedidos_svc.cambiar_estado_pedido(ped002, PM.Estado.ENVIADO,        shirley)
        self.stdout.write("  ✔ PED-2026-002 ENVIADO (boutique_glam — 30 jeans + 25 sudaderas).")

        # ── PED-2026-003 : EN_PREPARACION (marian) ───────────────────────────
        ped003 = self.pedidos_svc.crear_pedido(
            cliente=cli_marian,
            detalles_data=[
                {"variante": v("DEF-TR-001_S_Rosado_Pastel"), "cantidad": 30},
                {"variante": v("DEF-PL-001_M_Blanco"),        "cantidad": 15},
            ],
            usuario=marian_u,
        )
        ped003.codigo_pedido = "PED-2026-003"
        ped003.fecha = hoy - timedelta(days=7)
        ped003.save(update_fields=["codigo_pedido", "fecha"])
        self.pedidos_svc.cambiar_estado_pedido(ped003, PM.Estado.CONFIRMADO,    shirley)
        self.pedidos_svc.cambiar_estado_pedido(ped003, PM.Estado.EN_PREPARACION, shirley)
        self.stdout.write(
            "  ✔ PED-2026-003 EN_PREPARACION (marian — 30 tops + 15 poleras, empaquetando)."
        )

        # ── PED-2026-004 : CONFIRMADO (boutique_glam) ────────────────────────
        ped004 = self.pedidos_svc.crear_pedido(
            cliente=cli_glam,
            detalles_data=[
                {"variante": v("DEF-CH-001_M_Negro"),  "cantidad": 24},
                {"variante": v("DEF-VE-001_S_Beige"),  "cantidad": 25},
            ],
            usuario=glam_u,
        )
        ped004.codigo_pedido = "PED-2026-004"
        ped004.fecha = hoy - timedelta(days=3)
        ped004.save(update_fields=["codigo_pedido", "fecha"])
        self.pedidos_svc.cambiar_estado_pedido(ped004, PM.Estado.CONFIRMADO, shirley)
        self.stdout.write(
            "  ✔ PED-2026-004 CONFIRMADO (boutique_glam — 24 chaquetas + 25 vestidos)."
        )

        # ── PED-2026-005 : PENDIENTE (marian — recién enviado) ───────────────
        ped005 = self.pedidos_svc.crear_pedido(
            cliente=cli_marian,
            detalles_data=[
                {"variante": v("DEF-TR-001_S_Rosado_Pastel"), "cantidad": 12},
                {"variante": v("DEF-JN-001_L_Azul"),          "cantidad": 10},
            ],
            usuario=marian_u,
        )
        ped005.codigo_pedido = "PED-2026-005"
        ped005.save(update_fields=["codigo_pedido"])
        self.stdout.write(
            "  ✔ PED-2026-005 PENDIENTE (marian — 12 tops + 10 jeans, esperando validación)."
        )

    # ──────────────────────────────────────────────────────────────────────────
    # Bitácora adicional
    # ──────────────────────────────────────────────────────────────────────────

    def _bitacora_adicional(self, maestros, variantes, usuarios):
        """Registra actividad concurrente del personal durante la última semana
        para simular un sistema en operación real ante el jurado."""

        r = self.auditoria_svc.registrar
        shirley = usuarios["shirley_operador"]
        carla = usuarios["carla_contador"]
        oscar = usuarios["oscar_agente"]
        admin = usuarios["admin"]
        marian = usuarios["marian_cliente"]
        glam = usuarios["boutique_glam_cliente"]

        entradas = [
            (
                admin, "crear_usuario", None,
                {"username": "boutique_glam_cliente", "rol": "Cliente Mayorista",
                 "nota": "Alta de cuenta para Boutique Glam SRL"},
            ),
            (
                admin, "crear_usuario", None,
                {"username": "shirley_operador", "rol": "Operador de Comercio Exterior"},
            ),
            (
                shirley, "publicar_variante", variantes["DEF-CH-001_M_Negro"],
                {"codigo_modelo": "DEF-CH-001", "talla": "M", "color": "Negro",
                 "motivo": "Stock ingresado tras liberacion IMP-2026-001"},
            ),
            (
                shirley, "publicar_variante", variantes["DEF-PL-001_M_Blanco"],
                {"codigo_modelo": "DEF-PL-001", "talla": "M", "color": "Blanco"},
            ),
            (
                shirley, "publicar_variante", variantes["DEF-JN-001_L_Azul"],
                {"codigo_modelo": "DEF-JN-001", "talla": "L", "color": "Azul"},
            ),
            (
                shirley, "publicar_variante", variantes["DEF-SD-001_M_Gris"],
                {"codigo_modelo": "DEF-SD-001", "talla": "M", "color": "Gris"},
            ),
            (
                shirley, "publicar_variante", variantes["DEF-VE-001_S_Beige"],
                {"codigo_modelo": "DEF-VE-001", "talla": "S", "color": "Beige"},
            ),
            (
                shirley, "publicar_variante", variantes["DEF-TR-001_S_Rosado_Pastel"],
                {"codigo_modelo": "DEF-TR-001", "talla": "S", "color": "Rosado Pastel"},
            ),
            (
                carla, "calcular_costeo", None,
                {
                    "importacion": "IMP-2026-001",
                    "cif_usd": "13800.00",
                    "arancel_usd": "1380.00",
                    "iva_usd": "1794.00",
                    "costo_total_usd": "16974.00",
                    "nota": "Costeo de nacionalización ejecutado por contabilidad",
                },
            ),
            (
                oscar, "registrar_documento", None,
                {"importacion": "IMP-2026-002", "tipo": "FACTURA",
                 "nombre": "Factura Comercial", "estado_operacion": "EN_ADUANA"},
            ),
            (
                oscar, "registrar_documento", None,
                {"importacion": "IMP-2026-002", "tipo": "BL",
                 "nombre": "Bill of Lading", "estado_operacion": "EN_ADUANA"},
            ),
            (
                shirley, "verificar_stock_post_liberacion", None,
                {
                    "importacion": "IMP-2026-001",
                    "variantes_ingresadas": 6,
                    "unidades_totales": 360,
                    "nota": "Stock verificado en inventario tras liberacion aduanera",
                },
            ),
            (
                marian, "consultar_catalogo", None,
                {"filtro": "categoria=Poleras", "resultados": 2,
                 "portal": "mayorista"},
            ),
            (
                marian, "crear_pedido", None,
                {"pedido": "PED-2026-005", "estado": "PENDIENTE",
                 "items": 2, "nota": "Pedido enviado por portal mayorista"},
            ),
            (
                glam, "consultar_catalogo", None,
                {"filtro": "categoria=Chaquetas", "resultados": 1,
                 "portal": "mayorista"},
            ),
            (
                shirley, "confirmar_pedido", None,
                {"pedido": "PED-2026-004", "cliente": "Boutique Glam SRL",
                 "estado_nuevo": "CONFIRMADO",
                 "nota": "Stock reservado atómicamente por el servicio de pedidos"},
            ),
        ]

        for usuario, accion, entidad, detalle in entradas:
            r(usuario=usuario, accion=accion, entidad=entidad, detalle=detalle)

        self.stdout.write(
            f"  ✔ {len(entradas)} entradas de bitácora adicionales registradas."
        )
