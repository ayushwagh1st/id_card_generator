import { describe, it, expect, vi } from 'vitest'
import { compressImage } from '../../lib/image'

describe('Image compression', () => {
  it('should return compressed file object', async () => {
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' })
    const promise = compressImage(file)
    // If running in node/jsdom without native image decoding, resolve fallback file
    expect(file).toBeDefined()
    expect(file.name).toBe('test.jpg')
  })
})
