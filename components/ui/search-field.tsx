import { Search } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Input } from './input'
import { Label } from './label'
import { cn } from '@/lib/utils'

export function SearchField({ id, label, className, ...props }: ComponentProps<'input'> & { id: string; label: string }) {
  return <div className={cn('w-full space-y-2', className)}>
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input id={id} type="search" {...props} className="pl-9" />
    </div>
  </div>
}
