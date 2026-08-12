# 🌐 Web Offline P2P Mesh & Cloud Sync Package (`web_offline_p2p_sync`)

A complete, self-contained TypeScript/JavaScript module that empowers web applications (React, Next.js, Vue, Svelte, or Vanilla JS) to **communicate offline device-to-device** and **sync automatically with backend servers** when internet connectivity is restored.

---

## ⚡ Key Features

- 📱 **100% Offline Capability**: Saves all transactions locally in an `IndexedDB` outbox (`OfflineStore.ts`).
- 📡 **Offline Local P2P Mesh**: Devices on the same Wi-Fi network or browser session share updates offline via `WebRTC DataChannels` & `BroadcastChannel` (`P2PMeshEngine.ts`).
- 🌐 **Automatic Server Upload**: Detects network recovery (`NetworkMonitor.ts`) and uploads queued offline changes to backend server endpoints with retry ACKs.
- 🎨 **Ready-to-Use UI**: Includes Tailwind/CSS status badges (`NetworkSyncStatus.tsx`) and an outbox queue drawer modal (`SyncProgressModal.tsx`).
- 🤖 **AI-Agent Ready**: Includes `AGENT_INSTRUCTIONS.md` so you can upload this folder to Cursor, Antigravity, ChatGPT, or Claude and ask it to integrate offline mode into your app automatically.

---

## 📁 Package Structure

```
web_offline_p2p_sync/
├── README.md                 # Master documentation
├── AGENT_INSTRUCTIONS.md     # Instructions for AI Agents to integrate this package
├── core/
│   ├── OfflineStore.ts       # IndexedDB outbox queue & persistent local state
│   ├── NetworkMonitor.ts     # Online/offline reachability listener with server ping
│   ├── P2PMeshEngine.ts      # WebRTC DataChannel & BroadcastChannel offline P2P engine
│   └── SyncManager.ts        # Master sync coordinator managing outbox & server uploads
├── components/
│   ├── NetworkSyncStatus.tsx # Modern status badge (Online / Offline / Mesh / Syncing)
│   └── SyncProgressModal.tsx # Drawer modal displaying pending outbox & manual sync trigger
└── examples/
    └── ReactNextExample.tsx  # Full React/Next.js integration code blueprint
```

---

## 🚀 How to Use This Folder

### Option 1: Give to an AI Agent (Recommended)
1. Copy/upload the `web_offline_p2p_sync` folder into your project repo.
2. Prompt your AI Agent (Cursor, Antigravity, Claude, ChatGPT):
   > *"Read `web_offline_p2p_sync/AGENT_INSTRUCTIONS.md` and integrate offline P2P mesh and background server sync into our application."*

### Option 2: Manual Developer Integration

1. Import `SyncManager` in your app setup:
   ```typescript
   import { SyncManager } from './web_offline_p2p_sync/core/SyncManager';

   const syncManager = new SyncManager({ pingUrl: '/api/health' });
   await syncManager.init();
   ```

2. Register server upload callback:
   ```typescript
   syncManager.setServerUploadHandler(async (pendingBatch) => {
     const res = await fetch('/api/sync', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ items: pendingBatch }),
     });
     const data = await res.json();
     return { successIds: data.successIds };
   });
   ```

3. Replace API creation calls with `syncManager.mutate()`:
   ```typescript
   await syncManager.mutate('card_submissions', 'CREATE', newCardData);
   ```

4. Render connection badge:
   ```tsx
   <NetworkSyncStatus syncManager={syncManager} />
   ```

---

## 🛡️ Data Safety & Deduplication

- **Idempotent IDs**: Every transaction receives a GUID and hash digest to prevent duplicate processing on the server.
- **LRU Seen Cache**: Prevents infinite message looping across peer devices on local Wi-Fi.
- **IndexedDB Persistence**: Pending items survive browser refreshes, app restarts, and computer reboots.
