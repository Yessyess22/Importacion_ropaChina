/**
 * Suite E2E del flujo de pedido — S3-T07
 *
 * Pre-requisito: el stack completo debe estar en ejecución y el seed de
 * desarrollo cargado (los niveles de stock del catálogo demo se
 * resetean en cada corrida del seed, por lo que este test es
 * determinista mientras no se lo modifique manualmente entre corridas):
 *   docker compose up -d
 *   docker compose exec backend python manage.py seed_dev_data
 *
 * Ejecución:
 *   npx playwright test tests/pedidos.spec.ts
 *
 * Cubre el flujo completo de un pedido mayorista: selección de variante,
 * bloqueo por cantidad mínima incumplida (RF-15), corrección de la
 * cantidad y confirmación, y verificación de que el pedido aparece en
 * `/pedidos` con su estado inicial.
 *
 * Usa el modelo demo `DEV-VC-001` (Vestido Casual Demo), que en el seed
 * tiene una única variante publicada con stock (L / Rojo, stock 40) —
 * evita ambigüedad de selectores al haber un solo `VarianteSelector`
 * visible para ese modelo.
 */

import { expect, test } from '@playwright/test'

const CLIENTE_USERNAME = 'cliente_test'
const CLIENTE_PASSWORD = 'TestPass123!'

const MODELO = 'DEV-VC-001'
const MINIMO_MODELO = 10

test('E1: flujo de pedido — selección, error de mínimo, corrección y confirmación', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(CLIENTE_USERNAME)
  await page.getByLabel('Contraseña').fill(CLIENTE_PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL('/')

  // -------------------------------------------------------------------
  // Paso 1 — Ir al carrito de pedido desde el Catálogo
  // -------------------------------------------------------------------
  await page.goto('/catalogo')
  // El botón "Nuevo Pedido" renderiza un <a> vía la prop `render` de
  // base-ui con `role="button"` explícito (mismo patrón que "Nueva
  // Importación" en Sprint 2), no `role="link"`.
  await page.getByRole('button', { name: /nuevo pedido/i }).click()
  await page.waitForURL('/pedidos/nuevo')

  // El mínimo del cliente se muestra antes de armar el carrito
  await expect(page.getByText(new RegExp(`${MINIMO_MODELO} unidades`))).toBeVisible()

  // -------------------------------------------------------------------
  // Paso 2 — Seleccionar el modelo y agregar 1 unidad (por debajo del mínimo)
  // -------------------------------------------------------------------
  await page.locator('#prenda').click()
  await page.getByRole('option', { name: new RegExp(MODELO) }).click()

  // Este modelo tiene una única variante publicada con stock en el seed
  // (L / Rojo), así que no hay ambigüedad en los selectores de la tarjeta.
  await expect(page.getByText('L · Rojo')).toBeVisible()
  await page.getByRole('button', { name: /agregar/i }).click()

  await expect(page.getByText(`1 / ${MINIMO_MODELO} mín.`)).toBeVisible()

  // -------------------------------------------------------------------
  // Paso 3 — Confirmar con cantidad insuficiente: debe bloquear con toast
  // -------------------------------------------------------------------
  await page.getByRole('button', { name: /confirmar pedido/i }).click()

  const toastError = page.locator('[data-sonner-toast]').first()
  await expect(toastError).toBeVisible({ timeout: 5_000 })
  await expect(toastError).toContainText(new RegExp(`mínima por modelo es ${MINIMO_MODELO}`))
  expect(page.url()).toContain('/pedidos/nuevo')

  // -------------------------------------------------------------------
  // Paso 4 — Corregir la cantidad para cumplir el mínimo y reintentar
  // -------------------------------------------------------------------
  await page.locator('input[type="number"]').first().fill(String(MINIMO_MODELO - 1))
  await page.getByRole('button', { name: /agregar/i }).click()
  await expect(page.getByText(`${MINIMO_MODELO} / ${MINIMO_MODELO} mín.`)).toBeVisible()

  await page.getByRole('button', { name: /confirmar pedido/i }).click()

  const toastExito = page.locator('[data-sonner-toast]').first()
  await expect(toastExito).toBeVisible({ timeout: 5_000 })
  await expect(toastExito).toContainText(/registrado correctamente/i)
  const codigoPedido = (await toastExito.textContent())?.match(/PED-[\w-]+/)?.[0]
  expect(codigoPedido, 'El toast de éxito debe incluir el código del pedido').toBeTruthy()

  // La confirmación redirige de vuelta al catálogo (no existe aún un
  // detalle de pedido al que volver desde este flujo)
  await page.waitForURL('/catalogo')

  // -------------------------------------------------------------------
  // Paso 5 — Verificar que el pedido aparece en /pedidos con su estado inicial
  // -------------------------------------------------------------------
  await page.goto('/pedidos')
  const fila = page.locator('tbody tr', { hasText: codigoPedido! })
  await expect(fila).toBeVisible()
  await expect(fila.getByText('Pendiente', { exact: true })).toBeVisible()
})
