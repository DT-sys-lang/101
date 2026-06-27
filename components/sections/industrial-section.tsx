import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function IndustrialSection({
  children,
  tone = 'white',
  className,
}: {
  children: ReactNode
  tone?: 'white' | 'muted' | 'grid'
  className?: string
}) {
  return (
    <section
      className={cn(
        'border-b border-border py-16 sm:py-20 lg:py-24',
        tone === 'white' && 'bg-panel',
        tone === 'muted' && 'bg-ink-50',
        tone === 'grid' && 'industrial-grid bg-ink-50',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}
