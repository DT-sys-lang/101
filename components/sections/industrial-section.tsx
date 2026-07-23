import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function IndustrialSection({
  children,
  tone = 'white',
  className,
}: {
  children: ReactNode
  tone?: 'white' | 'muted' | 'grid' | 'dark'
  className?: string
}) {
  return (
    <section
      className={cn(
        'border-b border-border py-16 sm:py-20',
        tone === 'white' && 'bg-panel',
        tone === 'muted' && 'bg-ink-50',
        tone === 'grid' && 'industrial-grid bg-ink-50',
        tone === 'dark' && 'border-steel-900 bg-steel-900',
        className,
      )}
    >
      <div className="stitch-shell">{children}</div>
    </section>
  )
}
