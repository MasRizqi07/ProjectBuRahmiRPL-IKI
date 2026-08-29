import Image from 'next/image'
import { getDesignAsset, type DesignAssetGroup } from '@/lib/assets/design-assets'
import { cn } from '@/lib/utils'

interface DesignBackdropProps {
  readonly group: DesignAssetGroup
  readonly index?: number
  readonly variant?: 'card' | 'hero' | 'original'
  readonly alt?: string
  readonly priority?: boolean
  readonly className?: string
  readonly imageClassName?: string
  readonly overlayClassName?: string
  readonly sizes?: string
}

export function DesignBackdrop({
  group,
  index = 0,
  variant = 'hero',
  alt = '',
  priority = false,
  className,
  imageClassName,
  overlayClassName,
  sizes = '100vw',
}: DesignBackdropProps) {
  const asset = getDesignAsset(group, index)
  const src = variant === 'card' ? asset.cardSrc : variant === 'hero' ? asset.heroSrc : asset.src

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden={alt ? undefined : true}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        blurDataURL={asset.blurDataUrl}
        className={cn('object-cover', imageClassName)}
      />
      <div className={cn('absolute inset-0 bg-black/65', overlayClassName)} />
    </div>
  )
}
