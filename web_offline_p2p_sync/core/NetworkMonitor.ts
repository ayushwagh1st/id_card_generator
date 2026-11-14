/**
 * NetworkMonitor.ts
 * Real-time network reachability detector with active health ping verification.
 * Emits online/offline state changes to listeners.
 */

export type NetworkStatusListener = (isOnline: boolean) => void;

export class NetworkMonitor {
  private isOnline: boolean;
  private pingUrl: string;
  private pingIntervalMs: number;
  private listeners: Set<NetworkStatusListener> = new Set();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private checking: Promise<boolean> | null = null;

  constructor(pingUrl = '/api/health', pingIntervalMs = 15000) {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.pingUrl = pingUrl;
    this.pingIntervalMs = pingIntervalMs;
  }

  public start(): void {
    if (typeof window === 'undefined') return;
    if (this.intervalId) return;

    window.addEventListener('online', this.handleBrowserOnline);
    window.addEventListener('offline', this.handleBrowserOffline);

    // Periodic heartbeat verification (verifies true internet access behind Wi-Fi captive portals)
    this.intervalId = setInterval(() => this.checkServerReachability(), this.pingIntervalMs);
    this.checkServerReachability();
  }

  public stop(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('online', this.handleBrowserOnline);
    window.removeEventListener('offline', this.handleBrowserOffline);
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  public subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.isOnline); // Call immediately with current state
    return () => this.listeners.delete(listener);
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  private handleBrowserOnline = () => {
    this.checkServerReachability();
  };

  private handleBrowserOffline = () => {
    this.updateStatus(false);
  };

  public checkServerReachability(): Promise<boolean> {
    if (this.checking) return this.checking;
    this.checking = this.performCheck().finally(() => { this.checking = null; });
    return this.checking;
  }

  private async performCheck(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateStatus(false);
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(this.pingUrl, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      const body = response?.ok ? await response.json().catch(() => null) : null;
      const reachable = response !== null && response.ok && body?.status === 'ok';
      this.updateStatus(reachable);
      return reachable;
    } catch {
      this.updateStatus(false);
      return false;
    }
  }

  private updateStatus(newStatus: boolean): void {
    if (this.isOnline !== newStatus) {
      this.isOnline = newStatus;
      this.listeners.forEach((listener) => listener(this.isOnline));
    }
  }
}
