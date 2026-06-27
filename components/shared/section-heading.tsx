import { cn } from '@/lib/utils'

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'left',
}: {
  eyebrow: string
  title: string
  body?: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      <div className={cn('mb-4 h-0.5 w-12 bg-silver', align === 'center' && 'mx-auto')} />
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel-700">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold leading-tight text-ink-950 sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {body ? <p className="mt-4 text-base leading-7 text-ink-600">{body}</p> : null}
    </div>
  )
}
