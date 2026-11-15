/**
 * P2PMeshEngine.ts
 * Offline Peer-to-Peer Mesh engine using BroadcastChannel & WebRTC DataChannels.
 * Enables devices on the same local Wi-Fi or same browser context to sync data offline.
 */

import { OutboxItem } from './OfflineStore';

async function compressSignal(str: string): Promise<string> {
  if (typeof CompressionStream !== 'undefined') {
    const stream = new Blob([new TextEncoder().encode(str)])
      .stream()
      .pipeThrough(new CompressionStream('deflate-raw'));
    const buffer = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function decompressSignal(str: string): Promise<string> {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return await new Response(stream).text();
    } catch {
      return new TextDecoder().decode(bytes);
    }
  }
  return new TextDecoder().decode(bytes);
}

export type MeshMessageListener = (item: OutboxItem) => boolean | void | Promise<boolean | void>;
type MeshPacket = { type: 'SYNC_DELTA'; item: OutboxItem } | { type: 'HELLO' } | { type: 'INVENTORY' | 'REQUEST'; ids: string[] };

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
  private errorListeners = new Set<(error: string) => void>();
  private history: (() => Promise<OutboxItem[]>) | null = null;
  private reconciliationTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private processing = new Map<string, Promise<void>>();

  private rtcConfig: RTCConfiguration = {
    iceServers: [] // Local offline only
  };

  constructor(channelName = 'web_p2p_offline_mesh') {
    this.channelName = channelName;
  }

  public init(): void {
    if (typeof window === 'undefined') return;
    if (this.reconciliationTimer) return;
    this.stopped = false;

    // 1. Same-device cross-tab P2P channel
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(this.channelName);
      this.broadcastChannel.onmessage = (event) => {
        void this.handleIncomingPacket(event.data, 'tabs').catch(error => this.report(error));
      };
    }

    this.notifyPeerCount();
    this.reconciliationTimer = setInterval(() => { void this.reconcile().catch(error => this.report(error)); }, 15000);
    void this.reconcile().catch(error => this.report(error));
  }

  public setHistoryProvider(provider: () => Promise<OutboxItem[]>): void { this.history = provider; }
  public onError(listener: (error: string) => void): () => void { this.errorListeners.add(listener); return () => { this.errorListeners.delete(listener); }; }
  private report(error: unknown): void { for (const listener of this.errorListeners) listener(error instanceof Error ? error.message : String(error)); }
  private waitForIce(pc: RTCPeerConnection): Promise<void> {
    if(pc.iceGatheringState==='complete') return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const done=()=>{if(pc.iceGatheringState==='complete'){clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',done);resolve();}};
      const timer=setTimeout(()=>{pc.removeEventListener('icegatheringstatechange',done);pc.close();reject(new Error('Could not gather connection addresses. Retry pairing or use the local router.'));},10000);
      pc.addEventListener('icegatheringstatechange',done);done();
    });
  }
  private async parseSignal(compressed: string, type: 'offer' | 'answer'): Promise<RTCSessionDescriptionInit> {
    if(compressed.length>3500) throw new Error('Connection QR is too large. Use the local router.');
    const raw=await decompressSignal(compressed);
    if(!raw || raw.length>20000)throw new Error('Invalid connection QR.');
    const description=JSON.parse(raw);
    if(description.type!==type || typeof description.sdp!=='string')throw new Error(`Expected a connection ${type} QR.`);
    return description;
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
    await this.waitForIce(pc);

    // Compress SDP for QR Code
    const rawSdp = JSON.stringify(pc.localDescription);
    const compressedOffer = await compressSignal(rawSdp);
    if(compressedOffer.length>2500){pc.close();throw new Error('Connection QR is too dense. Use the local router.');}

    return { peerId, compressedOffer, pc };
  }

  /**
   * Scans an offer, generates an answer, and returns a compressed answer.
   */
  public async acceptOffer(compressedOffer: string): Promise<{ peerId: string; compressedAnswer: string; pc: RTCPeerConnection }> {
    const offer=await this.parseSignal(compressedOffer,'offer');
    const peerId = crypto.randomUUID();
    const pc = new RTCPeerConnection(this.rtcConfig);
    this.setupPeerConnection(peerId, pc);

    // Listen for data channel created by offerer
    pc.ondatachannel = (event) => {
      this.setupDataChannel(peerId, event.channel);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Wait for ICE gathering
    await this.waitForIce(pc);

    const compressedAnswer = await compressSignal(JSON.stringify(pc.localDescription));
    if(compressedAnswer.length>2500){pc.close();throw new Error('Connection response QR is too dense. Use the local router.');}
    return { peerId, compressedAnswer, pc };
  }

  /**
   * Completes the connection by accepting the generated answer from the peer.
   */
  public async acceptAnswer(pc: RTCPeerConnection, compressedAnswer: string): Promise<void> {
    const answer=await this.parseSignal(compressedAnswer,'answer');
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    await new Promise<void>((resolve, reject) => {
      const peerId=[...this.peerConnections].find(([,connection])=>connection===pc)?.[0];
      const timer = setTimeout(() => { cleanup(); pc.close(); reject(new Error('The peer data channel did not open. Check that both devices share Wi-Fi without client isolation.')); }, 20000);
      const check = () => {
        if (peerId && this.dataChannels.get(peerId)?.readyState==='open' && pc.connectionState === 'connected') { cleanup(); resolve(); }
        else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') { cleanup(); reject(new Error('Device connection failed.')); }
      };
      let unsubscribe = () => {};
      const cleanup = () => { clearTimeout(timer); unsubscribe(); pc.removeEventListener('connectionstatechange', check); };
      unsubscribe = this.onPeerCountChange(check);
      pc.addEventListener('connectionstatechange', check);
      check();
    });
  }

  private setupPeerConnection(peerId: string, pc: RTCPeerConnection) {
    this.peerConnections.set(peerId, pc);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.peerConnections.delete(peerId);
        this.dataChannels.delete(peerId);
        this.notifyPeerCount();
      }
      if (pc.connectionState === 'connected') { this.notifyPeerCount(); void this.reconcile(peerId).catch(error=>this.report(error)); }
      if (pc.connectionState === 'disconnected') { this.notifyPeerCount(); this.report('A peer is temporarily disconnected. Its missing records will reconcile when the connection returns.'); }
    };
  }

  private setupDataChannel(peerId: string, dc: RTCDataChannel) {
    dc.onopen = () => {
      this.dataChannels.set(peerId, dc);
      this.notifyPeerCount();
      void this.reconcile(peerId).catch(error => this.report(error));
    };
    dc.onclose = () => {
      this.dataChannels.delete(peerId);
      this.notifyPeerCount();
    };
    dc.onmessage = (event) => {
      try {
        if(typeof event.data!=='string' || event.data.length>60000)throw new Error('Peer packet exceeds the supported message limit.');
        const data = JSON.parse(event.data);
        void this.handleIncomingPacket(data, peerId).catch(error => this.report(error));
      } catch (e) {
        console.error("Failed to parse mesh packet", e);
      }
    };
  }

  // === WEBSOCKET LOCAL MESH ROUTER ===
  public connectWebSocket(url: string): Promise<void> {
    const parsed = new URL(url);
    if (!['ws:', 'wss:'].includes(parsed.protocol)) return Promise.reject(new Error('Use a ws:// or wss:// router URL.'));
    if (typeof location !== 'undefined' && location.protocol === 'https:' && parsed.protocol !== 'wss:') return Promise.reject(new Error('This HTTPS portal requires a trusted wss:// router.'));
    this.stopped = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.wsConnection) {
      this.wsConnection.onclose = null;
      this.wsConnection.close();
    }
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url);
      this.wsConnection = socket;
      const timeout = setTimeout(() => { socket.close(); reject(new Error('Router connection timed out.')); }, 10000);
      socket.onopen = () => {
        clearTimeout(timeout);
        this.notifyPeerCount();
        void this.reconcile('router').catch(error => this.report(error));
        resolve();
      };
      socket.onerror = () => { clearTimeout(timeout); reject(new Error('Cannot connect to router. Verify its address and TLS certificate.')); this.report('Local router connection failed.'); };
      socket.onmessage = (event) => {
        try {
          if (typeof event.data !== 'string' || event.data.length > 65536) return;
          const data = JSON.parse(event.data);
          void this.handleIncomingPacket(data, 'router').catch(error => this.report(error));
        } catch (error) { this.report(error); }
      };
      socket.onclose = () => {
        clearTimeout(timeout);
        reject(new Error('Router connection closed before it was ready. Saved records remain on this device.'));
        if (this.wsConnection !== socket) return;
        this.wsConnection = null;
        this.notifyPeerCount();
        if (!this.stopped) this.reconnectTimer = setTimeout(() => { void this.connectWebSocket(url).catch(error => this.report(error)); }, 5000);
      };
    });
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
    this.markSeen(item.id);
    void this.send({ type: 'SYNC_DELTA', item }).catch(error => this.report(error));
  }

  private async send(packet: MeshPacket, target?: string, exclude?: string): Promise<void> {
    const payload = JSON.stringify(packet);
    if (payload.length > 60000) throw new Error('Peer packet exceeds the transport limit. Export the queue instead.');
    if ((!target || target === 'tabs') && exclude !== 'tabs') this.broadcastChannel?.postMessage(packet);
    for (const [id, dc] of this.dataChannels) {
      if (id === exclude || (target && target !== id) || dc.readyState !== 'open') continue;
      const deadline=Date.now()+5000;
      while (dc.bufferedAmount > 262144 && dc.readyState === 'open' && !this.stopped && Date.now()<deadline) await new Promise(resolve => setTimeout(resolve, 25));
      if (dc.bufferedAmount > 262144) { this.report('Peer connection is congested. Records remain saved for catch-up.'); continue; }
      if (dc.readyState === 'open' && !this.stopped) dc.send(payload);
    }
    if ((!target || target === 'router') && exclude !== 'router' && this.wsConnection?.readyState === WebSocket.OPEN) this.wsConnection.send(payload);
  }

  private async reconcile(target?: string): Promise<void> {
    if (!this.history || this.stopped) return;
    const items = await this.history();
    for (let index = 0; index < items.length; index += 200) await this.send({ type: 'INVENTORY', ids: items.slice(index, index + 200).map(item => item.id) }, target);
    // Empty devices must still ask connected peers for their inventory.
    if (!items.length) await this.send({ type: 'HELLO' }, target);
  }

  private async handleIncomingPacket(value: unknown, source?: string): Promise<void> {
    const data=value as MeshPacket;
    if (!data || this.stopped) return;
    if (data.type === 'HELLO') {
      const items = await this.history?.() || [];
      for (let index = 0; index < items.length; index += 200) await this.send({ type: 'INVENTORY', ids: items.slice(index, index + 200).map(item => item.id) }, source);
      return;
    }
    if (data.type === 'INVENTORY' || data.type === 'REQUEST') {
      if (!Array.isArray(data.ids) || data.ids.length > 200 || data.ids.some((id: unknown) => typeof id !== 'string' || id.length > 100)) return;
      const items = await this.history?.() || [];
      const known = new Map(items.map(item => [item.id, item]));
      if (data.type === 'INVENTORY') {
        const missing = data.ids.filter((id: string) => !known.has(id));
        if (missing.length) await this.send({ type: 'REQUEST', ids: missing }, source);
      } else for (const id of data.ids) { const item=known.get(id); if (item) await this.send({ type: 'SYNC_DELTA', item }, source); }
      return;
    }
    if (data.type !== 'SYNC_DELTA' || !data.item || typeof data.item.id !== 'string') return;
    const item: OutboxItem = data.item;
    if (this.isDuplicate(item.id)) return;
    if (this.processing.has(item.id)) return this.processing.get(item.id);
    const work = (async () => {
      let isNew=true;
      for (const listener of this.listeners) if(await listener(item)===false)isNew=false;
      // Mark seen only after every consumer confirms durable storage.
      this.markSeen(item.id);
      if(isNew)await this.send({ type: 'SYNC_DELTA', item }, undefined, source);
    })().finally(() => this.processing.delete(item.id));
    this.processing.set(item.id, work);
    return work;
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
    this.activePeerCount = [...this.dataChannels].filter(([id,dc])=>dc.readyState==='open' && this.peerConnections.get(id)?.connectionState!=='disconnected').length + (this.wsConnection?.readyState === WebSocket.OPEN ? 1 : 0);
    this.peerChangeListeners.forEach((l) => l(this.activePeerCount));
  }

  public destroy(): void {
    this.stopped = true;
    if (this.reconciliationTimer) clearInterval(this.reconciliationTimer);
    this.reconciliationTimer = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.broadcastChannel) this.broadcastChannel.close();
    this.broadcastChannel = null;
    if (this.wsConnection) { this.wsConnection.onclose = null; this.wsConnection.close(); }
    this.wsConnection = null;
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.dataChannels.clear();
  }
}
