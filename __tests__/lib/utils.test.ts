import { describe, it, expect } from 'vitest'
import { cn } from '../../lib/utils'

describe('Utils', () => {
  it('should merge tailwind classes', () => {
    const result = cn('text-red-500', { 'bg-blue-500': true, 'p-4': false })
    expect(result).toBe('text-red-500 bg-blue-500')
  })
})
