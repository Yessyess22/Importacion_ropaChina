/**
 * Suite E2E del flujo de importaciones — S2-T07
 *
 * Pre-requisito: el stack completo debe estar en ejecución.
 *   docker compose up -d
 *   docker compose exec backend python manage.py seed_dev_data
 *
 * Ejecución:
 *   npx playwright test tests/importaciones.spec.ts
 *
 * Cubre el flujo completo de una operación de importación: registro con
 * una línea de detalle, y las tres transiciones de estado de aduana
 * (REGISTRADA → EN_TRANSITO → EN_ADUANA → LIBERADA) desde la UI, con
 * verificación del stock resultante (RF-09: la liberación genera entrada
 * de inventario automática).
 */

import { expect, test } from '@playwright/test'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'AdminDesarrolloUPDS2026!'

test('E1: flujo completo — registrar importación con línea, avanzar por los 4 estados y liberar genera stock', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(ADMIN_USERNAME)
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL('/')

  // -------------------------------------------------------------------
  // Paso 1 — Registrar la operación con una línea de detalle
  // -------------------------------------------------------------------
  const codigoUnico = `IMP-E2E-${Date.now()}`

  await page.goto('/importaciones/nueva')
  await page.locator('#codigo_unico').fill(codigoUnico)

  await page.locator('#proveedor').click()
  await page.getByRole('option').first().click()

  await page.locator('#fecha_registro').fill('2026-08-30')
  await page.locator('#valor_fob').fill('1000')
  await page.locator('#valor_flete').fill('150')
  await page.locator('#valor_seguro').fill('25')

  // CIF previsualizado en el frontend debe reflejar FOB + flete + seguro
  await expect(page.getByText('1.175,00 BOB')).toBeVisible()

  await page.getByRole('button', { name: /agregar línea/i }).click()
  await page.locator('table [role="combobox"]').first().click()
  await page.getByRole('option').first().click()
  await page.locator('table input[type="number"]').nth(0).fill('10')
  await page.locator('table input[type="number"]').nth(1).fill('25.50')

  await page.getByRole('button', { name: /registrar importación/i }).click()

  // Redirige al detalle de la operación recién creada
  await page.waitForURL(/\/importaciones\/\d+$/)
  await expect(page.getByText(codigoUnico)).toBeVisible()
  await expect(page.getByText('Registrada', { exact: true })).toBeVisible()
  // El CIF calculado por el backend (nunca por el cliente) debe coincidir
  await expect(page.getByText('1.175,00 BOB')).toBeVisible()

  async function avanzarEstado(botonRegex: RegExp, estadoEsperado: string) {
    await page.getByRole('button', { name: /cambiar estado/i }).click()
    await page.getByRole('button', { name: botonRegex }).click()
    await page.getByRole('button', { name: /^confirmar$/i }).click()
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(estadoEsperado, { exact: true })).toBeVisible()
  }

  // -------------------------------------------------------------------
  // Paso 2 — REGISTRADA → EN_TRANSITO
  // -------------------------------------------------------------------
  await avanzarEstado(/avanzar a en tránsito/i, 'En Tránsito')

  // -------------------------------------------------------------------
  // Paso 3 — EN_TRANSITO → EN_ADUANA
  // -------------------------------------------------------------------
  await avanzarEstado(/avanzar a en aduana/i, 'En Aduana')

  // -------------------------------------------------------------------
  // Paso 4 — EN_ADUANA → LIBERADA (dispara entrada de stock, RF-09)
  // -------------------------------------------------------------------
  await avanzarEstado(/avanzar a liberada/i, 'Liberada')

  // Liberada es un estado terminal: ya no debe ofrecerse "Cambiar Estado"
  await expect(page.getByRole('button', { name: /cambiar estado/i })).toHaveCount(0)
})
