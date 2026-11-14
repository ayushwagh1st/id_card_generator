import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep, basename } from 'node:path';

const actor = '00000000-0000-4000-8000-000000000001';
const sessionId = '00000000-0000-4000-8000-000000000002';
const keys = generateKeyPairSync('ec', { namedCurve: 'P-256' });
async function prepare(context: BrowserContext, page: Page, mode: 'ok' | 'partial' | 'asset-error' = 'ok') {
  await context.addInitScript(id => localStorage.setItem('offline-active-user:v2', id), actor);
  await context.route('**/api/health', route => route.fulfill({ json: { status: 'ok' } }));
  await context.route('**/api/offline/changes?*', route => route.fulfill({ json: { items: [], cursor: '0', hasMore: false } }));
  await context.route('**/api/offline/bootstrap', async route => {
    if (mode === 'asset-error') { await route.fulfill({ status: 503, json: { error: 'Required offline asset unavailable: /_next/static/chunks/' + 'missing-script-'.repeat(25) + '.js' } }); return; }
    const device = route.request().postDataJSON();
    const claims = { actorId: actor, deviceId: device.deviceId, publicKey: device.publicKey, role: 'LECTURER', scope: 'bal-pradarshani', expiresAt: Date.now() + 86400000 };
    const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signature = sign('sha256', Buffer.from(body), { key: keys.privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
    await route.fulfill({ json: { credential: body + '.' + signature, serverPublicKey: keys.publicKey.export({ format: 'jwk' }), serverTime: Date.now(), snapshot: { preparedAt: Date.now(), sessions: [{ id: sessionId, name: 'Gate duty', date: '2026-11-14', start_time: '09:00', end_time: '18:00' }], children: [], volunteers: [], enrollments: [], qrCodes: [] } } });
  });
  let requests = 0;
  await context.route('**/api/sync', async route => {
    requests++;
    const batch = route.request().postDataJSON().batch;
    await route.fulfill({ json: mode === 'partial' ? { successIds: batch.slice(0, 1).map((item: any) => item.id), failedIds: batch.slice(1).map((item: any) => ({ id: item.id, error: 'Participant requires review', retryable: false })) } : { successIds: batch.map((item: any) => item.id), failedIds: [] } });
  });
  await page.goto('http://localhost:3110/offline');
  await expect(page.getByRole('button', { name: 'Preparation and saved records' })).toBeEnabled();
  if (mode === 'asset-error') return () => requests;
  await expect.poll(() => page.evaluate(async () => {
    const request = indexedDB.open('app_offline_outbox');
    return new Promise<boolean>(resolve => { request.onsuccess = () => { const db = request.result; const get = db.transaction('metadata').objectStore('metadata').get('bal-pradarshani:' + '00000000-0000-4000-8000-000000000001' + ':pages-prepared-at'); get.onsuccess = () => { resolve(!!get.result); db.close(); }; }; });
  }), { timeout: 75000 }).toBe(true).catch(async error => {
    console.log('Preparation diagnostic', await page.evaluate(async () => {
      const names = await caches.keys(); const cacheKeys = await Promise.all(names.map(async name => ({ name, urls: (await (await caches.open(name)).keys()).map(request => request.url) })));
      const metadata = await new Promise<any[]>(resolve => { const open = indexedDB.open('app_offline_outbox'); open.onsuccess = () => { const db = open.result; const get = db.transaction('metadata').objectStore('metadata').getAllKeys(); get.onsuccess = () => { resolve(get.result); db.close(); }; }; });
      return { cacheKeys, metadata, alerts: [...document.querySelectorAll('[role="alert"]')].map(element => element.textContent) };
    })); throw error;
  });
  return () => requests;
}
async function queue(page: Page) {
  return page.evaluate(() => new Promise<any[]>((resolve, reject) => { const open = indexedDB.open('app_offline_outbox'); open.onerror = () => reject(open.error); open.onsuccess = () => { const db = open.result; const get = db.transaction('operations').objectStore('operations').getAll(); get.onsuccess = () => { resolve(get.result.map((row: any) => row.item)); db.close(); }; }; }));
}
async function selectSession(page: Page) {
  const select = page.getByRole('combobox').first(); await select.click();
  await page.getByRole('option').filter({ hasText: 'Gate duty' }).click();
}
async function scan(page: Page, id: string) {
  await page.getByPlaceholder('Manual ID entry...').fill(id);
  await page.getByRole('button', { name: /submit|scan|record/i }).filter({ hasText: /submit|scan|record/i }).last().click();
}

test('prepared operator page survives offline restart and retains committed scans', async ({ context, page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await prepare(context, page);
  const buildId=await page.locator('meta[name="event-offline-build"]').getAttribute('content');
  expect(buildId).toBe(readFileSync('.next-offline-tests/BUILD_ID','utf8').trim());
  const manifest=await context.request.get(`http://localhost:3110/_next/static/${buildId}/offline-assets.json`);
  expect(manifest.ok()).toBe(true);expect((await manifest.json()).build).toBe(buildId);
  const cached = await page.evaluate(async () => {
    const meta = await (await caches.open('event-offline-meta-v2')).match('/__event_offline_manifest');
    const metadata = meta ? await meta.json() : null;
    const cache = metadata ? await caches.open(metadata.cache) : null;
    const metaCache = await caches.open('event-offline-meta-v2');
    const requests = await metaCache.keys();
    return { metadata, metadataKeys: requests.map(request => request.url), metadataContents: await Promise.all(requests.map(async request => (await metaCache.match(request))?.text())), shell: !!await cache?.match('/offline'), shellIgnoringVary: !!await cache?.match('/offline', { ignoreVary: true }), keys: await caches.keys() };
  });
  expect(cached.shellIgnoringVary).toBe(true);
  await context.setOffline(true);
  await selectSession(page);
  // Use the form's native submit, avoiding camera permissions in this test.
  const field = page.locator('input[placeholder]').filter({ visible: true }).last();
  await field.fill('SNK-OFFLINE-1'); await field.press('Enter');
  await expect.poll(async () => (await queue(page)).length).toBe(1);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Event operations', exact: true })).toBeVisible();
  await expect.poll(async () => (await queue(page)).length).toBe(1);
  await page.goto('http://localhost:3110/lecturer/scanner');
  await expect(page).toHaveURL(/\/offline$/);
  await expect(page.getByRole('heading', { name: 'Event operations', exact: true })).toBeVisible();
  expect((await queue(page))[0]).toMatchObject({ status: 'pending', actorId: actor, entity: 'attendance_scans' });
  expect(errors).toEqual([]);
  await context.setOffline(false);
  await expect.poll(async () => (await queue(page)).filter(item => item.status !== 'synced').length, { timeout: 30000 }).toBe(0);
  expect(await queue(page)).toHaveLength(1);
});

test('separate devices relay through a three-device chain and a late join receives history', async ({ browser }) => {
  const contexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext(), browser.newContext()]);
  try {
    const pages = await Promise.all(contexts.map(context => context.newPage()));
    for (const page of pages) {
      await page.goto('http://127.0.0.1:3111');
      await page.evaluate(async () => { window.manager = new window.offlineTest.SyncManager({ dbName: 'transport-test' }); await window.manager.init(); });
    }
    const bridge = async (a: Page, b: Page) => {
      const offer = await a.evaluate(async () => { const result = await window.manager.getMeshEngine().createOffer(); (window as any).pc = result.pc; return result.compressedOffer; });
      const answer = await b.evaluate(async value => (await window.manager.getMeshEngine().acceptOffer(value)).compressedAnswer, offer);
      await a.evaluate(async value => window.manager.getMeshEngine().acceptAnswer((window as any).pc, value), answer);
    };
    await bridge(pages[0], pages[1]); await bridge(pages[1], pages[2]);
    await pages[0].evaluate(async id => window.manager.mutate('attendance_scans', 'CREATE', { scanData: 'CHAIN-1', sessionId: id, mode: 'check-in', timestamp: new Date().toISOString() }), sessionId);
    await expect.poll(() => pages[2].evaluate(async () => (await window.manager.getStore().getAllItems()).length)).toBe(1);
    await bridge(pages[0], pages[3]);
    await expect.poll(() => pages[3].evaluate(async () => (await window.manager.getStore().getAllItems()).length)).toBe(1);
    for (const page of pages) expect(await page.evaluate(async () => (await window.manager.getStore().getAllItems()).length)).toBe(1);
  } finally { await Promise.all(contexts.map(context => context.close())); }
});

test('a 1,000-scan backlog survives restart and uploads each ID once', async ({ page }) => {
  await page.goto('http://127.0.0.1:3111');
  const result=await page.evaluate(async sessionId=>{
    const {SyncManager}=window.offlineTest;
    const manager=new SyncManager({dbName:'volume-test'});
    const start=performance.now();
    for(let index=0;index<1000;index++) await manager.mutate('attendance_scans','CREATE',{scanData:'VOLUME-'+index,sessionId,mode:'check-in',timestamp:new Date().toISOString()});
    const savedMs=performance.now()-start;
    manager.destroy();
    const reopened=new SyncManager({dbName:'volume-test'});await reopened.init();
    const ids:string[]=[];
    reopened.setServerUploadHandler(async(batch:any[])=>{ids.push(...batch.map(item=>item.id));return {successIds:batch.map(item=>item.id),failedIds:[]};});
    await reopened.syncWithServer(true);
    const remaining=await reopened.getPendingCount();const count=(await reopened.getStore().getAllItems()).length;
    reopened.destroy();return {savedMs,remaining,count,uploaded:ids.length,unique:new Set(ids).size};
  },sessionId);
  console.log('1000-scan browser backlog',result);
  expect(result).toMatchObject({remaining:0,count:1000,uploaded:1000,unique:1000});
});

test('failed preparation keeps the last complete bundle usable offline',async({context,page})=>{
  await page.goto('http://127.0.0.1:3111');
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;});
  const prepare=()=>page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    return new Promise<{ok:boolean;error?:string}>(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=event=>{channel.port1.close();resolve(event.data);};registration.active!.postMessage({type:'PREPARE_OFFLINE'},[channel.port2]);});
  });
  expect((await prepare()).ok).toBe(true);
  await page.evaluate(()=>fetch('/manifest-mode?missing=1'));
  try {
    const result=await prepare();expect(result.ok).toBe(false);expect(result.error).toContain('Required offline asset unavailable');
    await page.evaluate(()=>fetch('/manifest-mode?html=1'));
    const wrongContent=await prepare();expect(wrongContent.ok).toBe(false);expect(wrongContent.error).toContain('wrong content type');
    await page.evaluate(()=>fetch('/manifest-mode?mismatch=1'));
    const changedRelease=await prepare();expect(changedRelease.ok).toBe(false);expect(changedRelease.error).toContain('release changed');
    const pointer=await page.evaluate(async()=>{const response=await(await caches.open('event-offline-meta-v2')).match('/__event_offline_manifest');return response?.json();});
    expect(pointer.cache).toBe('event-offline-browser-harness');
    await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:'Offline transport test'})).toBeVisible();
  }finally{await context.setOffline(false);await page.evaluate(()=>fetch('/manifest-mode?missing=0'));}
});

