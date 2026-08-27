import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormFieldProps extends React.ComponentProps<typeof Input> {
  readonly label: string
  readonly error?: string | undefined
  readonly hint?: string | undefined
}

export function FormField({ label, error, hint, className, id, ...props }: FormFieldProps) {
  const errorId = error && id ? `${id}-error` : undefined
  const hintId = hint && id ? `${id}-hint` : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-foreground">{label}</label>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId ?? hintId}
        className={cn('h-12 rounded-xl border-white/10 bg-black/25 px-4 focus-visible:border-war-gold', className)}
        {...props}
      />
      {error ? <p id={errorId} role="alert" className="mt-2 text-xs text-red-300">{error}</p> : hint ? <p id={hintId} className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
