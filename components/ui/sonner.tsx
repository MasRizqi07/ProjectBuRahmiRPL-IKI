'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

type ToasterTheme = 'light' | 'dark' | 'system'

const Toaster = ({ theme: themeProp, ...props }: ToasterProps) => {
  const theme = (themeProp ?? useTheme().theme ?? 'system') as ToasterTheme

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