test('development preparation gives an actionable message instead of fetching stale production chunks',async({page})=>{
  await page.goto('http://127.0.0.1:3111');
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;await fetch('/manifest-mode?development=1');});
  try {
    const result=await page.evaluate(async()=>new Promise<{ok:boolean;error?:string}>(async resolve=>{
      const registration=await navigator.serviceWorker.ready;const channel=new MessageChannel();
      channel.port1.onmessage=event=>{channel.port1.close();resolve(event.data);};registration.active!.postMessage({type:'PREPARE_OFFLINE'},[channel.port2]);
    }));
    expect(result.ok).toBe(false);expect(result.error).toContain('development preview');
    expect(await page.evaluate(async()=>!!await(await caches.open('event-offline-meta-v2')).match('/__event_offline_manifest'))).toBe(false);
  } finally {await page.evaluate(()=>fetch('/manifest-mode?missing=0'));}
});

test('sync dialog fits narrow screens with long errors, visible actions, and keyboard access',async({context,page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await prepare(context,page,'asset-error');
  await page.getByRole('button',{name:'Preparation and saved records'}).click();
  const dialog=page.getByRole('dialog',{name:'Offline & server sync'});
  await expect(dialog.getByRole('alert')).toContainText('App files could not be saved');
  await dialog.getByText('Technical details',{exact:true}).click();
  await dialog.getByText('Backup & router tools',{exact:true}).click();
  for(const theme of ['light','dark']){
    await page.evaluate(theme=>document.documentElement.classList.toggle('dark',theme==='dark'),theme);
    for(const [width,height] of [[320,640],[390,844],[668,673],[1280,900]]){
      await page.setViewportSize({width,height});
      const bounds=await dialog.evaluate(element=>{
        const rect=element.getBoundingClientRect();
        const overflowing=[element,...element.querySelectorAll('*:not(.sr-only)')].filter(node=>node instanceof HTMLElement&&node.clientWidth>0&&node.scrollWidth>node.clientWidth+1).map(node=>node.tagName);
        return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,overflowing};
      });
      expect(bounds.left).toBeGreaterThanOrEqual(0);expect(bounds.right).toBeLessThanOrEqual(width);expect(bounds.top).toBeGreaterThanOrEqual(0);expect(bounds.bottom).toBeLessThanOrEqual(height);expect(bounds.overflowing).toEqual([]);
      const button=dialog.getByRole('button',{name:'Prepare offline access',exact:true});
      await expect(button).toBeInViewport();await expect(dialog.getByRole('button',{name:'Close',exact:true}).last()).toBeInViewport();
      await dialog.screenshot({path:`verification-results/sync-dialog-${width}-${theme}.png`});
    }
  }
  await dialog.getByRole('button',{name:'Prepare offline access',exact:true}).focus();
  for(let index=0;index<12;index++){await page.keyboard.press('Tab');expect(await dialog.evaluate(element=>element.contains(document.activeElement))).toBe(true);}
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
  await page.evaluate(()=>document.documentElement.classList.remove('dark'));
  await page.setViewportSize({width:668,height:900});
  await page.getByRole('button',{name:'Preparation and saved records'}).click();
  await dialog.screenshot({path:'verification-results/sync-dialog-overview.png'});
  expect(errors).toEqual([]);
});

