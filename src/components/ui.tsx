import type { ReactNode } from 'react'
import { formatPct } from '../lib/stats'

export function ProgressBar({
  value,
  color = 'var(--accent)',
  className = '',
  height = 6,
}: {
  value: number
  color?: string
  className?: string
  height?: number
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-sunken ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  )
}

export function ProgressRing({
  value,
  size = 168,
  stroke = 12,
  className = '',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  className?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sunken)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, value) / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>{children}</section>
}

export function SectionTitle({ icon, children, aside }: { icon?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted">
        {icon}
        {children}
      </h2>
      {aside}
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="num mt-1 text-2xl font-medium tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-faint">{sub}</div>}
    </div>
  )
}

export const Pct = ({ value }: { value: number }) => <>{formatPct(value)}</>

export function Button({
  children,
  onClick,
  variant = 'ghost',
  className = '',
  title,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'ghost' | 'solid' | 'outline' | 'danger'
  className?: string
  title?: string
  type?: 'button' | 'submit'
}) {
  const styles = {
    ghost: 'text-muted hover:bg-sunken hover:text-ink',
    solid: 'bg-accent text-on-accent hover:opacity-90',
    outline: 'border border-line text-ink hover:bg-sunken',
    danger: 'border border-line text-accent hover:bg-accent-soft',
  }[variant]
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}
