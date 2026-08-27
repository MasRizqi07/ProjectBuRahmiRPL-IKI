'use client'

import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'

export function AppProviders({ children }: { readonly children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
      <Toaster theme="dark" position="top-center" />
    </MotionConfig>
  )
}
