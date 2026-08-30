/**
 * Suite E2E de autenticación — S1-T09 / GAP-7
 *
 * Pre-requisito: el stack completo debe estar en ejecución.
 *   docker compose up -d
 *
 * Ejecución:
 *   npx playwright test tests/auth.spec.ts
 *
 * Credenciales asumidas (seed de desarrollo):
 *   Administrador  → admin / AdminDesarrolloUPDS2026!
 *   Cliente Mayorista → cliente_test / TestPass123!
 *
 * Si el seed genera usuarios distintos, ajusta las constantes ADMIN_* y CLIENTE_*.
 */

import { expect, test, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Constantes de entorno de prueba
// ---------------------------------------------------------------------------
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'AdminDesarrolloUPDS2026!'

const CLIENTE_USERNAME = 'cliente_test'
const CLIENTE_PASSWORD = 'TestPass123!'

const INVALID_USERNAME = 'no_existe'
const INVALID_PASSWORD = 'contraseña_invalida'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Realiza el login completo y espera la redirección al dashboard. */
async function loginAs(page: Page, username: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(username)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: /ingresar/i }).click()
  await page.waitForURL('/')
}

// ---------------------------------------------------------------------------
// Escenario 1 — Login exitoso y redirección al Dashboard
// ---------------------------------------------------------------------------
test('E1: login exitoso redirige al dashboard y muestra nombre y rol en sidebar', async ({ page }) => {
  await page.goto('/login')

  // Rellena el formulario con credenciales válidas de administrador
  await page.getByLabel('Usuario').fill(ADMIN_USERNAME)
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()

  // El sistema debe redirigir automáticamente a "/"
  await page.waitForURL('/')
  expect(page.url()).toMatch(/\/$/)

  // Debe haberse creado una cookie de sesión (sessionid es el nombre por defecto de Django)
  const cookies = await page.context().cookies()
  const sessionCookie = cookies.find((c) => c.name === 'sessionid')
  expect(sessionCookie, 'La cookie de sesión debe existir tras el login').toBeTruthy()

  // El sidebar debe mostrar el rol del usuario
  const sidebar = page.locator('aside').first()
  await expect(sidebar.getByText('Administrador')).toBeVisible()
})

// ---------------------------------------------------------------------------
// Escenario 2 — Login fallido y aparición del Toast de error
// ---------------------------------------------------------------------------
test('E2: credenciales inválidas muestran toast de error y el usuario permanece en /login', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Usuario').fill(INVALID_USERNAME)
  await page.getByLabel('Contraseña').fill(INVALID_PASSWORD)
  await page.getByRole('button', { name: /ingresar/i }).click()

  // No debe haber redirección — permanece en /login
  await page.waitForTimeout(1500)
  expect(page.url()).toContain('/login')

  // Sonner renderiza los toasts en un [data-sonner-toaster] o con role="status"
  // El mensaje de error definido en Login.tsx es "Credenciales incorrectas"
  const toast = page.locator('[data-sonner-toast]').first()
  await expect(toast).toBeVisible({ timeout: 5_000 })
  await expect(toast).toContainText(/credenciales/i)
})

// ---------------------------------------------------------------------------
// Escenario 3 — Logout seguro mediante AlertDialog de confirmación
// ---------------------------------------------------------------------------
test('E3: logout muestra AlertDialog de confirmación, destruye sesión y redirige a /login', async ({ page }) => {
  // Establece sesión activa
  await loginAs(page, ADMIN_USERNAME, ADMIN_PASSWORD)

  // Localiza y pulsa "Cerrar sesión" en el sidebar (desktop)
  const sidebar = page.locator('aside').first()
  await sidebar.getByRole('button', { name: /cerrar sesión/i }).click()

  // El AlertDialog de shadcn/ui debe aparecer con el título definido en AppLayout
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(/cerrás sesión/i)

  // Confirma el logout pulsando el botón de acción destructiva
  await dialog.getByRole('button', { name: /cerrar sesión/i }).click()

  // Espera redirección a /login
  await page.waitForURL('/login')
  expect(page.url()).toContain('/login')

  // La cookie de sesión debe haber desaparecido
  const cookies = await page.context().cookies()
  const sessionCookie = cookies.find((c) => c.name === 'sessionid')
  expect(sessionCookie, 'La cookie de sesión debe destruirse tras el logout').toBeFalsy()
})

// ---------------------------------------------------------------------------
// Escenario 4 — Protección de rutas por rol (redirección para rol sin acceso)
// ---------------------------------------------------------------------------
test('E4: usuario con rol limitado es bloqueado al intentar acceder a /usuarios', async ({ page }) => {
  // Inicia sesión como Cliente Mayorista (rol sin acceso a /usuarios)
  await loginAs(page, CLIENTE_USERNAME, CLIENTE_PASSWORD)

  // Fuerza navegación directa a ruta restringida
  await page.goto('/usuarios')

  // ProtectedRoute redirige a "/" cuando el rol no está en allowedRoles
  // Espera que la URL final NO sea /usuarios
  await page.waitForURL((url) => !url.pathname.startsWith('/usuarios'), { timeout: 5_000 })

  const finalUrl = new URL(page.url())
  expect(
    finalUrl.pathname,
    'El sistema debe redirigir al dashboard "/" ante un rol sin permiso',
  ).toBe('/')
})
