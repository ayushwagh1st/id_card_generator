// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkMonitor } from '@/web_offline_p2p_sync/core/NetworkMonitor';

beforeEach(()=>vi.stubGlobal('navigator',{onLine:true}));
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
describe('verified server connectivity',()=>{
  it('checks GET and the health payload rather than trusting a HEAD 200',async()=>{
    const fetch=vi.fn(async()=>Response.json({status:'ok'}));vi.stubGlobal('fetch',fetch);
    expect(await new NetworkMonitor().checkServerReachability()).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/health',expect.objectContaining({method:'GET',cache:'no-store'}));
  });
  it('does not treat a captive portal HTML response as cloud access',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('<html>Wi-Fi sign-in</html>',{status:200})));
    expect(await new NetworkMonitor().checkServerReachability()).toBe(false);
  });
  it('does not claim database connectivity when the health probe reports failure',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>Response.json({status:'error'},{status:503})));
    expect(await new NetworkMonitor().checkServerReachability()).toBe(false);
  });
  it('does not fetch when the browser is disconnected',async()=>{
    vi.stubGlobal('navigator',{onLine:false});const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
    expect(await new NetworkMonitor().checkServerReachability()).toBe(false);expect(fetch).not.toHaveBeenCalled();
  });
  it('bounds a stalled health request and reports offline',async()=>{
    vi.useFakeTimers();vi.stubGlobal('fetch',vi.fn((_url:unknown,options:RequestInit)=>new Promise((_resolve,reject)=>options.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))));
    const probe=new NetworkMonitor().checkServerReachability();await vi.advanceTimersByTimeAsync(4001);expect(await probe).toBe(false);
  });
  it('coalesces concurrent reachability probes',async()=>{
    const fetch=vi.fn(async()=>Response.json({status:'ok'}));vi.stubGlobal('fetch',fetch);const monitor=new NetworkMonitor();
    await Promise.all([monitor.checkServerReachability(),monitor.checkServerReachability()]);expect(fetch).toHaveBeenCalledOnce();
  });
});
