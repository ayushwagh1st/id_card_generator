import React, { useEffect, useState } from 'react';
import { SyncManager } from '../core/SyncManager';
import { NetworkSyncStatus } from '../components/NetworkSyncStatus';
import { SyncProgressModal } from '../components/SyncProgressModal';

// Instantiate single instance of SyncManager for the app
const syncManager = new SyncManager({
  pingUrl: '/api/health', // Endpoint to verify true internet reachability
  dbName: 'my_app_offline_db',
  channelName: 'my_app_mesh',
});

export const AppIntegrationExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', details: '' });
  const [submittedList, setSubmittedList] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initialize SyncManager
    syncManager.init();

    // 2. Define Backend Server Sync Upload Callback
    syncManager.setServerUploadHandler(async (batch) => {
      console.log('Uploading offline batch to server:', batch);

      // Replace with your real API endpoint fetch/axios call
      const response = await fetch('/api/sync-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: batch }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      // Must return array of successfully processed IDs
      return { successIds: result.successIds || batch.map((b) => b.id) };
    });

    return () => syncManager.destroy();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    // Mutate data through SyncManager:
    // Safe when online OR offline!
    const outboxItem = await syncManager.mutate('card_submissions', 'CREATE', {
      title: formData.title,
      details: formData.details,
      createdAt: new Date().toISOString(),
    });

    setSubmittedList((prev) => [outboxItem.payload, ...prev]);
    setFormData({ title: '', details: '' });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header with Connection & Offline P2P Status Badge */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">My Application</h1>
        <NetworkSyncStatus syncManager={syncManager} onOpenModal={() => setIsModalOpen(true)} />
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Add New Record (Works Offline & Online)</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="e.g. Employee ID Card"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Details</label>
          <textarea
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="Additional information..."
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition"
        >
          Save Record
        </button>
      </form>

      {/* Local Submissions Display */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-md font-semibold text-slate-800 dark:text-white mb-3">Submitted Records</h3>
        {submittedList.length === 0 ? (
          <p className="text-sm text-slate-400">No records submitted yet.</p>
        ) : (
          <ul className="space-y-2">
            {submittedList.map((item, idx) => (
              <li key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm flex justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-200">{item.title}</span>
                <span className="text-slate-400 text-xs">{new Date(item.createdAt).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sync Status Drawer Modal */}
      <SyncProgressModal syncManager={syncManager} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
