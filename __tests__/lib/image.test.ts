import { describe, it, expect, vi } from 'vitest'
import { compressImage } from '../../lib/image'

describe('Image compression', () => {
  it('should compress image', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const result = await compressImage(file)
    expect(result).toBeDefined()
    expect(result.name).toBe('compressed.jpg')
  })
})
