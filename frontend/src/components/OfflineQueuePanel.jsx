// ===================================
// FILE: frontend/src/components/OfflineQueuePanel.jsx
// Offline Queue Display
// ===================================

import { useState, useEffect } from 'react';
import { CloudOff, CloudUpload, Trash2, RefreshCw } from 'lucide-react';
import { getQueuedReports, removeQueuedReport, processQueue, getQueueCount } from '../utils/offlineQueue';

const OfflineQueuePanel = () => {
  const [queue, setQueue] = useState([]);
  const [queueCount, setQueueCount] = useState(0);
  const [processing, setProcessing] = useState(false);

  const refreshQueue = async () => {
    const items = await getQueuedReports();
    setQueue(items);
    setQueueCount(items.length);
  };

  useEffect(() => {
    refreshQueue();

    const interval = setInterval(refreshQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this pending report?')) return;
    await removeQueuedReport(id);
    await refreshQueue();
  };

  const handleSync = async () => {
    if (!navigator.onLine) {
      alert('You are currently offline.');
      return;
    }

    setProcessing(true);
    try {
      const result = await processQueue();
      alert(`Synced ${result.processed} report(s). ${result.remaining} remaining.`);
      await refreshQueue();
    } catch (error) {
      alert('Sync failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (queueCount === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CloudOff className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">
              Offline Queue
            </h3>
            <p className="text-sm text-yellow-700">
              {queueCount} report(s) pending submission
            </p>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={processing || !navigator.onLine}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
        >
          {processing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <CloudUpload className="w-4 h-4" />
          )}
          Sync Now
        </button>
      </div>

      <div className="space-y-2">
        {queue.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg p-3 flex items-center justify-between border border-yellow-200"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">
                {item.formData.cropType} - {item.formData.quantity} {item.formData.unit}
              </p>
              <p className="text-xs text-gray-500">
                {item.formData.district}, {item.formData.province}
              </p>
              <p className="text-xs text-gray-400">
                Queued: {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfflineQueuePanel;
