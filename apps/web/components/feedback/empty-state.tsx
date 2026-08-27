import Link from 'next/link'
import { TicketX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  readonly title: string
  readonly description: string
  readonly action?: { href: string; label: string }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="glass-panel mx-auto flex max-w-2xl flex-col items-center rounded-2xl px-6 py-14 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-2xl border border-war-gold/20 bg-war-gold/8 text-war-gold"><TicketX aria-hidden="true" /></div>
      <h2 className="font-display text-3xl tracking-wide">{title}</h2>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <Button asChild size="lg" className="mt-7 rounded-xl font-bold"><Link href={action.href}>{action.label}</Link></Button>}
    </section>
  )
}
