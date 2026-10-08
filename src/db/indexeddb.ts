import { emptyStores, STORES, type Database, type StoreName } from './database';

const DB_NAME = 'mis-gastos';
const DB_STORE = 'kv';

interface KvRow {
  key: string;
  store: StoreName;
  id: string;
  value: unknown;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir IndexedDB'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Error de IndexedDB'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Error de IndexedDB'));
    tx.onabort = () => reject(tx.error ?? new Error('Transacción cancelada'));
  });
}

export function createIndexedDatabase(): Database {
  return {
    async readAll() {
      const db = await openDb();
      const tx = db.transaction(DB_STORE, 'readonly');
      const all = await requestToPromise(tx.objectStore(DB_STORE).getAll() as IDBRequest<KvRow[]>);
      await transactionDone(tx);
      db.close();
      const grouped = emptyStores();
      for (const row of all) {
        if (STORES.includes(row.store)) grouped[row.store].push(row.value);
      }
      return grouped;
    },
    async bulkUpsert(rows) {
      if (rows.length === 0) return;
      const db = await openDb();
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      for (const row of rows) {
        store.put({ key: `${row.store}:${row.id}`, store: row.store, id: row.id, value: row.value });
      }
      await transactionDone(tx);
      db.close();
    },
    async remove(storeName, id) {
      const db = await openDb();
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).delete(`${storeName}:${id}`);
      await transactionDone(tx);
      db.close();
    },
    async replaceAll(rows) {
      const db = await openDb();
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      store.clear();
      for (const row of rows) {
        store.put({ key: `${row.store}:${row.id}`, store: row.store, id: row.id, value: row.value });
      }
      await transactionDone(tx);
      db.close();
    },
  };
}
