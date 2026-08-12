# AI Agent Integration Guidelines for `web_offline_p2p_sync`

> **Role for AI Agent**: You are an expert Web Application Architect. Follow these step-by-step instructions to integrate offline peer-to-peer (P2P) mesh networking and background server synchronization into this web repository.

---

## 🎯 Goal

Enable the current web application to:
1. **Operate 100% Offline**: User actions (form submits, data creation, updates, deletes) must be saved into IndexedDB using `OfflineStore` when internet is disconnected.
2. **Local P2P Mesh Synchronization**: Devices on the same Wi-Fi / browser session must share updates in real-time offline via `P2PMeshEngine` (WebRTC / BroadcastChannel).
3. **Automatic Cloud Sync**: Once internet reachability returns (`NetworkMonitor`), pending outbox items must automatically upload to the backend server API.

---

## 🛠️ Step-by-Step AI Agent Integration Workflow

### Step 1: Copy `web_offline_p2p_sync` Core Files
Ensure the `web_offline_p2p_sync` folder is located in your project source (e.g., `src/lib/web_offline_p2p_sync` or `app/lib/web_offline_p2p_sync`).

### Step 2: Initialize `SyncManager` in App Root / Provider
Create or update your application root context/provider (e.g. `App.tsx`, `layout.tsx`, or `SyncProvider.tsx`):

```typescript
import { SyncManager } from './web_offline_p2p_sync/core/SyncManager';

export const syncManager = new SyncManager({
  pingUrl: '/api/health', // Replace with your server health endpoint
  dbName: 'app_offline_outbox',
  channelName: 'app_p2p_mesh',
});

// Initialize on app launch
syncManager.init();
```

### Step 3: Wire Up the Server Upload Handler
Connect `syncManager.setServerUploadHandler()` to your existing API server endpoints or database layer (e.g. Supabase, REST API, Express, Next.js API Routes):

```typescript
syncManager.setServerUploadHandler(async (pendingBatch) => {
  // Send batch of offline transactions to backend
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batch: pendingBatch }),
  });

  if (!response.ok) throw new Error('Sync endpoint error');

  const result = await response.json();
  return { successIds: result.successIds };
});
```

### Step 4: Replace Direct API Calls with `syncManager.mutate()`
Wherever user data is created, edited, or deleted in your UI forms:

```typescript
// BEFORE:
// await fetch('/api/cards', { method: 'POST', body: JSON.stringify(data) });

// AFTER (Supports both Online & Offline Seamlessly!):
await syncManager.mutate('cards', 'CREATE', data);
```

### Step 5: Render Connection & Sync UI Badges
Add `<NetworkSyncStatus syncManager={syncManager} />` to your app header/navbar so users can visually see:
- 🟢 **Online & Synced**
- 🔵 **Offline (P2P Mesh Active)**
- 🟠 **Syncing...**
- 🔴 **Offline (Saved Locally)**

---

## 📋 Verification Checklist for AI Agent
- [ ] Has IndexedDB initialized without console errors?
- [ ] Does turning off network interface switch badge status to **Offline**?
- [ ] Do form submissions succeed while offline and persist in `IndexedDB` outbox?
- [ ] Does reconnecting internet trigger automatic server batch upload?
