import { cn } from '@/lib/utils'

export function AnimatedLoader({ className = "w-6 h-6", text }: { className?: string; text?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={cn('ui-loading-indicator shrink-0 rounded-full border-2 border-current border-r-transparent', className)} />
      <span className={text ? 'text-sm font-medium' : 'sr-only'}>{text || 'Loading…'}</span>
    </span>
  )
}
