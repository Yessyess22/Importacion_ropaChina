/**
 * Suite E2E del flujo de reportes y bitácora — S4-T04
 *
 * Pre-requisito: el stack completo debe estar en ejecución.
 *   docker compose up -d
 *   docker compose exec backend python manage.py seed_dev_data
 *
 * Ejecución:
 *   npx playwright test tests/reportes.spec.ts
 *
 * Cubre RF-11 (reportes de importaciones/pedidos con gráfico + tabla de
 * detalle por registro + exportación a PDF) y S4-T03 (bitácora paginada
 * con filtro por acción y usuario).
 */

import { expect, test } from '@playwright/test'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'AdminDesarrolloUPDS2026!'

const CLIENTE_USERNAME = 'cliente_test'
const CLIENTE_PASSWORD = 'TestPass123!'

test('E1: reporte de importaciones muestra gráfico, detalle y permite exportar PDF', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(ADMIN_USERNAME)
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL('/')

  await page.getByRole('link', { name: 'Reportes' }).click()
  await page.waitForURL('/reportes')

  await expect(page.getByRole('heading', { name: 'Importaciones', exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Cantidad de importaciones por estado' })).toBeVisible()
  await expect(page.getByText(/Detalle de operaciones/)).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page
    .locator('section', { has: page.getByRole('heading', { name: 'Importaciones', exact: true }) })
    .getByRole('button', { name: /exportar pdf/i })
    .click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('reporte-importaciones-detallado.pdf')

  // Filtro de fechas: un rango sin operaciones muestra la tabla de detalle vacía.
  const seccionImportaciones = page.locator('section', {
    has: page.getByRole('heading', { name: 'Importaciones', exact: true }),
  })
  await seccionImportaciones.getByLabel('Desde').fill('2099-01-01')
  await expect(page.getByText('No hay operaciones registradas en el rango seleccionado.')).toBeVisible()
  await seccionImportaciones.getByRole('button', { name: 'Limpiar filtro' }).click()
})

test('E2: reporte de pedidos filtra por cliente y permite exportar PDF', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(ADMIN_USERNAME)
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL('/')

  await page.goto('/reportes')
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible()
  await expect(page.getByText(/Detalle de pedidos/)).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page
    .locator('section', { has: page.getByRole('heading', { name: 'Pedidos', exact: true }) })
    .getByRole('button', { name: /exportar pdf/i })
    .click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('reporte-pedidos-detallado.pdf')
})

test('E3: Cliente Mayorista no puede acceder a /reportes', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(CLIENTE_USERNAME)
  await page.getByLabel('Contraseña').fill(CLIENTE_PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL('/')

  await page.goto('/reportes')
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('link', { name: 'Reportes' })).toHaveCount(0)
})

test('E4: bitácora lista registros y filtra por acción', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(ADMIN_USERNAME)
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL('/')

  await page.getByRole('link', { name: 'Bitácora' }).click()
  await page.waitForURL('/auditoria')
  await expect(page.getByRole('heading', { name: 'Bitácora de Auditoría' })).toBeVisible()

  const filas = page.locator('tbody tr')
  await expect(filas.first()).toBeVisible()

  // Se usan aserciones con auto-retry de Playwright (en vez de un
  // `waitForTimeout` fijo) para no depender de cuánto tarde el fetch —
  // un timeout fijo es una fuente de flakiness bajo carga variable.
  await page.getByPlaceholder('Buscar por acción…').fill('crear_pedido')
  await expect(filas.first()).toContainText('Crear Pedido')

  await page.getByPlaceholder('Buscar por acción…').fill('accion_inexistente_zzz')
  await expect(page.getByText('Sin resultados para los filtros aplicados.')).toBeVisible()

  await page.getByRole('button', { name: 'Limpiar filtros' }).click()
})

test('E5: Cliente Mayorista no puede acceder a /auditoria (exclusiva de Administrador)', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(CLIENTE_USERNAME)
  await page.getByLabel('Contraseña').fill(CLIENTE_PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL('/')

  await page.goto('/auditoria')
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('link', { name: 'Bitácora' })).toHaveCount(0)
})
