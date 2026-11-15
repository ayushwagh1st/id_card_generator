import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.useRealTimers())

function navigate(prepared: boolean) {
  const handlers: Record<string, (event: unknown) => void> = {}
  let finish!: (value: Response) => void
  let signal!: AbortSignal
  const offline = new Response('Prepared offline page')
  const caches = { open: async () => ({ match: async (key: string) => key === '/__event_offline_manifest' ? prepared ? { json: async () => ({ cache: 'verified-release' }) } : null : offline }) }
  const fetch = vi.fn((_request: unknown, options: { signal: AbortSignal }) => {
    signal = options.signal
    return new Promise<Response>((yes, no) => { finish = yes; signal.addEventListener('abort', () => no(new Error('Aborted'))) })
  })
  runInNewContext(readFileSync(resolve('public/sw.js'), 'utf8'), { self: { location: { origin: 'http://localhost:3000' }, addEventListener: (name: string, callback: typeof handlers[string]) => { handlers[name] = callback } }, caches, fetch, URL, Response, AbortController, setTimeout, clearTimeout })
  let response!: Promise<Response>
  handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'http://localhost:3000/' }, respondWith: (value: Promise<Response>) => { response = value } })
  return { response, signal: () => signal, finish: (value: Response) => finish(value) }
}

describe('Offline navigation fallback', () => {
  it('does not abort a slow page when no prepared fallback exists', async () => {
    vi.useFakeTimers()
    const request = navigate(false)
    await vi.advanceTimersByTimeAsync(5000)
    expect(request.signal().aborted).toBe(false)
    request.finish(new Response('Live portal', { status: 200 }))
    expect(await (await request.response).text()).toBe('Live portal')
  })

  it('retains quick offline recovery when a verified fallback exists', async () => {
    vi.useFakeTimers()
    const request = navigate(true)
    await vi.advanceTimersByTimeAsync(5000)
    expect(request.signal().aborted).toBe(true)
    const response = await request.response
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/offline')
  })
})
