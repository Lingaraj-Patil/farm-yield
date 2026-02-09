// ===================================
// FILE: frontend/src/utils/offlineQueue.js
// Offline report queue (IndexedDB)
// ===================================

import { reportAPI } from './api';

const DB_NAME = 'farmyield-db';
const DB_VERSION = 1;
const STORE_NAME = 'reportQueue';

const openDB = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  };

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const withStore = async (mode, callback) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = callback(store);

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
};

export const enqueueReport = async ({ formData, images }) => {
  const payload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    formData,
    images: images.map((file) => ({
      name: file.name,
      type: file.type,
      blob: file,
    })),
  };

  await withStore('readwrite', (store) => store.put(payload));
  return payload.id;
};

export const getQueuedReports = async () => withStore('readonly', (store) => (
  new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  })
));

export const removeQueuedReport = async (id) => withStore('readwrite', (store) => (
  store.delete(id)
));

export const getQueueCount = async () => {
  const items = await getQueuedReports();
  return items.length;
};

const buildFormData = (formData, images) => {
  const data = new FormData();
  Object.keys(formData).forEach((key) => {
    data.append(key, formData[key]);
  });

  images.forEach((img) => {
    const file = new File([img.blob], img.name, { type: img.type });
    data.append('images', file);
  });

  return data;
};

export const processQueue = async () => {
  if (!navigator.onLine) return { processed: 0, remaining: await getQueueCount() };

  const items = await getQueuedReports();
  let processed = 0;

  for (const item of items) {
    try {
      const data = buildFormData(item.formData, item.images);
      await reportAPI.submit(data);
      await removeQueuedReport(item.id);
      processed += 1;
    } catch (error) {
      if (!error.response) {
        break;
      }
    }
  }

  const remaining = await getQueueCount();
  return { processed, remaining };
};
