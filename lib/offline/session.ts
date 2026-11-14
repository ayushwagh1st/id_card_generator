export const ACTIVE_USER = 'offline-active-user:v2';
export const SESSION_LOCK = 'offline-session-locked:v2';
export function openOfflineSession(userId: string): void {
  localStorage.removeItem(SESSION_LOCK);
  localStorage.setItem(ACTIVE_USER,userId);
  window.dispatchEvent(new Event('offline-session-unlocked'));
}
export function lockOfflineSession(): void {
  localStorage.removeItem(ACTIVE_USER);
  localStorage.setItem(SESSION_LOCK,'1');
  navigator.serviceWorker?.controller?.postMessage({type:'CLEAR_PRIVATE'});
  window.dispatchEvent(new Event('offline-session-locked'));
}
