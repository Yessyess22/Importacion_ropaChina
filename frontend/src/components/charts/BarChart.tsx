import { useState } from 'react'

import { cn } from '@/lib/utils'

export interface BarChartDatum {
  label: string
  value: number
}

interface BarChartProps {
  data: BarChartDatum[]
  ariaLabel: string
  formatValue?: (value: number) => string
}

const CHART_HEIGHT = 180
const BAR_WIDTH = 40
const GAP = 20
const TOP_PADDING = 24
const BOTTOM_PADDING = 22

/**
 * Gráfico de barras de una sola serie (categórica por estado): cada barra
 * ya se identifica por su etiqueta de eje, así que usa un único tono
 * (`--chart-1` de index.css) en vez de un color por barra — reservar hues
 * distintos para cuando el color es el único canal de identidad (leyenda).
 */
export function BarChart({ data, ariaLabel, formatValue = (v) => String(v) }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const innerHeight = CHART_HEIGHT - TOP_PADDING - BOTTOM_PADDING
  const width = data.length * (BAR_WIDTH + GAP) + GAP

  if (data.length === 0) {
    return (
      <p className="flex h-45 items-center justify-center text-sm text-muted-foreground">
        Sin datos para el rango seleccionado.
      </p>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        preserveAspectRatio="xMinYMid meet"
        className="h-45 min-w-80 w-full"
      >
        <line
          x1={0}
          y1={CHART_HEIGHT - BOTTOM_PADDING}
          x2={width}
          y2={CHART_HEIGHT - BOTTOM_PADDING}
          className="stroke-border"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const barHeight = (d.value / max) * innerHeight
          const x = GAP + i * (BAR_WIDTH + GAP)
          const y = CHART_HEIGHT - BOTTOM_PADDING - barHeight
          const isHovered = hovered === i

          return (
            <g
              key={d.label}
              tabIndex={0}
              role="button"
              aria-label={`${d.label}: ${formatValue(d.value)}`}
              className="cursor-pointer outline-none"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
            >
              <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              <rect
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={Math.max(barHeight, 2)}
                rx={4}
                className={cn('fill-chart-1 transition-opacity', isHovered ? 'opacity-75' : 'opacity-100')}
              />
              <text
                x={x + BAR_WIDTH / 2}
                y={Math.max(y - 6, TOP_PADDING - 8)}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold tabular-nums"
              >
                {formatValue(d.value)}
              </text>
              <text
                x={x + BAR_WIDTH / 2}
                y={CHART_HEIGHT - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
