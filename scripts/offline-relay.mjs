import { createServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { createPublicKey, verify, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { signingData } from '../web_offline_p2p_sync/core/signing.mjs';

/** @param {import('node:http').Server} server
 * @param {{databasePath?:string,token?:string,publicKey:import('node:crypto').JsonWebKey,scope?:string,allowedOrigins?:string[],maxOperations?:number}} options */
export function attachRelay(server, { databasePath = 'offline-relay.sqlite', token, publicKey, scope = 'bal-pradarshani', allowedOrigins = [], maxOperations = 100000 }) {
  if (!token || token.length < 32 || !publicKey || !allowedOrigins.length) throw new Error('Configure a 32-character router token, the portal public verification key, and allowed origins.');
  const key = createPublicKey({ key: publicKey, format: 'jwk' });
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS operations(scope TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(scope,id))');
  const insert = db.prepare('INSERT INTO operations(scope,id,payload) VALUES(?,?,?) ON CONFLICT(scope,id) DO NOTHING');
  const list = db.prepare('SELECT id FROM operations WHERE scope=? ORDER BY id');
  const get = db.prepare('SELECT payload FROM operations WHERE scope=? AND id=?');
  const count = db.prepare('SELECT COUNT(*) AS total FROM operations');
  const wss = new WebSocketServer({ noServer: true, maxPayload: 65536 });
  const matchesToken = value => { const expected = Buffer.from(token); const actual = Buffer.from(value || ''); return actual.length === expected.length && timingSafeEqual(actual, expected); };
  const send = (socket, data) => { if (socket.readyState === WebSocket.OPEN) { if (socket.bufferedAmount > 1048576) socket.close(1013, 'Reconnect to resume catch-up'); else socket.send(JSON.stringify(data)); } };
  const inventory = socket => { const rows = list.all(scope); for (let index = 0; index < rows.length; index += 200) send(socket, { type: 'INVENTORY', ids: rows.slice(index, index + 200).map(row => row.id) }); };
  const authorized = item => {
    try {
      if (!item || item.scope !== scope || typeof item.id !== 'string' || item.id.length > 100 || !['children','attendance_scans'].includes(item.entity) || typeof item.credential !== 'string' || item.credential.length > 5000 || typeof item.signature !== 'string') return false;
      const [body, signature, extra] = item.credential.split('.');
      if (extra || !verify('sha256', Buffer.from(body), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'base64url'))) return false;
      const claims = JSON.parse(Buffer.from(body, 'base64url').toString());
      if (claims.actorId !== item.actorId || claims.deviceId !== item.deviceId || claims.scope !== scope || !['SUPER_ADMIN','MODEL_HEAD','LECTURER'].includes(claims.role) || !Number.isFinite(claims.expiresAt) || item.timestamp > claims.expiresAt || Date.now() > claims.expiresAt + 30 * 86400000) return false;
      const deviceKey = createPublicKey({ key: claims.publicKey, format: 'jwk' });
      return verify('sha256', Buffer.from(signingData(item)), { key: deviceKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(item.signature, 'base64url'));
    } catch { return false; }
  };
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, 'https://router.invalid');
    if (!matchesToken(url.searchParams.get('token')) || !allowedOrigins.includes(request.headers.origin)) { socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n'); socket.destroy(); return; }
    wss.handleUpgrade(request, socket, head, client => wss.emit('connection', client, request));
  });
  wss.on('connection', socket => {
    socket.on('error', () => {});
    inventory(socket);
    socket.on('message', raw => {
      try {
        const packet = JSON.parse(raw.toString());
        if (packet.type === 'HELLO') inventory(socket);
        else if (packet.type === 'INVENTORY' && Array.isArray(packet.ids) && packet.ids.length <= 200) {
          const missing=packet.ids.filter(id=>typeof id==='string' && id.length<=100 && !get.get(scope,id));
          if (missing.length) send(socket,{type:'REQUEST',ids:missing});
        } else if (packet.type === 'REQUEST' && Array.isArray(packet.ids) && packet.ids.length <= 200) {
          for (const id of packet.ids) if (typeof id === 'string') { const row = get.get(scope,id); if (row) send(socket,{type:'SYNC_DELTA',item:JSON.parse(row.payload)}); }
        } else if (packet.type === 'SYNC_DELTA' && authorized(packet.item)) {
          const previous=get.get(scope,packet.item.id);
          if (previous) return;
          if (count.get().total >= maxOperations) { socket.close(1013,'Router storage limit reached; retain phone queues'); return; }
          insert.run(scope,packet.item.id,JSON.stringify(packet.item));
          for (const peer of wss.clients) if (peer !== socket) send(peer,packet);
        }
      } catch { socket.close(1008,'Invalid router packet'); }
    });
  });
  return { close: () => new Promise(resolve => { for (const socket of wss.clients) socket.terminate(); wss.close(() => { db.close(); resolve(); }); }), count: () => count.get().total };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.OFFLINE_TLS_CERT || !process.env.OFFLINE_TLS_KEY || !process.env.OFFLINE_PUBLIC_KEY_FILE) throw new Error('Set OFFLINE_TLS_CERT, OFFLINE_TLS_KEY, and OFFLINE_PUBLIC_KEY_FILE. HTTPS/WSS is required.');
  const exported = JSON.parse(readFileSync(process.env.OFFLINE_PUBLIC_KEY_FILE,'utf8'));
  const server=createServer({cert:readFileSync(process.env.OFFLINE_TLS_CERT),key:readFileSync(process.env.OFFLINE_TLS_KEY)},(_request,response)=>{response.writeHead(200,{'Content-Type':'application/json'});response.end('{"status":"ok","service":"event-relay"}');});
  const relay=attachRelay(server,{databasePath:process.env.OFFLINE_RELAY_DATABASE || 'offline-relay.sqlite',token:process.env.OFFLINE_RELAY_TOKEN,publicKey:exported.serverPublicKey || exported,scope:process.env.NEXT_PUBLIC_EVENT_ID || 'bal-pradarshani',allowedOrigins:(process.env.OFFLINE_ALLOWED_ORIGINS || '').split(',').filter(Boolean)});
  server.listen(Number(process.env.OFFLINE_RELAY_PORT || 8080),'0.0.0.0',()=>console.log('Event relay listening with durable storage and WSS. Keep phone queues until cloud confirmation.'));
  const stop=async()=>{await relay.close();server.close();}; process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
