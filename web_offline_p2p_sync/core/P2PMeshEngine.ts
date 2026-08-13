/**
 * P2PMeshEngine.ts
 * Offline Peer-to-Peer Mesh engine using BroadcastChannel & WebRTC DataChannels.
 * Enables devices on the same local Wi-Fi or same browser context to sync data offline.
 */

import { OutboxItem } from './OfflineStore';
import LZString from 'lz-string';

export type MeshMessageListener = (item: OutboxItem) => void;

export class P2PMeshEngine {
  private channelName: string;
  private broadcastChannel: BroadcastChannel | null = null;
  private seenMsgIds: Set<string> = new Set();
  private maxSeenCache = 500;
  private listeners: Set<MeshMessageListener> = new Set();
  
  // WebRTC & WebSocket State
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private wsConnection: WebSocket | null = null;
  
  private activePeerCount = 0;
  private peerChangeListeners: Set<(count: number) => void> = new Set();

  private rtcConfig: RTCConfiguration = {
    iceServers: [] // Local offline only
  };

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

    this.notifyPeerCount();
  }

  // === WEBRTC QR SIGNALING LOGIC ===

  /**
   * Generates a compressed WebRTC SDP Offer to be displayed as a QR Code.
   */
  public async createOffer(): Promise<{ peerId: string; compressedOffer: string; pc: RTCPeerConnection }> {
    const peerId = crypto.randomUUID();
    const pc = new RTCPeerConnection(this.rtcConfig);
    
    // Create Data Channel
    const dc = pc.createDataChannel(this.channelName, { negotiated: false });
    this.setupDataChannel(peerId, dc);
    this.setupPeerConnection(peerId, pc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait a brief moment for local ICE candidates to gather
    await new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') return resolve(true);
      const checkState = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', checkState);
          resolve(true);
        }
      };
      pc.addEventListener('icegatheringstatechange', checkState);
      setTimeout(() => resolve(true), 1500); // Timeout fallback
    });

    // Compress SDP for QR Code
    const rawSdp = JSON.stringify(pc.localDescription);
    const compressedOffer = LZString.compressToEncodedURIComponent(rawSdp);

    return { peerId, compressedOffer, pc };
  }

  /**
   * Scans an offer, generates an answer, and returns a compressed answer.
   */
  public async acceptOffer(compressedOffer: string): Promise<{ peerId: string; compressedAnswer: string; pc: RTCPeerConnection }> {
    const peerId = crypto.randomUUID();
    const pc = new RTCPeerConnection(this.rtcConfig);
    this.setupPeerConnection(peerId, pc);

    // Listen for data channel created by offerer
    pc.ondatachannel = (event) => {
      this.setupDataChannel(peerId, event.channel);
    };

    const rawSdp = LZString.decompressFromEncodedURIComponent(compressedOffer);
    if (!rawSdp) throw new Error("Invalid QR Code payload");

    const offer = JSON.parse(rawSdp);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Wait for ICE gathering
    await new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') return resolve(true);
      const checkState = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', checkState);
          resolve(true);
        }
      };
      pc.addEventListener('icegatheringstatechange', checkState);
      setTimeout(() => resolve(true), 1500);
    });

    const compressedAnswer = LZString.compressToEncodedURIComponent(JSON.stringify(pc.localDescription));
    return { peerId, compressedAnswer, pc };
  }

  /**
   * Completes the connection by accepting the generated answer from the peer.
   */
  public async acceptAnswer(pc: RTCPeerConnection, compressedAnswer: string): Promise<void> {
    const rawSdp = LZString.decompressFromEncodedURIComponent(compressedAnswer);
    if (!rawSdp) throw new Error("Invalid QR Code payload");
    
    const answer = JSON.parse(rawSdp);
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  private setupPeerConnection(peerId: string, pc: RTCPeerConnection) {
    this.peerConnections.set(peerId, pc);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.peerConnections.delete(peerId);
        this.dataChannels.delete(peerId);
        this.notifyPeerCount();
      }
    };
  }

  private setupDataChannel(peerId: string, dc: RTCDataChannel) {
    dc.onopen = () => {
      this.dataChannels.set(peerId, dc);
      this.notifyPeerCount();
    };
    dc.onclose = () => {
      this.dataChannels.delete(peerId);
      this.notifyPeerCount();
    };
    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleIncomingPacket(data);
      } catch (e) {
        console.error("Failed to parse mesh packet", e);
      }
    };
  }

  // === WEBSOCKET LOCAL MESH ROUTER ===
  public connectWebSocket(url: string) {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    
    try {
      this.wsConnection = new WebSocket(url);
      this.wsConnection.onopen = () => {
        this.notifyPeerCount();
      };
      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingPacket(data);
        } catch (e) {}
      };
      this.wsConnection.onclose = () => {
        this.wsConnection = null;
        this.notifyPeerCount();
      };
    } catch (err) {
      console.error("Failed to connect to local mesh router", err);
    }
  }


  // === CORE BROADCAST LOGIC ===

  public subscribe(listener: MeshMessageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onPeerCountChange(listener: (count: number) => void): () => void {
    this.peerChangeListeners.add(listener);
    listener(this.activePeerCount);
    return () => this.peerChangeListeners.delete(listener);
  }

  public broadcastItem(item: OutboxItem): void {
    if (this.isDuplicate(item.id)) return;
    this.markSeen(item.id);

    const packet = {
      type: 'SYNC_DELTA',
      item,
      senderTimestamp: Date.now(),
    };

    const payload = JSON.stringify(packet);

    // Broadcast cross-tab
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(packet);
    }

    // Broadcast over WebRTC DataChannels
    this.dataChannels.forEach((dc) => {
      if (dc.readyState === 'open') {
        dc.send(payload);
      }
    });

    // Broadcast over Local WebSocket Router
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(payload);
    }
  }

  private handleIncomingPacket(data: any): void {
    if (!data || data.type !== 'SYNC_DELTA' || !data.item) return;

    const item: OutboxItem = data.item;
    if (this.isDuplicate(item.id)) return;
    this.markSeen(item.id);

    // Notify listeners
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
    // Only count true remote WebRTC DataChannel connections or active WebSocket router
    this.activePeerCount = this.dataChannels.size + (this.wsConnection?.readyState === WebSocket.OPEN ? 1 : 0);
    this.peerChangeListeners.forEach((l) => l(this.activePeerCount));
  }

  public destroy(): void {
    if (this.broadcastChannel) this.broadcastChannel.close();
    if (this.wsConnection) this.wsConnection.close();
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.dataChannels.clear();
  }
}
