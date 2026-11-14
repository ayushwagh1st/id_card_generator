// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/sync/route';
import { requireOperator, applyOperation, verifyOperation } from '@/lib/offline/server';

vi.mock('@/lib/offline/server', () => ({
  requireOperator: vi.fn(), applyOperation: vi.fn(), verifyOperation: vi.fn(), OPERATOR_ROLES: ['SUPER_ADMIN', 'LECTURER', 'MODEL_HEAD'],
  adminClient: () => ({ auth: { admin: { getUserById: async () => ({ data: { user: { app_metadata: { role: 'LECTURER' } } }, error: null }) } } }),
}));
const actor = '00000000-0000-4000-8000-000000000001';
const operation = (id = 'op') => ({ id, entity: 'attendance_scans', action: 'CREATE', payload: { scanData: 'SNK-1', sessionId: '00000000-0000-4000-8000-000000000002', mode: 'check-in', timestamp: new Date().toISOString() }, timestamp: Date.now(), status: 'pending', retryCount: 0 });
const request = (batch: any[]) => new Request('https://portal.test/api/sync', { method: 'POST', body: JSON.stringify({ batch }), headers: { 'Content-Type': 'application/json' } });
beforeEach(() => { vi.mocked(requireOperator).mockResolvedValue({ id: actor } as any); vi.mocked(applyOperation).mockReset(); vi.mocked(verifyOperation).mockImplementation(() => ({ actorId: actor }) as any); });
describe('per-operation upload API', () => {
  it('returns 401 before any write when authentication is missing', async () => { vi.mocked(requireOperator).mockRejectedValue(new Error('AUTH_REQUIRED')); const response = await POST(request([operation()])); expect(response.status).toBe(401); expect(applyOperation).not.toHaveBeenCalled(); });
  it('returns 403 for accounts without a trusted operator role', async () => { vi.mocked(requireOperator).mockRejectedValue(new Error('OPERATOR_ROLE_REQUIRED')); expect((await POST(request([operation()]))).status).toBe(403); });
  it('acknowledges only applied operations and preserves retryability on partial failure', async () => {
    vi.mocked(applyOperation).mockResolvedValueOnce({ data: { applied: true } }).mockResolvedValueOnce({ error: 'Database unavailable', retryable: true });
    const data = await (await POST(request([operation('ok'), operation('retry')]))).json(); expect(data.successIds).toEqual(['ok']); expect(data.failedIds).toEqual([{ id: 'retry', error: 'Database unavailable', retryable: true }]);
  });
  it('never acknowledges unsupported actions without a database write', async () => {
    const data = await (await POST(request([{ ...operation(), action: 'DELETE' }]))).json(); expect(data.successIds).toEqual([]); expect(data.failedIds[0].retryable).toBe(false); expect(applyOperation).not.toHaveBeenCalled();
  });
  it('never acknowledges malformed target data', async () => {
    const data = await (await POST(request([{ ...operation(), entity: 'children', action: 'UPDATE', payload: { status: 'Checked In' } }]))).json(); expect(data.successIds).toEqual([]); expect(applyOperation).not.toHaveBeenCalled();
  });
  it('rejects forged signatures without writing', async () => {
    vi.mocked(verifyOperation).mockImplementation(() => { throw Error('Invalid signature'); }); const data = await (await POST(request([operation()]))).json(); expect(data.successIds).toEqual([]); expect(applyOperation).not.toHaveBeenCalled();
  });
  it('rejects batches exceeding the item limit', async () => { expect((await POST(request(Array.from({ length: 21 }, (_, i) => operation(String(i)))))).status).toBe(400); });
  it('rejects oversized bodies', async () => { const response = await POST(new Request('https://portal.test/api/sync', { method: 'POST', body: 'x'.repeat(256001) })); expect(response.status).toBe(413); });
});
