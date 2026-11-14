import { afterEach, describe, expect, it, vi } from 'vitest';
import { usableOfflineWorker } from '@/lib/offline/worker';
afterEach(() => vi.useRealTimers());
const registration = (value: object) => value as ServiceWorkerRegistration;
describe('offline worker lifecycle', () => {
  it('uses the activated worker while a slower replacement installs', async () => {
    const active = { state: 'activated' };
    expect(await usableOfflineWorker(registration({active, installing: {state: 'installing'}}))).toBe(active);
  });
  it('follows replacement workers instead of waiting on a redundant captured instance', async () => {
    vi.useFakeTimers();
    const state: any = {active: {state: 'activating'}, installing: {state: 'installing'}};
    const pending = usableOfflineWorker(registration(state));
    state.installing.state = 'redundant';
    state.active = {state: 'activated'};
    await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toBe(state.active);
  });
  it('asks a waiting first worker to activate and tolerates more than fifteen seconds', async () => {
    vi.useFakeTimers();
    const waiting = {state: 'installed',postMessage: vi.fn()};
    const state: any = {waiting,active:null};
    const pending = usableOfflineWorker(registration(state));
    await vi.advanceTimersByTimeAsync(16000);
    expect(waiting.postMessage).toHaveBeenCalledWith({type:'SKIP_WAITING'});
    state.active = {state:'activated'};
    await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toBe(state.active);
  });
  it('bounds failure without clearing caches or stored records', async () => {
    vi.useFakeTimers();
    const pending = expect(usableOfflineWorker(registration({}),300)).rejects.toThrow('Your saved records are safe');
    await vi.advanceTimersByTimeAsync(400);await pending;
  });
});
