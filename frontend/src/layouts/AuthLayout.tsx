import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary-foreground/10 font-bold text-primary-foreground">
            T
          </span>
          Trendy Import SRL
        </div>

        <blockquote className="space-y-2">
          <p className="text-sm leading-relaxed text-primary-foreground/80">
            Sistema de gestión de importaciones de ropa china. Administra proveedores, pedidos,
            costos aduanales y stock desde un solo lugar.
          </p>
          <footer className="text-xs text-primary-foreground/60">— Panel de Operaciones B2B</footer>
        </blockquote>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
