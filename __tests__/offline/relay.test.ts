// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep, basename } from 'node:path';
import WebSocket from 'ws';
import { attachRelay } from '../../scripts/offline-relay.mjs';
import { signingData } from '@/web_offline_p2p_sync/core/protocol';

const serverKeys=generateKeyPairSync('ec',{namedCurve:'P-256'}),deviceKeys=generateKeyPairSync('ec',{namedCurve:'P-256'});
const token='test-router-token-with-at-least-32-characters';
const cleanup: Array<()=>Promise<void>>=[];
afterEach(async()=>{for(const close of cleanup.splice(0).reverse())await close();});
async function router(databasePath=':memory:') {
  const server=createServer(); const relay=attachRelay(server,{databasePath,token,publicKey:serverKeys.publicKey.export({format:'jwk'}),allowedOrigins:['https://portal.test']});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=(server.address() as any).port; let closed=false;
  const close=async()=>{if(closed)return;closed=true;await relay.close();await new Promise<void>(resolve=>server.close(()=>resolve()));};cleanup.push(close);
  return {url:`ws://127.0.0.1:${port}/?token=${token}`,relay,close};
}
async function connect(url:string,origin='https://portal.test') {
  const socket=new WebSocket(url,{origin}); const packets:any[]=[];
  socket.on('message',raw=>packets.push(JSON.parse(raw.toString())));
  await new Promise<void>((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
  return {socket,packets};
}
const wait=async(check:()=>boolean)=>{for(let i=0;i<200&&!check();i++)await new Promise(resolve=>setTimeout(resolve,5));expect(check()).toBe(true);};
function operation(id='one') {
  const claims={actorId:'00000000-0000-4000-8000-000000000001',deviceId:'00000000-0000-4000-8000-000000000002',role:'LECTURER',scope:'bal-pradarshani',expiresAt:Date.now()+86400000,publicKey:deviceKeys.publicKey.export({format:'jwk'})};
  const body=Buffer.from(JSON.stringify(claims)).toString('base64url');
  const credential=body+'.'+sign('sha256',Buffer.from(body),{key:serverKeys.privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
  const item:any={id,entity:'attendance_scans',action:'CREATE',payload:{scanData:'SNK-1',sessionId:'00000000-0000-4000-8000-000000000003',mode:'check-in',timestamp:new Date().toISOString()},timestamp:Date.now(),scope:claims.scope,actorId:claims.actorId,deviceId:claims.deviceId,credential};
  item.signature=sign('sha256',Buffer.from(signingData(item)),{key:deviceKeys.privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');return item;
}
describe('durable local relay',()=>{
  it('requires an explicit strong token and trusted public key configuration',()=>{expect(()=>attachRelay(createServer(),{token:'weak',publicKey:{},allowedOrigins:[]})).toThrow('Configure');});
  it('rejects an invalid router token',async()=>{const r=await router();await expect(connect(r.url.replace(token,'wrong'))).rejects.toThrow();});
  it('rejects a browser from another origin',async()=>{const r=await router();await expect(connect(r.url,'https://untrusted.test')).rejects.toThrow();});
  it('persists a verified operation before broadcasting and deduplicates it',async()=>{
    const r=await router(),a=await connect(r.url),b=await connect(r.url);const item=operation();
    a.socket.send(JSON.stringify({type:'SYNC_DELTA',item}));await wait(()=>b.packets.some(packet=>packet.type==='SYNC_DELTA'));
    expect(r.relay.count()).toBe(1);a.socket.send(JSON.stringify({type:'SYNC_DELTA',item}));await new Promise(resolve=>setTimeout(resolve,30));expect(r.relay.count()).toBe(1);
  });
  it('refuses altered or unsigned operations',async()=>{const r=await router(),a=await connect(r.url);const item=operation();item.payload.scanData='FORGED';a.socket.send(JSON.stringify({type:'SYNC_DELTA',item}));await new Promise(resolve=>setTimeout(resolve,30));expect(r.relay.count()).toBe(0);});
  it('requests records created before a device connected to the router',async()=>{const r=await router(),a=await connect(r.url);a.socket.send(JSON.stringify({type:'INVENTORY',ids:['missing']}));await wait(()=>a.packets.some(packet=>packet.type==='REQUEST'));expect(a.packets.find(packet=>packet.type==='REQUEST').ids).toEqual(['missing']);});
  it('retains history across a router restart and supplies it to a late device',async()=>{
    const temporaryRoot=resolve(tmpdir());const directory=mkdtempSync(join(temporaryRoot,'offline-relay-test-'));cleanup.unshift(async()=>{const target=resolve(directory);if(!target.startsWith(temporaryRoot+sep)||!basename(target).startsWith('offline-relay-test-'))throw new Error('Unexpected relay test cleanup path');rmSync(target,{recursive:true,force:true});});
    const file=join(directory,'relay.sqlite');const first=await router(file),a=await connect(first.url);a.socket.send(JSON.stringify({type:'SYNC_DELTA',item:operation()}));await wait(()=>first.relay.count()===1);await first.close();
    const second=await router(file),b=await connect(second.url);await wait(()=>b.packets.some(packet=>packet.type==='INVENTORY'));b.socket.send(JSON.stringify({type:'REQUEST',ids:['one']}));await wait(()=>b.packets.some(packet=>packet.type==='SYNC_DELTA'));expect(b.packets.find(packet=>packet.type==='SYNC_DELTA').item.id).toBe('one');
  });
});
