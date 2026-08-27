import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const variants = {
  error: { icon: AlertCircle, classes: 'border-destructive/30 bg-destructive/8 text-red-200' },
  success: { icon: CheckCircle2, classes: 'border-status-success/30 bg-status-success/8 text-emerald-100' },
  info: { icon: Info, classes: 'border-war-gold/25 bg-war-gold/8 text-war-gold-bright' },
} as const

interface InlineAlertProps extends React.ComponentProps<'div'> {
  readonly variant?: keyof typeof variants
}

export function InlineAlert({ variant = 'info', className, children, ...props }: InlineAlertProps) {
  const config = variants[variant]
  const Icon = config.icon
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-xl border p-4 text-sm leading-6', config.classes, className)} {...props}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}
