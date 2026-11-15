const preferenceKey = 'event-touch-feedback'

export function touchFeedbackEnabled() {
  try { return typeof window !== 'undefined' && window.localStorage.getItem(preferenceKey) === 'on' } catch { return false }
}

export function setTouchFeedback(enabled: boolean) {
  try { window.localStorage.setItem(preferenceKey, enabled ? 'on' : 'off') } catch { return }
  window.dispatchEvent(new Event('touch-feedback-change'))
}

export function touchFeedback() {
  try {
    if (!touchFeedbackEnabled() || typeof navigator.vibrate !== 'function' || !window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    navigator.vibrate(10)
  } catch { /* Unsupported feedback must never interrupt an operation. */ }
}
