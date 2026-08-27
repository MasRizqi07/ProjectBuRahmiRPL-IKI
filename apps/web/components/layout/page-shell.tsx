import { cn } from '@/lib/utils'

interface PageShellProps extends React.ComponentProps<'main'> {
  readonly eyebrow?: string
  readonly title?: string
  readonly description?: string
}

export function PageShell({ eyebrow, title, description, className, children, ...props }: PageShellProps) {
  return (
    <main id="main-content" className={cn('container-shell flex-1 py-10 sm:py-14', className)} {...props}>
      {(eyebrow || title || description) && (
        <header className="mb-8 max-w-3xl sm:mb-12">
          {eyebrow && <p className="section-label mb-4">{eyebrow}</p>}
          {title && <h1 className="font-display text-4xl leading-none tracking-wide text-foreground sm:text-6xl">{title}</h1>}
          {description && <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>}
        </header>
      )}
      {children}
    </main>
  )
}
