import { Construction } from 'lucide-react'
import { getCapability, type CapabilityName } from '@/lib/capabilities'
import { cn } from '@/lib/utils'

interface CapabilityNoticeProps extends React.ComponentProps<'div'> {
  readonly capability: CapabilityName
}

export function CapabilityNotice({ capability, className, ...props }: CapabilityNoticeProps) {
  const definition = getCapability(capability)

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-xl border border-war-gold/25 bg-war-gold/8 p-4 text-xs leading-5 text-war-gold-bright',
        className,
      )}
      {...props}
    >
      <Construction className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-bold">Fitur belum aktif</p>
        <p className="text-muted-foreground">
          {definition.message} Target implementasi: Phase {definition.phase}.
        </p>
      </div>
    </div>
  )
}
