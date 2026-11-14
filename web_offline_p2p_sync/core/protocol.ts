import { z } from 'zod';
export { signingData } from './signing.mjs';

export const EVENT_SCOPE = process.env.NEXT_PUBLIC_EVENT_ID || 'bal-pradarshani';
export const scanSchema = z.object({ scanData: z.string().trim().min(1).max(300), sessionId: z.uuid(), mode: z.enum(['check-in', 'check-out']), timestamp: z.iso.datetime() });
const childCreate = z.object({ id: z.uuid(), qr_id: z.uuid(), name: z.string().trim().min(1).max(160), contact_number: z.string().max(30), session_id: z.uuid(), status: z.literal('Registered').optional(), serial_number: z.string().max(80).optional() });
const childUpdate = z.object({ id: z.uuid(), qr_id: z.uuid().optional(), status: z.enum(['Checked In', 'Checked Out']), checked_in_at: z.iso.datetime().optional(), checked_out_at: z.iso.datetime().optional() });
export const operationSchema = z.object({
  id: z.string().min(1).max(100), entity: z.enum(['children', 'attendance_scans']), action: z.enum(['CREATE', 'UPDATE']), payload: z.record(z.string(), z.unknown()), timestamp: z.number().int().positive(),
  actorId: z.uuid().optional(), deviceId: z.uuid().optional(), scope: z.string().max(100).optional(), credential: z.string().max(5000).optional(), signature: z.string().max(300).optional(), legacy: z.boolean().optional(),
}).superRefine((item, context) => {
  const schema = item.entity === 'attendance_scans' ? scanSchema : item.action === 'CREATE' ? childCreate : childUpdate;
  if (item.entity === 'attendance_scans' && item.action !== 'CREATE') context.addIssue({ code: 'custom', message: 'Scans are immutable CREATE events.' });
  const parsed = schema.safeParse(item.payload);
  if (!parsed.success) for (const issue of parsed.error.issues) context.addIssue({ ...issue, path: ['payload', ...issue.path] });
});

export function normalizeScan(value: string): string {
  const raw = value.includes('/verify/') ? value.split('/verify/').pop()! : value;
  return raw.trim().split('?')[0].replace(/\/$/, '');
}

