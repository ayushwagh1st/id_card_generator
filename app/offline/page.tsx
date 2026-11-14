'use client';

import { useState } from 'react';
import ScannerPage from '@/app/lecturer/scanner/page';
import { SpotRegistration } from '@/components/spot-registration/SpotRegistration';
import { useSyncManager } from '@/components/SyncProvider';

export default function OfflineOperationsPage() {
  const [view, setView] = useState<'scanner' | 'registration'>('scanner');
  const { state, syncManager, openModal, openBridgeModal } = useSyncManager();
  return <main className="mx-auto max-w-6xl p-4 sm:p-6">
    <h1 className="text-2xl font-semibold">Event operations</h1>
    <p className="my-3 text-sm">{state.isOnline ? 'Server reachable.' : 'Working from this device.'} {state.pendingCount} records awaiting server confirmation. Keep this device until all records are reconciled.</p>
    {state.error && <p role="alert" className="my-3 text-destructive">{state.error}</p>}
    <nav aria-label="Offline event tools" className="my-4 flex flex-wrap gap-3">
      <button type="button" className="ui-button" aria-pressed={view === 'scanner'} onClick={() => setView('scanner')}>Attendance scanner</button>
      <button type="button" className="ui-button" aria-pressed={view === 'registration'} onClick={() => setView('registration')}>Spot registration</button>
      <button type="button" className="ui-button" disabled={!syncManager} onClick={openModal}>Preparation and saved records</button>
      <button type="button" className="ui-button" disabled={!syncManager} onClick={openBridgeModal}>Connect devices</button>
    </nav>
    {!syncManager ? <p role="status">Opening local storage. If you have not prepared this device, <a className="underline" href="/login">sign in online first</a>.</p> : view === 'scanner' ? <ScannerPage /> : <SpotRegistration />}
  </main>;
}
