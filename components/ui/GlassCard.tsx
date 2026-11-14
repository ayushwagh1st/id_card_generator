'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  tilt?: boolean
  glowColor?: 'blue' | 'purple' | 'cyan' | 'indigo' | 'emerald' | 'rose' | 'none'
  onClick?: () => void
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  const panelClassName = cn('ui-panel', className)
  if (onClick) return <button type="button" className={cn(panelClassName, 'ui-panel-action')} onClick={onClick}>{children}</button>
  return <div className={panelClassName}>{children}</div>
}
