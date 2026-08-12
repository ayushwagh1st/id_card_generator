'use client'

import React from 'react'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  tilt?: boolean
  glowColor?: 'blue' | 'purple' | 'cyan' | 'indigo' | 'emerald' | 'rose' | 'none'
  onClick?: () => void
}

const glowGradients: Record<string, string> = {
  blue: 'from-blue-500/20 via-indigo-500/10 to-transparent',
  purple: 'from-purple-500/20 via-pink-500/10 to-transparent',
  cyan: 'from-cyan-500/20 via-blue-500/10 to-transparent',
  indigo: 'from-indigo-500/20 via-purple-500/10 to-transparent',
  emerald: 'from-emerald-500/20 via-teal-500/10 to-transparent',
  rose: 'from-rose-500/20 via-orange-500/10 to-transparent',
  none: '',
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glowColor = 'none',
  onClick,
}) => {
  const glow = glowGradients[glowColor] || ''

  return (
    <div
      className={`relative rounded-3xl overflow-hidden glass-panel border border-white/40 dark:border-white/[0.09] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.6)] transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      {/* Top Refraction Specular Highlight Line */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/25 to-transparent z-20" />

      {/* Inner Double-Bezel Specular Edge */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] z-10" />

      {/* Ambient Color Glow Orb in Dark Mode */}
      {glow && (
        <div className={`pointer-events-none absolute -top-12 -left-12 w-64 h-64 rounded-full bg-gradient-to-br ${glow} blur-3xl opacity-0 dark:opacity-100 transition-opacity duration-500 z-0`} />
      )}

      {/* Card Content */}
      <div className="relative z-20 h-full">{children}</div>
    </div>
  )
}
