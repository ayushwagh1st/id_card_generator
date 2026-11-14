import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';
await build({ configFile: false, define: { 'process.env.NEXT_PUBLIC_EVENT_ID': JSON.stringify('bal-pradarshani') }, build: { lib: { entry: resolve('tests/browser/harness.ts'), name: 'OfflineHarness', formats: ['iife'], fileName: () => 'harness.js' }, outDir: 'test-results/harness', emptyOutDir: true } });
const script = await readFile('test-results/harness/harness.js');
const worker = await readFile('public/sw.js');
let missingAsset=false;
let wrongMime=false;
let development=false;
let mismatch=false;
const buildId=()=>development?'development':mismatch?'browser-harness-mismatch':missingAsset?'browser-harness-incomplete':'browser-harness';
createServer((request, response) => {
  if (request.url?.startsWith('/manifest-mode')) { development=request.url.includes('development=1');mismatch=request.url.includes('mismatch=1');wrongMime=request.url.includes('html=1');missingAsset=request.url.includes('missing=1')||wrongMime;response.writeHead(200,{'Content-Type':'application/json'});response.end('{"ok":true}'); }
  else if (request.url === '/sw.js') {response.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store'});response.end(worker);}
  else if (request.url === '/offline-assets.json') {response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify({build:'unrelated-stale-build',assets:['/_next/static/stale.js']}));}
  else if (request.url === `/_next/static/${buildId()}/offline-assets.json`) {response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify({build:mismatch?'wrong-build':buildId(),assets:['/_next/static/harness.js',...(missingAsset?['/_next/static/missing.js']:[])]}));}
  else if (request.url === '/_next/static/harness.js') { response.writeHead(200, { 'Content-Type': 'application/javascript' }); response.end(script); }
  else if(request.url?.startsWith('/_next/static/')){response.writeHead(wrongMime?200:404,{'Content-Type':'text/html'});response.end('<html>Missing</html>');}
  else if (request.url === '/api/health') { response.writeHead(200, { 'Content-Type': 'application/json' }); response.end('{"status":"ok"}'); }
  else { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end(`<!doctype html><html lang="en"><head><meta name="event-offline-build" content="${buildId()}"><title>Offline transport test</title></head><body><h1>Offline transport test</h1><script src="/_next/static/harness.js"></script></body></html>`); }
}).listen(3111, '127.0.0.1');
