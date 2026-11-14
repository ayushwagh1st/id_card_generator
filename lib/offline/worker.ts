export async function usableOfflineWorker(registration: ServiceWorkerRegistration, timeout = 60000): Promise<ServiceWorker> {
  const deadline = Date.now() + timeout;
  const requested = new Set<ServiceWorker>();
  while (Date.now() < deadline) {
    // A working active release can prepare files while its replacement installs.
    if (registration.active?.state === 'activated') return registration.active;
    if (registration.waiting && !requested.has(registration.waiting)) {
      requested.add(registration.waiting);
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Offline access could not start on this device. Keep the app open and connected, then retry preparation. Your saved records are safe.');
}
