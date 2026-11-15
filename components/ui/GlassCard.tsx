'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string
  tilt?: boolean
}

export function GlassCard({ children, className, glowColor, tilt, onClick, ...props }: GlassCardProps) {
  if (onClick) {
    return (
      <button type="button" className={cn('ui-panel ui-panel-action', className)} onClick={onClick} {...(props as any)}>
        {children}
      </button>
    )
  }
  return (
    <div className={cn('ui-panel', className)} {...props}>
      {children}
    </div>
  )
}
