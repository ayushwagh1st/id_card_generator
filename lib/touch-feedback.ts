const preferenceKey = 'event-touch-feedback'

export function touchFeedbackEnabled(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(preferenceKey) === 'on'
  } catch {
    return false
  }
}

export function setTouchFeedback(enabled: boolean): void {
  try {
    window.localStorage.setItem(preferenceKey, enabled ? 'on' : 'off')
  } catch {}
}

export function touchFeedback(): void {
  try {
    if (!touchFeedbackEnabled() || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    if (typeof window !== 'undefined') {
      if (!window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    }
    navigator.vibrate(10)
  } catch {}
}
