import { OfflineStore, type OutboxItem } from './OfflineStore';
import { EVENT_SCOPE, signingData } from './protocol';

export interface DeviceCredential {
  actorId: string;
  deviceId: string;
  role: string;
  scope: string;
  expiresAt: number;
  publicKey: JsonWebKey;
}
type Identity = { deviceId: string; privateKey: CryptoKey; publicKey: JsonWebKey };
export const encode = (value: ArrayBuffer | Uint8Array): string => btoa(String.fromCharCode(...new Uint8Array(value as ArrayBuffer))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
export const decode = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));

export class DeviceIdentity {
  private identity: Identity | null = null;
  constructor(private store: OfflineStore) {}

  async init(): Promise<Identity> {
    if (this.identity) return this.identity;
    this.identity = await this.store.getMeta<Identity>('device');
    if (!this.identity) {
      const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
      this.identity = await this.store.setMetaIfAbsent('device', { deviceId: crypto.randomUUID(), privateKey: keys.privateKey, publicKey: await crypto.subtle.exportKey('jwk', keys.publicKey) });
    }
    return this.identity;
  }

  async sign(item: OutboxItem): Promise<OutboxItem> {
    const identity = await this.init();
    const credential = await this.store.getMeta<string>('credential');
    if (!credential) throw new Error('Prepare this device online before recording event operations.');
    const claims: DeviceCredential = JSON.parse(new TextDecoder().decode(decode(credential.split('.')[0])));
    if (item.timestamp > claims.expiresAt) throw new Error('Offline authorization expired. Connect and prepare this device again. Existing scans are safe.');
    const signed = { ...item, actorId: claims.actorId, deviceId: identity.deviceId, scope: EVENT_SCOPE, credential };
    signed.signature = encode(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.privateKey, new TextEncoder().encode(signingData(signed))));
    return signed;
  }

  async verify(item: OutboxItem): Promise<boolean> {
    try {
      if (!item.credential || !item.signature || item.scope !== EVENT_SCOPE) return false;
      const trustedKey = await this.store.getMeta<JsonWebKey>('server-public-key');
      if (!trustedKey) return false;
      const [body, signature] = item.credential.split('.');
      const serverKey = await crypto.subtle.importKey('jwk', trustedKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      if (!await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, serverKey, decode(signature), new TextEncoder().encode(body))) return false;
      const claims: DeviceCredential = JSON.parse(new TextDecoder().decode(decode(body)));
      if (claims.actorId !== item.actorId || claims.deviceId !== item.deviceId || claims.scope !== item.scope || item.timestamp > claims.expiresAt) return false;
      const deviceKey = await crypto.subtle.importKey('jwk', claims.publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, deviceKey, decode(item.signature), new TextEncoder().encode(signingData(item)));
    } catch { return false; }
  }
}
