import { SyncManager } from '../../web_offline_p2p_sync/core/SyncManager';
import { OfflineStore } from '../../web_offline_p2p_sync/core/OfflineStore';
declare global { interface Window { offlineTest: any; manager: any; } }
window.offlineTest = { SyncManager, OfflineStore };
