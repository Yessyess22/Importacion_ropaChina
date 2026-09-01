import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  Building2,
  Calculator,
  ClipboardList,
  DollarSign,
  FileText,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Package,
  Ship,
  ShoppingCart,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types/auth'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  allowedRoles: Role[]
}

const ALL_ROLES: Role[] = [
  'Administrador',
  'Operador de Comercio Exterior',
  'Agente Aduanal',
  'Contabilidad',
  'Cliente Mayorista',
]

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    allowedRoles: ALL_ROLES,
  },
  {
    label: 'Usuarios',
    href: '/usuarios',
    icon: Users,
    allowedRoles: ['Administrador'],
  },
  {
    label: 'Proveedores',
    href: '/proveedores',
    icon: Building2,
    allowedRoles: ['Administrador', 'Operador de Comercio Exterior', 'Agente Aduanal'],
  },
  {
    label: 'Clientes Mayoristas',
    href: '/clientes-mayoristas',
    icon: UserCheck,
    allowedRoles: ['Administrador', 'Operador de Comercio Exterior'],
  },
  {
    label: 'Agentes Aduanales',
    href: '/agentes-aduanales',
    icon: Briefcase,
    allowedRoles: ['Administrador', 'Operador de Comercio Exterior', 'Agente Aduanal'],
  },
  {
    label: 'Catálogo',
    href: '/catalogo',
    icon: Package,
    allowedRoles: ['Administrador', 'Operador de Comercio Exterior', 'Cliente Mayorista'],
  },
  {
    label: 'Importaciones',
    href: '/importaciones',
    icon: Ship,
    allowedRoles: ['Administrador', 'Operador de Comercio Exterior', 'Agente Aduanal', 'Contabilidad'],
  },
  {
    label: 'Documentos',
    href: '/documentos',
    icon: FileText,
    allowedRoles: ['Administrador', 'Agente Aduanal'],
  },
  {
    label: 'Costeo',
    href: '/costeo',
    icon: Calculator,
    allowedRoles: ['Administrador', 'Contabilidad'],
  },
  {
    label: 'Tipo de Cambio',
    href: '/tipo-cambio',
    icon: DollarSign,
    allowedRoles: ['Administrador', 'Operador de Comercio Exterior', 'Contabilidad'],
  },
  {
    label: 'Stock',
    href: '/stock',
    icon: Layers,
    allowedRoles: ['Administrador', 'Operador de Comercio Exterior', 'Agente Aduanal', 'Contabilidad'],
  },
  {
    label: 'Pedidos',
    href: '/pedidos',
    icon: ShoppingCart,
    allowedRoles: ['Administrador', 'Operador de Comercio Exterior', 'Contabilidad', 'Cliente Mayorista'],
  },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: BarChart3,
    allowedRoles: ['Administrador', 'Operador de Comercio Exterior', 'Agente Aduanal', 'Contabilidad'],
  },
  {
    label: 'Bitácora',
    href: '/auditoria',
    icon: ClipboardList,
    allowedRoles: ['Administrador'],
  },
]

export function AppLayout() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const visibleItems = NAV_ITEMS.filter(
    (item) => role !== null && item.allowedRoles.includes(role),
  )

  const displayName =
    user?.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : (user?.username ?? '')

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const SidebarContent = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-2 px-2 py-3">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground shadow-sm">
          T
        </span>
        <span className="text-sm font-semibold text-zinc-100">Trendy Import</span>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-all duration-150',
                isActive
                  ? 'scale-[1.02] bg-primary font-medium text-primary-foreground shadow-sm'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <div className="mb-2 px-2.5">
          <p className="truncate text-sm font-medium text-zinc-100">{displayName}</p>
          <p className="truncate text-xs text-zinc-400">{role}</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() => setIsLogoutDialogOpen(true)}
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </Button>
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
        {SidebarContent}
      </aside>

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-56 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 lg:hidden',
          isSidebarOpen ? 'flex translate-x-0' : 'hidden -translate-x-full',
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(false)}
          className="absolute right-2 top-2"
        >
          <X className="size-4" />
        </Button>
        {SidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground">Trendy Import SRL</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrás sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrará tu sesión activa en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleLogout}>
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
