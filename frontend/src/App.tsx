import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

type HealthResponse = {
  status: string
  service: string
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health/')
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data))
      .catch(() => setError('No se pudo conectar con el backend.'))
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-foreground">
      <h1 className="text-3xl font-bold">Trendy Import SRL</h1>
      <p className="text-muted-foreground">
        Fase 1 — Arquitectura base (React + Django + PostgreSQL + Nginx)
      </p>

      <div className="rounded-lg border border-border p-4 text-sm">
        {error && <p className="text-destructive">{error}</p>}
        {!error && !health && <p>Consultando estado del backend...</p>}
        {health && (
          <p>
            Backend: <strong>{health.status}</strong> ({health.service})
          </p>
        )}
      </div>

      <Button onClick={() => window.location.reload()}>Reintentar</Button>
    </main>
  )
}

export default App
