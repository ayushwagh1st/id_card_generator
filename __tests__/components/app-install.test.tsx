import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppInstallProvider, useAppInstall } from '@/components/AppInstallProvider'
import { Sidebar } from '@/components/layout/Sidebar'
vi.mock('next/navigation', () => ({usePathname:()=>'/admin/dashboard',useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}))

function Menu() { const { installed, install } = useAppInstall(); return <button disabled={installed} onClick={install}>{installed ? 'App installed' : 'Install app'}</button> }
async function setup() { await act(async () => { render(<AppInstallProvider><Menu /></AppInstallProvider>) }) }
afterEach(() => { cleanup(); vi.restoreAllMocks() })
describe('app installation', () => {
  it.each(['SUPER_ADMIN','MODEL_HEAD','LECTURER'] as const)('offers installation from the %s mobile sidebar', async role => {
    const close = vi.fn()
    await act(async()=>{render(<AppInstallProvider><Sidebar userRole={role} closeMobileMenu={close} /></AppInstallProvider>)})
    fireEvent.click(screen.getByRole('button',{name:'Install app'}))
    expect(close).toHaveBeenCalledOnce()
    expect(screen.getByRole('dialog',{name:'Install Bal Pradarshani'})).toBeVisible()
  })
  it('captures a prompt before opening the menu and consumes it once', async () => {
    await setup()
    const prompt = vi.fn(async () => {})
    const event = Object.assign(new Event('beforeinstallprompt', {cancelable:true}), {prompt,userChoice:Promise.resolve({outcome:'dismissed'})})
    fireEvent(window,event)
    expect(event.defaultPrevented).toBe(true)
    fireEvent.click(screen.getByRole('button',{name:'Install app'}))
    expect(prompt).toHaveBeenCalledTimes(1)
    await act(async () => {})
    fireEvent.click(screen.getByRole('button',{name:'Install app'}))
    expect(screen.getByRole('dialog')).toHaveTextContent('Add to Home screen')
    expect(prompt).toHaveBeenCalledTimes(1)
  })
  it('provides iPhone instructions when no native prompt is available', async () => {
    vi.spyOn(navigator,'userAgent','get').mockReturnValue('iPhone')
    await setup();fireEvent.click(screen.getByRole('button',{name:'Install app'}))
    expect(screen.getByRole('dialog')).toHaveTextContent('Safari')
    expect(screen.getByRole('dialog')).toHaveTextContent('Installing the app does not prepare offline access')
    fireEvent.click(screen.getByRole('button',{name:'Got it'}))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('updates the menu after installation completes', async () => {
    await setup();fireEvent(window,new Event('appinstalled'))
    expect(screen.getByRole('button',{name:'App installed'})).toBeDisabled()
  })
  it('offers manual instructions if the browser prompt fails', async () => {
    await setup()
    fireEvent(window,Object.assign(new Event('beforeinstallprompt'),{prompt:vi.fn().mockRejectedValue(new Error('Unavailable')),userChoice:Promise.resolve({outcome:'dismissed'})}))
    fireEvent.click(screen.getByRole('button',{name:'Install app'}))
    expect(await screen.findByRole('alert')).toHaveTextContent('Use its menu instead')
  })
})
