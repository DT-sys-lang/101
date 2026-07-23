import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-none border px-2 py-0.5 font-mono text-[11px] font-medium', {
  variants: {
    variant: {
      default: 'border-ink-950 bg-panel text-ink-950',
      secondary: 'border-border bg-ink-50 text-ink-600',
      signal: 'border-steel-100 bg-steel-100 text-steel-700',
      process: 'border-process-100 bg-process-100 text-process-700',
      copper: 'border-steel-100 bg-steel-100 text-steel-700',
      outline: 'border-border bg-panel text-ink-600',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
