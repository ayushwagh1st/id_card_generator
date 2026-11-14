import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowUpRight, CheckCircle2, ChevronDown, Circle, Download, KeyRound, Loader2, Upload, Wifi, WifiOff } from 'lucide-react';
import type { SyncManager, SyncState } from '../core/SyncManager';
import { errorMessage } from '../core/errors';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import styles from './SyncProgressModal.module.css';

interface SyncProgressModalProps {
  syncManager: SyncManager;
  isOpen: boolean;
  onClose: () => void;
  onPrepare?: () => Promise<void>;
  isPreparing?: boolean;
}

function formatDate(value: number) {
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function preparationError(error: string) {
  if (/development preview|requires the published app/.test(error)) return {
    title: 'Open the published app to prepare',
    message: 'This development preview cannot save a complete offline release. Use the published app, then prepare this device while connected. Your saved records are safe.',
  };
  if (/offline asset|offline files|app release|asset manifest|operator page/.test(error)) return {
    title: 'App files could not be saved',
    message: 'Preparation is incomplete. Keep the connection and try again. If this repeats, ask an administrator to check the published app files. Your saved records are safe.',
  };
  return { title: 'Action needed', message: error };
}

export const SyncProgressModal: React.FC<SyncProgressModalProps> = ({ syncManager, isOpen, onClose, onPrepare, isPreparing = false }) => {
  const [transferMessage, setTransferMessage] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const [state, setState] = useState<SyncState>({ isOnline: false, isSyncing: false, peerCount: 0, pendingCount: 0, lastSyncedTime: null });

  useEffect(() => syncManager.subscribeState(setState), [syncManager]);
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const refresh = () => { if (active) setNow(Date.now()); };
    queueMicrotask(refresh);
    const timer = setInterval(refresh, 1000);
    return () => { active = false; clearInterval(timer); };
  }, [isOpen]);
  if (!isOpen) return null;

  const authorized = !!state.authorizationExpiresAt && state.authorizationExpiresAt > now;
  const ready = !!state.preparedAt && !!state.pagesPreparedAt && authorized;
  const error = state.error ? preparationError(state.error) : null;
  const checks = [
    { label: 'Event data', complete: !!state.preparedAt, detail: state.preparedAt ? `Saved ${formatDate(state.preparedAt)}` : 'Save the event roster and sessions on this device.' },
    { label: 'Offline app files', complete: !!state.pagesPreparedAt, detail: state.pagesPreparedAt ? `Verified ${formatDate(state.pagesPreparedAt)}` : 'Not verified. Finish preparation before going offline.' },
    { label: 'Offline authorization', complete: authorized, detail: state.authorizationExpiresAt ? `${authorized ? 'Valid until' : 'Expired'} ${formatDate(state.authorizationExpiresAt)}` : 'Prepare online to authorize this device.' },
  ];
  const transfer = async (action: () => Promise<string>) => {
    if (transferBusy) return;
    setTransferBusy(true); setTransferMessage('');
    try { setTransferMessage(await action()); }
    catch (error) { setTransferMessage(errorMessage(error)); }
    finally { setTransferBusy(false); }
  };
  const download = (contents: string, name: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={styles.dialog}>
      <DialogHeader className={styles.header}>
        <DialogTitle>Offline & server sync</DialogTitle>
        <DialogDescription>Prepare this device and check your saved records.</DialogDescription>
      </DialogHeader>

      <div className={styles.body}>
        <div className={styles.connection}>
          {state.isOnline ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
          <span>{state.isOnline ? 'Server reachable' : state.peerCount ? 'Offline with connected devices' : 'Working on this device only'}</span>
        </div>
        <section className={styles.records} aria-label="Saved record delivery">
          <dl className={styles.metrics}>
            <div><dt>Awaiting server confirmation</dt><dd>{state.pendingCount}<span> records</span></dd></div>
            <div><dt>Connected devices</dt><dd>{state.peerCount}<span> peers</span></dd></div>
          </dl>
          <div className={styles.syncRow}>
            <p>{state.lastSyncedTime ? `Last synced ${formatDate(state.lastSyncedTime)}` : 'Saved records stay on this device until the server confirms them.'}</p>
            <Button variant="outline" disabled={!state.isOnline || state.isSyncing || state.pendingCount === 0} onClick={() => { void syncManager.syncWithServer(); }}>
              {state.isSyncing && <Loader2 className={styles.spinner} aria-hidden="true" />}{state.isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
          {!!state.failedCount && <div className={styles.failed}>
            <p>{state.failedCount} records need review. They remain saved.</p>
            <Button variant="outline" disabled={!state.isOnline || state.isSyncing} onClick={() => { void syncManager.retryFailed(); }}>Retry failed records</Button>
          </div>}
        </section>

        <section className={styles.readiness} aria-labelledby="offline-readiness-title">
          <div className={styles.sectionHeading}>
            <h2 id="offline-readiness-title">Offline readiness</h2>
            <span className={ready ? styles.ready : styles.incomplete} role="status">{isPreparing ? 'Preparing…' : ready ? 'Ready on this device' : 'Needs preparation'}</span>
          </div>
          <ul className={styles.checks}>
            {checks.map(check => <li key={check.label}>
              {check.complete ? <CheckCircle2 className={styles.checkComplete} aria-hidden="true" /> : <Circle className={styles.checkPending} aria-hidden="true" />}
              <div><h3>{check.label}</h3><p>{check.detail}</p></div>
            </li>)}
          </ul>
          {error && <div role="alert" className={styles.error}>
            <AlertCircle aria-hidden="true" />
            <div><h3>{error.title}</h3><p>{error.message}</p>
              {error.message !== state.error && <details className={styles.technical}><summary>Technical details</summary><p>{state.error}</p></details>}
            </div>
          </div>}
          <p className={styles.note}>Connected devices can relay saved records. Server sync resumes when a connection is available.</p>
          <a href="/offline" className={styles.toolsLink}>Open saved event tools <ArrowUpRight aria-hidden="true" /></a>
        </section>

        <details className={styles.backup}>
          <summary>Backup & router tools <ChevronDown aria-hidden="true" /></summary>
          <p>Export a backup before moving devices. Imports verify signatures and keep repeated IDs once.</p>
          <div className={styles.backupActions}>
            <Button variant="outline" disabled={transferBusy} onClick={() => { void transfer(async () => {
              download(await syncManager.exportData(), `event-queue-${Date.now()}.json`); return 'Saved-record backup downloaded.';
            }); }}><Download aria-hidden="true" />Export saved records</Button>
            <Button variant="outline" disabled={transferBusy} onClick={() => fileInput.current?.click()}><Upload aria-hidden="true" />Import saved records</Button>
            <Button variant="outline" disabled={transferBusy} onClick={() => { void transfer(async () => {
              const key = await syncManager.getStore().getMeta('server-public-key');
              if (!key) throw new Error('Prepare this device before exporting the router verification key.');
              download(JSON.stringify(key), 'event-router-public-key.json'); return 'Router public key downloaded.';
            }); }}><KeyRound aria-hidden="true" />Export router public key</Button>
          </div>
          <input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" aria-label="Saved records backup file" tabIndex={-1} onChange={event => {
            const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
            void transfer(async () => {
              if (file.size > 50000000) throw new Error('Backup exceeds 50 MB.');
              const count = await syncManager.importData(await file.text()); return `Imported ${count} verified records. Repeated IDs are preserved once.`;
            });
          }} />
          {transferMessage && <p role="status" className={styles.transferMessage}>{transferMessage}</p>}
        </details>
      </div>

      <div className={styles.footer}>
        <Button variant="outline" onClick={onClose}>Close</Button>
        {onPrepare && <Button disabled={!state.isOnline || isPreparing || state.isSyncing} onClick={() => { void onPrepare().catch(() => {}); }}>
          {isPreparing && <Loader2 className={styles.spinner} aria-hidden="true" />}{isPreparing ? 'Preparing offline access…' : 'Prepare offline access'}
        </Button>}
      </div>
    </DialogContent>
  </Dialog>;
};
