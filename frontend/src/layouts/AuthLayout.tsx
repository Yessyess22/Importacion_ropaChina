import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

const FEATURES = [
  { text: 'Flujo FOB → CIF → Aduana → Stock automatizado' },
  { text: 'Pedidos mayoristas con reserva atómica de inventario' },
  { text: '5 roles de acceso — auditoría de todas las operaciones' },
]

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca — solo visible en desktop */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white lg:flex">

        {/* Orbes decorativos para dar profundidad */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/4 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-white/4 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-sm font-bold ring-1 ring-inset ring-white/20">
            T
          </span>
          <span className="text-base font-semibold tracking-tight">Trendy Import SRL</span>
        </div>

        {/* Contenido central */}
        <div className="relative space-y-8">
          <div className="space-y-2">
            <p className="text-3xl font-bold leading-tight tracking-tight">
              Gestión integral de
            </p>
            <p className="text-3xl font-bold leading-tight tracking-tight text-white/40">
              importaciones China — Bolivia.
            </p>
          </div>

          <ul className="space-y-3.5">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-3 text-sm text-white/60">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/80">
                  ✓
                </span>
                {f.text}
              </li>
            ))}
          </ul>

          {/* Separador decorativo */}
          <div className="h-px w-16 bg-white/10" />

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: '5', label: 'Roles de acceso' },
              { value: '100%', label: 'Auditoría trazable' },
              { value: 'B2B', label: 'Portal mayorista' },
              { value: 'BOB', label: 'Moneda de operación' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg bg-white/5 p-3.5 ring-1 ring-inset ring-white/10"
              >
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="mt-0.5 text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline inferior */}
        <blockquote className="relative space-y-1.5">
          <p className="text-sm leading-relaxed text-white/40">
            Administra proveedores, pedidos, costos aduanales y stock desde un
            solo lugar.
          </p>
          <footer className="text-xs text-white/25">— Panel de Operaciones B2B</footer>
        </blockquote>
      </div>

      {/* Panel de formulario */}
      <div className="flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