test('prepared data and signing keys survive a full browser process restart',async()=>{
  const temporaryRoot=resolve(tmpdir());const profile=mkdtempSync(join(temporaryRoot,'event-browser-test-'));
  let context:BrowserContext|null=null;
  try {
    context=await chromium.launchPersistentContext(profile,{headless:true});
    let page=context.pages()[0] || await context.newPage();await prepare(context,page);await context.close();context=null;
    context=await chromium.launchPersistentContext(profile,{headless:true});await context.setOffline(true);
    page=context.pages()[0] || await context.newPage();await page.goto('http://localhost:3110/offline');
    await expect(page.getByRole('button',{name:'Preparation and saved records'})).toBeEnabled();await selectSession(page);
    const field=page.getByPlaceholder('Enter Volunteer ID (SNK ID)');await field.fill('PROCESS-RESTART-1');await field.press('Enter');
    await expect.poll(async()=>(await queue(page)).length).toBe(1);expect((await queue(page))[0].signature).toBeTruthy();
  }finally{
    await context?.close();
    const target=resolve(profile);
    if(!target.startsWith(temporaryRoot+sep)||!basename(target).startsWith('event-browser-test-'))throw new Error('Unexpected browser profile cleanup path');
    rmSync(target,{recursive:true,force:true,maxRetries:5,retryDelay:200});
  }
});
