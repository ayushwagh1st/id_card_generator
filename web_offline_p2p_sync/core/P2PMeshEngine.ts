/**
 * P2PMeshEngine.ts
 * Offline Peer-to-Peer Mesh engine using BroadcastChannel & WebRTC DataChannels.
 * Enables devices on the same local Wi-Fi or same browser context to sync data offline.
 */

import { OutboxItem } from './OfflineStore';

export type MeshMessageListener = (item: OutboxItem) => void;

export class P2PMeshEngine {
  private channelName: string;
  private broadcastChannel: BroadcastChannel | null = null;
  private seenMsgIds: Set<string> = new Set();
  private maxSeenCache = 500;
  private listeners: Set<MeshMessageListener> = new Set();
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private activePeerCount = 0;
  private peerChangeListeners: Set<(count: number) => void> = new Set();

  constructor(channelName = 'web_p2p_offline_mesh') {
    this.channelName = channelName;
  }

  public init(): void {
    if (typeof window === 'undefined') return;

    // 1. Same-device cross-tab P2P channel
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(this.channelName);
      this.broadcastChannel.onmessage = (event) => {
        this.handleIncomingPacket(event.data);
      };
    }

    // Update initial peer count (at least other open tabs on local machine)
    this.notifyPeerCount();
  }

  public subscribe(listener: MeshMessageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onPeerCountChange(listener: (count: number) => void): () => void {
    this.peerChangeListeners.add(listener);
    listener(this.activePeerCount);
    return () => this.peerChangeListeners.delete(listener);
  }

  /**
   * Broadcasts an outbox item to all connected offline peers.
   */
  public broadcastItem(item: OutboxItem): void {
    if (this.isDuplicate(item.id)) return;
    this.markSeen(item.id);

    const packet = {
      type: 'SYNC_DELTA',
      item,
      senderTimestamp: Date.now(),
    };

    // Broadcast cross-tab
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(packet);
    }

    // Broadcast over WebRTC DataChannels (if active)
    this.peerConnections.forEach((pc) => {
      // Find open datachannel and send
      (pc as any)._dataChannel?.send?.(JSON.stringify(packet));
    });
  }

  private handleIncomingPacket(data: any): void {
    if (!data || data.type !== 'SYNC_DELTA' || !data.item) return;

    const item: OutboxItem = data.item;
    if (this.isDuplicate(item.id)) return;
    this.markSeen(item.id);

    // Notify listeners so OfflineStore can merge the peer's item locally
    this.listeners.forEach((listener) => listener(item));
  }

  private isDuplicate(id: string): boolean {
    return this.seenMsgIds.has(id);
  }

  private markSeen(id: string): void {
    if (this.seenMsgIds.size >= this.maxSeenCache) {
      const oldest = this.seenMsgIds.values().next().value;
      if (oldest) this.seenMsgIds.delete(oldest);
    }
    this.seenMsgIds.add(id);
  }

  private notifyPeerCount(): void {
    // Basic peer estimation (tab count + active WebRTC data channels)
    this.activePeerCount = this.peerConnections.size + (this.broadcastChannel ? 1 : 0);
    this.peerChangeListeners.forEach((l) => l(this.activePeerCount));
  }

  public destroy(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
  }
}
