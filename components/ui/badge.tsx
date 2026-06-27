import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-steel-900 bg-steel-900 text-white',
        secondary: 'border-ink-200 bg-ink-50 text-ink-700',
        signal: 'border-signal-100 bg-signal-100 text-signal-700',
        process: 'border-process-100 bg-process-100 text-process-700',
        copper: 'border-copper-100 bg-copper-100 text-copper-700',
        outline: 'border-ink-300 bg-panel text-ink-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
